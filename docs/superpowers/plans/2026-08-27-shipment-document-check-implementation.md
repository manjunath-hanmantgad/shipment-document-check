# Shipment Document Check Implementation Plan

> **Status:** Historical execution plan. Its dated checkboxes and publication steps are preserved as plan-time evidence, not current instructions. Current state is recorded in `docs/project/PROJECT_MEMORY.md`, `docs/project/CURRENT_PROGRESS.md`, and `docs/submission/FINAL_CHECKLIST.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and submit one complete WebMCP-native export-document resolution journey using one fictional five-document shipment pack, nine deterministic checks, six WebMCP tools, and explicit human authority.

**Architecture:** A client-only React application validates one bundled case, evaluates nine deterministic rules, and stores UI state in a React reducer. Manual controls and WebMCP handlers dispatch the same reducer actions. The application stages exporter corrections, creates unsent external requests, records human decisions, reruns the preflight, and renders an explainable summary and lightweight activity log.

**Tech Stack:** React, TypeScript, Vite, pnpm, React `useReducer`, Zod, Vitest, Testing Library, Playwright, ESLint, plain CSS, static hosting, and the WebMCP Imperative API.

**Spec:** `docs/superpowers/specs/2026-08-27-shipment-document-check-design.md`

## Global constraints

- Build exactly one resettable fictional shipment case.
- Support exactly five document types: Letter of Credit, Commercial Invoice, Packing List, Bill of Lading, and Certificate of Origin.
- Implement exactly nine deterministic checks listed in the specification.
- Use exactly six WebMCP tools listed in the specification.
- Use one generic data-driven document-preview component.
- Use React `useReducer`; do not add Zustand, Redux, a backend, or database persistence.
- Commercial Invoice and Packing List may receive staged corrections. Letter of Credit, Bill of Lading, and Certificate of Origin are immutable.
- Staged exporter corrections and human decisions require visible human confirmation.
- External correction requests remain unsent drafts.
- The core implementation uses static registration of the six tools after the case loads. Authorization remains dynamic and deterministic in application code.
- Read tools must create zero state mutation.
- Document text is untrusted data and must not influence tool names, descriptions, authorization, or control flow.
- Do not implement arbitrary document upload, OCR, granular undo, downloadable reports, full audit snapshots, authentication, enterprise integrations, or an embedded chatbot.
- Manual UI actions and WebMCP handlers must call the same reducer actions.
- Keep the main product on one screen.
- Use test-driven development for rules, authority checks, reducer transitions, and WebMCP handlers.
- Commit after every independently testable top-level task.
- Update `docs/project/CURRENT_PROGRESS.md` and `docs/project/task-tracker-data.js` in the same commit that changes a task status.
- Change `PROJECT_MEMORY.md` only when a durable decision, invariant, interface, or constraint changes.
- The repository must be public and contain a detected open-source licence before submission.
- The public demonstration must be under three minutes and contain audio.
- The Devpost Official Rules control; the deadline is September 3, 2026 at 1:00 PM Pacific Time.

---

## Planned repository structure

```text
.
├── .editorconfig
├── .gitignore
├── .nvmrc
├── LICENSE
├── README.md
├── package.json
├── pnpm-lock.yaml
├── eslint.config.js
├── index.html
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── playwright.config.ts
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── ATTRIBUTIONS.md
│   ├── evals/
│   │   ├── prompt-cases.json
│   │   └── evaluation-report.md
│   ├── project/
│   │   ├── CURRENT_PROGRESS.md
│   │   ├── PROJECT_MEMORY.md
│   │   ├── task-tracker-data.js
│   │   └── task-tracker.html
│   ├── submission/
│   │   ├── DEVPOST_DRAFT.md
│   │   ├── DEMO_SCRIPT.md
│   │   └── FINAL_CHECKLIST.md
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-08-27-shipment-document-check-design.md
│       └── plans/
│           └── 2026-08-27-shipment-document-check-implementation.md
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── app.css
│   ├── domain/
│   │   ├── types.ts
│   │   ├── schema.ts
│   │   ├── case.ts
│   │   ├── rules.ts
│   │   ├── rules.test.ts
│   │   ├── actions.ts
│   │   ├── reducer.ts
│   │   └── reducer.test.ts
│   ├── components/
│   │   ├── DocumentList.tsx
│   │   ├── DocumentPreview.tsx
│   │   ├── FindingList.tsx
│   │   ├── EvidencePanel.tsx
│   │   ├── ResolutionPanel.tsx
│   │   ├── ActivityLog.tsx
│   │   └── PreflightSummary.tsx
│   ├── webmcp/
│   │   ├── global.d.ts
│   │   ├── types.ts
│   │   ├── schemas.ts
│   │   ├── tools.ts
│   │   ├── registerTools.ts
│   │   └── tools.test.ts
│   └── test/
│       └── setup.ts
└── tests/
    └── main-journey.spec.ts
```

## Locked interfaces

```ts
export type DocumentType =
  | "letter_of_credit"
  | "commercial_invoice"
  | "packing_list"
  | "bill_of_lading"
  | "certificate_of_origin";

export type DocumentOwner = "bank" | "exporter" | "carrier" | "authority";
export type DocumentEditability = "editable_draft" | "locked";
export type RuleStatus = "pass" | "fail" | "needs_human_review" | "not_applicable";
export type FindingAuthority = "exporter_editable" | "external_issuer" | "human_judgement";
export type FindingStatus =
  | "open"
  | "proposal_pending"
  | "resolved"
  | "pending_external"
  | "human_decision_pending"
  | "human_reviewed";

export type AppAction =
  | { type: "select_document"; documentId: string }
  | { type: "select_finding"; findingId: string }
  | { type: "stage_exporter_corrections"; corrections: ExporterCorrectionInput[]; actor: "human" | "agent" }
  | { type: "approve_exporter_correction"; proposalId: string }
  | { type: "reject_exporter_correction"; proposalId: string }
  | { type: "draft_external_requests"; findingIds: string[]; actor: "human" | "agent" }
  | { type: "stage_human_decision"; findingId: string; decision: HumanDecision; rationale: string; actor: "human" | "agent" }
  | { type: "confirm_human_decision"; findingId: string }
  | { type: "rerun_preflight"; actor: "human" | "agent" }
  | { type: "reset_case" };

export function runPreflight(pack: ShipmentPack, resolutions: ResolutionState): PreflightResult;
export function appReducer(state: AppState, action: AppAction): AppState;
export function getFreshInitialState(): AppState;
export function buildWebMcpTools(context: WebMcpContext): WebMcpToolDefinition[];
export function registerWebMcpTools(tools: WebMcpToolDefinition[]): () => void;
```

Required WebMCP tool names:

```text
get_pack_state
get_finding_evidence
stage_exporter_corrections
draft_external_correction_requests
stage_human_decision
rerun_preflight
```

---

### Task T03: Establish repository compliance baseline

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `.nvmrc`
- Create: `docs/ATTRIBUTIONS.md`
- Modify: `docs/project/CURRENT_PROGRESS.md`
- Modify: `docs/project/task-tracker-data.js`

**Produces:** A compliant repository entry point, detected open-source licence, setup boundary, and judge-path placeholder.

- [ ] **Step 1: Create the README structure**

Use these exact top-level sections:

```md
# Shipment Document Check
## What it demonstrates
## Why WebMCP
## Product boundary
## Supported workflow
## Local development
## WebMCP browser setup
## Testing
## Challenge demo path
## Security and limitations
## Project status
## Licence
```

State prominently that data is fictional and the product is not a definitive compliance review.

- [ ] **Step 2: Add licence and hygiene files**

Use the standard MIT licence. `.gitignore` must include:

```gitignore
node_modules/
dist/
coverage/
playwright-report/
test-results/
.env
.env.*
.DS_Store
```

Use Node 22 in `.nvmrc`. Use UTF-8, LF, final newline, and two-space indentation in `.editorconfig`.

- [ ] **Step 3: Add attribution policy**

`docs/ATTRIBUTIONS.md` must require every dependency or non-original asset to record name, source, licence, and use. Do not use third-party company logos or real trade documents.

- [ ] **Step 4: Verify and commit**

Verify README links, licence detection after the repository becomes public, and absence of secrets or real documents.

```bash
git add README.md LICENSE .gitignore .editorconfig .nvmrc docs
git commit -m "chore: establish repository compliance baseline"
```

Mark `T03` completed and `T04` current only after the files are verified.

---

### Task T04: Scaffold the client application and quality gates

**Files:**
- Create: `package.json`, `pnpm-lock.yaml`, `index.html`
- Create: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- Create: `vite.config.ts`, `eslint.config.js`, `playwright.config.ts`
- Create: `src/main.tsx`, `src/App.tsx`, `src/app.css`, `src/test/setup.ts`
- Create: `.github/workflows/ci.yml`
- Modify: `README.md`

**Produces:** Repeatable install, development, lint, unit-test, build, E2E, and deployment commands.

- [ ] **Step 1: Scaffold and install the approved dependencies**

```bash
pnpm create vite . --template react-ts
pnpm add zod
pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test eslint
```

Do not add a component library, router, backend, analytics SDK, model API, or state library.

- [ ] **Step 2: Write the failing shell test**

```tsx
it("shows the product boundary and WebMCP capability state", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /shipment document check/i })).toBeVisible();
  expect(screen.getByText(/not a definitive compliance review/i)).toBeVisible();
  expect(screen.getByText(/webmcp/i)).toBeVisible();
});
```

Run:

```bash
pnpm vitest run src/App.test.tsx
```

Expected: failure before the shell exists.

- [ ] **Step 3: Implement the minimum shell**

Render the heading, concise product statement, disclaimer, and a banner based on:

```ts
const webMcpAvailable = typeof document.modelContext !== "undefined";
```

Do not simulate WebMCP when it is unavailable.

- [ ] **Step 4: Configure quality gates**

Required scripts:

```json
{
  "dev": "vite",
  "lint": "eslint .",
  "test": "vitest",
  "test:run": "vitest run",
  "test:e2e": "playwright test",
  "build": "tsc -b && vite build",
  "preview": "vite preview"
}
```

CI runs `pnpm lint`, `pnpm test:run`, `pnpm build`, and one Chromium E2E smoke test.

- [ ] **Step 5: Verify and commit**

```bash
pnpm lint
pnpm test:run
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
git add .
git commit -m "chore: scaffold client application and quality gates"
```

Mark `T04` completed and `T05` current after all commands exit successfully.

---

### Task T05: Implement the single shipment pack and nine rules

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/schema.ts`
- Create: `src/domain/case.ts`
- Create: `src/domain/rules.ts`
- Create: `src/domain/rules.test.ts`

**Produces:** Validated fictional data, stable findings, and deterministic preflight results.

- [ ] **Step 1: Write failing rule tests**

Include assertions for the five seeded findings:

```ts
const result = runPreflight(getBaselinePack(), emptyResolutionState);

expect(result.findings.map((finding) => finding.id)).toEqual([
  "finding:beneficiary-name",
  "finding:quantity",
  "finding:port-of-discharge",
  "finding:goods-description",
  "finding:certificate-signature"
]);

expect(result.summary).toEqual({
  pass: 4,
  fail: 4,
  needsHumanReview: 1,
  notApplicable: 0
});
```

Also assert that raw and normalized source values are present.

- [ ] **Step 2: Define compact types and Zod schemas**

Use semantic IDs such as:

```text
doc:letter-of-credit
doc:commercial-invoice
field:commercial-invoice:beneficiary-name
finding:beneficiary-name
```

Never persist array indexes as IDs.

- [ ] **Step 3: Create one fictional pack**

Use fictional parties, ports, amounts, dates, shipment reference, goods description, and signatures. Add an adversarial sentence inside a non-control document field for later prompt-injection testing.

- [ ] **Step 4: Implement the nine rules**

Use deterministic normalization for whitespace, case, money, integer quantity, ISO dates, and ports. Goods-description differences return `needs_human_review`; they do not use an LLM.

- [ ] **Step 5: Verify and commit**

```bash
pnpm vitest run src/domain/rules.test.ts
pnpm test:run
pnpm build
git add src/domain docs/project
git commit -m "feat: add fictional shipment pack and preflight rules"
```

Mark `T05` completed and `T06` current.

---

### Task T06: Implement authority-aware actions and application state

**Files:**
- Create: `src/domain/actions.ts`
- Create: `src/domain/reducer.ts`
- Create: `src/domain/reducer.test.ts`

**Produces:** Shared state transitions used by both the UI and WebMCP handlers.

- [ ] **Step 1: Write failing reducer tests**

Required behaviors:

```ts
it("stages but does not apply an exporter correction before approval", () => {});
it("applies exactly one editable field after approval", () => {});
it("rejects exporter correction for a bill of lading finding", () => {});
it("creates an unsent external request without changing the document", () => {});
it("requires rationale for a human decision", () => {});
it("reruns against approved state and resets to the exact baseline", () => {});
```

- [ ] **Step 2: Implement authority helpers**

Centralize:

```ts
function assertExporterEditable(state: AppState, findingId: string): ExporterEditableFinding;
function assertExternalIssuer(state: AppState, findingId: string): ExternalIssuerFinding;
function assertHumanJudgement(state: AppState, findingId: string): HumanJudgementFinding;
```

Each helper returns a structured error rather than a generic exception.

- [ ] **Step 3: Implement staged workflows**

Exporter corrections and human decisions are staged. Only explicit UI confirmation applies them. External requests are deterministic drafts constructed from finding evidence and remain unsent.

- [ ] **Step 4: Implement activity entries and reset**

Use lightweight entries:

```ts
interface ActivityEntry {
  id: string;
  timestamp: string;
  actor: "human" | "agent" | "system";
  message: string;
}
```

Reset replaces state with `getFreshInitialState()`.

- [ ] **Step 5: Verify and commit**

```bash
pnpm vitest run src/domain/reducer.test.ts
pnpm test:run
pnpm build
git add src/domain docs/project
git commit -m "feat: enforce authority-aware resolution actions"
```

Mark `T06` completed and `T07` current.

---

### Task T07: Build the single-screen human workflow

**Files:**
- Modify: `src/App.tsx`, `src/app.css`
- Create: `src/components/DocumentList.tsx`
- Create: `src/components/DocumentPreview.tsx`
- Create: `src/components/FindingList.tsx`
- Create: `src/components/EvidencePanel.tsx`
- Create: `src/components/ResolutionPanel.tsx`
- Create: `src/components/ActivityLog.tsx`
- Create: `src/components/PreflightSummary.tsx`
- Create: `src/App.test.tsx`

**Produces:** A complete manually operable one-screen product.

- [ ] **Step 1: Write the failing workflow test**

```tsx
it("completes the three authority paths from one screen", async () => {
  render(<App />);

  await user.click(screen.getByRole("button", { name: /beneficiary typo/i }));
  await user.click(screen.getByRole("button", { name: /stage correction/i }));
  await user.click(screen.getByRole("button", { name: /approve correction/i }));

  await user.click(screen.getByRole("button", { name: /wrong discharge port/i }));
  await user.click(screen.getByRole("button", { name: /draft carrier request/i }));

  await user.click(screen.getByRole("button", { name: /goods description/i }));
  await user.type(screen.getByLabelText(/rationale/i), "Commercially equivalent description confirmed by exporter.");
  await user.click(screen.getByRole("button", { name: /confirm decision/i }));

  expect(screen.getByText(/pending external/i)).toBeVisible();
  expect(screen.getByText(/human reviewed/i)).toBeVisible();
});
```

- [ ] **Step 2: Build documents and evidence**

Use one `DocumentPreview` component driven by document sections and fields. Show ownership and locked status explicitly.

- [ ] **Step 3: Build findings and resolution**

The selected finding determines the resolution panel. Do not hide locked authority behind disabled edit controls; show why direct editing is unavailable.

- [ ] **Step 4: Build final summary and activity log**

Show counts for passing, open, proposal-pending, resolved, pending-external, and human-reviewed states. Avoid invented readiness percentages.

- [ ] **Step 5: Verify and commit**

```bash
pnpm vitest run src/App.test.tsx
pnpm test:run
pnpm build
git add src
git commit -m "feat: build single-screen document resolution workflow"
```

Mark `T07` completed and `T08` current.

---

### Task T08: Implement six WebMCP tools

**Files:**
- Create: `src/webmcp/global.d.ts`
- Create: `src/webmcp/types.ts`
- Create: `src/webmcp/schemas.ts`
- Create: `src/webmcp/tools.ts`
- Create: `src/webmcp/registerTools.ts`
- Create: `src/webmcp/tools.test.ts`
- Modify: `src/App.tsx`

**Produces:** Six validated tools that operate the same visible case as the manual UI.

- [ ] **Step 1: Write failing tool-handler tests**

Required assertions:

```ts
expect(getPackStateTool.annotations?.readOnlyHint).toBe(true);
expect(runReadTool(state)).toEqual(expect.objectContaining({ stateVersion: state.version }));
expect(runReadTool(state)).not.toMutate(state);
expect(() => stageExporterCorrections({ findingIds: ["finding:port-of-discharge"] })).toThrowStructured("ACTION_NOT_AVAILABLE");
```

- [ ] **Step 2: Define narrow input schemas**

Examples:

```ts
const findingIdSchema = z.string().startsWith("finding:");

const stageExporterCorrectionsInput = z.object({
  corrections: z.array(z.object({
    findingId: findingIdSchema,
    proposedValue: z.string().min(1)
  })).min(1).max(5)
});
```

Limit batch sizes and string lengths.

- [ ] **Step 3: Implement two read tools**

`get_pack_state` returns concise structured state. `get_finding_evidence` returns source references and marks document excerpts as untrusted where supported.

- [ ] **Step 4: Implement four write tools**

All handlers dispatch the same reducer actions as the UI and return staged state identifiers. They never apply exporter corrections or human decisions without visible user confirmation.

- [ ] **Step 5: Register statically with cleanup**

After the case loads, register all six tools. Use an adapter that unregisters or aborts registrations during React cleanup. If `document.modelContext` is absent, register nothing.

- [ ] **Step 6: Verify and commit**

```bash
pnpm vitest run src/webmcp/tools.test.ts
pnpm test:run
pnpm build
git add src/webmcp src/App.tsx docs/project
git commit -m "feat: expose authority-aware WebMCP tools"
```

Mark `T08` completed and `T09` current.

---

### Task T09: Run focused tests, security checks, and agent evals

**Files:**
- Create: `tests/main-journey.spec.ts`
- Create: `docs/evals/prompt-cases.json`
- Create: `docs/evals/evaluation-report.md`
- Modify: relevant unit tests and `README.md`

**Produces:** Reproducible evidence that the main journey works and locked authority cannot be bypassed.

- [ ] **Step 1: Add the complete browser journey**

The Playwright test must exercise exporter correction staging and approval, external-request drafting, human rationale confirmation, rerun, final summary, and reset.

- [ ] **Step 2: Add the prohibited-edit journey**

Attempt a direct Bill of Lading mutation through the UI action layer and WebMCP handler. Assert:

```ts
expect(error.code).toBe("ACTION_NOT_AVAILABLE");
expect(currentBillOfLading).toEqual(originalBillOfLading);
```

- [ ] **Step 3: Add prompt-injection isolation test**

The adversarial document sentence must appear only as untrusted evidence. Assert that tool definitions are constant and contain none of the document text.

- [ ] **Step 4: Create six eval cases**

Store prompt, expected tool sequence, prohibited mutations, and acceptable final state in `prompt-cases.json`. Record observed results and environment in `evaluation-report.md`.

- [ ] **Step 5: Verify and commit**

```bash
pnpm lint
pnpm test:run
pnpm build
pnpm test:e2e
git add tests docs/evals README.md src
git commit -m "test: validate WebMCP journey and authority boundaries"
```

Mark `T09` completed and `T10` current.

---

### Task T10: Deploy and validate the judge path

**Files:**
- Create or modify static-host configuration
- Modify: `README.md`
- Modify: `docs/project/CURRENT_PROGRESS.md`
- Modify: `docs/project/task-tracker-data.js`

**Produces:** A public, no-login URL with a verified supported-browser journey.

- [ ] **Step 1: Deploy the verified build**

Use Vercel, Netlify, Cloudflare Pages, or another static host. Do not require authentication.

- [ ] **Step 2: Test ChatGPT’s in-app browser**

Run the primary prompt and confirm visible staged actions, human approval, external drafts, human decision, and rerun.

- [ ] **Step 3: Test Chrome WebMCP DevTools**

Verify six available tools, valid schemas, registration lifecycle, and invocation history.

- [ ] **Step 4: Test fallback and fresh-reader path**

Open the site in a browser without WebMCP, confirm the manual workflow remains usable, and confirm the banner is accurate. Ask a fresh reviewer to follow only README instructions.

- [ ] **Step 5: Record evidence and commit**

Add only verified URLs and results.

```bash
git add README.md docs project-host-config
git commit -m "chore: deploy and verify judge path"
```

Mark `T10` completed and `T11` current.

---

### Task T11: Prepare submission materials

**Files:**
- Create: `docs/submission/DEVPOST_DRAFT.md`
- Create: `docs/submission/DEMO_SCRIPT.md`
- Create: `docs/submission/FINAL_CHECKLIST.md`
- Modify: `README.md`
- Create one original authority-flow diagram

**Produces:** Complete public materials mapped to the official judging criteria.

- [ ] **Step 1: Write the Devpost description**

Use these sections:

```md
## Problem
## Why WebMCP
## Human-agent collaboration
## Implementation
## WebMCP leverage
## Execution
## Potential impact
## Creativity and ambition
## Security and limitations
## Testing instructions
```

- [ ] **Step 2: Create one diagram**

Show:

```text
Agent request
→ WebMCP tool
→ input validation
→ authority check
→ staged visible action
→ human confirmation
→ rerun
```

Do not create multiple decorative architecture diagrams.

- [ ] **Step 3: Write the video script**

Target 2 minutes 30 seconds. Demonstrate the actual running product, six-tool workflow, rejected locked edit, and final summary. Do not include copyrighted music or third-party trademarks.

- [ ] **Step 4: Record and publish**

Upload a public YouTube video with audio. Verify duration and public visibility.

- [ ] **Step 5: Commit verified submission materials**

```bash
git add README.md docs/submission docs/assets
git commit -m "docs: prepare WebMCP challenge submission"
```

Mark `T11` completed and `T12` current.

---

### Task T12: Freeze and submit

**Files:**
- Modify only verified URLs, factual errors, and final status documents
- Create tag: `webmcp-challenge-submission`

**Produces:** A compliant, frozen submission.

- [ ] **Step 1: Run the complete verification gate**

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test:run
pnpm build
pnpm test:e2e
```

All commands must exit zero.

- [ ] **Step 2: Verify external artefacts**

Confirm:

- repository is public;
- GitHub detects the open-source licence;
- live URL opens without signup;
- six WebMCP tools appear in supported Chrome;
- YouTube video is public, under three minutes, and has audio;
- Devpost text contains all required explanations;
- no real documents, secrets, unlicensed assets, or unsupported claims exist.

- [ ] **Step 3: Submit before the internal freeze**

Internal freeze: September 3, 2026 at 8:00 PM IST. Do not rely on the final minutes before the controlling 1:00 PM Pacific deadline.

- [ ] **Step 4: Tag and freeze**

```bash
git tag webmcp-challenge-submission
git push origin webmcp-challenge-submission
```

Do not change the judged repository, live deployment, video, or Devpost entry during judging. Use a separate copy for further development.

- [ ] **Step 5: Record final state**

Mark `T12` completed only after Devpost confirms submission. Record the tag, commit SHA, live URL, video URL, and submission confirmation in `CURRENT_PROGRESS.md`.

---

## Execution order

```text
T03 → T04 → T05 → T06 → T07 → T08 → T09 → T10 → T11 → T12
```

Do not parallelize core domain, state, UI, and WebMCP work unless each branch has isolated files and a named integration owner. The schedule is short; merge-conflict theatre is not a judging criterion.

## Status rules

Use only:

- `completed`
- `current`
- `pending`
- `blocked`
- `deferred`

A task is completed only after:

1. its acceptance commands pass;
2. its deliverable is reviewed;
3. its commit exists;
4. tracker and progress state are updated.

A blocked task records the blocker, owner, and unblock condition in `CURRENT_PROGRESS.md`.

## Plan self-review

- **Scope coverage:** One case, five documents, nine rules, six tools, three authority paths, one screen, security boundaries, focused tests, deployment, and submission are mapped to tasks.
- **Overengineering scan:** No backend, OCR, multiple cases, report subsystem, granular undo, full audit snapshots, state library, router, component library, or dynamic-registration dependency remains.
- **Interface consistency:** The same reducer actions drive manual UI and WebMCP handlers.
- **Challenge fit:** The implementation visibly demonstrates WebMCP leverage, complete execution, a real user problem, and a differentiated authority model.
- **No placeholders:** No unresolved implementation requirement is left as `TBD` or `TODO`.
