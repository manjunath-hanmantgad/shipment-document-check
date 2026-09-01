# WebMCP Release Readiness Implementation Plan

> **Status:** Historical execution plan. Its dated checkboxes and release steps are preserved as plan-time evidence, not current instructions. Current state is recorded in `docs/project/PROJECT_MEMORY.md`, `docs/project/CURRENT_PROGRESS.md`, and `docs/submission/FINAL_CHECKLIST.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the redesigned export-pack preflight application internally state-consistent, dependency-clean, publicly accessible, fully documented, and challenge-ready without submitting it to Devpost.

**Architecture:** Keep the client-only React/reducer design and the six existing WebMCP tools. Move workflow-state derivation into one domain helper consumed by the UI and WebMCP payloads, then validate the same reducer state through unit, component, Playwright, signed-out browser, and native WebMCP journeys. Release the exact verified commit to public `main` and an unprotected Vercel production URL before updating evidence documents and recording the public demo.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Vitest 3, Playwright 1.55, pnpm 10, native WebMCP, Vercel static hosting.

**Spec:** `docs/superpowers/specs/2026-08-27-shipment-document-check-design.md` and `docs/submission/FINAL_CHECKLIST.md`.

## Global Constraints

- Keep exactly the six approved WebMCP tools and their existing authority boundaries.
- Approved exporter changes and confirmed human decisions are `verification_pending` until `rerun_preflight` consumes them.
- External correction requests remain unsent drafts and locked documents remain unchanged.
- Upgrade only `vite`, `vitest`, and `@playwright/test`, choosing the smallest compatible patched versions.
- Preserve the approved landing page and operational-workspace redesign; do not add new product scope.
- The production URL must be reachable signed out and expose native WebMCP.
- Do not open, edit, or submit the Devpost submission.

---

### Task 1: Canonical workflow status

**Files:**
- Modify: `src/domain/workflow.ts`
- Modify: `src/webmcp/tools.ts`
- Modify: `src/components/FindingList.tsx`
- Modify: `src/components/PreflightSummary.tsx`
- Test: `src/webmcp/tools.test.ts`
- Test: `src/App.test.tsx`
- Test: `tests/main-journey.spec.ts`

**Interfaces:**
- Consumes: `AppState`, `Finding`, approved field overrides, staged/confirmed decisions, external drafts.
- Produces: `workflowStatusCodeForFinding(state, finding)` with `open | proposal_pending | human_decision_pending | verification_pending | pending_external | human_reviewed`, plus the existing visible-label helper.

- [ ] **Step 1: Add failing WebMCP regression tests**

Add tests that approve an exporter proposal and confirm a staged human decision, then assert `get_pack_state.findings[].workflowStatus === "verification_pending"` before rerun.

- [ ] **Step 2: Add failing UI regression coverage**

Assert the summary shows the same verification-pending counts after exporter approval and after human confirmation, and that `get_pack_state` agrees in the browser journey.

- [ ] **Step 3: Run the focused tests and verify RED**

Run `corepack pnpm@10.15.1 vitest run src/webmcp/tools.test.ts src/App.test.tsx` and the focused Playwright journey. Expected: failures showing `open` or `human_reviewed` instead of `verification_pending`.

- [ ] **Step 4: Implement the canonical mapper**

Make the domain helper the only workflow-status decision point. Map confirmed-but-unrerun human decisions and approved-but-unrerun exporter corrections to `verification_pending`; retain pending-external and staged confirmation states.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the same focused Vitest and Playwright commands. Expected: all pass.

### Task 2: Minimal development-tool security patches

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: current official package metadata and compatibility constraints.
- Produces: fixed compatible versions of Vite, Vitest, and Playwright only.

- [ ] **Step 1: Check current patched versions and compatibility**

Use official package metadata/advisories to select the smallest fixed versions; do not upgrade unrelated packages.

- [ ] **Step 2: Update the three exact dependencies**

Run pnpm's exact-version update for `vite`, `vitest`, and `@playwright/test`, allowing only `package.json` and `pnpm-lock.yaml` to change.

- [ ] **Step 3: Verify dependency scope and audit**

Inspect the lockfile diff, run `pnpm audit` and `pnpm audit --prod`, and confirm no unrelated direct dependency changed.

### Task 3: Local release verification and commit

**Files:**
- Verify all changed source, tests, styles, and plan files.

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces: one locally verified branch commit.

- [ ] **Step 1: Run complete automated gates**

Run `pnpm lint`, `pnpm test:run`, `pnpm build`, `pnpm test:e2e`, and `git diff --check` from the isolated worktree.

- [ ] **Step 2: Run responsive visual verification**

Start the production preview, verify landing and workspace at desktop, tablet, and phone widths, check console/error overlays, keyboard focus, overflow, and key workflow controls, then stop the server.

- [ ] **Step 3: Review the final diff**

Confirm no locked-document mutation, tool-name change, secret, personal identifier, or Devpost mutation is included.

- [ ] **Step 4: Commit the redesigned branch**

Create one release-readiness commit containing the already-approved redesign plus the status fix, tests, dependency patches, and plan.

### Task 4: Merge and publish public main

**Files:**
- Git history only.

**Interfaces:**
- Consumes: verified `fix/operational-workspace` commit and current public `main`.
- Produces: public `main` containing the exact verified tree.

- [ ] **Step 1: Fetch and compare remote main**

Verify the remote has not moved incompatibly and confirm the merge base before integration.

- [ ] **Step 2: Merge without rewriting public history**

Merge the branch into `main` using a normal merge/fast-forward path, resolve only genuine overlaps, and rerun the full test suite on the merged tree.

- [ ] **Step 3: Push public main and verify repository state**

Push `main`, confirm the public repository exposes the new commit signed out, and verify commit-author emails remain GitHub noreply identities.

### Task 5: Unprotected production deployment and native journey

**Files:**
- Modify Vercel project settings only if required to disable deployment protection.

**Interfaces:**
- Consumes: public `main` commit.
- Produces: a stable, signed-out-accessible production URL serving that commit.

- [ ] **Step 1: Deploy the exact public-main commit to production**

Use the linked Vercel project or create a clean public project if protection cannot be removed safely. Record URL, deployment ID, commit, build status, and duration.

- [ ] **Step 2: Verify signed-out HTTP and visual access**

Check the URL from a signed-out context for a 200 response and the redesigned landing/workspace, with no Vercel login interstitial.

- [ ] **Step 3: Repeat the native WebMCP journey**

Discover exactly six tools; inspect pack and all evidence; stage two exporter corrections; approve visibly; verify locked-edit rejection; draft two unsent external requests; stage and visibly confirm the human decision; rerun; confirm seven passing, two pending external; reset the demo.

### Task 6: Submission evidence and public demo

**Files:**
- Modify: `README.md`
- Modify: `docs/evals/evaluation-report.md`
- Modify: `docs/submission/FINAL_CHECKLIST.md`
- Modify: `docs/submission/DEVPOST_DRAFT.md`
- Modify: `docs/submission/DEMO_SCRIPT.md` only if timing or verified copy changes.

**Interfaces:**
- Consumes: verified repository URL, deployment URL, test totals, native journey evidence, and public video URL.
- Produces: current, contradiction-free submission materials with no unresolved URL/test placeholders.

- [ ] **Step 1: Update repository and deployment evidence**

Replace stale private/protected/live-blocked statements with verified facts, update test counts, and record the exact public-main commit and production URL.

- [ ] **Step 2: Record the under-three-minute demo**

Capture the public product and native WebMCP flow with audible narration, showing visible human approval boundaries and final unresolved external actions. Do not include private tabs, credentials, notifications, or unlicensed media.

- [ ] **Step 3: Publish and verify the YouTube video**

Upload as Public, confirm signed-out playback, audio, duration under three minutes, title/description, and direct URL.

- [ ] **Step 4: Complete documentation placeholders**

Replace live URL, repository URL, video URL, and final-tag placeholders with verified values; retain only explicit owner-attestation items that cannot be independently proven.

### Task 7: Final challenge-compliance audit

**Files:**
- Modify documentation only if the audit finds a factual inconsistency.

**Interfaces:**
- Consumes: current official rules, public repository, public deployment, public video, and local verification evidence.
- Produces: a requirement-by-requirement ready/not-ready report without Devpost submission.

- [ ] **Step 1: Re-read current official rules and submission requirements**

Check eligibility, deadline, WebMCP use, public source/license, working public URL, description requirements, video requirements, originality/attribution, and functioning-as-described criteria.

- [ ] **Step 2: Cross-check every artifact signed out**

Verify public repo/license/source, production/native tools/full journey, YouTube playback/audio/duration, and documentation links.

- [ ] **Step 3: Report final status and residual owner actions**

Separate verified technical completion from user attestations or form-only fields. Explicitly confirm that Devpost was not submitted or modified.
