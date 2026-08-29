import type { AppState } from "./actions";
import type { Finding } from "./types";

export type FindingWorkflowStatus =
  | "Open"
  | "Awaiting approval"
  | "Awaiting confirmation"
  | "Verification pending"
  | "Pending external"
  | "Human reviewed";

export type FindingWorkflowStatusCode =
  | "open"
  | "proposal_pending"
  | "human_decision_pending"
  | "verification_pending"
  | "pending_external"
  | "human_reviewed";

const WORKFLOW_STATUS_LABELS: Record<
  FindingWorkflowStatusCode,
  FindingWorkflowStatus
> = {
  open: "Open",
  proposal_pending: "Awaiting approval",
  human_decision_pending: "Awaiting confirmation",
  verification_pending: "Verification pending",
  pending_external: "Pending external",
  human_reviewed: "Human reviewed",
};

export function workflowStatusCodeForFinding(
  state: AppState,
  finding: Finding,
): FindingWorkflowStatusCode {
  if (state.proposals.some((item) => item.findingId === finding.id)) {
    return "proposal_pending";
  }
  if (
    state.externalRequests.some((item) => item.findingId === finding.id) ||
    finding.findingStatus === "pending_external"
  ) {
    return "pending_external";
  }
  if (state.stagedHumanDecisions[finding.id]) {
    return "human_decision_pending";
  }

  const hasApprovedFieldOverride =
    finding.targetFieldId !== null &&
    Object.prototype.hasOwnProperty.call(
      state.resolutions.fieldOverrides,
      finding.targetFieldId,
    );
  const hasConfirmedHumanDecision = Object.prototype.hasOwnProperty.call(
    state.resolutions.humanDecisions,
    finding.id,
  );

  if (
    state.hasUnrunChanges &&
    (hasApprovedFieldOverride || hasConfirmedHumanDecision)
  ) {
    return "verification_pending";
  }
  if (finding.findingStatus === "human_reviewed") {
    return "human_reviewed";
  }
  return "open";
}

export function workflowStatusForFinding(
  state: AppState,
  finding: Finding,
): FindingWorkflowStatus {
  return WORKFLOW_STATUS_LABELS[workflowStatusCodeForFinding(state, finding)];
}

export function workflowCount(
  state: AppState,
  status: FindingWorkflowStatus,
): number {
  return state.preflight.findings.filter(
    (finding) => workflowStatusForFinding(state, finding) === status,
  ).length;
}
