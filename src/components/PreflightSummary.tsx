import type { AppState } from "../domain/actions";

interface PreflightSummaryProps {
  state: AppState;
}

export function PreflightSummary({ state }: PreflightSummaryProps) {
  const proposalIds = new Set(state.proposals.map((item) => item.findingId));
  const externalIds = new Set([
    ...state.externalRequests.map((item) => item.findingId),
    ...state.preflight.findings
      .filter((item) => item.findingStatus === "pending_external")
      .map((item) => item.id),
  ]);
  const humanIds = new Set([
    ...Object.keys(state.stagedHumanDecisions),
    ...Object.keys(state.resolutions.humanDecisions),
    ...state.preflight.findings
      .filter((item) => item.findingStatus === "human_reviewed")
      .map((item) => item.id),
  ]);

  const open = state.preflight.findings.filter(
    (finding) =>
      !proposalIds.has(finding.id) &&
      !externalIds.has(finding.id) &&
      !humanIds.has(finding.id),
  ).length;

  const items = [
    { label: "Passing", value: state.preflight.summary.pass },
    { label: "Open", value: open },
    { label: "Proposal pending", value: state.proposals.length },
    {
      label: "Resolved internally",
      value: Object.keys(state.resolutions.fieldOverrides).length,
    },
    { label: "Pending external", value: externalIds.size },
    {
      label: "Human reviewed",
      value: Object.keys(state.resolutions.humanDecisions).length,
    },
  ];

  return (
    <section className="summary-strip" aria-label="Preflight status summary">
      {items.map((item) => (
        <article
          key={item.label}
          className="summary-item"
          aria-label={`${item.value} ${item.label.toLowerCase()}`}
        >
          <strong aria-hidden="true">{item.value}</strong>
          <span aria-hidden="true">{item.label}</span>
        </article>
      ))}
    </section>
  );
}
