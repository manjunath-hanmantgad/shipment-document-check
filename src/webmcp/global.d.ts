import type { WebMcpModelContext } from "./types";

declare global {
  interface Document {
    modelContext?: WebMcpModelContext;
  }
}

export {};
