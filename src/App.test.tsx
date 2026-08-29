import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { WEB_MCP_TOOL_NAMES } from "./webmcp/tools";
import type { WebMcpToolDefinition } from "./webmcp/types";

afterEach(() => {
  Reflect.deleteProperty(document, "modelContext");
});

describe("single-screen document resolution workflow", () => {
  it("introduces the live shipment through an accessible WebMCP landing flow", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /fix what you control\. escalate what you don't\./i,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /open the live shipment/i }),
    ).toHaveAttribute("href", "#workspace-demo");
    expect(
      screen.getByRole("link", { name: /see why webmcp matters/i }),
    ).toHaveAttribute("href", "#webmcp-intro");
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /the agent can act\. the page decides what it is allowed to do\./i,
      }),
    ).toBeVisible();
    expect(screen.getByText("5 DOCUMENTS")).toBeVisible();
    expect(screen.getByText("9 CHECKS")).toBeVisible();
    expect(screen.getByText("6 WEBMCP TOOLS")).toBeVisible();
    expect(screen.getByText("3 AUTHORITY PATHS")).toBeVisible();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Export Document Pack Preflight",
      }),
    ).toBeVisible();
  });

  it("keeps sponsor branding out of the product UI", () => {
    render(<App />);

    expect(screen.queryByText(/OpenAI WebMCP Challenge 2026/i)).not.toBeInTheDocument();
  });

  it("uses a named status region and valid document-field description groups", () => {
    const { container } = render(<App />);

    expect(
      screen.getByRole("status", { name: /webmcp capability status/i }),
    ).toHaveTextContent(/webmcp not available/i);

    for (const field of container.querySelectorAll(".document-field")) {
      expect(
        [...field.children].map((child) => child.tagName.toLowerCase()),
      ).toEqual(["dt", "dd"]);
    }

    expect(
      screen.getByRole("group", { name: /4 passing of 9 checks/i }),
    ).toBeVisible();
    expect(screen.getByRole("group", { name: /5 open/i })).toBeVisible();
  });

  it("completes exporter, external-issuer, and human-judgement paths", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: /beneficiary-name consistency/i }),
    );
    await user.click(screen.getByRole("button", { name: /stage correction/i }));
    await user.click(screen.getByRole("button", { name: /approve correction/i }));

    await user.click(
      screen.getByRole("button", { name: /quantity consistency/i }),
    );
    await user.click(screen.getByRole("button", { name: /stage correction/i }));
    await user.click(screen.getByRole("button", { name: /approve correction/i }));

    await user.click(
      screen.getByRole("button", { name: /port-of-discharge consistency/i }),
    );
    expect(screen.getByText(/direct editing is unavailable/i)).toBeVisible();
    await user.click(screen.getByRole("button", { name: /draft carrier request/i }));

    await user.click(
      screen.getByRole("button", { name: /certificate signature marker/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /draft authority request/i }),
    );

    await user.click(
      screen.getByRole("button", { name: /goods-description review/i }),
    );
    await user.click(
      screen.getByRole("radio", { name: /accept wording difference/i }),
    );
    await user.type(
      screen.getByLabelText(/rationale/i),
      "Commercially equivalent description confirmed by exporter.",
    );
    await user.click(screen.getByRole("button", { name: /stage decision/i }));
    await user.click(screen.getByRole("button", { name: /confirm decision/i }));

    await user.click(screen.getByRole("button", { name: /rerun preflight/i }));

    expect(screen.getByLabelText(/7 passing/i)).toBeVisible();
    expect(screen.getByLabelText(/2 pending external/i)).toBeVisible();
    expect(screen.getByLabelText(/0 open/i)).toBeVisible();
    expect(screen.getByLabelText(/unsent correction request/i)).toBeVisible();
    expect(
      screen.getAllByText(/drafted 1 external correction request/i),
    ).toHaveLength(2);
    expect(screen.getByLabelText(/bill of lading preview/i)).toBeVisible();
  });

  it("keeps the shell usable without WebMCP and resets the case", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByLabelText(/webmcp capability status/i)).toHaveTextContent(
      /webmcp not available/i,
    );
    expect(screen.getByText(/not a definitive compliance review/i)).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: /beneficiary-name consistency/i }),
    );
    await user.click(screen.getByRole("button", { name: /stage correction/i }));
    expect(screen.getByRole("button", { name: /approve correction/i })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /reset demonstration/i }));

    expect(
      screen.queryByRole("button", { name: /approve correction/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/findings list/i)).toHaveTextContent(
      /5 open findings/i,
    );
  });

  it("marks an approved correction as awaiting verification and allows undo", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: /beneficiary-name consistency/i }),
    );
    await user.click(screen.getByRole("button", { name: /stage correction/i }));
    await user.click(screen.getByRole("button", { name: /approve correction/i }));

    expect(screen.getByLabelText(/1 verification pending/i)).toBeVisible();
    expect(screen.getByLabelText(/4 open/i)).toBeVisible();
    expect(screen.getByText(/approved — verification pending/i)).toBeVisible();

    await user.click(screen.getByRole("button", { name: /undo correction/i }));

    expect(screen.getByLabelText(/0 verification pending/i)).toBeVisible();
    expect(screen.getByLabelText(/5 open/i)).toBeVisible();
    expect(screen.queryByText(/approved — verification pending/i)).not.toBeInTheDocument();
  });

  it("counts a confirmed human decision as verification pending until rerun", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: /goods-description review/i }),
    );
    await user.click(
      screen.getByRole("radio", { name: /accept wording difference/i }),
    );
    await user.type(
      screen.getByLabelText(/rationale/i),
      "The product, grade, quantity and packing are equivalent.",
    );
    await user.click(screen.getByRole("button", { name: /stage decision/i }));
    await user.click(screen.getByRole("button", { name: /confirm decision/i }));

    expect(screen.getByLabelText(/1 verification pending/i)).toBeVisible();
    expect(screen.getByLabelText(/4 open/i)).toBeVisible();
    expect(
      screen.getByText(/decision confirmed — verification pending/i),
    ).toBeVisible();
  });

  it("returns a still-failing exporter correction to an open resolution form after rerun", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: /beneficiary-name consistency/i }),
    );
    const proposedValue = screen.getByLabelText(/proposed value/i);
    await user.clear(proposedValue);
    await user.type(proposedValue, "Still Incorrect Exporter Name");
    await user.click(screen.getByRole("button", { name: /stage correction/i }));
    await user.click(screen.getByRole("button", { name: /approve correction/i }));
    await user.click(screen.getByRole("button", { name: /rerun preflight/i }));

    expect(screen.getByLabelText(/0 verification pending/i)).toBeVisible();
    expect(screen.getByLabelText(/5 open/i)).toBeVisible();
    expect(
      screen.queryByText(/approved — verification pending/i),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stage correction/i })).toBeVisible();
  });

  it("shows a rejected human decision as reviewed rather than verification pending after rerun", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: /goods-description review/i }),
    );
    await user.click(
      screen.getByRole("radio", { name: /reject wording difference/i }),
    );
    await user.type(
      screen.getByLabelText(/rationale/i),
      "The wording is not acceptable for this presentation.",
    );
    await user.click(screen.getByRole("button", { name: /stage decision/i }));
    await user.click(screen.getByRole("button", { name: /confirm decision/i }));
    await user.click(screen.getByRole("button", { name: /rerun preflight/i }));
    await user.click(
      screen.getByRole("button", { name: /goods-description review/i }),
    );

    expect(screen.getByText("Human review recorded")).toBeVisible();
    expect(screen.getByText(/human decision: reject/i)).toBeVisible();
    expect(
      screen.queryByText(/decision confirmed — verification pending/i),
    ).not.toBeInTheDocument();
  });

  it("shows an escalated human decision as open follow-up after rerun", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: /goods-description review/i }),
    );
    await user.click(
      screen.getByRole("radio", { name: /escalate for specialist review/i }),
    );
    await user.type(
      screen.getByLabelText(/rationale/i),
      "A trade specialist must make the final determination.",
    );
    await user.click(screen.getByRole("button", { name: /stage decision/i }));
    await user.click(screen.getByRole("button", { name: /confirm decision/i }));
    await user.click(screen.getByRole("button", { name: /rerun preflight/i }));
    await user.click(
      screen.getByRole("button", { name: /goods-description review/i }),
    );

    expect(screen.getByText("Escalated for human follow-up")).toBeVisible();
    expect(screen.getByText(/human decision: escalate/i)).toBeVisible();
    expect(
      screen.queryByText(/decision confirmed — verification pending/i),
    ).not.toBeInTheDocument();
  });

  it("registers exactly the six approved tools when WebMCP is available", () => {
    const registeredNames: string[] = [];
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: async (tool: WebMcpToolDefinition) => {
          registeredNames.push(tool.name);
        },
      },
    });

    render(<App />);

    expect(screen.getByLabelText(/webmcp capability status/i)).toHaveTextContent(
      /webmcp available/i,
    );
    expect(registeredNames).toEqual(WEB_MCP_TOOL_NAMES);
  });
});
