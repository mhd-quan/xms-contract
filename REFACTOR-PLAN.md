# XMS Contract — Modular Refactor Plan

> Branch: `claude/plan-modular-refactor-5DDcs`
> Strategy: **Big-bang trên branch riêng**, behavior-preserving (không thay đổi UX/feature ở phase này).
> Phạm vi Infra: Hiện trạng (DOCX + JSON file) + thiết kế interface để chừa cửa cho Excel/PDF (chưa làm DB).
> Test: Vitest cho Core/Domain.
> State: Zustand chuẩn hoá toàn bộ store ở Renderer.

---

## 0. Mục tiêu & Nguyên tắc

### 0.1 Mục tiêu
1. Tách codebase từ monolith (main 283 dòng + FormView 375 dòng) thành 3 lớp rõ ràng: **Core / Infrastructure / Presentation**.
2. Mỗi lớp có ranh giới rõ; chỉ giao tiếp qua **interface đã định nghĩa**.
3. Cô lập side-effects (file I/O, DOCX rendering, dialog) vào Infrastructure để dễ mock và dễ thay thế.
4. Đặt nền móng cho việc thêm exporter mới (Xlsx, Pdf) mà **không sửa Core, không sửa UI**.
5. Hỗ trợ **nhiều loại tài liệu** (`contract-fullright`, `annex-newstore`, …) song song; thêm loại mới chỉ là thêm module, không sửa code chung.
6. Codify cấu trúc + quy tắc vào `ARCHITECTURE.md` để mọi feature mới đều theo chuẩn.

### 0.2 Nguyên tắc bất biến
- **Core không import Electron, không import React, không import `node:fs`/`node:path`/`jszip`/`mammoth`.** Chỉ TypeScript thuần + `zod` + `date-fns`.
- **Renderer không import `node:*`, không import từ `src/main/**`, không gọi `ipcRenderer` trực tiếp.** Chỉ giao tiếp qua `window.xms` (preload contract).
- **Main không import React.** Main không biết gì về UI. Mọi thứ Main trả ra phải là plain data đã validate qua zod.
- **IPC payload phải có schema zod ở cả hai phía.** Channel name lấy từ một file constants duy nhất (`@shared/ipc/channels.ts`); không bao giờ hardcode chuỗi.
- **Pure functions trong Core không nhận Date.now() hay đọc env.** Mọi non-determinism phải truyền vào qua tham số (clock, ids).
- **Không hard-code 1 loại tài liệu.** Mọi nơi đụng tới “loại tài liệu” phải đi qua `DocumentKind` (union type) + `DocumentRegistry` (lookup logic theo kind). Cấm `if (kind === 'contract-fullright')` rải rác trong code.

### 0.3 Tiêu chí “Done” cho refactor
- `npm run typecheck` xanh ở cả `node` và `web` config.
- `npm run lint` không có lỗi mới.
- `npm test` (vitest) chạy được, có tối thiểu các test ở §6.
- `npm run dev` mở app, tạo draft, render DOCX, lưu DOCX, mở folder chứa file → tất cả flow hoạt động giống `main` hiện tại.
- `ARCHITECTURE.md` đã commit và mô tả khớp với code thực tế.

---

## 1. Cấu trúc thư mục đích

```
src/
├── core/                          # LỚP 1 — DOMAIN. Pure TS. Không I/O, không React, không Electron.
│   ├── pricing/
│   │   ├── calculate-fees.ts      # tính subtotal, VAT, grand total từ stores + rates
│   │   ├── number-to-vietnamese.ts
│   │   ├── format-money.ts
│   │   └── index.ts               # public surface của pricing module
│   ├── date/
│   │   ├── format-date.ts         # nhận Date | string, không gọi new Date() ngầm
│   │   └── index.ts
│   ├── documents/                 # 1 sub-folder cho mỗi DocumentKind. Cấu trúc giống nhau.
│   │   ├── document-logic.ts      # interface DocumentLogic<TForm,TPreview> dùng chung
│   │   ├── registry.ts            # const DOCUMENT_REGISTRY: Record<DocumentKind, DocumentLogic>
│   │   ├── shared-primitives/     # Party, Store, money primitives dùng chung giữa các kind
│   │   ├── contract-fullright/
│   │   │   ├── build-preview-model.ts
│   │   │   ├── build-replacements.ts
│   │   │   ├── derive-draft-title.ts
│   │   │   ├── normalize-form-data.ts
│   │   │   └── index.ts           # export DocumentLogic implementation
│   │   └── annex-newstore/
│   │       ├── build-preview-model.ts
│   │       ├── build-replacements.ts
│   │       ├── derive-draft-title.ts
│   │       ├── normalize-form-data.ts
│   │       └── index.ts
│   └── index.ts                   # re-export public API của Core
│
├── infrastructure/                # LỚP 2 — Side-effects. Chỉ chạy ở Main process.
│   ├── storage/
│   │   ├── settings-repository.ts # SettingsRepository interface + JsonSettingsRepository impl
│   │   ├── draft-repository.ts    # DraftRepository interface + JsonDraftRepository impl
│   │   └── paths.ts               # APP_DATA, DRAFTS_DIR, TEMP_DIR (single source)
│   ├── templates/
│   │   ├── template-loader.ts     # TemplateLoader interface + CachingFsTemplateLoader (Map<kind,Uint8Array>)
│   │   └── manifest.ts            # đọc templates/<kind>/manifest.json
│   ├── exporters/
│   │   ├── exporter.ts            # interface Exporter<TInput, TOutput>
│   │   ├── docx/
│   │   │   ├── docx-exporter.ts   # implements Exporter<DocxRenderInput, Buffer>
│   │   │   ├── xml-utils.ts       # escapeXml, replaceNextTextNode, ...
│   │   │   └── content-types.ts   # normalizeDocxContentTypes
│   │   ├── xlsx/                  # PLACEHOLDER — chỉ folder + README, chưa implement
│   │   └── pdf/                   # PLACEHOLDER — chỉ folder + README, chưa implement
│   ├── system/
│   │   ├── shell-service.ts       # openPath, showItemInFolder
│   │   └── dialog-service.ts      # showSaveDialog
│   └── index.ts
│
├── main/                          # LỚP 2.5 — Composition root cho Main process.
│   ├── index.ts                   # tạo BrowserWindow + wire dependencies
│   ├── ipc/
│   │   ├── register.ts            # registerIpcHandlers(deps)
│   │   ├── handlers/
│   │   │   ├── settings-handlers.ts
│   │   │   ├── draft-handlers.ts
│   │   │   ├── template-handlers.ts
│   │   │   ├── render-handlers.ts
│   │   │   └── system-handlers.ts
│   │   └── validate.ts            # parseWith(schema, payload) helper
│   └── container.ts               # tạo & wire SettingsRepo, DraftRepo, Exporter, ...
│
├── preload/
│   ├── index.ts                   # contextBridge.exposeInMainWorld('xms', api)
│   ├── api.ts                     # XmsApi typed surface (mỗi method gọi ipcRenderer.invoke)
│   └── index.d.ts                 # augment Window
│
├── renderer/                      # LỚP 3 — UI. Không bao giờ import từ main/* hoặc infrastructure/*.
│   └── src/
│       ├── app/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── stores/                # zustand slices
│       │   ├── draft-store.ts
│       │   ├── library-store.ts
│       │   ├── settings-store.ts
│       │   └── index.ts
│       ├── services/              # adapter từ window.xms → store/UI
│       │   ├── draft-service.ts
│       │   ├── settings-service.ts
│       │   └── render-service.ts
│       ├── views/
│       │   ├── FormView.tsx
│       │   └── LibraryView.tsx
│       ├── components/
│       │   ├── PreviewPane.tsx
│       │   ├── SettingsModal.tsx
│       │   ├── Rack.tsx
│       │   └── StatusBar.tsx
│       ├── hooks/
│       │   ├── use-autosave.ts
│       │   └── use-debounced.ts
│       └── styles/
│
└── shared/                        # Hợp đồng dùng chung (chỉ types + zod, KHÔNG logic).
    ├── ipc/
    │   ├── channels.ts            # const IPC_CHANNELS = { ... } as const
    │   └── contracts.ts           # zod schema cho mọi IPC payload + response
    ├── schema/
    │   ├── document-kind.ts       # z.enum(['contract-fullright','annex-newstore'])
    │   ├── contract-fullright.ts
    │   ├── annex-newstore.ts
    │   ├── settings.ts
    │   └── draft.ts               # Draft = discriminated union theo `kind`
    └── types.ts                   # types derived từ zod via z.infer
```

### Quy tắc import ép buộc bằng ESLint
- `src/core/**` → không được import: `electron`, `react`, `react-dom`, `node:*`, `jszip`, `easy-template-x`, `mammoth`, `@renderer/**`, `@main/**`, `@infra/**`.
- `src/renderer/**` → không được import: `electron`, `node:*`, `@main/**`, `@infra/**`. Được phép import `@core/**` và `@shared/**`.
- `src/infrastructure/**` → không được import: `react`, `react-dom`, `@renderer/**`. Được phép import `@core/**`, `@shared/**`.
- `src/main/**` → composition root, được import `@infra/**`, `@core/**`, `@shared/**`. Không import `@renderer/**`.
- Enforce bằng `eslint-plugin-import` rule `no-restricted-paths` (xem §7).

---

## 2. Phase 1 — Core / Domain (Pure Logic)

### 2.1 Scope
Trích xuất toàn bộ logic tính toán & format từ `src/shared/contract-render.ts` + một phần `FormView.tsx` thành `src/core/`. **Tổ chức theo `DocumentKind`** ngay từ đầu để annex-newstore có chỗ ở. Không thay đổi hành vi của contract-fullright.

### 2.2 Việc cần làm
1. **Primitives chung**:
   - `src/core/pricing/format-money.ts` ← `formatMoney` (contract-render.ts:82-85).
   - `src/core/pricing/number-to-vietnamese.ts` ← `numberToVietnamese` (contract-render.ts:87-130).
   - `src/core/pricing/calculate-fees.ts` ← phần “fees calculation, subtotal, VAT, grand total” từ `buildPreviewModel` (contract-render.ts:132-169). Tách riêng để test độc lập.
   - `src/core/date/format-date.ts` ← `formatDate`, `formatDateLong` (contract-render.ts:68-80). Yêu cầu: nếu input là string ISO, dùng `parseISO`; nếu là `Date`, dùng trực tiếp. **Không** gọi `new Date()` ngầm.

2. **Interface chung cho mọi document kind** — `src/core/documents/document-logic.ts`:
   ```ts
   export interface DocumentLogic<TForm, TPreview> {
     readonly kind: DocumentKind;
     normalizeFormData(input: unknown): TForm;
     deriveDraftTitle(form: TForm): string;
     buildPreviewModel(form: TForm): TPreview;
     buildReplacements(form: TForm, preview: TPreview): {
       clickReplacements: Record<string, string>;
       specialTextReplacements: Record<string, string>;
     };
   }
   ```

3. **`src/core/documents/contract-fullright/`** — port từ code hiện tại:
   - `normalize-form-data.ts` ← `normalizeFormData`, `normalizeStores` (FormView.tsx:60-80).
   - `derive-draft-title.ts` ← `deriveDraftTitle` (FormView.tsx:82-89).
   - `build-preview-model.ts` ← phần còn lại của `buildPreviewModel` (gọi `calculate-fees`).
   - `build-replacements.ts` ← `buildClickReplacements` + `buildSpecialTextReplacements` (contract-render.ts:171-269).
   - `index.ts` export `contractFullrightLogic: DocumentLogic<...>`.

4. **`src/core/documents/annex-newstore/`** — placeholder có-chạy-được:
   - Phase này tạo file scaffolding với type-safe stub: `normalizeFormData` trả về object rỗng đã typed, `buildPreviewModel`/`buildReplacements` trả `{}` placeholder. Lý do: cấu trúc registry hoạt động ngay, code thật điền sau khi có spec từ `annex-newstore.md`.
   - **Blocker**: Cần `annex-newstore.md` (spec field) để hoàn thiện logic. Xem §12.
   - `index.ts` export `annexNewstoreLogic: DocumentLogic<...>`.

5. **`src/core/documents/registry.ts`**:
   ```ts
   export const DOCUMENT_REGISTRY = {
     'contract-fullright': contractFullrightLogic,
     'annex-newstore':     annexNewstoreLogic,
   } as const satisfies Record<DocumentKind, DocumentLogic<any, any>>;

   export function getDocumentLogic(kind: DocumentKind) { return DOCUMENT_REGISTRY[kind]; }
   ```

6. **Schema canonicalization** (`src/shared/schema/`):
   - `document-kind.ts` định nghĩa `z.enum(['contract-fullright','annex-newstore'])`.
   - Sửa `contract-fullright.ts` cho khớp data path thật của form.
   - Tạo `annex-newstore.ts` (rỗng/stub đến khi có spec).
   - `draft.ts` định nghĩa Draft là **discriminated union** theo `kind`.

7. Tạo `src/core/index.ts` re-export public surface (pricing, date, documents).

8. Xoá `src/shared/contract-render.ts` sau khi đã chuyển hết import sang `@core/*`.

### 2.3 Yêu cầu kỹ thuật
- Mỗi hàm Core nhận **input đã validate qua zod** (do caller validate, không validate trong Core). Lý do: tránh bundle zod runtime cost lặp lại trong Core hot path.
- Type input phải `Readonly<...>`; không mutate tham số.
- Không return undefined ẩn — luôn trả về object đã normalize đầy đủ field.
- Mỗi file Core ≤ 150 dòng. Nếu vượt, tách tiếp.
- Path alias `@core/*` được thêm vào `tsconfig.web.json`, `tsconfig.node.json`, `electron.vite.config.ts`.
- `DocumentKind` enum được khai báo **một chỗ duy nhất** ở `shared/schema/document-kind.ts`; mọi switch/branch khác dẫn xuất từ đây (compile-error nếu thêm kind mà quên handle).

### 2.4 Acceptance
- `import { getDocumentLogic } from '@core/documents'` chạy được ở renderer (cho preview) và main (cho render DOCX).
- `getDocumentLogic('contract-fullright').buildReplacements(form, preview)` ra output **byte-by-byte giống hành vi hiện tại** (golden test, §6).
- `getDocumentLogic('annex-newstore')` không throw, trả stub object hợp lệ.
- `npm test -- core` xanh (xem §6).

---

## 3. Phase 2 — Infrastructure (Side-effect Adapters)

### 3.1 Scope
Tách toàn bộ I/O và Electron API ra khỏi `main/index.ts` thành các service có interface. Main process chỉ còn là composition root.

### 3.2 Việc cần làm
1. **paths.ts**: Single source cho APP_DATA, DRAFTS_DIR, TEMP_DIR (main/index.ts:11-14).
2. **SettingsRepository**:
   ```ts
   export interface SettingsRepository {
     load(): Promise<AppSettings>;
     save(settings: AppSettings): Promise<void>;
   }
   ```
   Impl `JsonSettingsRepository` đọc/ghi `settings.json`, **validate qua `SettingsSchema` ở mọi load**, fallback default nếu parse fail. Thay code main/index.ts:10-57.
3. **DraftRepository**:
   ```ts
   export interface DraftRepository {
     list(): Promise<DraftSummary[]>;
     load(id: string): Promise<Draft | null>;
     save(draft: Draft): Promise<void>;
     delete(id: string): Promise<void>;
   }
   ```
   Impl `JsonDraftRepository` (main/index.ts:63-102). Validate Draft qua `DraftSchema` khi load và save.
4. **TemplateLoader** (có cache RAM):
   ```ts
   export interface TemplateLoader {
     listManifest(): Promise<TemplateManifestEntry[]>;     // có field { kind, id, title, path }
     loadBinary(kind: DocumentKind): Promise<Uint8Array>;  // cached
     invalidate(kind?: DocumentKind): void;
   }
   ```
   Impl `CachingFsTemplateLoader` (port từ main/index.ts:104-124). Cache theo `Map<DocumentKind, Uint8Array>`. Lazy-load: lần đầu đọc từ disk, lần sau trả từ cache.
   - **Cache key**: `kind` (không phải file path, để renderer không bao giờ thấy path).
   - **Invalidation**: API `invalidate()` công khai cho dev/test; production chỉ invalidate khi app khởi động lại.
   - **Layout disk**: `templates/<kind>/<kind>.template.docx` + `templates/<kind>/manifest.json`. Đọc folder để build manifest list.
5. **Exporter interface** (mở cửa cho Xlsx/Pdf):
   ```ts
   export interface Exporter<TInput, TOutput = Uint8Array> {
     readonly id: string;            // 'docx' | 'xlsx' | 'pdf'
     readonly fileExtension: string; // '.docx'
     export(input: TInput): Promise<TOutput>;
   }
   ```
   - `DocxExporter implements Exporter<DocxRenderInput, Uint8Array>`. Gói `JSZip` + xml-utils + content-types vào đây (main/index.ts:126-192).
   - `DocxRenderInput = { templateBinary: Uint8Array; clickReplacements: Record<string,string>; specialTextReplacements: Record<string,string> }`.
   - **Document-kind-agnostic**: Exporter không biết về `DocumentKind`. Caller (render handler) chịu trách nhiệm: lấy template binary theo kind từ `TemplateLoader`, gọi `getDocumentLogic(kind).buildReplacements(...)`, rồi đưa cho Exporter. Logic này tập trung ở 1 hàm `renderDocument(kind, form)` trong `main/ipc/handlers/render-handlers.ts`.
   - `xlsx/`, `pdf/` chỉ có README giải thích cách thêm exporter mới (chưa code).
6. **ShellService** + **DialogService**: bọc `shell.openPath`, `shell.showItemInFolder`, `dialog.showSaveDialog` (main/index.ts:208-220).
7. **Composition root** `main/container.ts`:
   ```ts
   export function buildContainer() {
     const paths = createPaths(app);
     const settingsRepo = new JsonSettingsRepository(paths);
     const draftRepo = new JsonDraftRepository(paths);
     const templateLoader = new FsTemplateLoader(paths);
     const exporters = new Map<string, Exporter<any>>([
       ['docx', new DocxExporter()],
     ]);
     const shellService = new ElectronShellService();
     const dialogService = new ElectronDialogService();
     return { settingsRepo, draftRepo, templateLoader, exporters, shellService, dialogService };
   }
   ```

### 3.3 Yêu cầu kỹ thuật
- Mọi service trả `Promise`, không phương thức sync. (Hiện tại `readFileSync` đang chạy đồng bộ trong handler IPC → block main thread; chuyển sang `fs/promises`.)
- Mọi service **validate input và output** qua zod tại biên (load file → parse, save → parse trước ghi).
- Service không `console.log`; nhận `logger` qua constructor (interface tối thiểu `{ info, warn, error }`). Impl mặc định dùng `console`.
- Path alias `@infra/*` thêm vào `tsconfig.node.json` và `electron.vite.config.ts`. **Không** thêm vào `tsconfig.web.json` để chặn renderer import.

### 3.4 Acceptance
- `main/index.ts` < 80 dòng (chỉ còn: `app.whenReady`, tạo BrowserWindow, gọi `buildContainer`, gọi `registerIpcHandlers`, lifecycle).
- Không còn `readFileSync`/`writeFileSync` trong `main/index.ts`.
- Mỗi service có ít nhất 1 unit test với fs giả lập (xem §6.2).

---

## 4. Phase 3 — IPC Contract (Connector kỷ luật giữa Main & Renderer)

### 4.1 Vấn đề hiện tại
- 11 channel ở `main/index.ts:194-226`, payload `unknown` ở preload (`preload/index.ts`).
- Constants ở `shared/ipc.ts` chưa được dùng nhất quán.
- Không validate ở main → renderer có thể gửi rác và làm crash file JSON.

### 4.2 Việc cần làm
1. `src/shared/ipc/channels.ts`:
   ```ts
   export const IPC = {
     settings: { get: 'settings:get', save: 'settings:save' },
     draft:    { list: 'draft:list', load: 'draft:load', save: 'draft:save', delete: 'draft:delete' },
     template: { list: 'template:list' },
     render:   { docx: 'render:docx', saveAs: 'render:saveAs' },
     os:       { openFile: 'os:openFile', showInFinder: 'os:showInFinder' },
   } as const;
   ```
2. `src/shared/ipc/contracts.ts`: với mỗi channel, định nghĩa **1 cặp** `RequestSchema` + `ResponseSchema` bằng zod. Đặc biệt cho draft + render: payload **discriminate theo `kind`** để type-safe end-to-end.
   ```ts
   export const RenderDocxRequest = z.discriminatedUnion('kind', [
     z.object({ kind: z.literal('contract-fullright'), draftId: z.string(), data: ContractFullrightSchema }),
     z.object({ kind: z.literal('annex-newstore'),     draftId: z.string(), data: AnnexNewstoreSchema }),
   ]);
   export const RenderDocxResponse = z.object({ tempPath: z.string() });

   export const DraftSaveRequest = z.discriminatedUnion('kind', [
     z.object({ kind: z.literal('contract-fullright'), id: z.string(), title: z.string(), data: ContractFullrightSchema }),
     z.object({ kind: z.literal('annex-newstore'),     id: z.string(), title: z.string(), data: AnnexNewstoreSchema }),
   ]);
   ```
   Ghi chú: response của `template:list` trả `Array<{ kind: DocumentKind, id, title }>` để renderer biết có những kind nào khả dụng.
3. `src/main/ipc/validate.ts`: helper `parseRequest(schema, payload)` ném `IpcValidationError` có channel name, để debug dễ.
4. `src/main/ipc/handlers/*.ts`: mỗi handler nhận deps qua DI:
   ```ts
   export function registerDraftHandlers({ ipcMain, draftRepo }: Deps) {
     ipcMain.handle(IPC.draft.save, async (_e, payload) => {
       const draft = parseRequest(DraftSaveRequest, payload);
       await draftRepo.save(draft);
       return DraftSaveResponse.parse({ ok: true });
     });
     // ...
   }
   ```
5. `src/preload/api.ts`: typed surface, không dùng `any`/`unknown` ở interface công khai:
   ```ts
   export interface XmsApi {
     settings: {
       get(): Promise<AppSettings>;
       save(settings: AppSettings): Promise<void>;
     };
     draft: {
       list(): Promise<DraftSummary[]>;
       load(id: string): Promise<Draft | null>;
       save(draft: Draft): Promise<void>;
       delete(id: string): Promise<void>;
     };
     template: { list(): Promise<TemplateManifestEntry[]> };
     render: {
       docx(req: RenderDocxRequestT): Promise<RenderDocxResponseT>;
       saveAs(tempPath: string, suggestedName: string): Promise<{ finalPath: string } | { cancelled: true }>;
     };
     os: { openFile(path: string): Promise<void>; showInFinder(path: string): Promise<void> };
   }
   ```
   `RenderDocxRequestT = z.infer<typeof RenderDocxRequest>` — types từ schema, một nguồn sự thật.
6. `src/preload/index.ts`: `contextBridge.exposeInMainWorld('xms', api)` với `api: XmsApi` đã typed.
7. `src/preload/index.d.ts`: `declare global { interface Window { xms: XmsApi } }`.

### 4.3 Yêu cầu kỹ thuật
- **Không** expose `ipcRenderer` raw cho renderer.
- **Không** truyền Buffer/`Uint8Array` qua IPC. Dùng pattern hiện có: main ghi file tạm, trả `tempPath`, renderer gọi `saveAs` để rename. Lý do: structured-clone Buffer tốn RAM và không rõ ràng.
- Mỗi response phải parse bằng `ResponseSchema.parse(...)` trước khi return — bắt sớm khi handler return sai shape.
- Channel name **chỉ** lấy từ `IPC` constants. ESLint custom rule (hoặc test) cấm chuỗi raw bắt đầu bằng `'settings:'`, `'draft:'`, ... trong main/preload.

### 4.4 Acceptance
- `src/preload/index.ts` < 50 dòng, không có `unknown` trong public type.
- Gửi payload sai shape từ DevTools console → main trả error có channel name + zod issue, không crash app.

---

## 5. Phase 4 — Renderer (UI) + Zustand stores

### 5.1 Scope
- Xoá form state lộn trong `FormView.tsx` (375 dòng).
- Chuyển toàn bộ data flow sang zustand slices.
- Component chỉ select state + dispatch action.

### 5.2 Việc cần làm
1. **Stores**:
   - `draft-store.ts`: state = `{ kind: DocumentKind | null, id, formData, isDirty, lastSavedAt }`. Actions: `hydrateFrom(draft)` (set cả `kind` và `formData`), `setField(path, value)`, `markSaved`, `reset`. Các action chuyên biệt theo kind (vd. `addStore` của contract-fullright) sống trong **slice riêng theo kind** (`draft-store/contract-fullright-actions.ts`, `draft-store/annex-newstore-actions.ts`) — store gốc gọi xuống slice qua dispatcher dựa theo `kind`.
   - `library-store.ts`: state = `{ templates: TemplateManifestEntry[], drafts: DraftSummary[], isLoading }`. Actions: `refreshTemplates`, `refreshDrafts`, `deleteDraft(id)`. `templates` đã có field `kind`.
   - `settings-store.ts`: state = `{ settings, isDirty }`. Actions: `load`, `update(patch)`, `save`.
2. **Services adapter** (`renderer/src/services/*.ts`): bọc `window.xms.*`. Component **không** gọi `window.xms` trực tiếp. Lý do: dễ mock trong storybook/test, dễ thêm cross-cutting (loading state, error toast).
3. **Hooks**:
   - `use-autosave.ts`: nhận `(isDirty, onSave, debounceMs)`. Trích từ FormView.tsx:142-164.
   - `use-debounced.ts`: utility chung.
4. **PreviewPane**: thay `import from '@shared/contract-render'` → `import { getDocumentLogic } from '@core/documents'`. Component đọc `kind` + `formData` từ `draft-store`, gọi `getDocumentLogic(kind).buildPreviewModel(formData)`. Hiển thị tuỳ kind (component con riêng cho contract-fullright vs annex-newstore).
5. **FormView**: trở thành **router theo `kind`** — render `<ContractFullrightForm/>` hoặc `<AnnexNewstoreForm/>` từ `views/forms/<kind>/`. Mỗi form view chỉ lo UI cho kind của mình, không có `useEffect` autosave (đã hoist lên `App.tsx` qua `use-autosave` hook chạy chung). Mục tiêu mỗi form view < 180 dòng.
   - Cấu trúc: `renderer/src/views/forms/contract-fullright/index.tsx`, `renderer/src/views/forms/annex-newstore/index.tsx`.
6. **LibraryView**: dùng `library-store`. Loại `useState` cho `templates`, `drafts`. Hiển thị draft kèm badge `kind` để user phân biệt.
7. **SettingsModal**: dùng `settings-store`. Loại bỏ form state cục bộ; thay bằng `update(patch)` rồi `save()`.
8. **New-document flow**: thêm action `library-store.createDraft(kind)` — tạo draft mới với `kind` đã chọn; UI mở picker chọn kind trước khi vào FormView.

### 5.3 Yêu cầu kỹ thuật
- Mỗi store ≤ 150 dòng. Nếu cần derived state, dùng selector function thuần (export riêng), không dùng middleware phức tạp.
- Mỗi action **đồng bộ** trừ khi thực sự gọi service async — async action phải `try/catch` và push error vào `useToastStore` (tạo store mới đơn giản nếu chưa có).
- Component chỉ được phép select **bằng selector hẹp** (`useDraftStore(s => s.formData.client.name)`). Cấm `useDraftStore(s => s)` để tránh re-render không cần thiết — enforce bằng code review checklist (không tự động).
- Form input controlled qua `setField('client.name', value)` với path-based setter (immer hoặc lodash.set). Path string định nghĩa qua type-safe key của `ContractFullrightSchema`.

### 5.4 Acceptance
- `FormView.tsx` < 180 dòng, không còn `useEffect` cho autosave (đã chuyển sang hook).
- `grep -r "window.xms" src/renderer/src/components src/renderer/src/views` → 0 kết quả (chỉ `services/*` dùng `window.xms`).
- App khởi động, hydrate draft, autosave 800ms sau khi gõ — như hiện tại.

---

## 6. Phase 5 — Testing (Vitest cho Core/Domain)

### 6.1 Setup
- Thêm dev deps: `vitest`, `@vitest/ui` (optional), `happy-dom` (chỉ cần nếu test renderer; phase này chỉ test core/infra).
- Thêm script: `"test": "vitest run"`, `"test:watch": "vitest"`.
- `vitest.config.ts`:
  - `environment: 'node'` (default, vì test core + infra).
  - `include: ['src/**/*.{test,spec}.ts']`.
  - `coverage.include: ['src/core/**', 'src/infrastructure/**']`.
  - Alias `@core`, `@shared`, `@infra` đồng bộ với electron.vite.config.ts.

### 6.2 Test bắt buộc
**Core** (priority 1, blocker cho merge):
- `core/pricing/format-money.test.ts`: 5+ case (số nguyên, có lẻ, 0, âm, lớn).
- `core/pricing/number-to-vietnamese.test.ts`: 8+ case (đơn vị, hàng nghìn, triệu, tỷ, số 0, làm tròn).
- `core/pricing/calculate-fees.test.ts`: 6+ case (1 store, nhiều store, VAT 0/10%, thời hạn lệch).
- `core/documents/contract-fullright/build-preview-model.test.ts`: golden test — input fixture JSON, so sánh với output JSON đã commit.
- `core/documents/contract-fullright/build-replacements.test.ts`: golden test — đảm bảo mọi placeholder của template được fill (so sánh keys).
- `core/documents/contract-fullright/derive-draft-title.test.ts`: 4+ case (đủ field, thiếu field, fallback).
- `core/documents/annex-newstore/*.test.ts`: smoke test (logic chưa hoàn thiện đến khi có spec) — chỉ verify `getDocumentLogic('annex-newstore')` không throw, return shape đúng. **Khi nhận `annex-newstore.md`** từ user thì bổ sung golden test giống contract-fullright.
- `core/documents/registry.test.ts`: với mỗi `kind` trong enum, đảm bảo `getDocumentLogic(kind)` trả về object có đầy đủ method theo `DocumentLogic` interface (chống quên đăng ký).
- `core/date/format-date.test.ts`: 3+ case (ISO string, Date, invalid).

**Infrastructure** (priority 2):
- `infrastructure/storage/settings-repository.test.ts`: dùng `memfs` hoặc `tmp` directory. Test: load mặc định khi file không tồn tại, load + parse hợp lệ, fallback default khi corrupt JSON, save round-trip.
- `infrastructure/storage/draft-repository.test.ts`: tương tự + list/delete + draft `kind` nào không nằm trong enum thì reject.
- `infrastructure/templates/template-loader.test.ts`: lần 1 đọc disk, lần 2 trả từ cache (spy fs.readFile), `invalidate(kind)` xoá đúng key.
- `infrastructure/exporters/docx/docx-exporter.test.ts`: dùng template fixture nhỏ trong `tests/fixtures/`, kiểm tra: output là file ZIP hợp lệ, chứa `word/document.xml`, đã thay placeholder.

### 6.3 Yêu cầu kỹ thuật
- Test Core **không** mock gì — pure functions thuần.
- Test Infra dùng `os.tmpdir()` thật (`mkdtemp`/`rm -rf` trong setup/teardown), không mock `fs`. Lý do: tránh sai khác giữa mock và thực tế trên Windows/macOS.
- Coverage tối thiểu cho `src/core/**`: 90% statements. (Không ép coverage cho infra.)
- Mọi test phải chạy < 5s tổng cộng.

### 6.4 Acceptance
- `npm test` xanh.
- Golden fixtures `tests/fixtures/contract-fullright.input.json` + `.expected.json` được commit.

---

## 7. Phase 6 — Lint, Typecheck, Build hardening

### 7.1 ESLint `no-restricted-paths`
Thêm rule trong `eslint.config.mjs`:
```js
{
  files: ['src/core/**/*.ts'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        'electron', 'react', 'react-dom',
        'node:*', 'fs', 'fs/promises', 'path', 'os',
        'jszip', 'easy-template-x', 'mammoth',
        '@renderer/*', '@main/*', '@infra/*',
      ],
    }],
  },
},
{
  files: ['src/renderer/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: ['electron', 'node:*', 'fs', 'fs/promises', 'path', 'os', '@main/*', '@infra/*'],
    }],
  },
},
{
  files: ['src/infrastructure/**/*.ts'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: ['react', 'react-dom', '@renderer/*'],
    }],
  },
},
```

### 7.2 TSConfig
- `tsconfig.web.json`: `paths` chỉ có `@core/*`, `@shared/*`, `@renderer/*`. **Không** có `@main/*`, `@infra/*`.
- `tsconfig.node.json`: `paths` có `@core/*`, `@shared/*`, `@infra/*`, `@main/*`. **Không** có `@renderer/*`.
- Bật `"noUncheckedIndexedAccess": true` ở cả hai.

### 7.3 electron.vite.config.ts
- Đảm bảo alias đồng bộ với tsconfig + vitest.
- `build.rollupOptions.external` chặn import nhầm phía renderer (như `easy-template-x`, `jszip`).

### 7.4 Acceptance
- `npm run lint` chạy xanh; thử thêm `import 'fs'` vào file core → lint báo lỗi.
- `npm run typecheck` xanh trên cả 2 config.

---

## 8. Phase 7 — Migration order (thứ tự thực thi cụ thể)

> Tuân theo thứ tự để tránh vỡ build giữa chừng. Mỗi step kết thúc với app build + chạy được.

1. **Setup hạ tầng** — thêm vitest, alias `@core`/`@infra`, ESLint rule trống (chưa enforce). Commit: `chore: add vitest and path aliases`.
2. **Schema canonicalization** — định nghĩa `DocumentKind` enum, sửa `ContractFullrightSchema` cho khớp data path thật của form (hiện sai, ví dụ `pricing.compositionCopyright` vs `pricing.composition`), tạo `AnnexNewstoreSchema` (stub đến khi có spec), `Draft` thành discriminated union theo `kind`. Validate trên fixture golden. Commit: `feat(schema): introduce DocumentKind and align schemas`.
3. **Core extraction (contract-fullright)** — tạo `src/core/{pricing,date,documents}/`, port code từ `shared/contract-render.ts` vào `core/documents/contract-fullright/`. Tạm thời `shared/contract-render.ts` re-export shim. Viết test §6.2 Core (contract-fullright). Commit: `refactor(core): extract pricing, date, contract-fullright logic`.
4. **Document registry + annex stub** — thêm `core/documents/document-logic.ts`, `registry.ts`, `core/documents/annex-newstore/` (stub). Test registry. Commit: `feat(core): document registry and annex-newstore stub`.
5. **Infrastructure extraction** — tạo `src/infrastructure/`, viết Settings/Draft/TemplateLoader (cache)/DocxExporter, container. Reorganize folder `templates/` thành `templates/<kind>/`. Main vẫn import như cũ qua adapter shim. Test §6.2 Infra. Commit: `refactor(infra): repositories, caching template loader, exporter`.
6. **IPC contracts** — tạo `shared/ipc/channels.ts` + `contracts.ts` (discriminated union theo `kind`). Refactor handlers vào `main/ipc/handlers/*`. Cập nhật preload. Commit: `refactor(ipc): typed contracts with DocumentKind discriminator`.
7. **Renderer stores** — tạo zustand stores + services. Refactor `FormView` thành router theo `kind`, tách `views/forms/contract-fullright/`, `views/forms/annex-newstore/`. `LibraryView`, `SettingsModal`, `PreviewPane` chuyển store. Commit: `refactor(renderer): zustand stores and per-kind form views`.
8. **Cleanup** — xoá `shared/contract-render.ts` (re-export shim), xoá code chết trong `main/index.ts`, xoá field unused trong types. Commit: `chore: remove legacy compatibility shims`.
9. **Lint hardening** — bật `no-restricted-imports`, `noUncheckedIndexedAccess`. Sửa các vi phạm phát sinh. Commit: `chore(lint): enforce layer boundaries`.
10. **Manual smoke test** — `npm run dev`, chạy end-to-end: mở app → tạo draft contract-fullright → fill form → preview → render docx → save as → mở folder; tạo draft annex-newstore (stub) → verify list xuất hiện đúng badge kind. Ghi notes vào PR.
11. **Codify ARCHITECTURE.md** — xem §9.

> **Lưu ý**: Khi nhận file `annex-newstore.md` từ user (xem §12), hoàn thiện schema + logic cho annex sẽ là 1 PR riêng, **không** thuộc phạm vi PR refactor này. Refactor này chỉ đảm bảo "khung" sẵn sàng nhận annex.

### 8.1 Yêu cầu kỹ thuật cho từng commit
- Mỗi commit step 2-8 phải để app vẫn `npm run dev` + `npm run build` thành công.
- Không có commit nào skip `--no-verify`.
- PR cuối cùng (merge về `main`) cần: typecheck xanh, lint xanh, vitest xanh, smoke test pass thủ công.

---

## 9. Phase 8 — Codify vào `ARCHITECTURE.md` (step cuối)

### 9.1 Mục đích
File `ARCHITECTURE.md` ở repo root là **nguồn sự thật** cho cấu trúc và quy tắc phát triển. Mọi PR thêm feature mới phải tự kiểm tra theo file này.

### 9.2 Nội dung bắt buộc của ARCHITECTURE.md
1. **Triết lý 3 lớp** — định nghĩa Core / Infrastructure / Presentation, kèm 1-2 dòng cho mỗi layer.
2. **Sơ đồ data flow** — text-based diagram (ASCII hoặc Mermaid):
   ```
   User input → Renderer (zustand) → window.xms (preload)
              → IPC channel (zod-validated) → Main handler
              → Infrastructure service → Core function
              → return → IPC response (zod-validated) → Renderer
   ```
3. **Quy tắc import** (copy từ §1 và §7.1).
4. **Cách thêm IPC channel mới** — checklist 6 bước:
   1) thêm name vào `shared/ipc/channels.ts`;
   2) thêm Request+Response schema vào `shared/ipc/contracts.ts`;
   3) viết handler trong `main/ipc/handlers/*`;
   4) thêm method vào `XmsApi` ở `preload/api.ts`;
   5) thêm service adapter ở `renderer/src/services/*`;
   6) thêm action vào store nếu cần.
5. **Cách thêm Exporter mới (Xlsx, Pdf)** — 4 bước:
   1) tạo `infrastructure/exporters/<format>/<format>-exporter.ts` implements `Exporter<...>`;
   2) đăng ký vào container;
   3) thêm channel `render:<format>` nếu UI cần phân biệt;
   4) thêm test với fixture nhỏ.
6. **Cách thêm Document Kind mới** (ví dụ thêm `addendum-pricing-update`) — 8 bước:
   1) thêm literal vào `shared/schema/document-kind.ts` enum;
   2) tạo schema `shared/schema/<kind>.ts` (zod) + cập nhật `Draft` discriminated union;
   3) tạo `core/documents/<kind>/` đầy đủ 4 file (`normalize-form-data`, `derive-draft-title`, `build-preview-model`, `build-replacements`) + `index.ts` export `DocumentLogic`;
   4) đăng ký vào `core/documents/registry.ts` (compile sẽ báo lỗi nếu quên);
   5) thêm `templates/<kind>/<kind>.template.docx` + `manifest.json`;
   6) thêm IPC discriminant case vào `RenderDocxRequest` và `DraftSaveRequest` ở `shared/ipc/contracts.ts`;
   7) tạo `renderer/src/views/forms/<kind>/index.tsx` + cập nhật router trong `FormView.tsx`;
   8) thêm fixture + test golden trong `tests/fixtures/<kind>/`.
7. **Cách thêm field mới vào 1 document kind** — 5 bước:
   1) thêm field vào `shared/schema/<kind>.ts`;
   2) cập nhật fixture + golden output ở tests;
   3) cập nhật `build-preview-model` + `build-replacements` của kind đó;
   4) cập nhật form view của kind đó;
   5) cập nhật template DOCX nếu cần placeholder mới.
7. **Anti-patterns đã loại bỏ** — bullet list (FormView monolith, IPC `unknown` payload, …) để đời sau không tái phạm.
8. **Test policy** — Core 90% coverage, Infra có smoke test, UI test thủ công cho đến khi có Playwright/Spectron.
9. **Lệnh hay dùng** — `npm run dev`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build:mac`.
10. **Vị trí chấp nhận “code lệch chuẩn”** — section ngắn ghi chú nếu có chỗ phải vi phạm tạm thời (ví dụ: 1 file legacy chưa migrate).

### 9.3 Yêu cầu kỹ thuật
- Độ dài ARCHITECTURE.md mục tiêu: 200-400 dòng. Không nhồi nhét lý thuyết, ưu tiên ví dụ code ngắn + checklist.
- Phải có ngày cập nhật ở đầu file.
- Mỗi rule phải có “lý do” 1 câu — để người đọc sau không xoá rule mà không hiểu.

### 9.4 Acceptance
- File tồn tại ở `/ARCHITECTURE.md`.
- Trỏ thử bất kỳ file nào trong `src/` → tìm được trong ARCHITECTURE.md mô tả layer + rule import.
- Commit cuối: `docs: codify modular architecture in ARCHITECTURE.md`.

---

## 10. Risks & Mitigations

| Rủi ro | Tác động | Mitigation |
|---|---|---|
| Big-bang refactor làm vỡ flow render DOCX | App không export được hợp đồng | Smoke test thủ công sau mỗi step §8; giữ golden test cho `build-replacements` |
| `DocumentKind` rò rỉ thành `if/else` rải rác (coupling muộn) | Thêm kind sau này phải sửa nhiều chỗ | Áp dụng pattern `DOCUMENT_REGISTRY` từ phase 1 (§2.2 step 5) + ESLint rule cấm `=== 'contract-fullright'` ngoài file `registry.ts` (custom rule hoặc grep test) |
| Annex chưa có spec → schema/logic là stub, dễ quên hoàn thiện | Annex không xuất được DOCX | Phase này tạo CI check: golden test annex skipped khi `tests/fixtures/annex-newstore/` chưa tồn tại, log warning rõ ràng. Theo dõi qua issue/TODO trong ARCHITECTURE.md |
| Cache template binary giữ binary cũ sau khi user thay file `.docx` | Render ra hợp đồng phiên bản cũ mà không hay | Document trong ARCHITECTURE.md: thay template → restart app. Trong dev, expose `templateLoader.invalidate()` qua DevTools (gắn `window.__xmsDev` chỉ ở dev build) |
| Zustand store tổ chức sai → re-render thừa | UI chậm | Quy tắc selector hẹp (§5.3) + dev tip trong ARCHITECTURE.md |
| Thiếu test cho IPC layer | Bug rò rỉ giữa main/renderer | Phase này chấp nhận, nhưng ARCHITECTURE.md note rõ là “to-do: contract test cho preload” |
| `noUncheckedIndexedAccess` bật muộn → nhiều file đỏ | Tốn thời gian sửa cuối phase | Bật từ step §8.1 (setup) ở mức warning, chuyển error ở step §8.9 |

---

## 11. Out of scope (phase này)

- Database (sqlite/lowdb) — chừa cửa qua `Repository` interface, không implement.
- Excel reader/writer thực tế — chỉ folder placeholder + README.
- PDF exporter thực tế — chỉ folder placeholder + README.
- Playwright/Spectron e2e — note vào ARCHITECTURE.md là to-do.
- Đa ngôn ngữ / i18n.
- Auto-update / code signing.
- Telemetry / crash reporting.

---

## 12. Câu hỏi mở — trạng thái

| # | Câu hỏi | Trả lời | Tác động vào plan |
|---|---|---|---|
| 1 | Có draft cũ cần migrate khi sửa schema? | **Không** | Bỏ migration logic trong `JsonDraftRepository.load`. Schema mới có thể reject draft cũ; đó là chấp nhận được. |
| 2 | Có thêm loại tài liệu nào ngoài `contract-fullright`? | **Có — `annex-newstore`** (Annex điều khoản mở mới cửa hàng) | Plan đã refactor sang multi-document-kind: `DocumentKind` enum, `DocumentRegistry`, `core/documents/<kind>/`, IPC discriminated union, FormView router theo kind. |
| 3 | Cache template binary trong RAM? | **Có** | `CachingFsTemplateLoader` với `Map<DocumentKind, Uint8Array>` + `invalidate()` API. |

### 12.1 Còn cần từ user

- **File `annex-newstore.md`** (hoặc danh sách field cụ thể của annex): hiện chưa có trong working tree / git history.
  - **Khi nào cần**: trước khi viết PR riêng hoàn thiện schema + logic annex. **Không** block PR refactor này — refactor chỉ tạo khung + stub annex.
  - **Khi nhận được**: bổ sung field vào `shared/schema/annex-newstore.ts`, cài đặt thật cho `core/documents/annex-newstore/*`, viết golden test, đặt template `.docx` vào `templates/annex-newstore/`.
