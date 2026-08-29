# Final Challenge Submission Checklist

**Project:** Export Document Pack Preflight  
**Controlling deadline:** September 3, 2026 at 1:00 PM Pacific Time  
**Internal freeze:** September 3, 2026 at 8:00 PM IST  
**Status vocabulary:** `verified`, `pending`, `blocked`, `not-applicable`

Do not mark an item verified from memory. Record evidence next to it.

## 1. Product scope

| Requirement | Status | Evidence |
|---|---|---|
| One fictional resettable shipment pack | verified | Bundled application data |
| Five supported document types | verified | LC, Invoice, Packing List, B/L, Certificate of Origin |
| Exactly nine deterministic checks | verified | `src/domain/rules.ts` |
| Exactly six WebMCP tools | verified | `src/webmcp/tools.ts` |
| One-screen manual workflow | verified | Application UI |
| Locked bank/carrier/authority documents cannot be directly edited | verified | Reducer and WebMCP tests |
| Exporter changes require visible human approval | verified | Reducer/UI flow |
| Human-judgement decisions require visible confirmation | verified | Reducer/UI flow |
| External correction requests remain unsent drafts | verified | Reducer/tool flow |
| No backend, auth, OCR, model API, or embedded chatbot | verified | Repository scope review |
| Product UI contains no unnecessary sponsor branding | verified | `src/App.tsx`; submission-polish regression assertion |

## 2. Code and testing gate

| Check | Status | Evidence |
|---|---|---|
| `pnpm-lock.yaml` is generated and committed | verified | Local fix branch commit `e7bf80d` |
| Clean `pnpm install --frozen-lockfile` succeeds | verified | Pinned pnpm 10.15.1 frozen install exited 0 on 2026-08-29 |
| `pnpm lint` exits 0 | verified | Fresh local run exited 0 on 2026-08-29 |
| `pnpm test:run` exits 0 | verified | 4 files and 43 tests passed on 2026-08-29 |
| `pnpm build` exits 0 | verified | TypeScript and Vite production build exited 0 on 2026-08-29 |
| `pnpm test:e2e` exits 0 | verified | 4 Chromium journeys passed on 2026-08-29 |
| Prompt-injection isolation test passes | verified | Included in the 43-test Vitest run on 2026-08-29 |
| Complete browser journey passes | verified | Playwright full manual-resolution journey passed on 2026-08-29 |
| Locked WebMCP edit journey passes | verified | Playwright direct locked-document rejection journey passed on 2026-08-29 |
| GitHub Actions CI rerun | not-applicable | Monthly Actions quota exhausted; owner approved local verification instead. Run later only if quota returns. |

A local clean-checkout failure blocks submission until fixed. Hosted CI is useful evidence, but it is not a challenge requirement and is not allowed to become a fabricated blocker after the owner explicitly deferred it.

## 3. Native WebMCP judge path

| Check | Status | Evidence |
|---|---|---|
| Public no-login live URL exists | blocked | T10 deployment environment required |
| ChatGPT in-app browser opens the live URL | blocked | Requires live deployment |
| Chrome/WebMCP environment discovers exactly six tools | blocked | Requires live/native WebMCP environment |
| Tool schemas are visible and valid | blocked | Requires live/native WebMCP environment |
| `get_pack_state` executes against live state | blocked | Requires live/native WebMCP environment |
| Direct B/L correction returns `DOCUMENT_LOCKED` | blocked | Requires live/native WebMCP environment |
| Manual fallback works without WebMCP | blocked | Validate deployed URL |
| Reset works on deployed URL | blocked | Validate deployed URL |
| Fresh reader can follow README without assistance | blocked | Validate deployed URL |

## 4. Six natural-language evals

Eval source: `docs/evals/prompt-cases.json`

| Eval | Status | Observed tool sequence/result |
|---|---|---|
| Inspect-only | blocked | Native agent run required |
| Explain goods-description evidence | blocked | Native agent run required |
| Stage exporter fixes | blocked | Native agent run required |
| Handle external issuer discrepancies | blocked | Native agent run required |
| Stage human judgement | blocked | Native agent run required |
| Primary multi-step journey with adversarial document text | blocked | Native agent run required |

Do not publish a tool-selection percentage until these observed calls are recorded in `docs/evals/evaluation-report.md`.

## 5. Repository compliance

| Requirement | Status | Evidence |
|---|---|---|
| Repository contains complete source and setup instructions | pending | Final review after T11 |
| Root MIT `LICENSE` exists | verified | `LICENSE` |
| Dependency/asset attributions are current | verified | Direct versions and resolved licence families reviewed on 2026-08-29 |
| Repository contains no real trade documents or personal/private data | blocked | Tree/history content scan found no real documents; two Gmail commit-author addresses require an owner exposure/rewrite decision before publication |
| Repository is public | blocked | Owner intentionally keeping private until closer to ready |
| GitHub visibly detects the MIT licence | blocked | Verify after repository becomes public |
| README links work signed-out | blocked | Verify after repository becomes public |
| No secrets or environment credentials are committed | verified | Current-tree and all-revision filename/content pattern scans returned no hits on 2026-08-29 |

## 6. Devpost description

Draft: `docs/submission/DEVPOST_DRAFT.md`

- [x] Problem is specific to SME export-documentation workflow.
- [x] Why WebMCP is necessary is explained.
- [x] Human-agent collaboration is described.
- [x] Implementation is described without fake enterprise features.
- [x] WebMCP Leverage is addressed.
- [x] Execution is addressed.
- [x] Potential Impact is addressed.
- [x] Creativity and Ambition are addressed.
- [x] Security and limitations are explicit.
- [x] Testing instructions are drafted.
- [x] Problem evidence is linked for final submission review.
- [x] Create a 3:2 project thumbnail from the real WebMCP-enabled application.
- [ ] Replace `[T10_VERIFIED_LIVE_URL]` only after verification.
- [ ] Replace `[T12_PUBLIC_REPOSITORY_URL]` only after public signed-out verification.
- [ ] Replace `[T11_VERIFIED_YOUTUBE_URL]` only after video is public.
- [ ] Remove every bracketed placeholder before submission.

## 7. Demo video

Script: `docs/submission/DEMO_SCRIPT.md`

| Requirement | Status | Evidence |
|---|---|---|
| Actual running product is shown | blocked | Requires T10 deployment |
| Six WebMCP tools are visibly shown | blocked | Requires native WebMCP environment |
| Staged exporter corrections are shown | blocked | Record after deployment |
| Human approval is shown | blocked | Record after deployment |
| Locked-document protection is shown | blocked | Record after deployment |
| External requests shown as unsent drafts | blocked | Record after deployment |
| Human judgement and rationale shown | blocked | Record after deployment |
| Final 7-pass / 2-pending-external state shown | blocked | Record after deployment |
| Duration under three minutes | blocked | Verify uploaded video |
| Audio narration is present | blocked | Verify uploaded video |
| Video is public on YouTube | blocked | Verify signed-out |
| No copyrighted music, unnecessary third-party trademarks, or private account data | pending | Product branding cleaned up; review final recording |

## 8. Submission links

Fill only after verification:

```text
Live application: [T10_VERIFIED_LIVE_URL]
Public repository: [T12_PUBLIC_REPOSITORY_URL]
Public YouTube demo: [T11_VERIFIED_YOUTUBE_URL]
Submission tag: [T12_FINAL_TAG]
```

## 9. Final freeze

Before pressing Submit:

- [ ] Re-read the current Devpost official rules.
- [ ] Verify deadline and timezone again.
- [x] Generate and commit `pnpm-lock.yaml`.
- [x] Run the complete code/test gate from a clean checkout.
- [ ] Verify live site signed-out.
- [ ] Verify repository signed-out.
- [ ] Verify video signed-out.
- [ ] Verify all six WebMCP tools in the native environment.
- [ ] Verify all six agent eval observations are recorded.
- [ ] Search the repository for secrets, private data, `TODO`, `TBD`, and submission placeholders.
- [ ] Confirm all assets and dependencies are original or correctly attributed.
- [ ] Create final submission tag.
- [ ] Complete Devpost submission before internal freeze.
- [ ] Freeze judged repository/deployment/submission artefacts.

A checklist item marked blocked is not a reason to improvise a claim. It is simply work that still has to happen, a surprisingly advanced concept in software delivery.
