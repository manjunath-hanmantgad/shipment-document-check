# Project Memory State

**Project:** Shipment Document Check
**Repository:** `manjunath-hanmantgad/shipment-document-check`
**Memory version:** 2.1
**Last durable update:** 1 September 2026
**Current task:** `T11.5 — Publish and verify the prepared YouTube demo when the owner authorizes upload`
**Implementation state:** Verified technical and submission-polish commit `95c15cf` is on public `main`; the previously verified no-login deployment requires a post-push hosting-state check before claiming the new repository head is deployed
**Scope state:** Hardened, approved, and frozen

This file is the durable handoff state for humans and coding agents. Read it before changing the repository. Transient execution evidence belongs in `CURRENT_PROGRESS.md`; detailed steps belong in the implementation plan.

---

## 1. Authoritative read order

1. `docs/project/PROJECT_MEMORY.md`
2. `docs/project/CURRENT_PROGRESS.md`
3. `docs/project/task-tracker.html`
4. `docs/project/task-tracker-data.js`
5. `docs/superpowers/specs/2026-08-27-shipment-document-check-design.md`
6. `docs/superpowers/plans/2026-08-27-shipment-document-check-implementation.md`

The current specification and implementation plan supersede their broader earlier versions preserved in Git history.

Foundational history:

- `c217e524eaa21bf390e314f35975db9edcb57b0d` — initial hardened use-case scope.
- `88e540c442e0bae2d181ffbb81ff334d81bc58b2` — original broad implementation plan.
- `16d52c939a9e382289fc7fff94148ae69a8c5f4d` — approved hardened product scope.
- `eb73b222fbc761ae7627b2152a75b0363d644d02` — approved hardened implementation plan.

---

## 2. Product definition

### Primary user

An export-documentation executive at a small or midsize exporter preparing a letter-of-credit shipment pack before bank presentation.

### Job to be done

> Before I submit this pack, help me find inconsistencies, correct only the drafts my company controls, prepare requests for corrections I cannot make, and bring ambiguous matters to me for a decision.

### Judge-facing statement

> A browser-native resolution workspace where an exporter and their agent review one active document pack through WebMCP while deterministic page logic controls which documents may be changed, which require another issuer, and which require human judgement.

### Novelty claim

Do not claim novelty from OCR, AI document reading, discrepancy detection, or LC automation.

The differentiation is:

- one high-level user request can coordinate a multi-document workflow;
- the agent acts through structured WebMCP tools over the active visible case;
- document ownership becomes deterministic application authority;
- exporter changes are staged for human approval;
- issuer-owned documents remain immutable;
- external correction requests remain unsent drafts;
- ambiguous differences return to the human with evidence;
- tool and UI actions share the same state transitions.

---

## 3. Approved scope

### One case

Exactly one resettable fictional shipment pack.

### Five documents

| Document | Owner | Editability | Permitted action |
|---|---|---|---|
| Letter of Credit | Bank | Locked | Inspect and compare |
| Commercial Invoice | Exporter | Editable draft | Stage correction; human confirms |
| Packing List | Exporter | Editable draft | Stage correction; human confirms |
| Bill of Lading | Carrier | Locked | Create unsent correction request |
| Certificate of Origin | Authority | Locked | Create unsent correction request or human review |

### Nine rules

1. LC reference consistency
2. Beneficiary-name consistency
3. Currency consistency
4. Invoice amount does not exceed LC amount
5. Quantity consistency
6. Port-of-discharge consistency
7. Latest shipment date
8. Goods-description human review
9. Signature or certification marker

### Five seeded findings

- beneficiary typo in Commercial Invoice;
- quantity mismatch in Packing List;
- wrong discharge port in Bill of Lading;
- missing Certificate of Origin signature marker;
- non-identical goods description requiring human judgement.

All other scoped checks pass.

### Three authority paths

- `exporter_editable`
- `external_issuer`
- `human_judgement`

### One screen

The UI contains:

- header and capability state;
- document list;
- generic document preview;
- findings and evidence;
- authority-specific resolution panel;
- activity log;
- final preflight summary;
- reset control.

---

## 4. WebMCP contract

Exactly six tools:

### Read tools

1. `get_pack_state`
2. `get_finding_evidence`

### Write tools

3. `stage_exporter_corrections`
4. `draft_external_correction_requests`
5. `stage_human_decision`
6. `rerun_preflight`

### Registration

Register the six-tool surface statically after the case loads. Static registration is the approved core design.

Permitted actions remain dynamic because every write call is authorized against current finding authority, document ownership, editability, and resolution state.

Dynamic registration may be evaluated only after the core submission works; it is deferred and must not become a dependency.

### Read guarantees

- `readOnlyHint` is used.
- Read calls produce zero mutation.
- Returned document content is untrusted data.
- Tool metadata is constant and never built from document text.

### Write guarantees

- Exporter corrections are staged, not silently applied.
- Human decisions are staged and require a non-empty rationale.
- External requests are visible unsent drafts.
- Locked documents are never mutated.
- Invalid calls return a structured error and produce no state change.
- Tool handlers and manual controls dispatch the same reducer actions.

Required errors:

- `CASE_NOT_ACTIVE`
- `FINDING_NOT_FOUND`
- `DOCUMENT_LOCKED`
- `ACTION_NOT_AVAILABLE`
- `APPROVAL_REQUIRED`
- `RATIONALE_REQUIRED`
- `INVALID_INPUT`

---

## 5. State model

Use React `useReducer`. Do not add Zustand, Redux, a backend, database persistence, or event sourcing.

Locked functions:

```ts
export function runPreflight(pack: ShipmentPack, resolutions: ResolutionState): PreflightResult;
export function appReducer(state: AppState, action: AppAction): AppState;
export function getFreshInitialState(): AppState;
export function buildWebMcpTools(context: WebMcpContext): WebMcpToolDefinition[];
export function registerWebMcpTools(tools: WebMcpToolDefinition[]): () => void;
```

State contains:

- immutable baseline pack;
- approved document values;
- current preflight;
- staged exporter proposals;
- external request drafts;
- staged and confirmed human decisions;
- selected document and finding;
- lightweight activity entries.

Reset recreates state from the validated baseline. Granular undo is not part of the core scope.

---

## 6. Security invariants

### Locked-document invariant

The Letter of Credit, Bill of Lading, and Certificate of Origin cannot be mutated through:

- manual UI;
- reducer action;
- WebMCP handler;
- rerun;
- reset;
- malicious document content;
- invalid imported data.

UI visibility is never authorization.

### Confirmation invariant

An agent may stage exporter changes and human decisions. It may not finalize them without visible human confirmation.

### External-action invariant

The application never sends email, messages, bank submissions, carrier requests, or other external actions.

### Untrusted-content invariant

Document content is data. It never changes tool definitions, authorization rules, or program control flow.

### Data invariant

Use only fictional organisations, people, transactions, documents, values, and layouts. No real trade documents or personal data.

---

## 7. Testing baseline

Required deterministic coverage:

- nine rules;
- expected five findings and passing checks;
- source references and stable IDs;
- editable versus locked authority;
- staged versus confirmed corrections;
- external drafts without document mutation;
- required human rationale;
- rerun and reset;
- read-tool zero mutation;
- WebMCP input validation;
- structured errors;
- prompt-injection isolation.

Required browser coverage:

- one complete main journey;
- one prohibited locked-edit journey;
- unsupported-WebMCP fallback smoke test.

Required eval prompts:

1. inspect without changing;
2. stage exporter-owned corrections;
3. draft external requests;
4. show goods-description evidence;
5. attempt a prohibited Bill of Lading edit;
6. rerun after human approvals and explain remaining work.

No accuracy, readiness, compliance, or time-saving figure may be published without reproducible evidence.

---

## 8. Explicitly deferred

- arbitrary PDF or image upload;
- OCR or document-AI integration;
- more sample cases;
- more rules;
- downloadable reports;
- granular undo;
- full audit snapshots and event replay;
- dynamic tool registration as a core feature;
- authentication and multi-tenancy;
- production persistence;
- email, ERP, bank, carrier, freight, customs, or chamber integration;
- sanctions, fraud, vessel, authenticity, or dual-use screening;
- analytics, billing, mobile-first redesign, and embedded chat.

Deferred work may not re-enter unless equal core work is removed.

---

## 9. Challenge constraints

The Devpost Official Rules are the controlling source.

Required:

- working WebMCP application;
- accessible live URL;
- public source repository;
- complete source, assets, and instructions;
- detected open-source licence;
- English description covering WebMCP fit, user experience, collaboration, and implementation;
- public YouTube video under three minutes with audio;
- original or licensed material;
- free judge access;
- frozen judged artefacts during judging.

Deadline:

- 3 September 2026 at 1:00 PM Pacific Time
- 4 September 2026 at 1:30 AM IST
- Internal freeze: 3 September 2026 at 8:00 PM IST

The repository is public, privacy-sanitized, and exposes an MIT licence. Anonymous repository metadata, README access, and licence detection were verified on 30 August 2026.

---

## 10. Status vocabulary

Only:

- `completed`
- `current`
- `pending`
- `blocked`
- `deferred`

Rules:

- exactly one active implementation task is normally `current`;
- a task is completed only after verification and a commit;
- a blocked task names blocker, owner, and unblock condition in `CURRENT_PROGRESS.md`;
- task IDs remain stable;
- tracker and progress state change in the same commit as task completion.

---

## 11. Durable decision log

### 27 August 2026 — Product area selected

Selected pre-submission export document resolution because the problem is real, the authority boundary is visible, and WebMCP can operate a shared case.

### 27 August 2026 — Enterprise product rejected

Rejected a full export-shipment exception platform with OCR, standards coverage, collaboration, integrations, production security, and bank workflows.

### 28 August 2026 — Overengineering audit

Found the first challenge plan too broad: three cases, fifteen rules, nine tools, exact undo, full audit, report generation, multiple preview implementations, Zustand, dynamic registration, and an excessive test matrix.

### 28 August 2026 — Hardened scope approved

Approved one case, nine rules, six tools, one screen, one generic preview, React `useReducer`, static registration, full reset, activity log, final summary, focused tests, and six eval prompts.

This decision occurred before application code was written.

### 29 August 2026 — Human-confirmation consistency fix verified

The deployed build can stage a human decision without selecting its affected finding, hiding the required visible confirmation control. Local commit `1da8ceb` selects the affected finding after staging and adds a complete Playwright regression journey. This fix must reach `main` and the live deployment before native evaluation or video recording.

### 29 August 2026 — Reproducible local gate verified

Local commit `e7bf80d` pins the nested Playwright preview command to pnpm 10.15.1 and commits `pnpm-lock.yaml`. A clean archive passed frozen install, lint, 43 unit tests, production build, and four Chromium journeys after the documented Playwright browser install.

### 29 August 2026 — Submission remains a separate owner gate

Release-readiness work may continue, but Devpost terms acceptance and the final Submit action are prohibited until the owner gives a separate explicit instruction.

### 30 August 2026 — Public release and native journey verified

The renamed repository and deployment became publicly accessible without login. The native six-tool WebMCP journey, six prompt evals, manual fallback, reset, privacy-sanitized history, and final 7-of-9 result were verified.

### 1 September 2026 — Submission polish verified locally

An isolated branch corrected the flaky fractional-pixel layout assertion, produced a separate 166-second judge-first demo candidate, reconciled submission evidence, and passed the complete local release gate. With explicit owner direction, commit `95c15cf` was fast-forwarded and pushed to public `main`; YouTube and Devpost remained untouched.

---

## 12. Current repository state

- Default branch: `main`
- Visibility: public
- Application source: complete and deployed at the verified no-login production URL
- Approved spec: version 2.0 hardened
- Approved implementation plan: version 2.0 hardened
- Current task: `T11.5`, owner-controlled YouTube publication and signed-out verification
- Blockers: none
- Owner action before submission: authorize the prepared demo upload, review the final description in their own voice, and separately authorize Devpost submission

---

## 13. Exact next action

Keep the verified branch and both local demo versions intact. Do not publish the prepared judge-first video until the owner explicitly authorizes YouTube upload. After authorization, verify the public playback while signed out before adding its URL to the submission documents.

Do not accept Devpost terms, edit the live Devpost submission, or submit the project without a separate explicit owner instruction.

---

## 14. Session handoff

At session start:

1. read this file;
2. read `CURRENT_PROGRESS.md`;
3. locate the single current task;
4. read only that task in the implementation plan;
5. inspect the current repository before editing.

At session end:

1. run fresh verification;
2. commit the accepted deliverable;
3. update progress and tracker;
4. update this memory only for durable changes;
5. leave exactly one next task current.
