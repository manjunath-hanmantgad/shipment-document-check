import {
  DOCUMENT_IDS,
  FIELD_IDS,
  getDocumentById,
  getFieldById,
} from "./case";
import type {
  FieldValue,
  Finding,
  FindingAuthority,
  FindingSeverity,
  FindingStatus,
  PreflightResult,
  ResolutionState,
  RuleOutcome,
  RuleStatus,
  ShipmentPack,
  SourceEvidence,
} from "./types";

export const emptyResolutionState: ResolutionState = {
  fieldOverrides: {},
  externalRequestFindingIds: [],
  humanDecisions: {},
};

type Normalizer = (value: FieldValue) => string;

interface EvidenceSpec {
  documentId: string;
  fieldId: string;
  normalize: Normalizer;
}

interface FindingSpec {
  id: string;
  authority: FindingAuthority;
  severity: FindingSeverity;
  targetDocumentId: string | null;
  targetFieldId: string | null;
}

interface RuleEvaluation {
  status: RuleStatus;
  explanation: string;
  sources: SourceEvidence[];
  finding?: FindingSpec;
}

interface RuleDefinition {
  id: string;
  title: string;
  evaluate: (pack: ShipmentPack, resolutions: ResolutionState) => RuleEvaluation;
}

function normalizeText(value: FieldValue): string {
  return String(value)
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[—–×]/g, "-")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeCurrency(value: FieldValue): string {
  return String(value).trim().toUpperCase();
}

function normalizeNumber(value: FieldValue): string {
  if (typeof value === "number") {
    return String(value);
  }
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? String(parsed) : normalizeText(value);
}

function normalizeDate(value: FieldValue): string {
  const raw = String(value).trim();
  const timestamp = Date.parse(raw);
  if (Number.isNaN(timestamp)) {
    return raw;
  }
  return new Date(timestamp).toISOString().slice(0, 10);
}

function getEffectiveValue(
  documentOwner: "bank" | "exporter" | "carrier" | "authority",
  documentEditability: "editable_draft" | "locked",
  fieldId: string,
  rawValue: FieldValue,
  resolutions: ResolutionState,
): FieldValue {
  const mayOverride =
    documentOwner === "exporter" && documentEditability === "editable_draft";
  return mayOverride &&
    Object.prototype.hasOwnProperty.call(resolutions.fieldOverrides, fieldId)
    ? resolutions.fieldOverrides[fieldId]
    : rawValue;
}

function evidence(
  pack: ShipmentPack,
  resolutions: ResolutionState,
  spec: EvidenceSpec,
): SourceEvidence {
  const document = getDocumentById(pack, spec.documentId);
  const field = getFieldById(document, spec.fieldId);
  const rawValue = getEffectiveValue(
    document.owner,
    document.editability,
    field.id,
    field.rawValue,
    resolutions,
  );

  return {
    documentId: document.id,
    documentTitle: document.title,
    fieldId: field.id,
    fieldLabel: field.label,
    sourceLocation: field.sourceLocation,
    rawValue: String(rawValue),
    normalizedValue: spec.normalize(rawValue),
    untrusted: field.untrusted,
  };
}

function equalityRule(
  id: string,
  title: string,
  specs: EvidenceSpec[],
  finding: FindingSpec,
  failureExplanation: string,
): RuleDefinition {
  return {
    id,
    title,
    evaluate(pack, resolutions) {
      const sources = specs.map((spec) => evidence(pack, resolutions, spec));
      const values = new Set(sources.map((source) => source.normalizedValue));
      return values.size === 1
        ? {
            status: "pass",
            explanation: `${title} is consistent across the scoped documents.`,
            sources,
          }
        : {
            status: "fail",
            explanation: failureExplanation,
            sources,
            finding,
          };
    },
  };
}

const rules: RuleDefinition[] = [
  equalityRule(
    "rule:lc-reference",
    "LC reference consistency",
    [
      {
        documentId: DOCUMENT_IDS.letterOfCredit,
        fieldId: FIELD_IDS.lcReference,
        normalize: normalizeText,
      },
      {
        documentId: DOCUMENT_IDS.commercialInvoice,
        fieldId: FIELD_IDS.invoiceLcReference,
        normalize: normalizeText,
      },
      {
        documentId: DOCUMENT_IDS.packingList,
        fieldId: FIELD_IDS.packingLcReference,
        normalize: normalizeText,
      },
      {
        documentId: DOCUMENT_IDS.billOfLading,
        fieldId: FIELD_IDS.billLcReference,
        normalize: normalizeText,
      },
      {
        documentId: DOCUMENT_IDS.certificateOfOrigin,
        fieldId: FIELD_IDS.certificateLcReference,
        normalize: normalizeText,
      },
    ],
    {
      id: "finding:lc-reference",
      authority: "human_judgement",
      severity: "critical",
      targetDocumentId: null,
      targetFieldId: null,
    },
    "The LC reference is not consistent across the document pack.",
  ),
  equalityRule(
    "rule:beneficiary-name",
    "Beneficiary-name consistency",
    [
      {
        documentId: DOCUMENT_IDS.letterOfCredit,
        fieldId: FIELD_IDS.lcBeneficiary,
        normalize: normalizeText,
      },
      {
        documentId: DOCUMENT_IDS.commercialInvoice,
        fieldId: FIELD_IDS.invoiceBeneficiary,
        normalize: normalizeText,
      },
    ],
    {
      id: "finding:beneficiary-name",
      authority: "exporter_editable",
      severity: "critical",
      targetDocumentId: DOCUMENT_IDS.commercialInvoice,
      targetFieldId: FIELD_IDS.invoiceBeneficiary,
    },
    "The Commercial Invoice beneficiary name differs from the Letter of Credit.",
  ),
  equalityRule(
    "rule:currency",
    "Currency consistency",
    [
      {
        documentId: DOCUMENT_IDS.letterOfCredit,
        fieldId: FIELD_IDS.lcCurrency,
        normalize: normalizeCurrency,
      },
      {
        documentId: DOCUMENT_IDS.commercialInvoice,
        fieldId: FIELD_IDS.invoiceCurrency,
        normalize: normalizeCurrency,
      },
    ],
    {
      id: "finding:currency",
      authority: "exporter_editable",
      severity: "critical",
      targetDocumentId: DOCUMENT_IDS.commercialInvoice,
      targetFieldId: FIELD_IDS.invoiceCurrency,
    },
    "The Commercial Invoice currency differs from the Letter of Credit.",
  ),
  {
    id: "rule:invoice-amount",
    title: "Invoice total within credit amount",
    evaluate(pack, resolutions) {
      const sources = [
        evidence(pack, resolutions, {
          documentId: DOCUMENT_IDS.letterOfCredit,
          fieldId: FIELD_IDS.lcAmount,
          normalize: normalizeNumber,
        }),
        evidence(pack, resolutions, {
          documentId: DOCUMENT_IDS.commercialInvoice,
          fieldId: FIELD_IDS.invoiceTotal,
          normalize: normalizeNumber,
        }),
      ];
      const creditAmount = Number(sources[0].normalizedValue);
      const invoiceTotal = Number(sources[1].normalizedValue);
      const passes =
        Number.isFinite(creditAmount) &&
        Number.isFinite(invoiceTotal) &&
        invoiceTotal <= creditAmount;

      return passes
        ? {
            status: "pass",
            explanation: "The Commercial Invoice total is within the Letter of Credit amount.",
            sources,
          }
        : {
            status: "fail",
            explanation: "The Commercial Invoice total exceeds the Letter of Credit amount.",
            sources,
            finding: {
              id: "finding:invoice-total",
              authority: "exporter_editable",
              severity: "critical",
              targetDocumentId: DOCUMENT_IDS.commercialInvoice,
              targetFieldId: FIELD_IDS.invoiceTotal,
            },
          };
    },
  },
  equalityRule(
    "rule:quantity",
    "Quantity consistency",
    [
      {
        documentId: DOCUMENT_IDS.commercialInvoice,
        fieldId: FIELD_IDS.invoiceQuantity,
        normalize: normalizeNumber,
      },
      {
        documentId: DOCUMENT_IDS.packingList,
        fieldId: FIELD_IDS.packingQuantity,
        normalize: normalizeNumber,
      },
    ],
    {
      id: "finding:quantity",
      authority: "exporter_editable",
      severity: "critical",
      targetDocumentId: DOCUMENT_IDS.packingList,
      targetFieldId: FIELD_IDS.packingQuantity,
    },
    "The Packing List quantity differs from the Commercial Invoice quantity.",
  ),
  equalityRule(
    "rule:port-of-discharge",
    "Port-of-discharge consistency",
    [
      {
        documentId: DOCUMENT_IDS.letterOfCredit,
        fieldId: FIELD_IDS.lcDischargePort,
        normalize: normalizeText,
      },
      {
        documentId: DOCUMENT_IDS.billOfLading,
        fieldId: FIELD_IDS.billDischargePort,
        normalize: normalizeText,
      },
    ],
    {
      id: "finding:port-of-discharge",
      authority: "external_issuer",
      severity: "critical",
      targetDocumentId: DOCUMENT_IDS.billOfLading,
      targetFieldId: FIELD_IDS.billDischargePort,
    },
    "The carrier-issued Bill of Lading names a different discharge port.",
  ),
  {
    id: "rule:latest-shipment-date",
    title: "Shipment date within latest allowed date",
    evaluate(pack, resolutions) {
      const sources = [
        evidence(pack, resolutions, {
          documentId: DOCUMENT_IDS.letterOfCredit,
          fieldId: FIELD_IDS.lcLatestShipmentDate,
          normalize: normalizeDate,
        }),
        evidence(pack, resolutions, {
          documentId: DOCUMENT_IDS.billOfLading,
          fieldId: FIELD_IDS.billShipmentDate,
          normalize: normalizeDate,
        }),
      ];
      const latest = Date.parse(sources[0].normalizedValue);
      const shipped = Date.parse(sources[1].normalizedValue);
      const passes =
        Number.isFinite(latest) && Number.isFinite(shipped) && shipped <= latest;

      return passes
        ? {
            status: "pass",
            explanation: "The on-board date is not later than the latest allowed shipment date.",
            sources,
          }
        : {
            status: "fail",
            explanation: "The on-board date is later than the latest allowed shipment date.",
            sources,
            finding: {
              id: "finding:shipment-date",
              authority: "external_issuer",
              severity: "critical",
              targetDocumentId: DOCUMENT_IDS.billOfLading,
              targetFieldId: FIELD_IDS.billShipmentDate,
            },
          };
    },
  },
  {
    id: "rule:goods-description",
    title: "Goods-description review",
    evaluate(pack, resolutions) {
      const sources = [
        evidence(pack, resolutions, {
          documentId: DOCUMENT_IDS.letterOfCredit,
          fieldId: FIELD_IDS.lcGoodsDescription,
          normalize: normalizeText,
        }),
        evidence(pack, resolutions, {
          documentId: DOCUMENT_IDS.commercialInvoice,
          fieldId: FIELD_IDS.invoiceGoodsDescription,
          normalize: normalizeText,
        }),
      ];
      const identical = sources[0].normalizedValue === sources[1].normalizedValue;
      const humanDecision = resolutions.humanDecisions["finding:goods-description"];
      const hasConfirmedDecision =
        humanDecision !== undefined && humanDecision.rationale.trim().length > 0;

      if (identical) {
        return {
          status: "pass",
          explanation: "The scoped goods descriptions are deterministically identical.",
          sources,
        };
      }

      if (hasConfirmedDecision && humanDecision.decision === "accept") {
        return {
          status: "pass",
          explanation: `Human review accepted the wording difference: ${humanDecision.rationale}`,
          sources,
        };
      }

      return {
        status:
          hasConfirmedDecision && humanDecision.decision === "reject"
            ? "fail"
            : "needs_human_review",
        explanation:
          hasConfirmedDecision && humanDecision.decision === "reject"
            ? `Human review rejected the wording difference: ${humanDecision.rationale}`
            : "The goods descriptions are not identical; a human must decide whether they conflict.",
        sources,
        finding: {
          id: "finding:goods-description",
          authority: "human_judgement",
          severity: "warning",
          targetDocumentId: DOCUMENT_IDS.commercialInvoice,
          targetFieldId: FIELD_IDS.invoiceGoodsDescription,
        },
      };
    },
  },
  {
    id: "rule:certificate-signature",
    title: "Certificate signature marker",
    evaluate(pack, resolutions) {
      const sources = [
        evidence(pack, resolutions, {
          documentId: DOCUMENT_IDS.certificateOfOrigin,
          fieldId: FIELD_IDS.certificateMarker,
          normalize: normalizeText,
        }),
      ];
      const present = sources[0].normalizedValue === "TRUE";

      return present
        ? {
            status: "pass",
            explanation: "The Certificate of Origin contains an authorised signature marker.",
            sources,
          }
        : {
            status: "fail",
            explanation: "The authority-issued Certificate of Origin has no signature marker.",
            sources,
            finding: {
              id: "finding:certificate-signature",
              authority: "external_issuer",
              severity: "critical",
              targetDocumentId: DOCUMENT_IDS.certificateOfOrigin,
              targetFieldId: FIELD_IDS.certificateMarker,
            },
          };
    },
  },
];

function findingStatus(
  findingId: string,
  authority: FindingAuthority,
  resolutions: ResolutionState,
): FindingStatus {
  if (
    authority === "external_issuer" &&
    resolutions.externalRequestFindingIds.includes(findingId)
  ) {
    return "pending_external";
  }
  const humanDecision = resolutions.humanDecisions[findingId];
  if (
    authority === "human_judgement" &&
    humanDecision !== undefined &&
    humanDecision.decision !== "escalate" &&
    humanDecision.rationale.trim().length > 0
  ) {
    return "human_reviewed";
  }
  return "open";
}

function toFinding(
  rule: RuleDefinition,
  evaluation: RuleEvaluation,
  resolutions: ResolutionState,
): Finding | null {
  if (!evaluation.finding || evaluation.status === "pass") {
    return null;
  }
  return {
    id: evaluation.finding.id,
    ruleId: rule.id,
    title: rule.title,
    status: evaluation.status,
    explanation: evaluation.explanation,
    sources: evaluation.sources,
    authority: evaluation.finding.authority,
    severity: evaluation.finding.severity,
    findingStatus: findingStatus(
      evaluation.finding.id,
      evaluation.finding.authority,
      resolutions,
    ),
    targetDocumentId: evaluation.finding.targetDocumentId,
    targetFieldId: evaluation.finding.targetFieldId,
  };
}

export function runPreflight(
  pack: ShipmentPack,
  resolutions: ResolutionState,
): PreflightResult {
  const outcomes: RuleOutcome[] = [];
  const findings: Finding[] = [];

  for (const rule of rules) {
    const evaluation = rule.evaluate(pack, resolutions);
    outcomes.push({
      ruleId: rule.id,
      title: rule.title,
      status: evaluation.status,
      explanation: evaluation.explanation,
      sources: evaluation.sources,
    });
    const finding = toFinding(rule, evaluation, resolutions);
    if (finding) {
      findings.push(finding);
    }
  }

  return {
    packId: pack.id,
    outcomes,
    findings,
    summary: {
      pass: outcomes.filter((outcome) => outcome.status === "pass").length,
      fail: outcomes.filter((outcome) => outcome.status === "fail").length,
      needsHumanReview: outcomes.filter(
        (outcome) => outcome.status === "needs_human_review",
      ).length,
      notApplicable: outcomes.filter(
        (outcome) => outcome.status === "not_applicable",
      ).length,
    },
  };
}
