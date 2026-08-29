import {
  getBaselinePack,
  getDocumentById,
  getFieldById,
} from "./case";
import {
  emptyResolutionState,
  runPreflight,
} from "./rules";
import type {
  Actor,
  AppAction,
  AppState,
  DomainActionError,
  ExporterCorrectionInput,
  ExporterEditableFinding,
  ExternalCorrectionRequest,
  ExternalIssuerFinding,
  HumanJudgementFinding,
  StagedHumanDecision,
  ValidationResult,
} from "./actions";
import type {
  FieldValue,
  Finding,
  ResolutionState,
} from "./types";

function freshResolutions(): ResolutionState {
  return {
    fieldOverrides: { ...emptyResolutionState.fieldOverrides },
    externalRequestFindingIds: [
      ...emptyResolutionState.externalRequestFindingIds,
    ],
    humanDecisions: { ...emptyResolutionState.humanDecisions },
  };
}

export function getFreshInitialState(): AppState {
  const pack = getBaselinePack();
  const resolutions = freshResolutions();
  const preflight = runPreflight(pack, resolutions);

  return {
    pack,
    resolutions,
    preflight,
    proposals: [],
    externalRequests: [],
    stagedHumanDecisions: {},
    selectedDocumentId: pack.documents[0].id,
    selectedFindingId: preflight.findings[0]?.id ?? null,
    activities: [],
    hasUnrunChanges: false,
    lastError: null,
  };
}

function error(
  code: DomainActionError["code"],
  message: string,
  details: Pick<DomainActionError, "findingId" | "documentId"> = {},
): DomainActionError {
  return { code, message, ...details };
}

function findFinding(
  state: AppState,
  findingId: string,
): ValidationResult<Finding> {
  const finding = state.preflight.findings.find((item) => item.id === findingId);
  return finding
    ? { ok: true, value: finding }
    : {
        ok: false,
        error: error(
          "FINDING_NOT_FOUND",
          `Finding is not available in the current preflight: ${findingId}`,
          { findingId },
        ),
      };
}

export function assertExporterEditable(
  state: AppState,
  findingId: string,
): ValidationResult<ExporterEditableFinding> {
  const result = findFinding(state, findingId);
  if (!result.ok) return result;

  const finding = result.value;

  if (finding.targetDocumentId) {
    const document = getDocumentById(state.pack, finding.targetDocumentId);
    if (document.owner !== "exporter" || document.editability !== "editable_draft") {
      return {
        ok: false,
        error: error(
          "DOCUMENT_LOCKED",
          `${document.title} is not an exporter-owned editable draft.`,
          { findingId, documentId: document.id },
        ),
      };
    }
  }

  if (
    finding.authority !== "exporter_editable" ||
    !finding.targetDocumentId ||
    !finding.targetFieldId
  ) {
    return {
      ok: false,
      error: error(
        "ACTION_NOT_AVAILABLE",
        "This finding cannot be corrected by the exporter.",
        {
          findingId,
          documentId: finding.targetDocumentId ?? undefined,
        },
      ),
    };
  }

  return {
    ok: true,
    value: finding as ExporterEditableFinding,
  };
}

export function assertExternalIssuer(
  state: AppState,
  findingId: string,
): ValidationResult<ExternalIssuerFinding> {
  const result = findFinding(state, findingId);
  if (!result.ok) return result;

  const finding = result.value;
  if (finding.authority !== "external_issuer" || !finding.targetDocumentId) {
    return {
      ok: false,
      error: error(
        "ACTION_NOT_AVAILABLE",
        "This finding does not require an external issuer request.",
        {
          findingId,
          documentId: finding.targetDocumentId ?? undefined,
        },
      ),
    };
  }

  const document = getDocumentById(state.pack, finding.targetDocumentId);
  if (document.editability !== "locked" || document.owner === "exporter") {
    return {
      ok: false,
      error: error(
        "ACTION_NOT_AVAILABLE",
        "An external request is available only for issuer-owned locked documents.",
        { findingId, documentId: document.id },
      ),
    };
  }

  return {
    ok: true,
    value: finding as ExternalIssuerFinding,
  };
}

export function assertHumanJudgement(
  state: AppState,
  findingId: string,
): ValidationResult<HumanJudgementFinding> {
  const result = findFinding(state, findingId);
  if (!result.ok) return result;

  if (result.value.authority !== "human_judgement") {
    return {
      ok: false,
      error: error(
        "ACTION_NOT_AVAILABLE",
        "This finding is not assigned to human judgement.",
        {
          findingId,
          documentId: result.value.targetDocumentId ?? undefined,
        },
      ),
    };
  }

  return {
    ok: true,
    value: result.value as HumanJudgementFinding,
  };
}

function withError(state: AppState, actionError: DomainActionError): AppState {
  return {
    ...state,
    lastError: actionError,
  };
}

function withActivity(
  state: AppState,
  actor: Actor,
  message: string,
  changes: Partial<AppState>,
): AppState {
  const sequence = state.activities.length + 1;
  return {
    ...state,
    ...changes,
    activities: [
      ...state.activities,
      {
        id: `activity:${sequence}`,
        timestamp: new Date().toISOString(),
        actor,
        message,
      },
    ],
    lastError: null,
  };
}

function currentFieldValue(
  state: AppState,
  documentId: string,
  fieldId: string,
): FieldValue {
  if (Object.prototype.hasOwnProperty.call(state.resolutions.fieldOverrides, fieldId)) {
    return state.resolutions.fieldOverrides[fieldId];
  }
  return getFieldById(getDocumentById(state.pack, documentId), fieldId).rawValue;
}

function invalidCorrection(
  correction: ExporterCorrectionInput,
): DomainActionError | null {
  if (
    typeof correction.proposedValue === "string" &&
    correction.proposedValue.trim().length === 0
  ) {
    return error(
      "INVALID_INPUT",
      "A proposed correction cannot be blank.",
      { findingId: correction.findingId },
    );
  }
  return null;
}

function stageExporterCorrections(
  state: AppState,
  action: Extract<AppAction, { type: "stage_exporter_corrections" }>,
): AppState {
  if (action.corrections.length === 0) {
    return withError(
      state,
      error("INVALID_INPUT", "At least one correction is required."),
    );
  }

  const seen = new Set<string>();
  const validated: Array<{
    correction: ExporterCorrectionInput;
    finding: ExporterEditableFinding;
  }> = [];

  for (const correction of action.corrections) {
    if (seen.has(correction.findingId)) {
      return withError(
        state,
        error("INVALID_INPUT", "A correction batch contains a duplicate finding.", {
          findingId: correction.findingId,
        }),
      );
    }
    seen.add(correction.findingId);

    const inputError = invalidCorrection(correction);
    if (inputError) return withError(state, inputError);

    const result = assertExporterEditable(state, correction.findingId);
    if (!result.ok) return withError(state, result.error);
    validated.push({ correction, finding: result.value });
  }

  const proposalByFinding = new Map(
    state.proposals.map((proposal) => [proposal.findingId, proposal]),
  );

  for (const { correction, finding } of validated) {
    proposalByFinding.set(finding.id, {
      id: `proposal:${finding.id}`,
      findingId: finding.id,
      documentId: finding.targetDocumentId,
      fieldId: finding.targetFieldId,
      previousValue: currentFieldValue(
        state,
        finding.targetDocumentId,
        finding.targetFieldId,
      ),
      proposedValue: correction.proposedValue,
      stagedBy: action.actor,
    });
  }

  return withActivity(
    state,
    action.actor,
    `${action.actor === "agent" ? "Agent" : "Human"} staged ${validated.length} exporter correction${validated.length === 1 ? "" : "s"}.`,
    {
      proposals: [...proposalByFinding.values()],
    },
  );
}

function approveExporterCorrection(
  state: AppState,
  proposalId: string,
): AppState {
  const proposal = state.proposals.find((item) => item.id === proposalId);
  if (!proposal) {
    return withError(
      state,
      error(
        "APPROVAL_REQUIRED",
        `Correction proposal is not awaiting approval: ${proposalId}`,
      ),
    );
  }

  const authority = assertExporterEditable(state, proposal.findingId);
  if (!authority.ok) return withError(state, authority.error);

  return withActivity(state, "human", "Human approved an exporter correction.", {
    resolutions: {
      ...state.resolutions,
      fieldOverrides: {
        ...state.resolutions.fieldOverrides,
        [proposal.fieldId]: proposal.proposedValue,
      },
    },
    proposals: state.proposals.filter((item) => item.id !== proposalId),
    hasUnrunChanges: true,
  });
}

function rejectExporterCorrection(
  state: AppState,
  proposalId: string,
): AppState {
  const proposal = state.proposals.find((item) => item.id === proposalId);
  if (!proposal) {
    return withError(
      state,
      error(
        "APPROVAL_REQUIRED",
        `Correction proposal is not awaiting approval: ${proposalId}`,
      ),
    );
  }

  return withActivity(state, "human", "Human rejected an exporter correction.", {
    proposals: state.proposals.filter((item) => item.id !== proposalId),
  });
}

function hasAppliedResolutions(resolutions: ResolutionState): boolean {
  return (
    Object.keys(resolutions.fieldOverrides).length > 0 ||
    resolutions.externalRequestFindingIds.length > 0 ||
    Object.keys(resolutions.humanDecisions).length > 0
  );
}

function undoExporterCorrection(state: AppState, findingId: string): AppState {
  const authority = assertExporterEditable(state, findingId);
  if (!authority.ok) return withError(state, authority.error);

  const fieldId = authority.value.targetFieldId;
  if (!Object.prototype.hasOwnProperty.call(state.resolutions.fieldOverrides, fieldId)) {
    return withError(
      state,
      error("ACTION_NOT_AVAILABLE", "This correction is not awaiting verification.", {
        findingId,
      }),
    );
  }

  const fieldOverrides = { ...state.resolutions.fieldOverrides };
  delete fieldOverrides[fieldId];
  const resolutions = { ...state.resolutions, fieldOverrides };

  return withActivity(state, "human", "Human undid an approved exporter correction.", {
    resolutions,
    hasUnrunChanges: hasAppliedResolutions(resolutions),
  });
}

function requestBody(state: AppState, finding: ExternalIssuerFinding): string {
  const document = getDocumentById(state.pack, finding.targetDocumentId);
  const evidence = finding.sources
    .map((source) => `- ${source.documentTitle} · ${source.fieldLabel}: ${source.rawValue}`)
    .join("\n");

  return [
    `Please review ${document.title} for shipment ${state.pack.reference}.`,
    `Issue: ${finding.explanation}`,
    "Source evidence:",
    evidence,
    "This is an unsent draft for human review.",
  ].join("\n");
}

function draftExternalRequests(
  state: AppState,
  action: Extract<AppAction, { type: "draft_external_requests" }>,
): AppState {
  if (action.findingIds.length === 0) {
    return withError(
      state,
      error("INVALID_INPUT", "At least one external finding is required."),
    );
  }

  const uniqueIds = [...new Set(action.findingIds)];
  if (uniqueIds.length !== action.findingIds.length) {
    return withError(
      state,
      error("INVALID_INPUT", "An external request batch contains duplicate findings."),
    );
  }

  const findings: ExternalIssuerFinding[] = [];
  for (const findingId of uniqueIds) {
    const result = assertExternalIssuer(state, findingId);
    if (!result.ok) return withError(state, result.error);
    findings.push(result.value);
  }

  const requestByFinding = new Map(
    state.externalRequests.map((request) => [request.findingId, request]),
  );

  for (const finding of findings) {
    const document = getDocumentById(state.pack, finding.targetDocumentId);
    const draft: ExternalCorrectionRequest = {
      id: `request:${finding.id}`,
      findingId: finding.id,
      documentId: document.id,
      recipient: document.issuer,
      subject: `Correction requested: ${finding.title}`,
      body: requestBody(state, finding),
      status: "draft",
      sent: false,
      createdBy: action.actor,
    };
    requestByFinding.set(finding.id, draft);
  }

  const externalIds = new Set(state.resolutions.externalRequestFindingIds);
  findings.forEach((finding) => externalIds.add(finding.id));

  return withActivity(
    state,
    action.actor,
    `${action.actor === "agent" ? "Agent" : "Human"} drafted ${findings.length} external correction request${findings.length === 1 ? "" : "s"}.`,
    {
      externalRequests: [...requestByFinding.values()],
      resolutions: {
        ...state.resolutions,
        externalRequestFindingIds: [...externalIds],
      },
      hasUnrunChanges: true,
    },
  );
}

function discardExternalRequest(state: AppState, findingId: string): AppState {
  const request = state.externalRequests.find((item) => item.findingId === findingId);
  if (!request) {
    return withError(
      state,
      error("ACTION_NOT_AVAILABLE", "No unsent external request is available to discard.", {
        findingId,
      }),
    );
  }

  const resolutions = {
    ...state.resolutions,
    externalRequestFindingIds: state.resolutions.externalRequestFindingIds.filter(
      (item) => item !== findingId,
    ),
  };

  return withActivity(state, "human", "Human discarded an unsent external request.", {
    externalRequests: state.externalRequests.filter(
      (item) => item.findingId !== findingId,
    ),
    resolutions,
    hasUnrunChanges: hasAppliedResolutions(resolutions),
  });
}

function stageHumanDecision(
  state: AppState,
  action: Extract<AppAction, { type: "stage_human_decision" }>,
): AppState {
  const authority = assertHumanJudgement(state, action.findingId);
  if (!authority.ok) return withError(state, authority.error);

  const rationale = action.rationale.trim();
  if (!rationale) {
    return withError(
      state,
      error(
        "RATIONALE_REQUIRED",
        "A human decision requires a non-empty rationale.",
        { findingId: action.findingId },
      ),
    );
  }

  const staged: StagedHumanDecision = {
    findingId: action.findingId,
    decision: action.decision,
    rationale,
    stagedBy: action.actor,
  };

  return withActivity(
    state,
    action.actor,
    `${action.actor === "agent" ? "Agent" : "Human"} staged a human-review decision.`,
    {
      stagedHumanDecisions: {
        ...state.stagedHumanDecisions,
        [action.findingId]: staged,
      },
    },
  );
}

function confirmHumanDecision(state: AppState, findingId: string): AppState {
  const staged = state.stagedHumanDecisions[findingId];
  if (!staged) {
    return withError(
      state,
      error(
        "APPROVAL_REQUIRED",
        "No human decision is awaiting confirmation.",
        { findingId },
      ),
    );
  }

  const authority = assertHumanJudgement(state, findingId);
  if (!authority.ok) return withError(state, authority.error);

  const remaining = { ...state.stagedHumanDecisions };
  delete remaining[findingId];

  return withActivity(state, "human", "Human confirmed a review decision.", {
    stagedHumanDecisions: remaining,
    resolutions: {
      ...state.resolutions,
      humanDecisions: {
        ...state.resolutions.humanDecisions,
        [findingId]: {
          decision: staged.decision,
          rationale: staged.rationale,
        },
      },
    },
    hasUnrunChanges: true,
  });
}

function cancelHumanDecision(state: AppState, findingId: string): AppState {
  if (!state.stagedHumanDecisions[findingId]) {
    return withError(
      state,
      error("ACTION_NOT_AVAILABLE", "No human decision is awaiting confirmation.", {
        findingId,
      }),
    );
  }

  const stagedHumanDecisions = { ...state.stagedHumanDecisions };
  delete stagedHumanDecisions[findingId];

  return withActivity(state, "human", "Human cancelled a staged review decision.", {
    stagedHumanDecisions,
  });
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "select_document": {
      const exists = state.pack.documents.some(
        (document) => document.id === action.documentId,
      );
      return exists
        ? {
            ...state,
            selectedDocumentId: action.documentId,
            lastError: null,
          }
        : withError(
            state,
            error("INVALID_INPUT", `Document not found: ${action.documentId}`, {
              documentId: action.documentId,
            }),
          );
    }
    case "select_finding": {
      const result = findFinding(state, action.findingId);
      return result.ok
        ? {
            ...state,
            selectedFindingId: action.findingId,
            lastError: null,
          }
        : withError(state, result.error);
    }
    case "stage_exporter_corrections":
      return stageExporterCorrections(state, action);
    case "approve_exporter_correction":
      return approveExporterCorrection(state, action.proposalId);
    case "reject_exporter_correction":
      return rejectExporterCorrection(state, action.proposalId);
    case "undo_exporter_correction":
      return undoExporterCorrection(state, action.findingId);
    case "draft_external_requests":
      return draftExternalRequests(state, action);
    case "discard_external_request":
      return discardExternalRequest(state, action.findingId);
    case "stage_human_decision":
      return stageHumanDecision(state, action);
    case "confirm_human_decision":
      return confirmHumanDecision(state, action.findingId);
    case "cancel_human_decision":
      return cancelHumanDecision(state, action.findingId);
    case "rerun_preflight": {
      const preflight = runPreflight(state.pack, state.resolutions);
      return withActivity(
        state,
        action.actor,
        `${action.actor === "agent" ? "Agent" : "Human"} reran the deterministic preflight.`,
        {
          preflight,
          selectedFindingId: preflight.findings[0]?.id ?? null,
          hasUnrunChanges: false,
        },
      );
    }
    case "reset_case":
      return getFreshInitialState();
  }
}
