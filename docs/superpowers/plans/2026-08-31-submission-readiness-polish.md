# Submission Readiness Polish Implementation Plan

> **Status:** Historical execution plan. Its dated checkboxes are preserved as plan-time evidence, not current instructions. Current state is recorded in `docs/project/PROJECT_MEMORY.md`, `docs/project/CURRENT_PROGRESS.md`, and `docs/submission/FINAL_CHECKLIST.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Remove the newly discovered flaky phone-layout gate, make the existing demo immediately prove the native WebMCP experience, reconcile submission evidence, and finish with one fresh end-to-end website suite.

**Architecture:** Keep product behavior unchanged. Correct the regression test so it measures same-row alignment with subpixel tolerance, deterministically reorder only existing approved demo assets, then update public documentation to describe the verified state without inventing publication URLs or release tags.

**Tech Stack:** React, TypeScript, Vite, Playwright, Vitest, OpenMontage, Remotion, FFmpeg/DAPI.

**Spec:** `docs/submission/FINAL_CHECKLIST.md`

## Global constraints

- Do not upload or publish to YouTube.
- Do not enter, save, or submit anything on Devpost.
- Do not push the branch or create a release tag.
- Preserve the existing demo video; write the judge-first edit as a separate output.
- Reuse the approved narration, captions, and footage. Do not add music, stock footage, or generated assets.
- Keep the application workflow and its six native WebMCP tools unchanged.

---

### Task 1: Correct the phone-layout regression gate

**Files:**
- Modify: `tests/smoke.spec.ts`

**Step 1: Reproduce the existing failure**

Run the focused phone-layout test at the existing 390 x 844 viewport and retain the failing coordinate evidence.

**Step 2: Apply the minimal assertion correction**

Replace exact floating-point equality with explicit non-null checks and a subpixel tolerance:

```ts
expect(firstFact).not.toBeNull();
expect(secondFact).not.toBeNull();
expect(Math.abs(firstFact!.y - secondFact!.y)).toBeLessThan(1);
```

This continues to fail if the facts move to different rows while avoiding false failures caused by browser subpixel text/layout rounding.

**Step 3: Verify the focused regression repeatedly**

Run the focused test with repeated executions and require every run to pass.

---

### Task 2: Create a judge-first demo cut without replacing the prior video

**Files:**
- Modify: `.openmontage-production/OpenMontage/projects/shipment-document-check-openmontage/artifacts/edit_decisions.json`
- Modify: `.openmontage-production/OpenMontage/projects/shipment-document-check-openmontage/artifacts/script.json`
- Create: `.openmontage-production/OpenMontage/projects/shipment-document-check-openmontage/assets/audio/narration-judge-first.wav`
- Create: `.openmontage-production/OpenMontage/projects/shipment-document-check-openmontage/assets/subtitles/narration-judge-first.srt`
- Create: `artifacts/shipment-document-check-demo-openmontage-judge-first.mp4`

**Step 1: Reorder only the approved material**

Use this sequence and keep the total runtime unchanged:

1. Live WebMCP call and untrusted-document boundary, 0-23 seconds.
2. Problem/context, 23-41 seconds.
3. Six-tool overview, 41-61 seconds.
4. Exporter corrections, 61-89 seconds.
5. External requests, 89-116 seconds.
6. Human decision, 116-143 seconds.
7. Rerun, 143-158 seconds.
8. Outcome, 158-165 seconds.

**Step 2: Rebuild narration and captions from the existing section assets**

Use OpenMontage's registered audio and subtitle tools. Do not synthesize new speech or alter the approved wording.

**Step 3: Render a separate output**

Use the existing OpenMontage/Remotion composition path. Do not overwrite or delete `artifacts/shipment-document-check-demo-openmontage.mp4`.

**Step 4: Verify the finished media**

Probe streams and duration, inspect the opening and all transitions with filmstrips/frame grabs, and confirm the entire output remains sharp and audible.

---

### Task 3: Reconcile submission evidence and update the README

**Files:**
- Modify: `docs/submission/FINAL_CHECKLIST.md`
- Modify: `docs/submission/DEMO_SCRIPT.md`
- Modify: `docs/submission/DEVPOST_DRAFT.md`
- Modify: `docs/ATTRIBUTIONS.md`
- Modify: `docs/evals/evaluation-report.md` only if it contains stale counts or media facts
- Modify: `README.md`

**Step 1: Remove stale or misleading status text**

- Replace obsolete demo duration and opening-sequence claims with the verified judge-first cut.
- Replace placeholder YouTube URL and tag tokens with plain pending-owner-action statements.
- Treat a final git tag as optional internal release hygiene, not a challenge requirement.
- Reconcile checklist boxes only where local evidence supports completion.

**Step 2: Refresh the public README**

Keep the name, deployment URL, architecture, six-tool contract, screenshots, test commands, safety boundaries, and submission status accurate. Do not add local filesystem paths or imply that the demo has been published.

---

### Task 4: Run the fresh release gate

**Step 1: Run static and unit gates**

```bash
pnpm lint
pnpm test
pnpm build
```

**Step 2: Run one complete website end-to-end suite**

```bash
pnpm test:e2e
```

Treat this single Playwright suite as the final website journey: landing, responsive behavior, all six native WebMCP registrations, staged exporter changes, external-only requests, visible human confirmation, rerun, persistence, accessibility, and browser-error checks must all pass.

**Step 3: Audit repository state**

Confirm there are no remaining placeholder tokens, no accidental publication changes, no overwritten prior video, and only intended files are modified.
