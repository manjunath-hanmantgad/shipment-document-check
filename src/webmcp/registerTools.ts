import type {
  WebMcpModelContext,
  WebMcpToolDefinition,
} from "./types";

export function registerWebMcpTools(
  tools: WebMcpToolDefinition[],
  modelContext: WebMcpModelContext | undefined = document.modelContext,
): () => void {
  if (!modelContext || typeof modelContext.registerTool !== "function") {
    return () => undefined;
  }

  const controller = new AbortController();

  for (const tool of tools) {
    void modelContext
      .registerTool(tool, { signal: controller.signal })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(`WebMCP registration failed for ${tool.name}`, error);
      });
  }

  return () => controller.abort();
}
