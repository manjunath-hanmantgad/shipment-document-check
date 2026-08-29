import { expect, test, type Page } from "@playwright/test";

async function installWebMcpHarness(page: Page) {
  await page.addInitScript(() => {
    type ToolResult = {
      content: Array<{ type: string; text: string }>;
      isError?: boolean;
    };
    type Tool = {
      name: string;
      execute: (input: unknown) => Promise<ToolResult>;
    };
    type RegistrationOptions = { signal?: AbortSignal };

    const activeTools = new Map<string, Tool>();

    Object.defineProperty(window, "__webMcpTestTools", {
      configurable: true,
      get: () => [...activeTools.values()],
    });

    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: async (tool: Tool, options?: RegistrationOptions) => {
          activeTools.set(tool.name, tool);
          options?.signal?.addEventListener(
            "abort",
            () => {
              if (activeTools.get(tool.name) === tool) {
                activeTools.delete(tool.name);
              }
            },
            { once: true },
          );
        },
      },
    });
  });
}

async function executeWebMcpTool(
  page: Page,
  name: string,
  input: unknown,
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  return page.evaluate(
    async ({ toolName, toolInput }) => {
      type ToolResult = {
        content: Array<{ type: string; text: string }>;
        isError?: boolean;
      };
      type Tool = {
        name: string;
        execute: (input: unknown) => Promise<ToolResult>;
      };
      const tools = (
        window as typeof window & { __webMcpTestTools?: Tool[] }
      ).__webMcpTestTools;
      const tool = tools?.find((item) => item.name === toolName);
      if (!tool) throw new Error(`WebMCP tool not registered: ${toolName}`);
      return tool.execute(toolInput);
    },
    { toolName: name, toolInput: input },
  );
}

function readToolPayload(result: {
  content: Array<{ type: string; text: string }>;
}): Record<string, unknown> {
  return JSON.parse(result.content[0].text) as Record<string, unknown>;
}

test("completes the full manual resolution journey and reset", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("button", { name: /beneficiary-name consistency/i })
    .click();
  await page.getByRole("button", { name: /stage correction/i }).click();
  await page.getByRole("button", { name: /approve correction/i }).click();

  await page.getByRole("button", { name: /quantity consistency/i }).click();
  await page.getByRole("button", { name: /stage correction/i }).click();
  await page.getByRole("button", { name: /approve correction/i }).click();

  await page
    .getByRole("button", { name: /port-of-discharge consistency/i })
    .click();
  await expect(page.getByText(/direct editing is unavailable/i)).toBeVisible();
  await page.getByRole("button", { name: /draft carrier request/i }).click();

  await page
    .getByRole("button", { name: /certificate signature marker/i })
    .click();
  await page.getByRole("button", { name: /draft authority request/i }).click();

  await page.getByRole("button", { name: /goods-description review/i }).click();
  await page
    .getByRole("radio", { name: /accept wording difference/i })
    .check();
  await page
    .getByLabel(/rationale/i)
    .fill("Commercially equivalent description confirmed by exporter.");
  await page.getByRole("button", { name: /stage decision/i }).click();
  await page.getByRole("button", { name: /confirm decision/i }).click();

  await page.getByRole("button", { name: /rerun preflight/i }).click();

  await expect(page.getByLabel(/7 passing/i)).toBeVisible();
  await expect(page.getByLabel(/2 pending external/i)).toBeVisible();
  await expect(page.getByLabel(/0 open/i)).toBeVisible();
  await expect(page.getByLabel(/bill of lading preview/i)).toBeVisible();

  await page.getByRole("button", { name: /reset demonstration/i }).click();
  await expect(page.getByLabel(/findings list/i)).toContainText("5 open findings");
});

test("surfaces and confirms a WebMCP-staged human decision", async ({ page }) => {
  await installWebMcpHarness(page);
  await page.goto("/");

  await page.getByRole("button", { name: /quantity consistency/i }).click();

  const staged = await executeWebMcpTool(page, "stage_human_decision", {
    findingId: "finding:goods-description",
    decision: "accept",
    rationale:
      "Both descriptions refer to the same product, grade, total quantity, and equivalent 25 KG bag packaging.",
  });
  expect(staged.isError).not.toBe(true);

  const beforeConfirmation = readToolPayload(
    await executeWebMcpTool(page, "get_pack_state", {}),
  );
  expect(beforeConfirmation).toEqual(
    expect.objectContaining({
      findings: expect.arrayContaining([
        expect.objectContaining({
          id: "finding:goods-description",
          workflowStatus: "human_decision_pending",
        }),
      ]),
      confirmedHumanDecisionIds: [],
    }),
  );

  await expect(page.getByText("Awaiting human confirmation")).toBeVisible();
  await page.getByRole("button", { name: "Confirm decision" }).click();
  await expect(
    page.getByText(/human decision confirmed: accept/i),
  ).toBeVisible();

  const afterConfirmation = readToolPayload(
    await executeWebMcpTool(page, "get_pack_state", {}),
  );
  expect(afterConfirmation).toEqual(
    expect.objectContaining({
      findings: expect.arrayContaining([
        expect.objectContaining({
          id: "finding:goods-description",
          workflowStatus: "human_reviewed",
        }),
      ]),
      hasUnrunChanges: true,
      confirmedHumanDecisionIds: ["finding:goods-description"],
    }),
  );
  await expect(page.getByText("Awaiting human confirmation")).toHaveCount(0);
});

test("registers six tools and rejects a direct locked-document correction", async ({
  page,
}) => {
  await installWebMcpHarness(page);
  await page.goto("/");

  await expect(page.getByLabel("WebMCP capability status")).toContainText(
    "WebMCP available",
  );

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & { __webMcpTestTools?: unknown[] }
          ).__webMcpTestTools?.length ?? 0,
      ),
    )
    .toBe(6);

  const packResult = await executeWebMcpTool(page, "get_pack_state", {});
  expect(packResult.isError).not.toBe(true);
  expect(readToolPayload(packResult)).toEqual(
    expect.objectContaining({ ok: true, findingCount: 5 }),
  );

  const documentNav = page.getByRole("navigation", { name: "Shipment documents" });
  const billOfLadingButton = documentNav.getByRole("button", {
    name: /bill of lading/i,
  });
  const before = await billOfLadingButton.textContent();

  const rejected = await executeWebMcpTool(page, "stage_exporter_corrections", {
    corrections: [
      {
        findingId: "finding:port-of-discharge",
        proposedValue: "Rotterdam, Netherlands",
      },
    ],
  });

  expect(rejected.isError).toBe(true);
  expect(readToolPayload(rejected)).toEqual(
    expect.objectContaining({ ok: false, code: "DOCUMENT_LOCKED" }),
  );
  await expect(
    page.getByRole("button", { name: /approve correction/i }),
  ).toHaveCount(0);
  expect(await billOfLadingButton.textContent()).toBe(before);
});
