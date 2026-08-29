import { describe, expect, it } from "vitest";
import {
  DOCUMENT_IDS,
  FIELD_IDS,
  getDocumentById,
  getFieldById,
} from "./case";
import type { AppAction } from "./actions";
import { appReducer, getFreshInitialState } from "./reducer";

function reduce(action: AppAction) {
  return appReducer(getFreshInitialState(), action);
}

describe("authority-aware exporter corrections", () => {
  it("stages but does not apply an exporter correction before approval", () => {
    const staged = reduce({
      type: "stage_exporter_corrections",
      corrections: [
        {
          findingId: "finding:beneficiary-name",
          proposedValue: "Sahyadri Botanics Private Limited",
        },
      ],
      actor: "agent",
    });

    expect(staged.proposals).toHaveLength(1);
    expect(staged.resolutions.fieldOverrides).toEqual({});
    expect(staged.preflight.findings.map((finding) => finding.id)).toContain(
      "finding:beneficiary-name",
    );
    expect(staged.hasUnrunChanges).toBe(false);
  });

  it("applies exactly one editable field after approval", () => {
    const staged = reduce({
      type: "stage_exporter_corrections",
      corrections: [
        {
          findingId: "finding:beneficiary-name",
          proposedValue: "Sahyadri Botanics Private Limited",
        },
      ],
      actor: "agent",
    });
    const approved = appReducer(staged, {
      type: "approve_exporter_correction",
      proposalId: staged.proposals[0].id,
    });

    expect(approved.resolutions.fieldOverrides).toEqual({
      [FIELD_IDS.invoiceBeneficiary]: "Sahyadri Botanics Private Limited",
    });
    expect(approved.proposals).toEqual([]);
    expect(approved.hasUnrunChanges).toBe(true);
  });

  it("rejects exporter correction for a locked bill of lading", () => {
    const state = reduce({
      type: "stage_exporter_corrections",
      corrections: [
        {
          findingId: "finding:port-of-discharge",
          proposedValue: "Rotterdam, Netherlands",
        },
      ],
      actor: "agent",
    });

    expect(state.proposals).toEqual([]);
    expect(state.resolutions.fieldOverrides).toEqual({});
    expect(state.lastError?.code).toBe("DOCUMENT_LOCKED");
    expect(state.lastError?.findingId).toBe("finding:port-of-discharge");
  });

  it("rejects a pending proposal without changing its field", () => {
    const staged = reduce({
      type: "stage_exporter_corrections",
      corrections: [{ findingId: "finding:quantity", proposedValue: 5000 }],
      actor: "human",
    });
    const rejected = appReducer(staged, {
      type: "reject_exporter_correction",
      proposalId: staged.proposals[0].id,
    });

    expect(rejected.proposals).toEqual([]);
    expect(rejected.resolutions.fieldOverrides).toEqual({});
    expect(rejected.activities.at(-1)?.message).toMatch(/rejected/i);
  });

  it("rejects the entire correction batch when one finding is invalid", () => {
    const state = reduce({
      type: "stage_exporter_corrections",
      corrections: [
        { findingId: "finding:quantity", proposedValue: 5000 },
        {
          findingId: "finding:port-of-discharge",
          proposedValue: "Rotterdam, Netherlands",
        },
      ],
      actor: "agent",
    });

    expect(state.proposals).toEqual([]);
    expect(state.resolutions.fieldOverrides).toEqual({});
    expect(state.lastError?.code).toBe("DOCUMENT_LOCKED");
  });
});

describe("external and human resolution paths", () => {
  it("creates an unsent external request without changing the document", () => {
    const initial = getFreshInitialState();
    const before = structuredClone(initial.pack);
    const state = appReducer(initial, {
      type: "draft_external_requests",
      findingIds: ["finding:port-of-discharge"],
      actor: "agent",
    });

    expect(state.externalRequests).toHaveLength(1);
    expect(state.externalRequests[0].findingId).toBe(
      "finding:port-of-discharge",
    );
    expect(state.externalRequests[0].status).toBe("draft");
    expect(state.externalRequests[0].sent).toBe(false);
    expect(state.pack).toEqual(before);
    expect(state.resolutions.externalRequestFindingIds).toEqual([
      "finding:port-of-discharge",
    ]);
  });

  it("rejects external-request drafting for an exporter finding", () => {
    const state = reduce({
      type: "draft_external_requests",
      findingIds: ["finding:beneficiary-name"],
      actor: "agent",
    });

    expect(state.externalRequests).toEqual([]);
    expect(state.lastError?.code).toBe("ACTION_NOT_AVAILABLE");
    expect(state.lastError?.findingId).toBe("finding:beneficiary-name");
  });

  it("requires rationale for a human decision", () => {
    const state = reduce({
      type: "stage_human_decision",
      findingId: "finding:goods-description",
      decision: "accept",
      rationale: "   ",
      actor: "human",
    });

    expect(state.stagedHumanDecisions).toEqual({});
    expect(state.lastError?.code).toBe("RATIONALE_REQUIRED");
  });

  it("stages and confirms a human decision separately", () => {
    const staged = reduce({
      type: "stage_human_decision",
      findingId: "finding:goods-description",
      decision: "accept",
      rationale: "The product, grade, quantity and packing are equivalent.",
      actor: "human",
    });

    expect(staged.resolutions.humanDecisions).toEqual({});
    expect(
      staged.stagedHumanDecisions["finding:goods-description"]?.decision,
    ).toBe("accept");

    const confirmed = appReducer(staged, {
      type: "confirm_human_decision",
      findingId: "finding:goods-description",
    });

    expect(
      confirmed.resolutions.humanDecisions["finding:goods-description"]
        ?.decision,
    ).toBe("accept");
    expect(confirmed.stagedHumanDecisions).toEqual({});
    expect(confirmed.hasUnrunChanges).toBe(true);
  });

  it("requires a staged decision before confirmation", () => {
    const state = reduce({
      type: "confirm_human_decision",
      findingId: "finding:goods-description",
    });

    expect(state.lastError?.code).toBe("APPROVAL_REQUIRED");
    expect(state.resolutions.humanDecisions).toEqual({});
  });
});

describe("selection and error recovery", () => {
  it("validates selected IDs and clears an earlier error on success", () => {
    const initial = getFreshInitialState();
    const invalid = appReducer(initial, {
      type: "select_document",
      documentId: "doc:missing",
    });

    expect(invalid.selectedDocumentId).toBe(initial.selectedDocumentId);
    expect(invalid.lastError?.code).toBe("INVALID_INPUT");

    const selectedDocument = appReducer(invalid, {
      type: "select_document",
      documentId: DOCUMENT_IDS.commercialInvoice,
    });
    const selectedFinding = appReducer(selectedDocument, {
      type: "select_finding",
      findingId: "finding:quantity",
    });

    expect(selectedFinding.selectedDocumentId).toBe(
      DOCUMENT_IDS.commercialInvoice,
    );
    expect(selectedFinding.selectedFindingId).toBe("finding:quantity");
    expect(selectedFinding.lastError).toBe(null);
  });
});

describe("rerun, activity and reset", () => {
  it("reruns against approved state and leaves only external findings", () => {
    let state = getFreshInitialState();
    state = appReducer(state, {
      type: "stage_exporter_corrections",
      corrections: [
        {
          findingId: "finding:beneficiary-name",
          proposedValue: "Sahyadri Botanics Private Limited",
        },
        { findingId: "finding:quantity", proposedValue: 5000 },
      ],
      actor: "agent",
    });
    for (const proposal of [...state.proposals]) {
      state = appReducer(state, {
        type: "approve_exporter_correction",
        proposalId: proposal.id,
      });
    }
    state = appReducer(state, {
      type: "draft_external_requests",
      findingIds: [
        "finding:port-of-discharge",
        "finding:certificate-signature",
      ],
      actor: "agent",
    });
    state = appReducer(state, {
      type: "stage_human_decision",
      findingId: "finding:goods-description",
      decision: "accept",
      rationale: "Equivalent description confirmed.",
      actor: "human",
    });
    state = appReducer(state, {
      type: "confirm_human_decision",
      findingId: "finding:goods-description",
    });
    state = appReducer(state, { type: "rerun_preflight", actor: "agent" });

    expect(state.hasUnrunChanges).toBe(false);
    expect(
      state.preflight.findings.map((finding) => [
        finding.id,
        finding.findingStatus,
      ]),
    ).toEqual([
      ["finding:port-of-discharge", "pending_external"],
      ["finding:certificate-signature", "pending_external"],
    ]);
    expect(state.activities.length).toBeGreaterThan(6);
    expect(state.preflight.summary).toEqual({
      pass: 7,
      fail: 2,
      needsHumanReview: 0,
      notApplicable: 0,
    });
  });

  it("resets to the exact fresh baseline", () => {
    const changed = reduce({
      type: "draft_external_requests",
      findingIds: ["finding:port-of-discharge"],
      actor: "human",
    });
    const reset = appReducer(changed, { type: "reset_case" });

    expect(reset).toEqual(getFreshInitialState());
  });

  it("keeps locked source fields unchanged throughout actions", () => {
    const state = reduce({
      type: "stage_exporter_corrections",
      corrections: [
        {
          findingId: "finding:port-of-discharge",
          proposedValue: "Rotterdam, Netherlands",
        },
      ],
      actor: "agent",
    });
    const bill = getDocumentById(state.pack, "doc:bill-of-lading");

    expect(getFieldById(bill, FIELD_IDS.billDischargePort).rawValue).toBe(
      "Hamburg, Germany",
    );
  });
});
