import type { AppState } from "../domain/actions";
import type { Finding } from "../domain/types";

interface FindingListProps {
  state: AppState;
  selectedFindingId: string | null;
  onSelect: (findingId: string) => void;
}

function statusFor(state: AppState, finding: Finding): string {
  if (state.proposals.some((item) => item.findingId === finding.id)) {
    return "Proposal pending";
  }
  if (state.externalRequests.some((item) => item.findingId === finding.id)) {
    return "Pending external";
  }
  if (state.stagedHumanDecisions[finding.id]) {
    return "Decision pending";
  }
  if (state.resolutions.humanDecisions[finding.id]) {
    return "Human reviewed";
  }
  if (finding.findingStatus === "pending_external") return "Pending external";
  if (finding.findingStatus === "human_reviewed") return "Human reviewed";
  return "Open";
}

export function FindingList({
  state,
  selectedFindingId,
  onSelect,
}: FindingListProps) {
  const openCount = state.preflight.findings.filter(
    (finding) => statusFor(state, finding) === "Open",
  ).length;

  return (
    <section className="panel finding-panel" aria-label="Findings list">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Preflight issues</p>
          <h2>Findings</h2>
          <p className="panel-subtitle">
            {openCount} open finding{openCount === 1 ? "" : "s"}
          </p>
        </div>
        <span className="count-badge">{state.preflight.findings.length}</span>
      </div>

      <div className="finding-list">
        {state.preflight.findings.length === 0 ? (
          <p className="empty-state">No active findings remain.</p>
        ) : (
          state.preflight.findings.map((finding) => {
            const selected = finding.id === selectedFindingId;
            const status = statusFor(state, finding);
            return (
              <button
                key={finding.id}
                type="button"
                className={`finding-item ${selected ? "selected" : ""}`}
                aria-pressed={selected}
                onClick={() => onSelect(finding.id)}
              >
                <span className="finding-title">{finding.title}</span>
                <span className="finding-explanation">{finding.explanation}</span>
                <span className="finding-footer">
                  <span className={`severity severity-${finding.severity}`}>
                    {finding.severity}
                  </span>
                  <span
                    className={`finding-status status-${status
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {status}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
