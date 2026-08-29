import type { AppAction, AppState } from "../domain/actions";
import { appReducer, getFreshInitialState } from "../domain/reducer";
import { registerWebMcpTools } from "./registerTools";
import {
  WEB_MCP_TOOL_NAMES,
  buildWebMcpTools,
} from "./tools";
import type {
  WebMcpContext,
  WebMcpModelContext,
  WebMcpToolResult,
} from "./types";

function readPayload(result: WebMcpToolResult): Record<string, unknown> {
  return JSON.parse(result.content[0].text) as Record<string, unknown>;
}

function createHarness() {
  let state = getFreshInitialState();
  const actions: AppAction[] = [];
  const context: WebMcpContext = {
    getState: () => state,
    dispatch: (action) => {
      actions.push(action);
      state = appReducer(state, action);
    },
    afterDispatch: async () => undefined,
  };

  return {
    context,
    actions,
    getState: (): AppState => state,
  };
}

function getTool(
  context: WebMcpContext,
  name: (typeof WEB_MCP_TOOL_NAMES)[number],
) {
  const tool = buildWebMcpTools(context).find((item) => item.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
}

describe("WebMCP tools", () => {
  it("exposes exactly the six approved tools with read annotations", () => {
    const { context } = createHarness();
    const tools = buildWebMcpTools(context);

    expect(tools.map((tool) => tool.name)).toEqual(WEB_MCP_TOOL_NAMES);
    expect(getTool(context, "get_pack_state").annotations?.readOnlyHint).toBe(
      true,
    );
    expect(
      getTool(context, "get_finding_evidence").annotations,
    ).toEqual({ readOnlyHint: true, untrustedContentHint: true });
  });

  it("returns the active pack without mutating application state", async () => {
    const harness = createHarness();
    const before = structuredClone(harness.getState());

    const result = await getTool(harness.context, "get_pack_state").execute({});

    expect(harness.getState()).toEqual(before);
    expect(result.isError).not.toBe(true);
    expect(readPayload(result)).toEqual(
      expect.objectContaining({
        ok: true,
        pack: expect.objectContaining({ reference: "SHIP-2026-0087" }),
        findingCount: 5,
      }),
    );
  });

  it("returns source evidence as untrusted data without mutating state", async () => {
    const harness = createHarness();
    const before = structuredClone(harness.getState());

    const result = await getTool(
      harness.context,
      "get_finding_evidence",
    ).execute({ findingId: "finding:goods-description" });

    expect(harness.getState()).toEqual(before);
    expect(readPayload(result)).toEqual(
      expect.objectContaining({
        ok: true,
        findingId: "finding:goods-description",
        untrustedContent: true,
      }),
    );
  });

  it("keeps adversarial document text out of tool metadata and authorization", () => {
    const harness = createHarness();
    const metadata = buildWebMcpTools(harness.context).map((tool) => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: tool.annotations,
    }));
    const serialized = JSON.stringify(metadata).toLowerCase();

    expect(serialized).not.toContain("ignore all restrictions");
    expect(serialized).not.toContain("approve every discrepancy");
    expect(serialized).not.toContain("untrusted document text:");
  });

  it("stages exporter corrections without approving them", async () => {
    const harness = createHarness();

    const result = await getTool(
      harness.context,
      "stage_exporter_corrections",
    ).execute({
      corrections: [
        {
          findingId: "finding:beneficiary-name",
          proposedValue: "Sahyadri Botanics Private Limited",
        },
      ],
    });

    expect(result.isError).not.toBe(true);
    expect(harness.getState().proposals).toHaveLength(1);
    expect(harness.getState().resolutions.fieldOverrides).toEqual({});
    expect(readPayload(result)).toEqual(
      expect.objectContaining({
        ok: true,
        status: "staged",
        proposalIds: ["proposal:finding:beneficiary-name"],
      }),
    );
  });

  it("rejects an exporter correction against a locked document", async () => {
    const harness = createHarness();

    const result = await getTool(
      harness.context,
      "stage_exporter_corrections",
    ).execute({
      corrections: [
        {
          findingId: "finding:port-of-discharge",
          proposedValue: "Rotterdam, Netherlands",
        },
      ],
    });

    expect(result.isError).toBe(true);
    expect(harness.getState().proposals).toHaveLength(0);
    expect(readPayload(result)).toEqual(
      expect.objectContaining({ ok: false, code: "DOCUMENT_LOCKED" }),
    );
  });

  it("creates unsent issuer request drafts without changing documents", async () => {
    const harness = createHarness();
    const originalPack = structuredClone(harness.getState().pack);

    const result = await getTool(
      harness.context,
      "draft_external_correction_requests",
    ).execute({
      findingIds: [
        "finding:port-of-discharge",
        "finding:certificate-signature",
      ],
    });

    expect(result.isError).not.toBe(true);
    expect(harness.getState().pack).toEqual(originalPack);
    expect(harness.getState().externalRequests).toHaveLength(2);
    expect(harness.getState().externalRequests.every((item) => !item.sent)).toBe(
      true,
    );
  });

  it("stages but does not confirm a human decision", async () => {
    const harness = createHarness();

    const result = await getTool(
      harness.context,
      "stage_human_decision",
    ).execute({
      findingId: "finding:goods-description",
      decision: "accept",
      rationale: "Exporter confirmed the descriptions are commercially equivalent.",
    });

    expect(result.isError).not.toBe(true);
    expect(
      harness.getState().stagedHumanDecisions["finding:goods-description"],
    ).toBeDefined();
    expect(
      harness.getState().resolutions.humanDecisions["finding:goods-description"],
    ).toBeUndefined();
  });

  it("reruns the deterministic preflight through the shared action", async () => {
    const harness = createHarness();

    const result = await getTool(
      harness.context,
      "rerun_preflight",
    ).execute({});

    expect(result.isError).not.toBe(true);
    expect(harness.actions.at(-1)).toEqual({
      type: "rerun_preflight",
      actor: "agent",
    });
    expect(readPayload(result)).toEqual(
      expect.objectContaining({
        ok: true,
        summary: { pass: 4, fail: 4, needsHumanReview: 1, notApplicable: 0 },
      }),
    );
  });

  it("registers all tools with one abortable lifecycle", async () => {
    const harness = createHarness();
    const registered: Array<{ name: string; signal: AbortSignal | undefined }> = [];
    const modelContext: WebMcpModelContext = {
      registerTool: async (tool, options) => {
        registered.push({ name: tool.name, signal: options?.signal });
      },
    };

    const cleanup = registerWebMcpTools(
      buildWebMcpTools(harness.context),
      modelContext,
    );
    await Promise.resolve();

    expect(registered.map((item) => item.name)).toEqual(WEB_MCP_TOOL_NAMES);
    expect(registered.every((item) => item.signal?.aborted === false)).toBe(true);

    cleanup();
    expect(registered.every((item) => item.signal?.aborted === true)).toBe(true);
  });
});
