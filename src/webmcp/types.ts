import type { AppAction, AppState } from "../domain/actions";

export type JsonSchema = Record<string, unknown>;

export interface WebMcpTextContent {
  type: "text";
  text: string;
}

export interface WebMcpToolResult {
  content: WebMcpTextContent[];
  isError?: boolean;
}

export interface WebMcpToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

export interface WebMcpToolDefinition {
  name: string;
  title?: string;
  description: string;
  inputSchema: JsonSchema;
  annotations?: WebMcpToolAnnotations;
  execute: (input: unknown) => Promise<WebMcpToolResult>;
}

export interface WebMcpRegistrationOptions {
  signal?: AbortSignal;
  exposedTo?: string[];
}

export interface WebMcpModelContext {
  registerTool: (
    tool: WebMcpToolDefinition,
    options?: WebMcpRegistrationOptions,
  ) => Promise<void>;
}

export interface WebMcpContext {
  getState: () => AppState;
  dispatch: (action: AppAction) => void;
  afterDispatch: () => Promise<void>;
}
