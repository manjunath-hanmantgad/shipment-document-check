import { useEffect, useReducer, useRef } from "react";
import { ActivityLog } from "./components/ActivityLog";
import { DocumentList } from "./components/DocumentList";
import { DocumentPreview } from "./components/DocumentPreview";
import { EvidencePanel } from "./components/EvidencePanel";
import { FindingList } from "./components/FindingList";
import { LandingHero } from "./components/LandingHero";
import { PreflightSummary } from "./components/PreflightSummary";
import { ResolutionPanel } from "./components/ResolutionPanel";
import { WebMcpIntro } from "./components/WebMcpIntro";
import { appReducer, getFreshInitialState } from "./domain/reducer";
import { runPreflight } from "./domain/rules";
import { registerWebMcpTools } from "./webmcp/registerTools";
import { buildWebMcpTools } from "./webmcp/tools";

function waitForVisibleUpdate(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      return;
    }
    setTimeout(resolve, 0);
  });
}

function App() {
  const [state, dispatch] = useReducer(
    appReducer,
    undefined,
    getFreshInitialState,
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  const webMcpAvailable =
    typeof document.modelContext?.registerTool === "function";

  useEffect(() => {
    const tools = buildWebMcpTools({
      getState: () => stateRef.current,
      dispatch,
      afterDispatch: waitForVisibleUpdate,
    });
    return registerWebMcpTools(tools);
  }, [dispatch]);

  const selectedDocument =
    state.pack.documents.find((item) => item.id === state.selectedDocumentId) ??
    state.pack.documents[0];
  const selectedFinding =
    state.preflight.findings.find((item) => item.id === state.selectedFindingId) ??
    null;

  const selectFinding = (findingId: string) => {
    const finding = state.preflight.findings.find((item) => item.id === findingId);
    dispatch({ type: "select_finding", findingId });
    if (finding?.targetDocumentId) {
      dispatch({ type: "select_document", documentId: finding.targetDocumentId });
    }
  };

  return (
    <main className="site-main">
      <LandingHero />
      <WebMcpIntro />
      <section
        id="workspace-demo"
        className="application"
        aria-labelledby="application-title"
        tabIndex={-1}
      >
      <header className="app-header">
        <div>
          <h2 id="application-title">Shipment Document Check</h2>
          <p className="app-subtitle">
            Review one fictional shipment pack while the page enforces who may
            change each document.
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => dispatch({ type: "reset_case" })}
          >
            Reset demonstration
          </button>
          <button
            type="button"
            className="button primary"
            disabled={!state.hasUnrunChanges}
            onClick={() => {
              const nextPreflight = runPreflight(state.pack, state.resolutions);
              const nextDocumentId = nextPreflight.findings[0]?.targetDocumentId;
              dispatch({ type: "rerun_preflight", actor: "human" });
              if (nextDocumentId) {
                dispatch({ type: "select_document", documentId: nextDocumentId });
              }
            }}
          >
            Rerun preflight
          </button>
        </div>
      </header>

      <section className="shipment-bar" aria-label="Active shipment">
        <div>
          <span>Shipment</span>
          <strong>{state.pack.reference}</strong>
        </div>
        <p>{state.pack.title}</p>
        <div
          className={`capability ${webMcpAvailable ? "available" : "unavailable"}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label="WebMCP capability status"
        >
          <strong>
            WebMCP {webMcpAvailable ? "available" : "not available"}
          </strong>
          <span>
            {webMcpAvailable
              ? "Six site tools are enabled for this shipment."
              : "Manual workflow active. No WebMCP support is being simulated."}
          </span>
        </div>
      </section>

      <PreflightSummary state={state} />

      <section className="review-flow" aria-label="Document review workspace">
        <FindingList
          state={state}
          selectedFindingId={state.selectedFindingId}
          onSelect={selectFinding}
        />
        <EvidencePanel finding={selectedFinding} />
        <ResolutionPanel
          key={selectedFinding?.id ?? "no-finding"}
          state={state}
          finding={selectedFinding}
          dispatch={dispatch}
        />
        <DocumentPreview
          document={selectedDocument}
          fieldOverrides={state.resolutions.fieldOverrides}
          highlightedFieldIds={
            selectedFinding?.sources.map((item) => item.fieldId) ?? []
          }
        />
        <DocumentList
          documents={state.pack.documents}
          selectedDocumentId={state.selectedDocumentId}
          onSelect={(documentId) =>
            dispatch({ type: "select_document", documentId })
          }
        />
      </section>

      <ActivityLog activities={state.activities} />

      <aside className="disclaimer" aria-label="Product limitation">
        <strong>Demonstration only.</strong> All data is fictional. This is not a
        definitive compliance review and is not a substitute for a qualified
        trade-finance professional.
      </aside>
      </section>
    </main>
  );
}

export default App;
