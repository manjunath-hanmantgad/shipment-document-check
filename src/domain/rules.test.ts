import { describe, expect, it } from "vitest";
import {
  DOCUMENT_IDS,
  FIELD_IDS,
  getBaselinePack,
  getDocumentById,
  getFieldById,
} from "./case";
import { parseShipmentPack } from "./schema";
import { emptyResolutionState, runPreflight } from "./rules";

const expectedFindingIds = [
  "finding:beneficiary-name",
  "finding:quantity",
  "finding:port-of-discharge",
  "finding:goods-description",
  "finding:certificate-signature",
];

describe("fictional shipment pack", () => {
  it("contains exactly one validated document of every supported type", () => {
    const pack = parseShipmentPack(getBaselinePack());

    expect(pack.documents.map((document) => document.type)).toEqual([
      "letter_of_credit",
      "commercial_invoice",
      "packing_list",
      "bill_of_lading",
      "certificate_of_origin",
    ]);
  });

  it("returns a fresh independent pack on every reset", () => {
    const first = getBaselinePack();
    const second = getBaselinePack();
    const invoice = getDocumentById(first, DOCUMENT_IDS.commercialInvoice);

    getFieldById(invoice, FIELD_IDS.invoiceBeneficiary).rawValue =
      "Changed locally";

    expect(
      getFieldById(
        getDocumentById(second, DOCUMENT_IDS.commercialInvoice),
        FIELD_IDS.invoiceBeneficiary,
      ).rawValue,
    ).toBe("Sahyadri Botanic Private Limited");
  });

  it("uses one data-driven section model with valid field references", () => {
    const pack = getBaselinePack();

    for (const document of pack.documents) {
      const fieldIds = new Set(document.fields.map((field) => field.id));
      for (const section of document.sections) {
        for (const fieldId of section.fieldIds) {
          expect(fieldIds.has(fieldId)).toBe(true);
        }
      }
    }
  });

  it("rejects an invalid document authority matrix", () => {
    const invalid = getBaselinePack();
    invalid.documents[0].editability = "editable_draft";

    expect(() => parseShipmentPack(invalid)).toThrow(/must be locked/i);
  });

  it("rejects duplicate field ids across documents", () => {
    const invalid = getBaselinePack();
    invalid.documents[1].fields[0].id = FIELD_IDS.lcReference;

    expect(() => parseShipmentPack(invalid)).toThrow(/duplicate field id/i);
  });

  it("rejects sections that reference missing fields", () => {
    const invalid = getBaselinePack();
    invalid.documents[1].sections[0].fieldIds.push("field:missing");

    expect(() => parseShipmentPack(invalid)).toThrow(/references missing field/i);
  });
});

describe("deterministic preflight", () => {
  it("returns five seeded findings and four passing checks", () => {
    const result = runPreflight(getBaselinePack(), emptyResolutionState);

    expect(result.findings.map((finding) => finding.id)).toEqual(
      expectedFindingIds,
    );
    expect(result.summary).toEqual({
      pass: 4,
      fail: 4,
      needsHumanReview: 1,
      notApplicable: 0,
    });
  });

  it("keeps raw and normalized source evidence", () => {
    const result = runPreflight(getBaselinePack(), emptyResolutionState);

    for (const finding of result.findings) {
      expect(finding.sources.length).toBeGreaterThan(0);
      for (const source of finding.sources) {
        expect(source.documentId).toMatch(/^doc:/);
        expect(source.fieldId).toMatch(/^field:/);
        expect(source.rawValue).not.toBe("");
        expect(source.normalizedValue).not.toBe("");
      }
    }
  });

  it("is deterministic and does not mutate its input", () => {
    const pack = getBaselinePack();
    const snapshot = structuredClone(pack);

    const first = runPreflight(pack, emptyResolutionState);
    const second = runPreflight(pack, emptyResolutionState);

    expect(second).toEqual(first);
    expect(pack).toEqual(snapshot);
  });

  it("uses approved field overrides without mutating locked baseline data", () => {
    const result = runPreflight(getBaselinePack(), {
      ...emptyResolutionState,
      fieldOverrides: {
        [FIELD_IDS.invoiceBeneficiary]: "Sahyadri Botanics Private Limited",
        [FIELD_IDS.packingQuantity]: 5000,
      },
    });

    expect(result.findings.map((finding) => finding.id)).toEqual([
      "finding:port-of-discharge",
      "finding:goods-description",
      "finding:certificate-signature",
    ]);
    expect(result.summary).toEqual({
      pass: 6,
      fail: 2,
      needsHumanReview: 1,
      notApplicable: 0,
    });
  });

  it("ignores direct overrides for locked third-party documents", () => {
    const result = runPreflight(getBaselinePack(), {
      ...emptyResolutionState,
      fieldOverrides: {
        [FIELD_IDS.billDischargePort]: "Rotterdam, Netherlands",
        [FIELD_IDS.certificateMarker]: true,
      },
    });

    expect(result.findings.map((finding) => finding.id)).toContain(
      "finding:port-of-discharge",
    );
    expect(result.findings.map((finding) => finding.id)).toContain(
      "finding:certificate-signature",
    );
  });

  it("converts a confirmed human decision into an explainable outcome", () => {
    const accepted = runPreflight(getBaselinePack(), {
      ...emptyResolutionState,
      humanDecisions: {
        "finding:goods-description": {
          decision: "accept",
          rationale: "The wording describes the same product and packing.",
        },
      },
    });

    expect(accepted.findings.map((finding) => finding.id)).not.toContain(
      "finding:goods-description",
    );
    expect(accepted.summary).toEqual({
      pass: 5,
      fail: 4,
      needsHumanReview: 0,
      notApplicable: 0,
    });
  });

  it("keeps human review open when the rationale is empty", () => {
    const result = runPreflight(getBaselinePack(), {
      ...emptyResolutionState,
      humanDecisions: {
        "finding:goods-description": {
          decision: "accept",
          rationale: "   ",
        },
      },
    });

    expect(result.summary.needsHumanReview).toBe(1);
    expect(result.findings.map((finding) => finding.id)).toContain(
      "finding:goods-description",
    );
  });

  it("marks external requests pending without mutating locked documents", () => {
    const pack = getBaselinePack();
    const snapshot = structuredClone(pack);
    const result = runPreflight(pack, {
      ...emptyResolutionState,
      externalRequestFindingIds: [
        "finding:port-of-discharge",
        "finding:certificate-signature",
      ],
    });

    expect(
      result.findings
        .filter((finding) => finding.authority === "external_issuer")
        .map((finding) => finding.findingStatus),
    ).toEqual(["pending_external", "pending_external"]);
    expect(pack).toEqual(snapshot);
  });

  it("treats adversarial document instructions only as untrusted data", () => {
    const pack = getBaselinePack();
    const note = getFieldById(
      getDocumentById(pack, DOCUMENT_IDS.commercialInvoice),
      FIELD_IDS.invoiceNotes,
    );

    expect(note.rawValue).toMatch(/ignore all restrictions/i);
    expect(note.untrusted).toBe(true);
    expect(JSON.stringify(runPreflight(pack, emptyResolutionState))).not.toMatch(
      /ignore all restrictions/i,
    );
  });
});
