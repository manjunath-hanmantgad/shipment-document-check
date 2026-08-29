import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { getDocumentById, getFieldById } from "../domain/case";
import type { AppAction, AppState } from "../domain/actions";
import type { FieldValue, Finding, HumanResolution } from "../domain/types";

interface ResolutionPanelProps {
  state: AppState;
  finding: Finding | null;
  dispatch: (action: AppAction) => void;
}

function suggestionFor(finding: Finding): string {
  const source =
    finding.sources.find((item) => item.fieldId !== finding.targetFieldId) ??
    finding.sources[0];
  return source?.rawValue ?? "";
}

function coerceValue(value: string, currentValue: FieldValue): FieldValue {
  if (typeof currentValue === "number") {
    const number = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(number) ? number : value;
  }
  if (typeof currentValue === "boolean") {
    return value === "true";
  }
  return value;
}

export function ResolutionPanel({
  state,
  finding,
  dispatch,
}: ResolutionPanelProps) {
  const [correctionValue, setCorrectionValue] = useState(
    finding ? suggestionFor(finding) : "",
  );
  const [decision, setDecision] =
    useState<HumanResolution["decision"]>("accept");
  const [rationale, setRationale] = useState("");

  if (!finding) {
    return (
      <section
        className="panel detail-panel resolution-panel"
        aria-label="Resolution controls"
      >
        <p className="empty-state">Select a finding to see the permitted action.</p>
      </section>
    );
  }

  const proposal = state.proposals.find((item) => item.findingId === finding.id);
  const externalRequest = state.externalRequests.find(
    (item) => item.findingId === finding.id,
  );
  const stagedDecision = state.stagedHumanDecisions[finding.id];
  const confirmedDecision = state.resolutions.humanDecisions[finding.id];

  const targetDocument = finding.targetDocumentId
    ? getDocumentById(state.pack, finding.targetDocumentId)
    : null;
  const targetField =
    targetDocument && finding.targetFieldId
      ? getFieldById(targetDocument, finding.targetFieldId)
      : null;
  const fieldOverridden =
    targetField !== null &&
    Object.prototype.hasOwnProperty.call(
      state.resolutions.fieldOverrides,
      targetField.id,
    );

  return (
    <section
      className="panel detail-panel resolution-panel"
      aria-label="Resolution controls"
    >
      <div className="panel-heading compact">
        <div>
          <p className="section-kicker">Authority-aware action</p>
          <h2>Resolution</h2>
        </div>
      </div>

      {state.lastError ? (
        <div className="error-message" role="alert">
          <strong>{state.lastError.code}</strong>
          <span>{state.lastError.message}</span>
        </div>
      ) : null}

      {finding.authority === "exporter_editable" && targetField ? (
        <div className="resolution-stack">
          <p className="authority-explanation">
            This field belongs to an exporter-owned draft. A proposed change must be
            staged and approved before it affects the document.
          </p>

          {proposal ? (
            <article className="proposal-card">
              <span className="state-label">Awaiting human approval</span>
              <dl className="change-comparison">
                <div>
                  <dt>Current value</dt>
                  <dd>{String(proposal.previousValue)}</dd>
                </div>
                <div>
                  <dt>Proposed value</dt>
                  <dd>{String(proposal.proposedValue)}</dd>
                </div>
              </dl>
              <div className="button-row">
                <button
                  type="button"
                  className="button primary"
                  onClick={() =>
                    dispatch({
                      type: "approve_exporter_correction",
                      proposalId: proposal.id,
                    })
                  }
                >
                  Approve correction
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    dispatch({
                      type: "reject_exporter_correction",
                      proposalId: proposal.id,
                    })
                  }
                >
                  Reject proposal
                </button>
              </div>
            </article>
          ) : fieldOverridden ? (
            <div className="success-message">
              Approved correction applied. Rerun the preflight to refresh findings.
            </div>
          ) : (
            <form
              className="resolution-form"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                dispatch({
                  type: "stage_exporter_corrections",
                  corrections: [
                    {
                      findingId: finding.id,
                      proposedValue: coerceValue(
                        correctionValue,
                        targetField.rawValue,
                      ),
                    },
                  ],
                  actor: "human",
                });
              }}
            >
              <label htmlFor={`correction-${finding.id}`}>Proposed value</label>
              <input
                id={`correction-${finding.id}`}
                value={correctionValue}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setCorrectionValue(event.target.value)
                }
              />
              <button type="submit" className="button primary">
                Stage correction
              </button>
            </form>
          )}
        </div>
      ) : null}

      {finding.authority === "external_issuer" && targetDocument ? (
        <div className="resolution-stack">
          <div className="locked-message">
            <strong>Direct editing is unavailable.</strong>
            <span>
              {targetDocument.title} is controlled by {targetDocument.issuer}. The
              application can prepare a request, but it cannot alter the document.
            </span>
          </div>

          {externalRequest ? (
            <article
              className="request-card"
              aria-label={`Unsent correction request for ${finding.title}`}
            >
              <span className="state-label">Unsent draft</span>
              <dl>
                <div>
                  <dt>Recipient</dt>
                  <dd>{externalRequest.recipient}</dd>
                </div>
                <div>
                  <dt>Subject</dt>
                  <dd>{externalRequest.subject}</dd>
                </div>
              </dl>
              <pre>{externalRequest.body}</pre>
            </article>
          ) : (
            <button
              type="button"
              className="button primary"
              onClick={() =>
                dispatch({
                  type: "draft_external_requests",
                  findingIds: [finding.id],
                  actor: "human",
                })
              }
            >
              {targetDocument.owner === "carrier"
                ? "Draft carrier request"
                : "Draft authority request"}
            </button>
          )}
        </div>
      ) : null}

      {finding.authority === "human_judgement" ? (
        <div className="resolution-stack">
          <p className="authority-explanation">
            Deterministic comparison cannot decide whether these descriptions conflict.
            Record a human decision and rationale.
          </p>

          {stagedDecision ? (
            <article className="proposal-card">
              <span className="state-label">Awaiting human confirmation</span>
              <dl>
                <div>
                  <dt>Decision</dt>
                  <dd>{stagedDecision.decision}</dd>
                </div>
                <div>
                  <dt>Rationale</dt>
                  <dd>{stagedDecision.rationale}</dd>
                </div>
              </dl>
              <button
                type="button"
                className="button primary"
                onClick={() =>
                  dispatch({
                    type: "confirm_human_decision",
                    findingId: finding.id,
                  })
                }
              >
                Confirm decision
              </button>
            </article>
          ) : confirmedDecision ? (
            <div className="success-message">
              Human decision confirmed: {confirmedDecision.decision}. Rerun the
              preflight to apply the review outcome.
            </div>
          ) : (
            <form
              className="resolution-form"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                dispatch({
                  type: "stage_human_decision",
                  findingId: finding.id,
                  decision,
                  rationale,
                  actor: "human",
                });
              }}
            >
              <fieldset>
                <legend>Decision</legend>
                <label>
                  <input
                    type="radio"
                    name={`decision-${finding.id}`}
                    value="accept"
                    checked={decision === "accept"}
                    onChange={() => setDecision("accept")}
                  />
                  Accept wording difference
                </label>
                <label>
                  <input
                    type="radio"
                    name={`decision-${finding.id}`}
                    value="reject"
                    checked={decision === "reject"}
                    onChange={() => setDecision("reject")}
                  />
                  Reject wording difference
                </label>
                <label>
                  <input
                    type="radio"
                    name={`decision-${finding.id}`}
                    value="escalate"
                    checked={decision === "escalate"}
                    onChange={() => setDecision("escalate")}
                  />
                  Escalate for specialist review
                </label>
              </fieldset>
              <label htmlFor={`rationale-${finding.id}`}>Rationale</label>
              <textarea
                id={`rationale-${finding.id}`}
                value={rationale}
                rows={4}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setRationale(event.target.value)
                }
                placeholder="State why the wording is acceptable, conflicting, or uncertain."
              />
              <button type="submit" className="button primary">
                Stage decision
              </button>
            </form>
          )}
        </div>
      ) : null}
    </section>
  );
}
