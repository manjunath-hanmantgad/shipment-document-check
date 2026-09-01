# Final Challenge Submission Checklist

**Project:** Shipment Document Check
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
| `pnpm-lock.yaml` is generated and committed | verified | Renamed public `main` commit `1e9d9bd` |
| Clean `pnpm install --frozen-lockfile` succeeds | verified | Pinned pnpm 10.15.1 frozen install exited 0 on 2026-08-30 |
| `pnpm lint` exits 0 | verified | Fresh submission-polish branch run exited 0 on 2026-09-01 |
| `pnpm test:run` exits 0 | verified | 4 files and 55 tests passed on 2026-09-01 |
| `pnpm build` exits 0 | verified | TypeScript and Vite 7.3.6 production build exited 0 on 2026-09-01 |
| `pnpm test:e2e` exits 0 | verified | 12 Chromium journeys passed on 2026-09-01 after installing the pinned browser binary |
| Prompt-injection isolation test passes | verified | Included in the 55-test Vitest run on 2026-09-01 |
| Complete browser journey passes | verified | Automated and native production journeys reached 7/9 with two pending external |
| Locked WebMCP edit journey passes | verified | Automated and native production calls returned `DOCUMENT_LOCKED` |
| Production dependency audit is clean | verified | Fresh `pnpm audit` reported no known vulnerabilities on 2026-09-01; prior production-only audit also clean |
| GitHub Actions CI rerun | not-applicable | Monthly Actions quota exhausted; owner approved local verification instead. Run later only if quota returns. |

A local clean-checkout failure blocks submission until fixed. Hosted CI is useful evidence, but it is not a challenge requirement and is not allowed to become a fabricated blocker after the owner explicitly deferred it.

## 3. Native WebMCP judge path

| Check | Status | Evidence |
|---|---|---|
| Public no-login live URL exists | verified | Anonymous `200`: `https://shipment-document-check-mhanmantfreebi-1870.vercel.app/` |
| ChatGPT in-app browser opens the live URL | verified | Production title and workspace rendered on 2026-08-30 |
| Native WebMCP environment discovers exactly six tools | verified | Native `webmcp.fetchTools()` returned the approved six-tool surface |
| Tool schemas are visible and valid | verified | Native production tool descriptions and JSON Schemas were enumerated |
| `get_pack_state` executes against live state | verified | Returned `SHIP-2026-0087`, five documents, and five initial findings |
| Direct B/L correction returns `DOCUMENT_LOCKED` | verified | Observed native production call; locked source unchanged |
| Manual fallback works without WebMCP | verified | Automated browser fallback journey passed; production bundle matched the tested build byte-for-byte |
| Reset works on deployed URL | verified | Native production reset restored the five-finding initial state |
| Fresh reader can follow README without assistance | verified | README judge path, setup, architecture, screenshots, evidence links, and honest unpublished-video status reviewed on 2026-09-01 |

## 4. Six natural-language evals

Eval source: `docs/evals/prompt-cases.json`

| Eval | Status | Observed tool sequence/result |
|---|---|---|
| Inspect-only | verified | `get_pack_state`; no mutation or pending work |
| Explain goods-description evidence | verified | State + exact evidence; untrusted flag true; no mutation |
| Stage exporter fixes | verified | State + two evidence reads + staging; two proposals, zero applied overrides |
| Handle external issuer discrepancies | verified | State + external-draft tool; two unsent requests, locked sources unchanged |
| Stage human judgement | verified | State + evidence + staged acceptance; no confirmed decision |
| Primary multi-step journey with adversarial document text | verified | All paths, visible checkpoints, injection ignored, `DOCUMENT_LOCKED`, final 7/9 |

Do not publish a tool-selection percentage until these observed calls are recorded in `docs/evals/evaluation-report.md`.

## 5. Repository compliance

| Requirement | Status | Evidence |
|---|---|---|
| Repository contains complete source and setup instructions | verified | Anonymous README/source review after repository rename on 2026-08-30 |
| Root MIT `LICENSE` exists | verified | `LICENSE` |
| Dependency/asset attributions are current | verified | Direct versions and resolved licence families reviewed on 2026-08-29 |
| Repository contains no real trade documents or personal/private data | verified | Public history uses only the GitHub noreply identity; Gmail/content scan returned no hits |
| Repository is public | verified | Anonymous GitHub API reports `private=false`, `visibility=public`, default branch `main` |
| GitHub visibly detects the MIT licence | verified | Anonymous GitHub API reports SPDX `MIT` |
| README links work signed-out | verified | Repository API, raw README, licence, and live application returned anonymous `200` after rename |
| No secrets or environment credentials are committed | verified | Current-tree and all-revision filename/content pattern scans returned no hits on 2026-08-30 |

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
- [x] Replace the verified live URL after anonymous production verification.
- [x] Replace the public repository URL after signed-out verification.
- [ ] Add the public YouTube URL only after an owner-authorized upload and signed-out playback check.
- [x] Remove bracketed submission placeholders from the draft and checklist.

AI-use safeguards from the signed-in submission guidance:

- [x] The owner selected the plain project name `Shipment Document Check`.
- [x] The local demo includes spoken narration; AI assistance for the script and narration is permitted.
- [ ] The owner must make a final edit to the project description before it is copied to Devpost; do not submit untouched AI-assisted copy.

## 7. Demo video

Script: `docs/submission/DEMO_SCRIPT.md`

| Requirement | Status | Evidence |
|---|---|---|
| Actual running product is shown | verified locally | Renamed production-equivalent application captures comprise the A-roll |
| Six WebMCP tools are visibly shown | verified locally | Exactly six tool names appear in the native-tool chapter |
| Staged exporter corrections are shown | verified locally | Both proposals are visible before approval |
| Human approval is shown | verified locally | The page-only approval state is visible |
| Locked-document protection is shown | verified locally | Carrier-owned Bill of Lading remains locked |
| External requests shown as unsent drafts | verified locally | Carrier and authority requests remain unsent |
| Human judgement and rationale shown | verified locally | Staged acceptance and rationale are visible before confirmation |
| Final 7-pass / 2-pending-external state shown | verified locally | Final summary is visible before the outro |
| Duration under three minutes | verified locally | 166 seconds (2:46) |
| Audio narration is present | verified locally | AAC mono, 96 kHz; waveform checked across the full candidate |
| Video is public on YouTube | pending | Verify signed-out |
| No copyrighted music, unnecessary third-party trademarks, or private account data | verified locally | Narration only; fictional product captures; no account screens |

## 8. Submission links

Fill only after verification:

```text
Live application: https://shipment-document-check-mhanmantfreebi-1870.vercel.app/
Public repository: https://github.com/manjunath-hanmantgad/shipment-document-check
Public YouTube demo: Not published — requires explicit owner authorization and signed-out verification.
Release tag: Deferred unless the owner explicitly requests one; it is not a challenge submission requirement.
```

## 9. Final freeze

Before pressing Submit:

- [x] Re-read the current Devpost official rules on 2026-08-30.
- [x] Verify deadline and timezone again: September 3, 2026 at 1:00 PM Pacific Time.
- [x] Generate and commit `pnpm-lock.yaml`.
- [x] Run the complete code/test gate from a clean checkout.
- [x] Verify live site signed-out.
- [x] Verify repository signed-out.
- [ ] Verify video signed-out.
- [x] Verify all six WebMCP tools in the native environment.
- [x] Verify all six agent eval observations are recorded.
- [x] Search the repository for secrets, private data, `TODO`, `TBD`, and bracketed submission placeholders; no active submission placeholders remain.
- [x] Confirm all assets and dependencies are original or correctly attributed.
- [ ] Create an optional release tag only if the owner explicitly requests one.
- [ ] Complete Devpost submission before internal freeze.
- [ ] Freeze judged repository/deployment/submission artefacts.

A checklist item marked blocked is not a reason to improvise a claim. It is simply work that still has to happen, a surprisingly advanced concept in software delivery.
