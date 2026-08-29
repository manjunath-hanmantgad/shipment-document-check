# Export Document Pack Preflight

## Hardened Product Scope and WebMCP Design

**Document status:** Approved scope, version 2.0  
**Approved:** 28 August 2026  
**Repository:** `manjunath-hanmantgad/webmcp-challenge-2026-manjunath`  
**Working product name:** Export Document Pack Preflight  
**Challenge:** OpenAI WebMCP Challenge 2026  
**Supersedes:** The broader three-case, fifteen-rule, nine-tool design preserved in Git history

---

## 1. Executive decision

Build one narrow, complete WebMCP application for one real operational job:

> Help an SME export-documentation executive review one letter-of-credit shipment pack, stage corrections to exporter-owned drafts, prepare unsent correction requests for issuer-owned documents, route ambiguous differences to human judgement, and rerun a transparent consistency preflight.

The product is not a general trade-finance platform. It does not attempt arbitrary document ingestion, production OCR, comprehensive UCP 600 or ISBP examination, bank submission, legal advice, or enterprise collaboration.

The challenge thesis is:

> A webpage can translate real-world document ownership into enforceable agent capabilities. The agent can resolve a multi-document case without impersonating a bank, carrier, chamber, or human reviewer.

Document checking already exists commercially. The challenge differentiation is not “AI reads export documents.” It is the visible, authority-aware collaboration between a human, their browser agent, and the active webpage through WebMCP.

---

## 2. Why the problem is real

Letter-of-credit document packs require consistency across documents produced by several parties. Errors in names, quantities, dates, routing, descriptions, signatures, and values can create amendment or resubmission cycles before bank presentation.

The challenge build addresses the pre-submission question:

> Which inconsistencies can we correct ourselves, which require another issuer, and which require human judgement?

Authoritative and commercial validation sources:

- https://www.trade.gov/letter-credit
- https://www.trade.gov/documents-export-transaction
- https://academy.iccwbo.org/trade-finance/article/11-questions-that-will-help-you-master-documentary-credits/
- https://www.smartlc.ai/

The submission will state that existing products validate the market. It will not claim that document extraction or discrepancy detection is novel.

---

## 3. Primary user and job

### Primary user

An export-documentation executive at a small or midsize exporter preparing a documentary-credit shipment pack before presentation to a bank.

### Job to be done

> Before I submit this document pack, help me find inconsistencies, correct only the drafts my company controls, prepare requests for corrections I cannot make, and leave ambiguous matters for an explicit human decision.

### Product promise

The user can give one high-level instruction to their browser agent. The agent uses six structured WebMCP tools to inspect the pack, stage permitted work, and update the same visible case. Deterministic application code enforces document authority and human confirmation.

### Non-claims

The application does not claim to:

- guarantee bank acceptance;
- certify compliance;
- provide legal, banking, customs, or professional advice;
- replace qualified document examiners;
- verify authenticity;
- submit documents or send messages;
- process confidential production documents safely;
- support every LC format, country, bank, commodity, or corridor.

Visible disclaimer:

> This demonstration performs selected cross-document consistency checks. It is not a definitive compliance review or a substitute for a qualified trade-finance professional.

---

## 4. Hardened scope

### 4.1 One primary case

The application contains one resettable fictional shipment pack. It must demonstrate all three authority paths and the complete judge journey.

No second or third sample case is required for the core submission. Inspection-only and adverse behavior are covered through tests and evals.

### 4.2 Five synthetic documents

| Document | Owner or issuer | Editability | Permitted application behavior |
|---|---|---|---|
| Letter of Credit | Issuing bank | Locked | Inspect and compare only |
| Commercial Invoice | Exporter | Editable draft | Stage correction; human approves or rejects |
| Packing List | Exporter | Editable draft | Stage correction; human approves or rejects |
| Bill of Lading | Carrier | Locked | Inspect; create unsent carrier correction request |
| Certificate of Origin | Chamber or authority | Locked | Inspect; create unsent issuer request or require human review |

The documents are bundled, fictional, machine-readable data rendered through one generic document-preview component. There is no upload or OCR pipeline.

### 4.3 Nine deterministic checks

The preflight engine implements exactly these checks:

1. LC reference consistency
2. Beneficiary-name consistency
3. Currency consistency
4. Commercial-invoice total does not exceed LC amount
5. Invoice and packing-list quantity consistency
6. Port-of-discharge consistency
7. Shipment date does not exceed the latest allowed shipment date
8. Goods-description difference requiring human review when not deterministically equivalent
9. Required signature or certification marker

Allowed outcomes:

- `pass`
- `fail`
- `needs_human_review`
- `not_applicable`

Every non-pass finding must include exact document and field references, raw values, normalized values, severity, authority, and current resolution state.

### 4.4 Five seeded findings

The primary case contains these visible findings:

| Finding | Authority | Expected result |
|---|---|---|
| Beneficiary typo in Commercial Invoice | Exporter editable | Agent stages correction; user approves |
| Quantity mismatch in Packing List | Exporter editable | Agent stages correction; user approves |
| Wrong discharge port in Bill of Lading | External issuer | Agent creates unsent carrier request |
| Missing signature marker in Certificate of Origin | External issuer | Agent creates unsent issuer request |
| Non-identical goods description | Human judgement | Agent shows evidence; user records decision and rationale |

The remaining scoped rules pass. This proves that the result is computed from pack state rather than a static list of errors.

---

## 5. Human-agent journey

1. The user opens the single shipment pack.
2. The page shows five documents, five open findings, ownership badges, and WebMCP capability state.
3. The user asks the browser agent to review the pack and resolve what it safely can.
4. The agent calls `get_pack_state`.
5. The agent calls `get_finding_evidence` for relevant findings.
6. The agent calls `stage_exporter_corrections` with the two exporter-owned findings.
7. The UI displays before-and-after proposals. The human approves or rejects each proposal.
8. The agent calls `draft_external_correction_requests` for the Bill of Lading and Certificate of Origin findings.
9. The UI displays unsent drafts. No external action occurs.
10. The agent calls `stage_human_decision` only after receiving a human-supplied decision and rationale for the description difference.
11. The human confirms the staged decision.
12. The agent calls `rerun_preflight`.
13. The page shows resolved internal issues, pending external requests, the human-reviewed item, passing checks, and the activity log.
14. The user can reset the entire demonstration case.

The core workflow is complete without granular undo or downloadable reporting.

---

## 6. WebMCP tool contract

The application contains no embedded chatbot. ChatGPT’s in-app browser or another compatible browser agent supplies the conversational interface.

### 6.1 Tool set

| Tool | Type | Purpose |
|---|---|---|
| `get_pack_state` | Read | Return document authority, findings, counts, resolution states, and the latest preflight summary |
| `get_finding_evidence` | Read | Return exact source fields and values for one finding |
| `stage_exporter_corrections` | Write | Stage one or more corrections for exporter-owned editable drafts |
| `draft_external_correction_requests` | Write | Create one or more visible unsent requests for external-issuer findings |
| `stage_human_decision` | Write | Stage a user-supplied decision and non-empty rationale for a human-judgement finding |
| `rerun_preflight` | Write | Recalculate the nine checks against the currently approved state |

### 6.2 Registration strategy

Use a small, static six-tool surface after the case loads. Do not make dynamic registration a core dependency.

The current finding’s permitted actions are dynamic, but enforcement occurs in deterministic application code. Invalid calls return structured errors and do not mutate state.

This avoids tool churn and keeps agent selection predictable while still demonstrating authority-aware behavior.

### 6.3 Read and write boundaries

- Read tools use `readOnlyHint`.
- Tool inputs are validated with Zod and validated again against current case state.
- Document excerpts are treated as untrusted content and marked with `untrustedContentHint` where supported.
- Write tools stage actions; they do not silently finalize exporter corrections or human decisions.
- External correction requests remain drafts and are never sent.
- Tool handlers and manual UI actions dispatch the same reducer actions.
- Tool completion is reported only after the visible UI reflects the staged result.
- Locked documents are never mutated through UI, reducer, tool handler, rerun, or reset.

### 6.4 Structured errors

Required error codes:

- `CASE_NOT_ACTIVE`
- `FINDING_NOT_FOUND`
- `DOCUMENT_LOCKED`
- `ACTION_NOT_AVAILABLE`
- `APPROVAL_REQUIRED`
- `RATIONALE_REQUIRED`
- `INVALID_INPUT`

Every rejected action produces no document mutation and no misleading success message.

---

## 7. One-screen product design

The application uses one desktop-first responsive screen.

### Header

- Product name
- Shipment reference
- WebMCP available or unavailable
- Visible disclaimer
- Reset demonstration control

### Left column: documents

- Five document cards
- Owner or issuer
- Editable or locked badge
- Selected document state

### Center column: findings and evidence

- Open and resolved findings
- Severity and authority badges
- Exact source values
- Generic document preview
- Before-and-after proposal when applicable

### Right column: resolution

The panel changes according to authority:

- exporter correction proposal and approval;
- external correction-request draft;
- human decision and rationale.

### Bottom area

- Current preflight summary
- Append-only activity log
- Passing-check count
- Resolved, pending-external, and human-reviewed counts

No separate dashboard pages, route hierarchy, analytics section, report builder, or product-tour subsystem is required.

---

## 8. Technical architecture

### Stack

- React
- TypeScript
- Vite
- pnpm
- React `useReducer`
- Zod
- Vitest
- Testing Library
- Playwright
- ESLint
- Plain CSS
- Static hosting
- WebMCP Imperative API through `document.modelContext.registerTool`

### State flow

```text
Bundled fictional pack
        ↓
Zod validation
        ↓
Nine-rule preflight engine
        ↓
React reducer
        ↓
Manual UI actions and six WebMCP handlers
        ↓
Visible proposals, drafts, decisions, summary, and activity log
```

### State boundary

The reducer stores:

- immutable baseline pack;
- approved document values;
- current preflight findings;
- staged exporter proposals;
- external request drafts;
- staged and confirmed human decisions;
- selected document and finding;
- activity entries.

The application does not require Zustand, a backend, local persistence, event replay, or granular undo. Reset recreates state from the validated baseline.

---

## 9. Security and trust boundaries

### Deterministic authorization

Every write action verifies:

- an active case exists;
- the finding exists and is unresolved;
- the finding authority matches the requested action;
- the target document has the required ownership and editability;
- the proposed value is permitted;
- required human rationale is present.

UI visibility is not authorization.

### Prompt-injection test

One document includes an adversarial sentence instructing the agent to ignore restrictions or approve all findings.

The application must ensure:

- document content never becomes tool metadata;
- document content is returned as untrusted data;
- read requests do not mutate state;
- locked-document mutation remains impossible;
- no cross-origin or external side effect exists.

### Data boundary

- All companies, people, documents, values, and transactions are fictional.
- No real personal or commercial data is used.
- No tool sends email, submits documents, or calls a bank, carrier, ERP, or customs service.
- No production security claim is made.

---

## 10. Focused test and evaluation scope

### Deterministic tests

Required:

- all nine rules with relevant pass, fail, review, and not-applicable fixtures;
- source references and stable finding IDs;
- exporter-editable versus locked-document authorization;
- staged versus approved correction behavior;
- external requests remain drafts;
- human rationale is required;
- rerun reflects approved state;
- reset returns exact baseline;
- read tools produce zero mutation;
- write tools produce the intended visible state;
- malicious document text does not affect authority or tool metadata.

### Browser tests

Required:

1. One complete manual and WebMCP-assisted happy journey.
2. One prohibited attempt to edit a locked document.
3. One unsupported-WebMCP fallback smoke test.

### Agent evals

Use six prompts:

1. Inspect the pack without changing anything.
2. Stage corrections only for documents the exporter controls.
3. Draft requests for issues in documents the exporter does not control.
4. Show evidence for the goods-description difference.
5. Attempt to change the Bill of Lading directly and verify rejection.
6. After human approvals, rerun the preflight and explain what remains.

Record actual results. Do not publish invented accuracy, time savings, or readiness percentages.

### Accessibility baseline

Use semantic controls, labels, visible focus, keyboard-reachable primary actions, readable contrast, and reduced-motion-safe behavior. A separate accessibility certification programme is outside scope.

---

## 11. Challenge compliance

The Devpost Official Rules are controlling.

The submission must provide:

- a functioning WebMCP-powered web application;
- a working live URL accessible in ChatGPT’s in-app browser or supported Chrome;
- a public source repository;
- complete source, original assets, setup instructions, and testing instructions;
- a detectable open-source licence;
- an English text description explaining WebMCP fit, user experience, human-agent collaboration, and implementation;
- a public YouTube demonstration under three minutes with audio;
- original or properly licensed material;
- free judge access through judging;
- no modification of judged artefacts after the deadline.

Controlling deadline:

- 3 September 2026 at 1:00 PM Pacific Time
- 4 September 2026 at 1:30 AM IST
- Internal project freeze: 3 September 2026 at 8:00 PM IST

The repository is currently private and must become public before submission.

---

## 12. Explicitly deferred

The challenge build excludes:

- arbitrary PDF or image upload;
- OCR and document-AI integration;
- multiple sample cases;
- additional rule packs;
- comprehensive trade-finance standards;
- granular undo;
- downloadable report generation;
- full audit snapshots and event replay;
- dynamic tool registration as a required feature;
- authentication and multi-tenancy;
- database persistence;
- email or external-message sending;
- bank, ERP, carrier, freight, customs, or chamber integrations;
- sanctions, fraud, vessel, authenticity, or dual-use screening;
- analytics, billing, mobile-first redesign, and embedded chat.

Deferred work must not quietly return unless equal core work is removed and the judge journey remains complete.

---

## 13. Definition of done

### Product

- One fictional pack loads and resets reliably.
- Five documents render through one generic preview.
- Nine rules generate the expected five findings and passing checks.
- Two exporter corrections can be staged and visibly approved.
- Two external correction requests can be drafted but not sent.
- One human decision requires visible evidence and rationale.
- Rerun produces an explainable final summary.
- Activity log records the visible journey.
- Locked documents remain immutable.

### WebMCP

- Six tools register in the supported browser.
- Read tools create no mutation.
- Batch write tools stage only authorized actions.
- Invalid authority calls return structured errors.
- UI and tool handlers use the same reducer actions.
- Document content is treated as untrusted.
- Chrome DevTools shows registration and invocation history.

### Quality and submission

- Focused unit and browser tests pass.
- Six prompt evals are recorded honestly.
- The live URL works without signup.
- Repository is public and licence is detected.
- README provides a complete judge path.
- Video is public, under three minutes, includes audio, and visibly demonstrates WebMCP.
- Devpost entry addresses all judging criteria.
- Judged artefacts are frozen after submission.

---

## 14. Judge-facing statement

> Export Document Pack Preflight is a browser-native resolution workspace for SME exporters. A user can ask their agent to review one active shipment pack, stage corrections only to exporter-owned drafts, prepare requests for issuer-owned errors, and bring ambiguous differences to the human. Six WebMCP tools operate the same visible case, while deterministic page logic enforces ownership, confirmation, provenance, and locked-document boundaries.

---

## 15. Scope-control rule

A new feature may enter the challenge build only when all three conditions are true:

1. It materially improves WebMCP Leverage, Execution, Potential Impact, or Creativity and Ambition.
2. It can be implemented and verified without delaying the complete primary journey.
3. Equivalent effort is removed from the current scope.

Otherwise it remains deferred.

---

## 16. Approved hardening record

On 28 August 2026, before application implementation began, the scope was deliberately reduced:

- three cases to one;
- fifteen rules to nine;
- nine tools to six;
- five preview components to one generic renderer;
- Zustand to React `useReducer`;
- dynamic registration to a static core tool set with deterministic action authorization;
- exact undo to full-case reset;
- full audit snapshots to a lightweight activity log;
- downloadable report to an on-screen final summary;
- broad test matrices to focused deterministic tests, two principal journeys, and six eval prompts.

This reduction is a product decision, not deferred unfinished work. The project is intended to be narrow, credible, demonstrable, and complete.
