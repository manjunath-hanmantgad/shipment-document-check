# Current Project Progress

**Project:** Export Document Pack Preflight  
**Repository:** `manjunath-hanmantgad/webmcp-challenge-2026-manjunath`  
**Snapshot date:** 29 August 2026  
**Scope version:** 2.0, finalized and frozen  
**Current phase:** Deployed judge-path verification  
**Current task:** `T10 — Deploy and validate the judge path`  
**Completed through:** `T09 — Focused validation, security tests, and eval dataset`  
**Parallel submission work:** `T11.1`–`T11.4` completed; `T11.5` waits for verified T10  
**Known product-code blockers:** Live deployment lacks the locally verified human-confirmation fix
**Repository visibility:** Private pending release audit and owner decision on commit-author email exposure

This file records transient execution state. Durable product decisions remain in `PROJECT_MEMORY.md`; detailed steps remain in the implementation plan; task status remains in `task-tracker-data.js`.

---

## 1. Completed product work

Merged implementation and deterministic-validation tasks:

- `T03` repository baseline — PR `#1`.
- `T04` client scaffold — PR `#2`.
- `T05` fictional pack and nine rules — PR `#3`.
- `T06` authority-aware reducer and actions — PR `#4`.
- `T07` single-screen human workflow — PR `#5`.
- `T08` six WebMCP tools — PR `#6`.
- `T09` focused browser/security specifications and six-case eval dataset — PR `#7`.
- T11 submission hardening/materials — PR `#9`; only the public video remains external.

There is no open product-feature rework from these tasks. The challenge build remains one fictional five-document pack, nine checks, six WebMCP tools, one screen, no backend, no OCR, no model API, no persistence, and no embedded chatbot.

---

## 2. T10 deployment status

The original deployment blocker has been resolved.

### Root cause that was fixed

The surfaced Vercel connector described deployment as a zero-argument local-workspace action. Live validation revealed the real write contract accepts:

```text
target: preview | production
name: string
files: [{ file: string, data: string }]
```

Therefore deployment does not require a local clone, Vercel CLI, local npm access, or making the GitHub repository public.

### Exact application deployment

The application source from the then-current `main` was uploaded through Vercel's file-deployment write path. That deployment predates local commits `1da8ceb` and `e7bf80d` and must not be used for final native evaluation or video recording.

Candidate exact-app deployment:

```text
https://export-document-pack-preflight-2u4exkq1l-mhanmantfreebi-1870.vercel.app/
```

Project-style candidate alias:

```text
https://export-document-pack-preflight-mhanmantfreebi-1870.vercel.app/
```

### Stable production entry

A stable production entry deployment was created and Vercel returned `READY`:

```text
https://export-document-pack-preflight-live-qst6bpb0n.vercel.app/
```

Production project alias:

```text
https://export-document-pack-preflight-live-mhanmantfreebi-1870.vercel.app/
```

Deployment ID:

```text
dpl_D7VdoEVEMfVTCU51saSBSD2cYLN6
```

The stable production entry redirects immediately to the immutable exact-app deployment. This is a T10 verification URL, not yet the final submission URL. The final freeze should replace the redirect with a direct production build once all checks pass.

### Remaining Vercel connector defect

The Vercel write action creates deployments successfully, but the read-side connector cannot see deployments created by the write action. This is reproducible even with tiny deployments that the write action reports as `READY`.

Observed read-side behavior:

- empty project listing;
- `404 deployment not found` for write-returned deployment IDs;
- authenticated URL fetch/share operations unable to resolve write-created deployments.

This is a connector observability/scope mismatch, not evidence of a product-code failure.

---

## 3. T10 subtask state

| Subtask | Status | Evidence / remaining check |
|---|---|---|
| `T10.1` Deploy public no-login production build | current | Redeploy the exact release-candidate commit, then verify signed out |
| `T10.2` Main journey + six prompt evals in ChatGPT browser | blocked | Requires fixed deployment and native WebMCP browser session |
| `T10.3` Tool registration/invocation in Chrome WebMCP | blocked | Requires fixed deployment and native Chrome WebMCP session |
| `T10.4` Unsupported-browser fallback and reset | blocked | Verify against the fixed deployed URL in a normal browser |
| `T10.5` Fresh-reader README path | blocked | Run after the fixed deployed URL and public repository are verified |

Do not mark T10 complete from a Vercel URL alone. The browser and native-agent evidence is still mandatory.

---

## 4. T11 status

Merged submission materials:

- `docs/submission/DEVPOST_DRAFT.md`
- `docs/submission/DEMO_SCRIPT.md`
- `docs/submission/AUTHORITY_FLOW.md`
- `docs/submission/FINAL_CHECKLIST.md`

| Subtask | Status | Evidence |
|---|---|---|
| `T11.1` README, architecture, limitations, testing instructions | completed | merged README/submission docs |
| `T11.2` Devpost description | completed | `docs/submission/DEVPOST_DRAFT.md` |
| `T11.3` One authority-flow diagram | completed | `docs/submission/AUTHORITY_FLOW.md` |
| `T11.4` Demo under three minutes | completed | 2:30 script in `docs/submission/DEMO_SCRIPT.md` |
| `T11.5` Record and publish YouTube demo | blocked | requires verified T10 live/native path |

---

## 5. Current task status

| Status | Count | Tasks |
|---|---:|---|
| Completed | 10 | `T00`–`T09` |
| Current | 1 | `T10` |
| Blocked | 1 partial | `T11.5` waits on T10 |
| Pending | 1 | `T12` |
| Deferred | 4 | `D01`–`D04` |

---

## 6. Final code-verification gate

The local release-candidate branch contains:

- `1da8ceb` — surface WebMCP-staged human decisions for visible confirmation;
- `e7bf80d` — commit the lockfile and pin Playwright's nested preview command.

A clean archive of `e7bf80d` passed the following gate on 29 August 2026:

```bash
corepack pnpm@10.15.1 install --frozen-lockfile --ignore-scripts
PLAYWRIGHT_BROWSERS_PATH=0 corepack pnpm@10.15.1 exec playwright install chromium
corepack pnpm@10.15.1 lint
corepack pnpm@10.15.1 test:run
corepack pnpm@10.15.1 build
PLAYWRIGHT_BROWSERS_PATH=0 corepack pnpm@10.15.1 test:e2e
```

Observed results: frozen install passed, lint passed, 43/43 unit tests passed, production build passed, and 4/4 Chromium journeys passed. Rerun this gate after any application/configuration change. GitHub Actions may be rerun if quota returns, but remains optional evidence under the owner's quota deferral.

---

## 7. Exact next action

Do **not** add product features.

1. Finish and commit the release documentation/audit updates.
2. Decide whether the two Gmail commit-author addresses may be exposed publicly or authorize a controlled history rewrite.
3. Land the verified branch on `main` and push it.
4. Deploy that exact commit to the stable production URL.
5. Verify fallback, reset, exactly six tools, the full main journey, the locked-edit rejection, and all six prompt evals.
6. Record actual tool calls/results in `docs/evals/evaluation-report.md`.
7. Once T10 is reproducible, record and publish the narrated <3-minute demo.
8. Replace only verified external placeholders and complete the Devpost draft fields.
9. Do not accept Devpost terms or submit without a separate explicit owner instruction.
