# XMS Contract Architecture
Updated: 2026-04-28

This file is the working contract for the modular refactor. New features should
fit these boundaries before code review starts, not after a bug appears.

## Current Refactor Status

Phase 7 has been migrated through tooling, schemas, core, registry,
infrastructure, IPC, renderer stores, cleanup, lint hardening, and manual smoke.
Step 11 is this document. It records the rules that keep the refactor stable.

## Design Goals

- Keep domain logic pure so calculations and document transforms are easy to
  test without Electron, files, or React.
- Keep side effects in one layer so file storage, template loading, dialogs, and
  shell calls can be replaced without rewriting the UI.
- Keep renderer code task-focused: stores own interaction state, services call
  `window.xms`, and views render document-kind-specific forms.
- Keep every cross-process payload validated at the boundary with shared zod
  contracts.
- Keep document kinds extensible through `DocumentKind` and `DOCUMENT_REGISTRY`
  instead of scattered string checks.

## The Three Layers

### Core

Location: `src/core/**`

Core is pure TypeScript domain logic. It owns pricing, date formatting, document
normalization, draft-title derivation, preview models, and replacement builders.

Reason: a pure core can be tested with fixtures and reused from main or renderer
without dragging platform effects into the hot path.

Core may import:

- `@shared/**` for schema-derived types and stable constants.
- Pure dependencies such as `date-fns`.

Core must not import:

- `electron`, `react`, `react-dom`, `node:*`, `@infra/**`, `@renderer/**`,
  `src/main/**`, or `src/preload/**`.

### Infrastructure

Location: `src/infrastructure/**`

Infrastructure owns side effects and adapters:

- `storage/` reads and writes settings and drafts.
- `templates/` reads manifests and cached template binaries.
- `exporters/docx/` patches the real DOCX package.
- `system/` wraps shell and dialog behavior.

Reason: isolating side effects lets main compose services and keeps platform
details out of core and renderer code.

Infrastructure may import:

- `@shared/**` for schemas and types.
- Node and Electron types needed by adapters.

Infrastructure must not import:

- `@core/**`, `@renderer/**`, `src/main/**`, or `src/preload/**`.

### Presentation

Location: `src/renderer/**`

Presentation owns UI, interaction state, and renderer-only orchestration.
React views read zustand selectors, call store actions, and use renderer
services instead of calling IPC directly.

Reason: the renderer should remain a thin, inspectable user workflow layer.

Renderer may import:

- `@core/**` for pure preview and normalization helpers.
- `@shared/**` for types, schemas, and `DocumentKind`.

Renderer must not import:

- `electron`, `node:*`, `@infra/**`, `src/main/**`, or `src/preload/**`.

## Main And Preload

`src/main/**` is the composition root. It creates the Electron window, builds the
container, and registers IPC handlers. Main may import `@infra/**`, `@core/**`,
and `@shared/**`, but it must not import renderer code.

Reason: main is allowed to connect layers, but should not become another
business-logic or UI layer.

`src/preload/**` exposes the typed `window.xms` bridge. It validates requests
before `ipcRenderer.invoke` and validates responses before returning to the
renderer.

Reason: preload is the only intentional browser-to-main bridge; keeping it
small makes IPC reviewable.

Preload may import:

- `electron` for `contextBridge` and `ipcRenderer`.
- `@shared/ipc/**` and shared types.

Preload must not import:

- `@core/**`, `@infra/**`, `@renderer/**`, `src/main/**`, or `node:*`.

## Shared Contracts

Location: `src/shared/**`

Shared code contains schemas, IPC constants, and types derived from schemas. It
does not contain application behavior.

Reason: shared code is loaded by multiple processes, so it must stay stable and
low side-effect.

Important files: `schema/document-kind.ts` is the only source for supported
document kind literals, `schema/draft.ts` owns the draft union,
`ipc/channels.ts` owns raw IPC strings, `ipc/contracts.ts` owns request and
response schemas, and `types.ts` exports shared app types.

## Data Flow

```text
User input
  -> Renderer view
  -> zustand store
  -> renderer service
  -> window.xms preload method
  -> IPC channel name from shared/ipc/channels.ts
  -> zod request validation in preload and main
  -> main IPC handler
  -> infrastructure adapter and/or core function
  -> zod response validation in main and preload
  -> renderer service
  -> zustand store
  -> UI update
```

DOCX render currently follows this path:

```text
ContractFullrightFormView
  -> normalizeContractFullrightForm
  -> renderService.docx
  -> window.xms.render.docx
  -> render:docx handler
  -> settingsRepo.load + templateLoader.loadBinary
  -> contract-fullright replacement builders
  -> DocxExporter.export
  -> temp .docx path
```

Reason: data flow must cross process boundaries only through typed IPC, and DOCX
patching must stay in the main-side adapter path.

## Directory Map

```text
src/core/date|pricing/                 Pure helper modules.
src/core/documents/{registry,<kind>}/   Document logic by kind.
src/infrastructure/storage|templates/   JSON repositories and template loader.
src/infrastructure/exporters/docx/      DOCX package patching.
src/infrastructure/exporters/{xlsx,pdf}/ Future exporter placeholders.
src/infrastructure/system/              Dialog and shell adapters.
src/main/{container,ipc}/               Dependency wiring and IPC handlers.
src/preload/api.ts                      XmsApi and invoke validation helper.
src/renderer/src/stores|services/       zustand state and window.xms adapters.
src/renderer/src/views/forms/<kind>/    Per-kind form views.
src/shared/{schema,ipc}/                zod schemas, channels, contracts.
templates/<kind>/                       Manifest and template binary.
```

## Import Rules

These rules are enforced in `eslint.config.mjs`.

Core rule: core cannot import platform, UI, infrastructure, main, or preload
code.

Reason: pure domain logic should remain deterministic and testable.

Renderer rule: renderer cannot import Electron, Node, infrastructure, main, or
preload code.

Reason: renderer behavior must go through `window.xms` so payload validation and
process isolation stay intact.

Preload rule: preload cannot import domain, infrastructure, renderer, main, or
Node code.

Reason: preload is only a typed IPC bridge.

Infrastructure rule: infrastructure cannot import core, renderer, main, or
preload code.

Reason: adapters should be replaceable and should not accidentally depend on UI
or domain module internals.

Main rule: main composes dependencies and handlers, but must not import renderer
code.

Reason: main owns process orchestration, not UI.

Shared rule: shared modules should stay schema/type/constant only.

Reason: shared modules are loaded by both sides and should not hide effects.

## IPC Channel Checklist

When adding a new IPC channel:

1. Add the channel name to `src/shared/ipc/channels.ts`.
2. Add request and response zod schemas to `src/shared/ipc/contracts.ts`.
3. Add derived TypeScript types only if callers need them.
4. Implement the handler in `src/main/ipc/handlers/*`.
5. Register the handler from `src/main/ipc/register.ts` if a new handler module
   is added.
6. Use `parseRequest` and `parseResponse` in the main handler.
7. Add a method to `XmsApi` in `src/preload/api.ts`.
8. Add a renderer service wrapper in `src/renderer/src/services/xms-services.ts`.
9. Add a store action if state changes.
10. Add tests for contract parsing or handler helper behavior.

Reason: every channel must be reviewable from name to UI action.

Do not hardcode channel strings outside `channels.ts`.

Reason: raw strings drift silently and bypass compiler help.

## Exporter Checklist

When adding an exporter such as XLSX or PDF:

1. Create `src/infrastructure/exporters/<format>/<format>-exporter.ts`.
2. Implement `Exporter<TInput, TOutput>` from `exporter.ts`.
3. Keep file or package manipulation inside the exporter folder.
4. Register the exporter in `src/main/container.ts`.
5. Add a `render:<format>` channel if the UI needs format-specific behavior.
6. Add request and response schemas in `src/shared/ipc/contracts.ts`.
7. Add a renderer service method and store/view action if users can trigger it.
8. Add a small fixture test.

Reason: exporters are side-effect adapters and should not change core or form
views just to support a new file format.

## Document Kind Checklist

When adding a document kind, for example `addendum-pricing-update`:

1. Add the literal to `DOCUMENT_KINDS` in `src/shared/schema/document-kind.ts`.
2. Add `src/shared/schema/<kind>.ts` with a zod schema.
3. Add the draft case to `src/shared/schema/draft.ts`.
4. Add IPC discriminant cases for draft save and render requests in
   `src/shared/ipc/contracts.ts`.
5. Create `src/core/documents/<kind>/normalize-form-data.ts`.
6. Create `src/core/documents/<kind>/derive-draft-title.ts`.
7. Create `src/core/documents/<kind>/build-preview-model.ts`.
8. Create `src/core/documents/<kind>/build-replacements.ts`.
9. Export a `DocumentLogic` implementation from `src/core/documents/<kind>/index.ts`.
10. Register the implementation in `src/core/documents/registry.ts`.
11. Add `templates/<kind>/manifest.json` and the template binary.
12. Add `src/renderer/src/views/forms/<kind>/...`.
13. Update the router in `src/renderer/src/views/FormView.tsx`.
14. Add fixture and golden tests under the matching test area.

Reason: the discriminant, core logic, template, IPC payload, and UI route must
move together or the app can create drafts that cannot render.

## Field Change Checklist

When adding or changing a field on one document kind:

1. Update the kind schema in `src/shared/schema/<kind>.ts`.
2. Update normalization in `src/core/documents/<kind>/normalize-form-data.ts`.
3. Update preview and replacement builders for that kind.
4. Update fixtures and golden outputs.
5. Update the form view for that kind.
6. Update the DOCX template if a placeholder is added or renamed.
7. Run the full validation gate.

Reason: schema, UI, preview, and exported document must remain the same contract.

## Renderer Store Rules

Use narrow selectors:

```ts
const formData = useDraftStore((state) => state.formData)
const saveCurrentDraft = useDraftStore((state) => state.saveCurrentDraft)
```

- Broad store subscriptions make large forms re-render more often than needed.
- Keep side effects in actions or services, not presentational components.
- Use `renderer/src/services/xms-services.ts` for every `window.xms` call.

Reason: views should stay easy to scan and should not duplicate persistence or
IPC protocols.

## Template Rules

- Template metadata lives in `templates/<kind>/manifest.json`, so the library
  and loader can discover document kinds without hardcoded UI lists.
- Template binaries are cached by `CachingFsTemplateLoader`, so repeated renders
  avoid unnecessary disk reads.
- If a template file changes while the app is running, restart the app or call a
  dev-only invalidation hook before expecting the new binary.

Reason: template discovery and caching must be predictable when document kinds
grow.

## Accepted Deviations And To-Dos

`annex-newstore` is intentionally a stub until the annex spec file or field list
is provided. It can be created and listed as a draft, but DOCX rendering throws a
clear "not implemented" error for that kind. Reason: Phase 7 builds the
multi-kind frame; annex content belongs in a later feature PR after the spec
exists.

Preload contract tests are not full end-to-end IPC tests yet. Reason: Phase 7
validates schemas, request/response parsing, and smoke behavior; Playwright or
Spectron coverage is out of scope for this phase.

XLSX and PDF exporters are placeholders. Reason: repository and exporter
interfaces leave room for them without adding unimplemented user-facing
features.

## Anti-Patterns Removed

Removed patterns include the monolithic `FormView`, raw `unknown` IPC payloads,
hardcoded IPC strings, renderer calls that bypass `window.xms`, shared render
logic that mixed UI normalization with DOCX replacement logic, one-kind-only
template paths, and the legacy bridge after `window.xms` became the API.

Reason: these patterns made behavior hard to validate and future document kinds
expensive to add.

## Test Policy

- Core logic needs fixture or unit coverage for normalization, pricing, dates,
  preview model construction, and replacement generation. Reason: core is the
  stable behavior contract for document output.
- Infrastructure needs adapter-level tests with temporary paths or small
  fixtures. Reason: side effects fail differently from pure logic.
- IPC schemas need contract tests for valid and invalid payload shapes. Reason:
  schema regressions should fail before a process boundary.
- Renderer store helpers need unit tests when they transform data. Reason: store
  action regressions are cheaper to catch outside the browser.
- Manual UI smoke is required after changing export, preview, templates, or form
  routing. Reason: native dialogs and Electron shell behavior are not covered by
  unit tests.

## Validation And Commands

Run these before claiming a refactor step is ready:

```bash
git diff --check
npm test
npm run typecheck
npm run lint
npm run build
```

For local development and packaging:

```bash
npm run dev
npm run generate:template-assets
npm run build:unpack
npm run build:mac
```

Reason: unit tests, type checks, lint rules, and bundling catch different classes
of failure.

## Review Checklist

Before merging architecture or refactor changes:

1. Start from current `main`; keep the diff inside this repository and avoid
   unrelated staging.
2. Respect `REFACTOR-PLAN.md` order and the one-step-per-PR cadence.
3. Confirm layer imports match `eslint.config.mjs`.
4. Route new IPC through shared constants and zod contracts.
5. Route new document-kind behavior through `DocumentKind` and
   `DOCUMENT_REGISTRY`.
6. Keep renderer changes on stores/services, not direct IPC.
7. Validate DOCX changes against the real template path.
8. Record the validation gate in the PR body.

Reason: the refactor is only done if future work can safely build on it.
