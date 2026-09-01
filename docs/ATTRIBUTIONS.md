# Dependency and Asset Attributions

This file records every direct non-original dependency and asset used by Shipment Document Check. The committed lockfile and installed dependency graph were reviewed on 2026-08-29 with pnpm 10.15.1.

## Direct dependency record

| Name | Source | Licence | Version | Use in this project | Required notice or action |
|---|---|---|---|---|---|
| React | https://github.com/facebook/react | MIT | 19.1.1 | User-interface runtime | Preserve upstream licence through package distribution |
| React DOM | https://github.com/facebook/react | MIT | 19.1.1 | Browser rendering | Preserve upstream licence through package distribution |
| Zod | https://github.com/colinhacks/zod | MIT | 4.1.5 | Runtime validation for bundled data and tool inputs | Preserve upstream licence through package distribution |
| TypeScript | https://github.com/microsoft/TypeScript | Apache-2.0 | 5.9.2 | Static type checking and build | Preserve upstream notice through package distribution |
| Vite | https://github.com/vitejs/vite | MIT | 7.3.6 | Development server and production bundling | Preserve upstream licence through package distribution |
| Vite React plugin | https://github.com/vitejs/vite-plugin-react | MIT | 5.0.2 | React JSX transformation | Preserve upstream licence through package distribution |
| Vitest | https://github.com/vitest-dev/vitest | MIT | 3.2.6 | Unit tests | Preserve upstream licence through package distribution |
| Testing Library React | https://github.com/testing-library/react-testing-library | MIT | 16.3.0 | Component tests | Preserve upstream licence through package distribution |
| Testing Library DOM matchers | https://github.com/testing-library/jest-dom | MIT | 6.8.0 | Browser-oriented assertions | Preserve upstream licence through package distribution |
| Testing Library User Event | https://github.com/testing-library/user-event | MIT | 14.6.1 | User interaction tests | Preserve upstream licence through package distribution |
| Playwright Test | https://github.com/microsoft/playwright | Apache-2.0 | 1.55.1 | Chromium end-to-end tests | Preserve upstream notice through package distribution |
| ESLint | https://github.com/eslint/eslint | MIT | 9.34.0 | Static linting | Preserve upstream licence through package distribution |
| ESLint JavaScript config | https://github.com/eslint/eslint | MIT | 9.34.0 | Recommended JavaScript lint rules | Preserve upstream licence through package distribution |
| TypeScript ESLint | https://github.com/typescript-eslint/typescript-eslint | MIT | 8.41.0 | TypeScript lint configuration | Preserve upstream licence through package distribution |
| React Hooks ESLint plugin | https://github.com/facebook/react | MIT | 5.2.0 | React Hooks lint rules | Preserve upstream licence through package distribution |
| React Refresh ESLint plugin | https://github.com/ArnaudBarre/eslint-plugin-react-refresh | MIT | 0.4.20 | Fast-refresh export checks | Preserve upstream licence through package distribution |
| globals | https://github.com/sindresorhus/globals | MIT | 16.3.0 | Browser and Node global definitions for ESLint | Preserve upstream licence through package distribution |
| jsdom | https://github.com/jsdom/jsdom | MIT | 26.1.0 | DOM environment for unit tests | Preserve upstream licence through package distribution |
| Node.js type definitions | https://github.com/DefinitelyTyped/DefinitelyTyped | MIT | 24.3.0 | Node configuration typing | Preserve upstream licence through package distribution |
| React type definitions | https://github.com/DefinitelyTyped/DefinitelyTyped | MIT | 19.1.10 | React typing | Preserve upstream licence through package distribution |
| React DOM type definitions | https://github.com/DefinitelyTyped/DefinitelyTyped | MIT | 19.1.7 | React DOM typing | Preserve upstream licence through package distribution |

No third-party visual asset, logo, font, document template, photograph, illustration, sound, dataset, or real trade document is used.

The local judge-first demonstration uses only captures of this project's fictional application and generated spoken narration. It contains no music, stock footage, third-party product footage, account screens, or real shipment data. The video remains a local review artefact and has not been uploaded.

`docs/submission/assets/devpost-thumbnail.jpg` is an original 3:2 screenshot of this project's fictional, WebMCP-enabled application state. It contains no browser chrome, account information, real shipment data, or third-party media.

The four JPEG images in `docs/screenshots/` are direct application captures at 1425 × 802 pixels. They show only this project's original interface and fictional shipment data, contain no browser chrome or account information, and were added as public README documentation rather than promotional mockups.

`docs/screenshots/architecture-overview.png`, `docs/submission/ARCHITECTURE.architecture.json`, and `docs/submission/ARCHITECTURE.html` were generated for this project with [Archify](https://github.com/tt-a1i/archify) 2.16 (MIT). Archify was used only as a documentation-authoring tool and is not a runtime or package dependency. The typed source describes the repository's actual client-only components and authority boundaries; no backend or external service was invented for the diagram.

`public/assets/landing/shipment-document-check-hero.webp` is original AI-generated artwork created specifically for this project's judge-facing landing experience with OpenAI's built-in image-generation capability in Codex. The built-in tool did not expose a model identifier. The final artwork contains fictional, unbranded trade-document forms and port infrastructure; it uses no third-party artwork, characters, logos, flags, company names, or readable text.

## Transitive dependency review

`pnpm licenses list --json` reported the following declared licence families for the resolved dependency graph:

| Licence | Unique packages | Package-version records |
|---|---:|---:|
| MIT | 227 | 236 |
| MIT-0 | 1 | 1 |
| Apache-2.0 | 19 | 21 |
| Python-2.0 | 1 | 1 |
| CC-BY-4.0 | 1 | 1 |
| ISC | 13 | 17 |
| BSD-2-Clause | 8 | 8 |
| BSD-3-Clause | 3 | 3 |

No package reported an unknown or unlicensed status. All 21 direct dependency versions matched `package.json` and their installed package metadata. Dependencies and Playwright browser binaries are development/build inputs and are not committed to this repository; upstream licence and notice files remain in their distributed packages.

## Dependency policy

For every added software dependency:

1. Record the exact package name and installed version.
2. Link to its canonical source.
3. Record its declared licence.
4. Explain its narrow purpose.
5. Preserve required licence or notice material.
6. Reject unclear or incompatible licences.
7. Update this file in the same commit that introduces the dependency.

Adding a component library, model SDK, OCR SDK, analytics SDK, backend framework, database client, router, state-management library, or unrelated utility requires a scope decision rather than casual package accumulation.

## Asset policy

Do not use:

- real letters of credit, invoices, packing lists, bills of lading, or certificates;
- documents copied from a commercial product demonstration;
- third-party company, bank, carrier, chamber, government, or standards-organisation logos;
- copyrighted screenshots, music, photographs, illustrations, fonts, or templates without a compatible licence;
- private customer, employer, shipment, financial, or personal data;
- paid standards text reproduced beyond what its licence permits.

The five document previews, fictional organisations, shipment values, text, layouts, icons, and diagrams must be created specifically for this repository.

## Source-code policy

Short patterns may be informed by official public documentation, but implementation must be original and adapted to this codebase. Record copied or substantially adapted samples when their licence or attribution terms require it.

WebMCP tool definitions must be written for this application. Do not copy another challenge entrant's implementation or relabel a showcase application.

## Submission review

Before the final submission freeze:

- [x] Commit and review `pnpm-lock.yaml`.
- [x] Review transitive dependency licences and required notices.
- [x] Confirm every direct dependency version matches the lockfile.
- [x] Confirm every visual, sound, diagram, and document template is original or recorded.
- [x] Confirm the demonstration video uses no unlicensed music or footage — original application capture and narration only; no music.
- [x] Confirm no real trade document or identifying data exists in source, fixtures, screenshots, history, or deployment — synthetic-data and history scans completed on 2026-08-30.
- [x] Confirm the public repository exposes this file and the root `LICENSE` — both returned anonymously after the repository rename.
