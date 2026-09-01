# Final Documentation Audit Implementation Plan

> **Status:** Historical completed execution plan. Its no-publication constraints describe the audit boundary at that time; current YouTube and submission state is recorded in `docs/project/PROJECT_MEMORY.md`, `docs/project/CURRENT_PROGRESS.md`, and `docs/submission/FINAL_CHECKLIST.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Review every tracked repository folder and document, remove confirmed stale or placeholder wording from active materials, and leave the repository internally consistent without publishing to YouTube or Devpost.

**Architecture:** Treat `git ls-files` as the exhaustive repository inventory because the codebase graph service is unavailable. Separate active public/handoff documents from dated historical specifications and plans, preserve history unless it misdirects current work, and validate every edit with exact searches, link/file checks, syntax checks, and the full project gate.

**Tech Stack:** Git, Markdown, JSON, JavaScript, React, TypeScript, Vitest, Playwright, Vite, pnpm.

**Spec:** `README.md` and `docs/submission/FINAL_CHECKLIST.md`

## Global Constraints

- Do not upload, publish, save, or submit anything to YouTube or Devpost.
- Do not alter product behavior, the six WebMCP tool contracts, or fictional shipment data.
- Preserve dated plans/specifications as historical evidence; update them only when an unqualified current-state statement could misdirect a reader.
- Preserve all unrelated worktrees and the user-owned `.impeccable/` directory.
- Do not invent a video URL, release tag, deployment verification, test result, or submission status.

---

### Task 1: Inventory and classify every tracked folder and file

**Files:**
- Inspect: every path returned by `git ls-files`
- Create: `docs/superpowers/plans/2026-09-01-final-documentation-audit.md`

**Interfaces:**
- Consumes: public `main` at `e1947a8`
- Produces: a complete tracked-file inventory and a list of confirmed active-document inconsistencies

- [x] **Step 1: Enumerate tracked paths and repository folders**

Run `git ls-files` and group paths by root and documentation subfolder.

- [x] **Step 2: Scan every tracked text file for stale names, hosts, durations, counts, placeholders, unfinished markers, and contradictory status language**

Search exact patterns plus contextual `pending`, `placeholder`, and publication wording. Classify intentional code/UI placeholder terminology separately from submission placeholders.

- [x] **Step 3: Validate references to tracked images, diagrams, source files, and local Markdown links**

Require every repository-relative target to exist with matching case.

### Task 2: Reconcile active public and handoff documentation

**Files:**
- Modify only confirmed stale active documents found in Task 1
- Inspect without routine rewriting: `docs/superpowers/specs/` and older dated plans

**Interfaces:**
- Consumes: the Task 1 inconsistency list
- Produces: consistent README, submission materials, evaluation evidence, project handoff state, and tracker state

- [x] **Step 1: Apply the smallest wording and status corrections**

Use explicit pending-owner-action language for unpublished video and unsubmitted Devpost work. Keep historical evidence dated and clearly scoped.

- [x] **Step 2: Re-run the stale-reference and placeholder scans**

Require zero active placeholder tokens and zero unqualified obsolete product/repository/deployment claims.

- [x] **Step 3: Review the complete diff against the no-publication boundary**

Confirm no runtime behavior, YouTube state, Devpost state, or external submission record changed.

### Task 3: Verify the repository after documentation cleanup

**Files:**
- Verify: all modified documentation and repository configuration
- Test: `src/**/*.test.ts`, `src/**/*.test.tsx`, `tests/*.spec.ts`

**Interfaces:**
- Consumes: reconciled documentation from Task 2
- Produces: fresh evidence for the final handoff

- [x] **Step 1: Validate structured and generated documentation syntax**

Run JSON parsing, JavaScript syntax checks, and `git diff --check` for every modified structured document.

- [x] **Step 2: Run the complete project gate**

Run pinned pnpm lint, 55-test Vitest suite, production build, 12-journey Playwright suite, and dependency audit.

- [x] **Step 3: Report resolved items and remaining owner-only actions**

Report exact evidence, disclose any intentionally historical wording left unchanged, and keep YouTube publication and Devpost submission pending explicit owner authorization.
