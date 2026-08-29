import type { AppState } from "../domain/actions";
import { workflowCount } from "../domain/workflow";

interface PreflightSummaryProps {
  state: AppState;
}

export function PreflightSummary({ state }: PreflightSummaryProps) {
  const passing = state.preflight.summary.pass;
  const totalChecks = Object.values(state.preflight.summary).reduce(
    (total, count) => total + count,
    0,
  );
  const open = workflowCount(state, "Open");
  const verificationPending = workflowCount(state, "Verification pending");
  const pendingExternal = workflowCount(state, "Pending external");
  const awaitingConfirmation =
    workflowCount(state, "Awaiting approval") +
    workflowCount(state, "Awaiting confirmation");

  return (
    <section className="review-overview" aria-label="Preflight status summary">
      <div
        className="review-progress"
        role="group"
        aria-label={`${passing} passing of ${totalChecks} checks`}
      >
        <p className="section-kicker">Review progress</p>
        <strong>{passing} of {totalChecks} checks passing</strong>
        <span>
          {open} need action · {awaitingConfirmation} awaiting confirmation
        </span>
      </div>
      <div className="review-statuses">
        <div role="group" aria-label={`${open} open`}>
          <span className="review-status-label">Open</span>
          <strong className="review-status-value">{open}</strong>
        </div>
        <div
          role="group"
          aria-label={`${verificationPending} verification pending`}
        >
          <span className="review-status-label">Verification pending</span>
          <strong className="review-status-value">{verificationPending}</strong>
        </div>
        <div role="group" aria-label={`${pendingExternal} pending external`}>
          <span className="review-status-label">Pending external</span>
          <strong className="review-status-value">{pendingExternal}</strong>
        </div>
      </div>
    </section>
  );
}
