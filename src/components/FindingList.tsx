import type { AppState } from "../domain/actions";
import { workflowCount, workflowStatusForFinding } from "../domain/workflow";

interface FindingListProps {
  state: AppState;
  selectedFindingId: string | null;
  onSelect: (findingId: string) => void;
}

export function FindingList({
  state,
  selectedFindingId,
  onSelect,
}: FindingListProps) {
  const openCount = workflowCount(state, "Open");

  return (
    <section className="panel finding-panel" aria-label="Findings list">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Current work</p>
          <h2>Review queue</h2>
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
            const status = workflowStatusForFinding(state, finding);
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
