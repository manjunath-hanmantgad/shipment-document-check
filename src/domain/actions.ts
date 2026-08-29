import type {
  FieldValue,
  Finding,
  HumanResolution,
  PreflightResult,
  ResolutionState,
  ShipmentPack,
} from "./types";

export type Actor = "human" | "agent" | "system";

export type DomainErrorCode =
  | "CASE_NOT_ACTIVE"
  | "FINDING_NOT_FOUND"
  | "DOCUMENT_LOCKED"
  | "ACTION_NOT_AVAILABLE"
  | "APPROVAL_REQUIRED"
  | "RATIONALE_REQUIRED"
  | "INVALID_INPUT";

export interface DomainActionError {
  code: DomainErrorCode;
  message: string;
  findingId?: string;
  documentId?: string;
}

export interface ExporterCorrectionInput {
  findingId: string;
  proposedValue: FieldValue;
}

export interface ExporterCorrectionProposal {
  id: string;
  findingId: string;
  documentId: string;
  fieldId: string;
  previousValue: FieldValue;
  proposedValue: FieldValue;
  stagedBy: Exclude<Actor, "system">;
}

export interface ExternalCorrectionRequest {
  id: string;
  findingId: string;
  documentId: string;
  recipient: string;
  subject: string;
  body: string;
  status: "draft";
  sent: false;
  createdBy: Exclude<Actor, "system">;
}

export interface StagedHumanDecision extends HumanResolution {
  findingId: string;
  stagedBy: Exclude<Actor, "system">;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  actor: Actor;
  message: string;
}

export interface AppState {
  pack: ShipmentPack;
  resolutions: ResolutionState;
  preflight: PreflightResult;
  proposals: ExporterCorrectionProposal[];
  externalRequests: ExternalCorrectionRequest[];
  stagedHumanDecisions: Record<string, StagedHumanDecision>;
  selectedDocumentId: string;
  selectedFindingId: string | null;
  activities: ActivityEntry[];
  hasUnrunChanges: boolean;
  lastError: DomainActionError | null;
}

export type ExporterEditableFinding = Finding & {
  authority: "exporter_editable";
  targetDocumentId: string;
  targetFieldId: string;
};

export type ExternalIssuerFinding = Finding & {
  authority: "external_issuer";
  targetDocumentId: string;
};

export type HumanJudgementFinding = Finding & {
  authority: "human_judgement";
};

export type AppAction =
  | { type: "select_document"; documentId: string }
  | { type: "select_finding"; findingId: string }
  | {
      type: "stage_exporter_corrections";
      corrections: ExporterCorrectionInput[];
      actor: Exclude<Actor, "system">;
    }
  | { type: "approve_exporter_correction"; proposalId: string }
  | { type: "reject_exporter_correction"; proposalId: string }
  | { type: "undo_exporter_correction"; findingId: string }
  | {
      type: "draft_external_requests";
      findingIds: string[];
      actor: Exclude<Actor, "system">;
    }
  | { type: "discard_external_request"; findingId: string }
  | {
      type: "stage_human_decision";
      findingId: string;
      decision: HumanResolution["decision"];
      rationale: string;
      actor: Exclude<Actor, "system">;
    }
  | { type: "confirm_human_decision"; findingId: string }
  | { type: "cancel_human_decision"; findingId: string }
  | { type: "rerun_preflight"; actor: Exclude<Actor, "system"> }
  | { type: "reset_case" };

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: DomainActionError };
