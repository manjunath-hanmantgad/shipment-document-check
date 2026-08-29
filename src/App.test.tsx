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
