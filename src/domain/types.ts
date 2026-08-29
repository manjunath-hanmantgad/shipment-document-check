export type DocumentType =
  | "letter_of_credit"
  | "commercial_invoice"
  | "packing_list"
  | "bill_of_lading"
  | "certificate_of_origin";

export type DocumentOwner = "bank" | "exporter" | "carrier" | "authority";
export type DocumentEditability = "editable_draft" | "locked";

export type FieldKey =
  | "lc_reference"
  | "beneficiary_name"
  | "currency"
  | "lc_amount"
  | "invoice_total"
  | "quantity"
  | "port_of_discharge"
  | "latest_shipment_date"
  | "shipment_date"
  | "goods_description"
  | "certification_marker"
  | "notes";

export type FieldValue = string | number | boolean;

export interface DocumentField {
  id: string;
  key: FieldKey;
  label: string;
  rawValue: FieldValue;
  sourceLocation: string;
  untrusted: boolean;
}

export interface DocumentSection {
  id: string;
  title: string;
  fieldIds: string[];
}

export interface TradeDocument {
  id: string;
  type: DocumentType;
  title: string;
  issuer: string;
  owner: DocumentOwner;
  editability: DocumentEditability;
  fields: DocumentField[];
  sections: DocumentSection[];
}

export interface ShipmentPack {
  id: string;
  reference: string;
  title: string;
  documents: TradeDocument[];
}

export type RuleStatus =
  | "pass"
  | "fail"
  | "needs_human_review"
  | "not_applicable";

export type FindingAuthority =
  | "exporter_editable"
  | "external_issuer"
  | "human_judgement";

export type FindingSeverity = "critical" | "warning" | "information";

export type FindingStatus =
  | "open"
  | "pending_external"
  | "human_reviewed";

export interface SourceEvidence {
  documentId: string;
  documentTitle: string;
  fieldId: string;
  fieldLabel: string;
  sourceLocation: string;
  rawValue: string;
  normalizedValue: string;
  untrusted: boolean;
}

export interface RuleOutcome {
  ruleId: string;
  title: string;
  status: RuleStatus;
  explanation: string;
  sources: SourceEvidence[];
}

export interface Finding extends RuleOutcome {
  id: string;
  ruleId: string;
  authority: FindingAuthority;
  severity: FindingSeverity;
  findingStatus: FindingStatus;
  targetDocumentId: string | null;
  targetFieldId: string | null;
}

export interface HumanResolution {
  decision: "accept" | "reject" | "escalate";
  rationale: string;
}

export interface ResolutionState {
  fieldOverrides: Record<string, FieldValue>;
  externalRequestFindingIds: string[];
  humanDecisions: Record<string, HumanResolution>;
}

export interface PreflightSummary {
  pass: number;
  fail: number;
  needsHumanReview: number;
  notApplicable: number;
}

export interface PreflightResult {
  packId: string;
  outcomes: RuleOutcome[];
  findings: Finding[];
  summary: PreflightSummary;
}
