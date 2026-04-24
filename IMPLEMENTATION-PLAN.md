# XMS Contract v1.0.0 — Implementation Plan

**Document type.** Product Owner spec + Backend architecture + UX component inventory.
**Target delivery.** 3 weeks (15 working days) solo by an execution agent with light review gates.
**Base stack.** Electron + React 18 + TypeScript + Vite + Zustand + easy-template-x + mammoth.js.
**Template scope.** Single template (`contract-fullright`), architected so template 2..N plug in without touching app shell.

---

## 0. Executive Summary

XMS Contract is a macOS desktop utility that turns a fixed Word template (`contract-fullright.dotx`) into a filled `.docx` via a split-pane form/preview interface. It shares design DNA with `xms-calc` (Space Grotesk, dark purple-shifted Ableton palette, three-accent system) and extends it with Ableton-native patterns not yet used in `xms-calc`: Device Racks for form sections, Clip Slot Grid for table editing, Browser-style template library.

Core flow: pick template in Library view, fill fields in collapsible-rack form (left), watch live HTML preview update (right), export .docx. Draft state persists per template-session in app data dir. Excel paste populates Appendix 1 store list. Party A data (NCT identity, banking, POA) lives in app-level Settings, never in per-contract forms.

Three locked-in architectural decisions:
1. **Template is pre-processed at build time** into a Jinja-syntax `.template.docx`. No runtime .dotx mutation.
2. **Preview is a mammoth-generated HTML skeleton** with token markers, DOM-patched live on form change with a 250ms debounce. 80% fidelity accepted.
3. **No Python sidecar.** easy-template-x runs inside Electron main process. Bundle stays ~150MB after electron-builder compresses.

Confidence on overall plan: **Highly Confident**. Main risks are mammoth fidelity on complex tables (mitigated by one-time HTML inspection pass) and first-time notarization friction (mitigated by right-click-open + signed releases deferred to v1.1).

---

## 1. Product Scope

### 1.1 v1.0.0 Deliverables (In Scope)

1. **Template library view.** Landing page with card grid listing available templates. MVP ships one card: Contract Fullright. Architecture supports adding cards without shell changes.
2. **Form pane.** Collapsible Device Racks grouping fields by logical section. Ableton-authentic visual language (flat rectangles, 2 to 3px radius, no drop shadows, uppercase 10px labels, expand triangle).
3. **Preview pane.** Live-updating HTML rendering of the contract. Shares scroll with form via optional sync toggle.
4. **Table editor** for Appendix 1 (store list) and Appendix 2 (fee table). Add/remove/reorder rows. Inline validation.
5. **Excel/Sheets paste** into table editor. Auto-detects tab-separated clipboard and maps to table rows. Preview-then-commit dialog.
6. **Draft autosave + resume.** Per-contract-session JSON in app data dir. Library view shows "Recent drafts" section with contract number + Party B name + timestamp.
7. **Export pipeline.** Generate .docx via easy-template-x, show Save dialog, optionally open in Word/Pages after save.
8. **App-level Settings** for Party A (NCT) identity, banking, POA. Populated once, referenced by every contract.
9. **Macro auto-fill.** Party B name/tax code typed in Rack 3 auto-fills Appendix 1 and Appendix 2 metadata headers. Contract number typed once appears in every required location.
10. **Amount-in-words (VNĐ).** Computed from Appendix 2 total via `vn-num2words` or equivalent.

### 1.2 Explicitly Non-Goals for v1.0.0

- Multiple templates live in the library (architecture supports it; only one ships).
- PDF export.
- Cloud sync or multi-device.
- User accounts or auth.
- In-app template editor or schema editor.
- Auto-update via electron-updater. Manual DMG releases only.
- Code signing and notarization. Ship unsigned DMG; user right-click-opens first time.
- Windows/Linux build. macOS only.
- Template versioning UI.

### 1.3 Acceptance Criteria (v1.0.0 Exit)

A contract filled through the form and exported must match the visual output of manually filling `contract-fullright.dotx` in Word to a degree that a non-technical NCT reviewer cannot tell which was machine-generated, on:
- All 5 pricing line items with correct VN/EN labels.
- Appendix 1 with at least 10 stores populated.
- Appendix 2 with correct computed totals and Vietnamese amount-in-words.
- Signature block with correct representative names.
- Bilingual VN/EN formatting preserved throughout.

Secondary: cold-start to ready-to-type under 2.5 seconds on a 2020+ MacBook Air. Form-to-preview perceived lag under 400ms.

---

## 2. Ableton Design Language Adaptation

### 2.1 Inherited from xms-calc (Locked, No Debate)

| Token | Value | Notes |
|---|---|---|
| `--bg-root` | `#1e1e22` | Main canvas |
| `--bg-surface` | `#1a1a1e` | Rack body, preview shell |
| `--bg-elevated` | `#28282e` | Expanded rack inner, modal bodies |
| `--text-primary` | `#e8e8ec` | Field values, labels |
| `--text-secondary` | `#8a8a8a` | Placeholders, secondary metadata |
| `--pear` | `#CFF533` | Primary focus, active state, commit |
| `--picton` | `#44CCFF` | Counter inputs, bulk actions, table tools |
| `--daw-orange` | `#FF8B00` | Transport-analog (save, export), destructive-warn |
| `--daw-yellow` | `#FFD300` | Warnings, draft-dirty indicator |
| Font | `Space Grotesk` with `system-ui` fallback | Self-hosted copy same as xms-calc |
| Focus system | Pear glass-focus (`box-shadow: 0 0 0 2px var(--pear-dim)`) | Documented xms-calc extension |
| Radius cap | 3px for rectangular controls | Pill 999px allowed only for chip/badge |
| Flatness | No elevation shadows on floating panels (per DESIGN-AUDIT Tier 1 rec #2) | Use 1px borders instead |

### 2.2 New Ableton Patterns (Not in xms-calc, Introduced Here)

These are the additions that make XMS Contract feel like a different instrument in the same rack.

**A. Device Rack (form sections).** Ableton's device rack is a horizontal strip with a title bar, collapse triangle, activator LED, and numbered macros. Port to form: each rack section (Party B, Bank, Term, etc.) renders as a vertical stack with a 24px header bar containing the triangle collapse, section name in uppercase 11px, optional "completeness" LED (pear when all required fields filled, dim gray otherwise). Right side of header shows "n/m fields" counter in 9px.

**B. Clip Slot Grid (table cells).** Ableton Session View cells are 1px-bordered rectangles with uniform row height. Port to Appendix tables: each cell is 28px tall, 1px border, inner 4px padding. Empty cell shows a faint dot centroid (8px circle, `--text-secondary`, 20% opacity). Focused cell gets pear 1px ring on all sides (no glow, since preview pane is already text-heavy).

**C. Clip Launch Button (row action).** Small triangle icon left of each row for drag-reorder. Uses Ableton's convention: arrow points down when collapsed, right when active. Port to table: drag handle on left of each row, 12x12px outlined triangle that rotates on drag-start.

**D. Browser (template library).** Ableton Browser is a left-docked panel with category chips at top, searchable list below, icon-and-name row for each item. Port to library view: full-screen Browser-analog grid. Each template card is 240x160px, has a thumbnail strip at top (rendered mini-preview of the template), title + subtitle, "Last used" metadata, "New" button bottom-right.

**E. Macro Label Convention.** Ableton macro labels are uppercase, 10px, tracked +0.04em, color `--text-secondary`. All field labels in XMS Contract use this exact treatment. Below the label, the input is 32px tall, `--bg-elevated` background, 1px `--bg-root` border (darker than parent), 13px Space Grotesk for value text.

**F. Transport Bar (action footer).** Ableton's top transport strip is black (`#000` analog, we use `--bg-root`) with rectangular controls. Port to bottom statusbar: 36px tall, contains (left) draft status dot + filename, (center) contract completeness percentage + missing-fields count, (right) Export and Open-in-Word buttons. Export button uses `--daw-orange` fill when completeness is 100%, dim gray otherwise.

**G. Chain Selector (preview pagination).** Ableton rack chains are horizontal tabs at top of a rack. Port: the preview pane has a thin tab strip showing "Main Contract / Appendix 1 / Appendix 2" letting the user jump sections of the preview.

**H. Key Dispatch Pattern (Excel paste).** Ableton uses a pale cyan highlight when MIDI input is detected. Port: when clipboard contains tab-separated data and user focuses the store list table, picton-dim border flashes on the table once to signal "paste available", and a "Paste n rows from clipboard" pill appears in the table toolbar.

### 2.3 Screen Layout

```
+------------------------------------------------------------------+
| [XMS] Contract Fullright > Draft: HD-2026-042           [Settings]| 40px topbar
+------------------------------------------------------------------+
|                              |                                    |
| FORM PANE (42% width)        | PREVIEW PANE (58%)                 |
|                              |                                    |
| [v] CONTRACT METADATA   2/2  | [Main / App 1 / App 2]  ← tabs    |
|   Contract No. [HD-___]      |                                    |
|   Signing Date [__/__/__]    | (rendered HTML skeleton with       |
|                              |  live tokens replaced by values;   |
| [>] PARTY B IDENTITY   0/6   |  pagination respects tab selection)|
|                              |                                    |
| [v] PARTY B BANK        3/3  |                                    |
|   Account [...]              |                                    |
|   Bank [...]                 |                                    |
|   Branch [...]               |                                    |
|                              |                                    |
| [>] TERM                1/2  |                                    |
| [>] SERVICE PRICING     4/9  |                                    |
| [>] VAT INVOICE INFO    0/3  |                                    |
| [>] CONTACT PERSONS     0/6  |                                    |
| [>] STORE LIST (A1)   0 rows |                                    |
| [>] FEE TABLE (A2)    comp.  |                                    |
|                              |                                    |
+------------------------------+                                    |
| [6px drag handle ■]                                                |
+------------------------------------------------------------------+
| ● draft · 31/45 fields · 68%         [Open in Word]  [EXPORT DOCX]| 36px statusbar
+------------------------------------------------------------------+
```

Collapsed racks show only the header; expanded racks show label+input stack below. Scroll is per-pane.

### 2.4 Interaction Details

- **Rack collapse animation**: 140ms ease-out height transition. No opacity fade. Triangle rotates 90deg.
- **Input focus**: 2px pear ring (glass-focus), no glow blur beyond what xms-calc uses already.
- **Value commit**: input commits on blur or Enter. Preview updates on commit + on typing via 250ms debounce (whichever fires first on blur).
- **Table row hover**: row background shifts from transparent to `rgba(207,245,51,0.04)`.
- **Drag handle grab**: cursor becomes `grabbing`, row gets `--picton` left border during drag.
- **Excel paste detection**: on `paste` event inside Store List rack, if clipboard `text/plain` contains `\t`, intercept, parse rows, show commit modal with parsed preview table. User clicks "Append rows" or "Replace all rows".
- **Export button state**: dim gray when completeness < 100%, orange when 100%. Hover when dim shows tooltip with comma-separated missing field labels.

---

## 3. System Architecture

### 3.1 Process Topology

**Main process** (Electron main, `src/main/index.ts`):
- Owns file I/O (drafts, settings, exports, template reading).
- Runs easy-template-x render pipeline.
- Exposes IPC handlers via `ipcMain.handle`.
- Manages BrowserWindow lifecycle.

**Renderer process** (React app, `src/renderer/`):
- All UI. No direct Node access.
- Form state via Zustand store.
- Calls main via `window.api.*` exposed by preload.

**Preload** (`src/preload/index.ts`):
- `contextBridge.exposeInMainWorld('api', { ... })`.
- Narrow typed surface: `loadTemplate`, `renderDocx`, `saveDraft`, `loadDraft`, `listDrafts`, `getSettings`, `saveSettings`, `openExport`.

No BrowserView, no hidden windows, no remote module. Secure defaults.

### 3.2 IPC Contract (Typed)

Define in `src/shared/ipc.ts` and import both sides.

```ts
// Template operations
'template:list'   : () => Promise<TemplateManifestEntry[]>
'template:load'   : (id: string) => Promise<TemplateManifest>

// Draft operations
'draft:list'      : () => Promise<DraftSummary[]>
'draft:load'      : (id: string) => Promise<Draft>
'draft:save'      : (draft: Draft) => Promise<{ savedAt: string }>
'draft:delete'    : (id: string) => Promise<void>

// Settings (Party A data)
'settings:get'    : () => Promise<Settings>
'settings:save'   : (settings: Settings) => Promise<void>

// Render
'render:docx'     : (payload: RenderPayload) => Promise<{ tempPath: string }>
'render:preview'  : (payload: RenderPayload) => Promise<{ html: string }>  // future if live-docx ever needed
'render:saveAs'   : (tempPath: string, suggestedName: string) => Promise<{ finalPath: string } | { cancelled: true }>

// OS
'os:openFile'     : (path: string) => Promise<void>
'os:showInFinder' : (path: string) => Promise<void>
```

All handlers wrapped in a small `safeHandle` utility that catches exceptions and returns `{ ok: false, error: string }` envelopes in production (renderer treats as toast), and throws in dev (so the error shows in DevTools).

### 3.3 Data Flow (Form Change to Preview Update)

1. User types into `<TextInput>`.
2. Component updates Zustand store via `setField(rackId, fieldId, value)`.
3. Zustand store publishes change.
4. `PreviewPane` subscribes to the full form snapshot. It debounces at 250ms.
5. After debounce, it runs `applyTokenSubstitutions(skeletonHTML, snapshot, derivedValues)` in the renderer (pure string/DOM op, no IPC).
6. Derived values (computed fields like Appendix 2 totals, amount-in-words, contract-number-propagation) are re-computed before substitution via pure functions in `src/renderer/derive/`.
7. Substituted HTML is set on the preview iframe srcdoc or a sandboxed div.

Simultaneously, every field change schedules a 1.5-second debounced draft autosave via IPC. Autosave writes the full snapshot to `~/Library/Application Support/xms-contract/drafts/<draftId>.json`.

### 3.4 File System (User Machine)

```
~/Library/Application Support/xms-contract/
├── settings.json                  (Party A identity, POA, last-used dir)
├── drafts/
│   ├── 2026-04-24_01h32_HD-042.json
│   └── ...
├── logs/
│   └── main.log                   (rotated at 1MB, keep last 3)
└── cache/                          (future: rendered PDFs if we ship PDF export)
```

`exportedPath` field on draft records the last export location so "Reveal in Finder" works after a resume.

---

## 4. Template Preparation Pipeline

### 4.1 One-Time Manual Conversion Procedure

This is the bootstrap step. Done once by hand, never repeated unless NCT legal changes the template. Output is committed to repo as `templates/contract-fullright/contract-fullright.template.docx`.

Procedure, explicit step-by-step for the execution agent:

1. Open `contract-fullright.dotx` in Microsoft Word (not Pages; Pages corrupts content controls).
2. Use File > Save As > select `.docx` format, save as `contract-fullright.template.docx` in a scratch folder.
3. Open the Developer tab. View > Navigation Pane enabled to jump sections quickly.
4. For each `Click điền thông tin.` placeholder (or dotted line, or `Điền số HD.`), select the placeholder text (including the content control wrapper if present) and replace with a Jinja token per the field catalog in §4.2.
5. For the two dynamic tables (Appendix 1 store rows, Appendix 2 fee line items), wrap the template row in `{% tr for item in stores %}` and `{% tr endfor %}` markers using easy-template-x's `{%tr%}` syntax that repeats table rows.
6. For computed cells in Appendix 2 (subtotal, VAT, total, words), leave them as Jinja tokens pointing to derived values computed app-side.
7. Validate by running a smoke render with synthetic fixture data (see §4.4).
8. Commit `contract-fullright.template.docx` to `templates/contract-fullright/` in the repo.

### 4.2 Field Token Catalog (`contract-fullright`)

Authoritative mapping of every fill point to its Jinja token, rack assignment, input type, and derivation rule. Field IDs use snake_case matching the token.

**Rack 1: CONTRACT METADATA** (appears in header + Appendix 1 + Appendix 2 headers)

| Token | Label VN | Label EN | Type | Notes |
|---|---|---|---|---|
| `{{ contract_no }}` | Số hợp đồng | Contract No. | text | Appears 2x in body + both appendix headers. App propagates. |
| `{{ signed_day }}` | Ngày ký | Day | number (1-31) | |
| `{{ signed_month }}` | Tháng ký | Month | number (1-12) | |
| `{{ signed_year_suffix }}` | Năm ký (20__) | Year | number (0-99) | Template shows "20..", we fill last 2 digits |
| `{{ signed_date_display }}` | auto | auto | derived | `dd/MM/yyyy` for appendix headers |

**Rack 2: PARTY A (LOCKED, APP SETTINGS ONLY)**

These are NCT's own data. Never edited per-contract. Edit via Settings modal.

| Token | Label | Default | Notes |
|---|---|---|---|
| `{{ party_a.bank_account }}` | STK Bên A | (from settings) | |
| `{{ party_a.bank_name }}` | Ngân hàng Bên A | (from settings) | |
| `{{ party_a.bank_branch }}` | Chi nhánh | (from settings) | |
| `{{ party_a.poa_no }}` | Số GUQ | (from settings) | Format `…/…/GUQ-NCT MEDIA` |
| `{{ party_a.poa_date }}` | Ngày GUQ | (from settings) | |
| `{{ party_a.representative }}` | Đại diện | `ZHANG QUAN` | Hardcoded in template, kept. |
| `{{ party_a.payment_bank_account }}` | STK nhận thanh toán | (from settings) | Article 4.2.2 |
| `{{ party_a.payment_bank_name }}` | Ngân hàng | (from settings) | Article 4.2.2 |

**Rack 3: PARTY B IDENTITY** (§Party B block + Appendix 1/2 headers)

| Token | Label VN | Type | Required |
|---|---|---|---|
| `{{ party_b.name }}` | Tên công ty | text | yes |
| `{{ party_b.address }}` | Địa chỉ | textarea | yes |
| `{{ party_b.tax_code }}` | Mã số thuế | text (regex 10 or 13 digits) | yes |
| `{{ party_b.phone }}` | Điện thoại | text | yes |
| `{{ party_b.representative }}` | Đại diện | text | yes |
| `{{ party_b.position }}` | Chức vụ | text | yes |

**Rack 4: PARTY B BANK**

| Token | Label | Type |
|---|---|---|
| `{{ party_b.bank_account }}` | Số tài khoản | text |
| `{{ party_b.bank_name }}` | Ngân hàng | text |
| `{{ party_b.bank_branch }}` | Chi nhánh | text |

**Rack 5: TERM** (§Article 3)

| Token | Label | Type | Notes |
|---|---|---|---|
| `{{ term.start_date }}` | Ngày bắt đầu | date `dd/MM/yyyy` | |
| `{{ term.end_date }}` | Ngày kết thúc | date | |
| `{{ term.start_day }}` `{{ term.start_month }}` `{{ term.start_year }}` | derived | | Split for template formatting |
| `{{ term.end_day }}` `{{ term.end_month }}` `{{ term.end_year }}` | derived | | |

**Rack 6: SERVICE PRICING** (§Article 4.1 table, 5 line items × up to 2 unit bases)

Flat fields (unit prices). Stored in VND integer.

| Token | Label | Notes |
|---|---|---|
| `{{ pricing.related_rights.per_store_year }}` | Quyền liên quan (năm) | |
| `{{ pricing.related_rights.per_store_month }}` | Quyền liên quan (tháng) | |
| `{{ pricing.composition_copyright.per_store_year }}` | Quyền tác giả (năm) | |
| `{{ pricing.composition_copyright.per_store_month }}` | Quyền tác giả (tháng) | |
| `{{ pricing.account.per_store_year }}` | Phí tài khoản (năm) | |
| `{{ pricing.account.per_store_month }}` | Phí tài khoản (tháng) | |
| `{{ pricing.application.per_store_year }}` | Phí Ứng dụng (năm) | |
| `{{ pricing.website.per_store_year }}` | Phí Website (năm) | |
| `{{ pricing.device.per_store_year }}` | Phí Thiết bị (năm) | |

**Rack 7: VAT INVOICE INFO** (§Article 4.2.3)

| Token | Label | Type |
|---|---|---|
| `{{ invoice.company_name }}` | Tên đơn vị | text |
| `{{ invoice.address }}` | Địa chỉ xuất hóa đơn | text |
| `{{ invoice.tax_code }}` | MST xuất hóa đơn | text |

Default: copy from `party_b.*` with per-field override toggle (Ableton pattern: "link" icon on each field; click unlinks).

**Rack 8: CONTACTS** (§Article 12.3)

| Token | Label |
|---|---|
| `{{ contact_a.name }}` `{{ contact_a.email }}` `{{ contact_a.phone }}` | Bên A liên lạc |
| `{{ contact_b.name }}` `{{ contact_b.email }}` `{{ contact_b.phone }}` | Bên B liên lạc |

Party A contact defaults from Settings with override.

**Rack 9: STORE LIST (Appendix 1, dynamic rows)**

Table row loop: `{% tr for store in stores %}...{% tr endfor %}`.

Per-row tokens:
- `{{ store.name }}` — Tên cửa hàng
- `{{ store.address }}` — Địa chỉ
- `{{ store.using_term }}` — Thời hạn sử dụng (text, e.g. "01/05/2026 – 30/04/2027" or inherits from contract Term)
- `{{ store.months }}` — Số tháng sử dụng (integer)

Footer: `{{ total_months }}` = sum of `stores[*].months`, computed.

**Rack 10: FEE TABLE (Appendix 2, dynamic + computed)**

Line items loop: iterate over 5 fixed categories (related_rights, composition_copyright, account, application, website, device) + any additional ad-hoc rows the user adds.

Per-line tokens:
- `{{ fee.unit_price }}` — Đơn giá (VND/store/month)
- `{{ fee.store_count }}` — Số cửa hàng
- `{{ fee.months }}` — Số tháng sử dụng
- `{{ fee.total }}` — Thành tiền (computed = unit_price × store_count × months)

Footer computed:
- `{{ subtotal }}` = sum of `fees[*].total`
- `{{ vat_pct }}` — user input (default 10)
- `{{ vat_amount }}` = subtotal × vat_pct / 100
- `{{ grand_total }}` = subtotal + vat_amount
- `{{ grand_total_in_words_vn }}` — computed via `vn-num2words` or equivalent (e.g., "Một tỷ hai trăm ba mươi triệu đồng chẵn")
- `{{ grand_total_in_words_en }}` — optional; for now write as Title-cased number format, refine later

### 4.3 Field Enumeration Summary

Totals: **roughly 45 editable per-contract fields** across 8 racks + 4 derived fields + 1 dynamic table (Store List, variable row count) + 1 semi-dynamic table (Fee Table, 5 fixed categories × 4 cells each). Matches template's 90 "Click điền thông tin." (many placeholders repeat the same logical field, e.g., contract_no appears in the body and both appendix headers).

### 4.4 Smoke Fixture

Create `templates/contract-fullright/fixture.json` with realistic data (actual NCT address for Party A, a plausible Party B like "Công ty TNHH Cà Phê Thử Nghiệm", 12 stores, realistic pricing at 50,000 VND/store/month for related rights). Test rendering produces a valid .docx that opens in Word without corruption warnings.

### 4.5 Preview Skeleton Generation

Build-time script `scripts/build-preview-skeleton.ts`:
1. Load `contract-fullright.template.docx`.
2. Run mammoth to convert to HTML.
3. Post-process HTML: convert `{{ token }}` occurrences to `<span data-token="token" class="tpl-token">…</span>` for targeted DOM replacement.
4. Convert `{% tr for store in stores %}…{% tr endfor %}` regions into `<tr data-repeat="stores">` template rows that the renderer clones per store.
5. Inline CSS for the preview: ported from xms-calc's `template.css` (Lexend + warm gray) OR recreate a minimal "document" stylesheet matching Word's look. **Decision: port template.css from xms-calc and style the preview as if it were a printed document.** This matches Archie's mental model (dark interface, light document) from the DESIGN-AUDIT.
6. Output `src/renderer/assets/preview-skeletons/contract-fullright.html`.

---

## 5. Form Schema (TypeScript + Zod)

`src/shared/schema/contract-fullright.ts`:

```ts
import { z } from 'zod'

export const StoreRowSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  usingTerm: z.string().min(1),           // free-text, e.g. "01/05/2026 – 30/04/2027"
  months: z.number().min(0).max(120),
})

export const FeeLineSchema = z.object({
  categoryId: z.enum([
    'related_rights', 'composition_copyright',
    'account', 'application', 'website', 'device',
  ]),
  unitPrice: z.number().min(0),
  storeCount: z.number().int().min(0),
  months: z.number().min(0).max(120),
})

export const ContractFullrightSchema = z.object({
  meta: z.object({
    contractNo: z.string().min(1),
    signedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  partyB: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    taxCode: z.string().regex(/^\d{10}(-\d{3})?$|^\d{13}$/),
    phone: z.string().min(1),
    representative: z.string().min(1),
    position: z.string().min(1),
    bankAccount: z.string().min(1),
    bankName: z.string().min(1),
    bankBranch: z.string().min(1),
  }),
  term: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  pricing: z.object({
    relatedRights: z.object({ perStoreYear: z.number(), perStoreMonth: z.number() }),
    compositionCopyright: z.object({ perStoreYear: z.number(), perStoreMonth: z.number() }),
    account: z.object({ perStoreYear: z.number(), perStoreMonth: z.number() }),
    application: z.object({ perStoreYear: z.number() }),
    website: z.object({ perStoreYear: z.number() }),
    device: z.object({ perStoreYear: z.number() }),
  }),
  invoice: z.object({
    companyName: z.string(),
    address: z.string(),
    taxCode: z.string(),
    linkedFromPartyB: z.boolean().default(true),
  }),
  contacts: z.object({
    partyA: z.object({ name: z.string(), email: z.string().email(), phone: z.string() }),
    partyB: z.object({ name: z.string(), email: z.string().email(), phone: z.string() }),
  }),
  stores: z.array(StoreRowSchema).min(1, 'Phải có ít nhất 1 cửa hàng'),
  fees: z.array(FeeLineSchema).min(1),
  vatPct: z.number().min(0).max(100).default(10),
})

export type ContractFullright = z.infer<typeof ContractFullrightSchema>
```

Settings schema:

```ts
export const SettingsSchema = z.object({
  partyA: z.object({
    bankAccount: z.string(),
    bankName: z.string(),
    bankBranch: z.string(),
    poaNo: z.string(),
    poaDate: z.string(),
    paymentBankAccount: z.string(),
    paymentBankName: z.string(),
  }),
  defaults: z.object({
    vatPct: z.number().default(10),
    defaultContactA: z.object({
      name: z.string(), email: z.string(), phone: z.string(),
    }),
  }),
  ui: z.object({
    lastFormPaneWidthPct: z.number().default(42),
    previewSyncScroll: z.boolean().default(false),
  }),
})
```

---

## 6. Feature Specifications

### 6.1 Template Library View

**Acceptance:** User lands on library on app open. Sees one template card (`contract-fullright`) and a "Recent drafts" section if drafts exist. Clicking the card creates a new empty draft and navigates to the form view. Clicking a draft opens it in place.

**Layout (Browser-analog):**
- Title bar: `XMS Contract` wordmark + Settings gear icon.
- Category chips: `All / Contracts / Appendices` (MVP: only "Contracts" active; others disabled chip placeholders to signal future).
- Template grid: 3-column CSS grid at 1440w, collapses to 2 at 1024w. Each card 240x180 with thumbnail (screenshot of first page of rendered fixture), title "Contract Fullright", subtitle "Background Music Service Agreement", "NEW" button (pear) bottom-right.
- Recent drafts: horizontal scrollable strip below template grid. Each draft chip: contract no. + party B name + last-modified relative time + delete X on hover.

**Empty state:** if no drafts, "Recent drafts" section hidden.

### 6.2 Form Pane

**Rack component:**
```tsx
<Rack
  id="party_b"
  title="PARTY B IDENTITY"
  requiredCount={6}
  filledCount={computed}
  defaultCollapsed={false}
>
  <Field label="TÊN CÔNG TY" required>
    <TextInput bind="partyB.name" />
  </Field>
  ...
</Rack>
```

Keyboard: `Cmd+[` / `Cmd+]` jumps between racks. `Cmd+/` toggles collapse-all. Field navigation via Tab/Shift-Tab respects rack collapse state (collapsed racks skip).

**Validation:** Zod runs on blur per field. Invalid fields show 1px `--daw-orange` left border and a 10px error text below. Racks with any error show an orange dot in the completeness indicator instead of a pear dot.

**Completeness LED:**
- All required filled + all valid: pear dot.
- Some required empty, no errors: gray ring.
- Any validation error: orange solid dot.

### 6.3 Preview Pane

**Layer cake:**
1. Preview wrapper `<div class="preview-wrapper">`: holds the chain selector tabs at top and the document frame.
2. Chain selector: three tabs `[Main Contract | Appendix 1 | Appendix 2]`. Tab click scrolls to the relevant section marker. Active tab gets pear underline.
3. Document frame: `<iframe srcdoc={html} sandbox="allow-same-origin">` to isolate styles from app. Height fills available space, internal scroll.

**Live update:** renderer owns a React hook `usePreviewHTML(snapshot, skeletonHTML)` that memoizes substitution. Debounced with 250ms. On result, iframe's `srcdoc` is updated. We accept the iframe reload cost (~10ms) in exchange for style isolation and to prevent leaked state.

**Alternative considered:** render into a shadow-DOM root instead of iframe for zero-reload updates. Rejected because Word fonts (Times New Roman, Calibri) need specific CSS reset that conflicts with Space Grotesk app-wide, and shadow DOM's style leakage story is messier than iframe.

**Scroll-sync (optional):** A toggle in statusbar. When on, form rack in focus auto-scrolls preview to that section via anchor IDs embedded in skeleton (`<a name="rack_party_b"/>` etc.). Disabled by default to avoid disorienting jumps.

### 6.4 Table Editor (Store List + Fee Table)

Shared component `<TableEditor schema={StoreRowSchema} bind="stores" />`.

**Columns:** derived from schema. Each column has a header with uppercase 10px label, column type chip (text/number/date).

**Row rendering:** flex row, drag handle left, cells, row actions right (duplicate icon, delete X).

**Add row:** bottom + button labeled "APPEND ROW" or pill "n rows · +". Keyboard `Cmd+Enter` on last cell adds a new row and moves focus to the first cell.

**Delete row:** click X on row action group. Confirm dialog only if row has any non-empty cell.

**Reorder:** drag handle to reorder within table. Uses `@dnd-kit/sortable`.

**Cell validation:** runs on blur per cell. Invalid cells get `--daw-orange` 1px left border, tooltip shows error message.

**Keyboard navigation:** arrow keys move focus between cells; Tab next cell; Shift-Tab prev cell; Enter next row same column; Escape unfocuses.

### 6.5 Excel/Sheets Paste Flow

**Trigger:** `paste` event fires anywhere inside TableEditor container. Handler inspects `clipboardData.getData('text/plain')`. If content contains at least one `\t` character AND at least one `\n`, treat as tabular.

**Parse:** split rows by `\n`, cells by `\t`. Strip trailing empty rows. First row is assumed header if it matches column names heuristically (case-insensitive fuzzy match); otherwise treated as data.

**Modal UI:**
```
+--------------------------------------------------+
| PASTE DETECTED                              [X]  |
|                                                  |
| Detected 12 rows, 4 columns from clipboard.      |
| Column mapping:                                  |
|   Clipboard col 1 → [Store name ▾]               |
|   Clipboard col 2 → [Address ▾]                  |
|   Clipboard col 3 → [Using term ▾]               |
|   Clipboard col 4 → [Months ▾]                   |
|                                                  |
| Preview (first 3 rows):                          |
|   [ parsed rows displayed in mini table ]        |
|                                                  |
| Conflict resolution:                             |
|   ( ) Append to existing (current: 0 rows)       |
|   (•) Replace all                                |
|                                                  |
|                           [Cancel]  [COMMIT]     |
+--------------------------------------------------+
```

Commit button is pear when all mappings valid. Cancel closes without changes.

**Heuristic column matching:** if clipboard headers are "Cửa hàng / Store" match to `name`; "Địa chỉ / Address" match to `address`; etc. User can override.

### 6.6 Draft Autosave + Resume

**Trigger:** any change to form state schedules a write. Debounce 1.5s. Write via IPC `draft:save`.

**Storage:** one file per draft at `drafts/<draftId>.json`. Content:
```json
{
  "id": "uuid-v4",
  "templateId": "contract-fullright",
  "createdAt": "ISO",
  "updatedAt": "ISO",
  "title": "HD-2026-042 · Cà Phê Thử Nghiệm",
  "exportedPath": "/path/to/last-export.docx" | null,
  "data": { /* ContractFullright */ }
}
```

**Title** auto-derived from `meta.contractNo + party_b.name`. Empty falls back to `Untitled · YYYY-MM-DD HH:mm`.

**Resume:** library view queries `draft:list`, renders chip strip. Click → `draft:load` → navigate to form with state hydrated.

**Delete:** confirm modal. Physical file removed.

**No cloud, no git history.** Draft JSON is just a save file. Future version control belongs to generated .docx, not draft state.

### 6.7 Export Flow

1. User clicks Export button (statusbar, orange when 100% complete).
2. Main process receives `render:docx` IPC call with snapshot.
3. Snapshot runs through `deriveComputedFields()` (totals, amount-in-words, date splits).
4. easy-template-x loads `contract-fullright.template.docx`, injects data, writes to `temp/<draftId>.docx`.
5. Main sends `{ tempPath }` back to renderer.
6. Renderer triggers `render:saveAs` with suggested filename `HD-<contractNo>-<partyBSlug>.docx`.
7. Main shows native save dialog with default dir = `Settings.defaultExportDir` or `~/Documents/XMS Contracts/` (created if missing).
8. After save, draft's `exportedPath` is updated. Statusbar flashes pear "Exported ✓" for 2s.
9. Optional: "Open in Word" button in statusbar after export becomes active, runs `os:openFile`.

**Filename slug:** `party_b.name` lowercased, non-ASCII stripped, whitespace to hyphen. Example: "Công ty TNHH Cà Phê Thử Nghiệm" → `cong-ty-tnhh-ca-phe-thu-nghiem`.

---

## 7. Implementation Phases (Sprint Plan)

3-week solo, 5 working days per week. Each phase has explicit exit criteria so the execution agent can gate progression.

### Phase 0 — Scaffold (Day 1 to Day 2)

- `pnpm create` electron-vite project with React + TS template.
- Copy `src/renderer/styles/styles.css` from `xms-calc` as baseline. Remove calculator-specific selectors; keep palette, typography, focus system.
- Install deps: `react`, `react-dom`, `zustand`, `zod`, `@dnd-kit/core`, `@dnd-kit/sortable`, `easy-template-x`, `mammoth`, `date-fns`, `uuid`, `vn-num2words` (or equivalent), `electron-vite`, `electron-builder`.
- Configure `electron-builder.yml`: `appId: com.xmusicstation.xms-contract`, `productName: XMS Contract`, `mac.icon: build/icon.icns` (convert from provided `512x512@2x.icns`).
- Set up `tsconfig.json`, ESLint, Prettier matching xms-calc conventions (check xms-calc's files during scaffold).
- Initialize git repo, initial commit, push to private GitHub.
- Verify `pnpm dev` opens an empty app window with the Ableton-palette background.

**Exit:** blank window renders in `--bg-root` at 1280x800.

### Phase 1 — Template Conversion (Day 2 to Day 3)

- Perform §4.1 manual conversion procedure. Save `contract-fullright.template.docx`.
- Create `templates/contract-fullright/manifest.json`:
  ```json
  { "id": "contract-fullright", "name": "Contract Fullright",
    "subtitle": "Background Music Service Agreement",
    "version": "1.0.0", "templateFile": "contract-fullright.template.docx",
    "skeletonFile": "skeleton.html", "schemaId": "contractFullright" }
  ```
- Build smoke fixture `fixture.json` (§4.4).
- Write `scripts/smoke-render.ts`: loads template + fixture, runs easy-template-x, writes `out.docx`. Open in Word manually, confirm no corruption + all fields populated.
- Run `scripts/build-preview-skeleton.ts` (§4.5) to produce `skeleton.html`.

**Exit:** smoke-render produces a valid .docx that opens without warnings in Word; skeleton.html renders visually in a browser with placeholder markers highlighted.

### Phase 2 — Schema + State (Day 3 to Day 4)

- Author `src/shared/schema/contract-fullright.ts` (§5).
- Author `src/shared/schema/settings.ts`.
- Author `src/shared/ipc.ts` with typed channel signatures.
- Set up Zustand store `src/renderer/state/formStore.ts`: single slice per loaded contract, `setField(path, value)` action, selector `getCompleteness()`.
- Write pure derive module `src/renderer/derive/contractFullright.ts` containing `deriveAll(snapshot)` that produces the extra tokens needed by template (date splits, Appendix totals, amount-in-words, slug).
- Unit tests for derive module with a fixture.

**Exit:** Derive functions pass unit tests; store accepts partial data and computes completeness correctly.

### Phase 3 — Template Library View (Day 5)

- `src/renderer/views/LibraryView.tsx`.
- Template manifest loading via IPC `template:list`.
- Draft listing via `draft:list`.
- Template card component `<TemplateCard>`.
- Recent drafts strip with chip component.
- Settings gear button opens a modal (component only; settings form in Phase 9).

**Exit:** Library renders, clicking the card transitions to an empty form view, clicking a fixture-created draft loads into form view.

### Phase 4 — Form Pane + Racks (Day 6 to Day 9)

- `<Rack>` component with collapse animation, completeness LED, field counter.
- `<FieldLabel>` + `<TextInput>` + `<TextAreaInput>` + `<NumberInput>` + `<DateInput>` + `<CurrencyInput>` primitives. All match Ableton macro pattern (uppercase 10px label, 32px tall input, pear focus ring).
- Wire all 8 non-table racks (Metadata, Party B Identity, Party B Bank, Term, Pricing, Invoice, Contacts) to schema paths.
- "Link from Party B" toggle for Invoice rack (Ableton link-icon analog).
- Resizable split pane with 6px drag handle between form and preview. Remember width in settings.
- Keyboard shortcuts: Cmd+[, Cmd+], Cmd+/.

**Exit:** All non-table fields fillable; validation fires on blur; completeness indicator updates live; resizing works.

### Phase 5 — Preview Pane (Day 10 to Day 11)

- `<PreviewPane>` component with chain selector tabs and iframe-based document frame.
- Skeleton loader: fetches `contract-fullright/skeleton.html` at form-load.
- `applyTokenSubstitutions(html, snapshot, derived)` function: replaces `<span data-token="x">` and clones `<tr data-repeat="x">` per row.
- 250ms debounce hook.
- Chain selector scroll-to-section behavior.
- Preview CSS: ported from xms-calc `template.css` or minimal document stylesheet matching Word look.

**Exit:** Typing in form updates preview within 400ms perceived lag; all tokens appear; appendix tables render with placeholder rows.

### Phase 6 — Table Editor + Excel Paste (Day 12 to Day 13)

- `<TableEditor>` generic component (§6.4).
- Wire Store List rack to stores array.
- Wire Fee Table rack with 5 pre-seeded rows (one per category), allowing unit price edits but category names locked. Store count and months editable.
- Drag handle reorder via @dnd-kit/sortable.
- Excel paste detection + parse + modal confirm (§6.5).
- Derived footers: total months, subtotal, VAT amount, grand total, amount-in-words.

**Exit:** paste a 20-row Google Sheets selection into Store List, commit, all rows appear. Fee Table subtotal matches hand-computed. Preview reflects.

### Phase 7 — Draft Autosave + Resume (Day 14)

- 1.5s debounced autosave IPC call.
- Draft title auto-derivation.
- Library view "Recent drafts" strip populated.
- Draft delete confirm modal.

**Exit:** Type in form, close app, reopen, find draft in Recent, open, all state restored.

### Phase 8 — Export Pipeline + Settings (Day 15 to Day 16)

- Implement `render:docx` main handler.
- Derive-then-render flow.
- Native save dialog with default dir.
- Statusbar Export + Open-in-Word buttons.
- Settings modal: Party A bank, POA, default contact A, VAT default, default export dir.
- Settings persisted via `settings:save`.

**Exit:** Full fill + export round-trip produces a .docx identical in output to hand-filled version within qualitative review tolerance.

### Phase 9 — Polish + Testing (Day 17 to Day 19)

- Ableton-feel qualitative pass: every shadow checked against DESIGN-AUDIT Tier 1 recs; no 999px pill shapes outside chip/badge; all radii ≤3px for rectangular.
- Empty states: empty library, empty draft list, zero-store appendix warning.
- Error states: render failure (corrupt template), save-cancelled, invalid schema on draft load.
- Performance pass: measure cold start, first-paint, form-to-preview latency. Aim <2.5s cold start, <400ms preview latency.
- Integration tests: golden-file comparison of rendered .docx against checked-in reference.
- Manual regression: fill one real contract end-to-end, verify output.

**Exit:** No open P0/P1 issues. Qualitative Ableton coherence check passes (done by Archie personally).

### Phase 10 — Release (Day 20)

- Bump version to 1.0.0 in `package.json`.
- `pnpm build` produces unsigned DMG.
- Tag git `v1.0.0`, push.
- Create GitHub Release, attach DMG.
- Document in `RELEASE.md`: "Right-click DMG → Open on first launch; macOS will warn, choose Open anyway."

**Exit:** DMG installed on target Mac, app launches, full flow works.

---

## 8. Testing Strategy

**Unit.** Derive functions (date splits, totals, amount-in-words, slug). Zod schema validation. Token substitution function (pure, idempotent). Excel paste parser.

**Integration.** Golden-file test: given `fixture.json`, render produces a .docx whose XML matches a checked-in reference within normalized-whitespace tolerance. If it drifts, diff is human-reviewable.

**Smoke.** `pnpm smoke` script: spin up Electron in headless-ish mode (via `@electron/forge` smoke preset or `playwright` electron support), navigate to library, create draft, fill fixture data, export, verify file exists.

**Manual.** Archie fills one real contract and compares to the hand-version. This is the gate for release.

**No snapshot tests on UI** in v1.0.0. The design is evolving; snapshots would become maintenance noise.

---

## 9. Repo Structure

```
xms-contract/
├── .github/
│   └── workflows/
│       └── build-macos.yml           (manual trigger; runs pnpm build)
├── build/
│   └── icon.icns                     (converted from 512x512@2x.icns)
├── dist/                              (electron-builder output, gitignored)
├── templates/
│   └── contract-fullright/
│       ├── manifest.json
│       ├── contract-fullright.template.docx
│       ├── skeleton.html
│       └── fixture.json
├── scripts/
│   ├── build-preview-skeleton.ts
│   └── smoke-render.ts
├── src/
│   ├── main/
│   │   ├── index.ts
│   │   ├── ipc/
│   │   │   ├── draft.ts
│   │   │   ├── render.ts
│   │   │   ├── settings.ts
│   │   │   └── template.ts
│   │   └── render-engine/
│   │       ├── easy-template-x.ts
│   │       └── paths.ts
│   ├── preload/
│   │   └── index.ts
│   ├── renderer/
│   │   ├── App.tsx
│   │   ├── views/
│   │   │   ├── LibraryView.tsx
│   │   │   └── FormView.tsx
│   │   ├── components/
│   │   │   ├── Rack.tsx
│   │   │   ├── FieldLabel.tsx
│   │   │   ├── TextInput.tsx
│   │   │   ├── NumberInput.tsx
│   │   │   ├── DateInput.tsx
│   │   │   ├── CurrencyInput.tsx
│   │   │   ├── TableEditor.tsx
│   │   │   ├── PreviewPane.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   └── SettingsModal.tsx
│   │   ├── state/
│   │   │   ├── formStore.ts
│   │   │   └── settingsStore.ts
│   │   ├── derive/
│   │   │   └── contractFullright.ts
│   │   ├── lib/
│   │   │   ├── excelPaste.ts
│   │   │   ├── vnNumToWords.ts
│   │   │   └── tokenSubstitution.ts
│   │   ├── styles/
│   │   │   └── styles.css            (ported from xms-calc)
│   │   └── assets/
│   │       └── preview-stylesheet.css
│   └── shared/
│       ├── ipc.ts
│       ├── schema/
│       │   ├── contract-fullright.ts
│       │   └── settings.ts
│       └── types.ts
├── tests/
│   ├── derive.test.ts
│   ├── tokenSubstitution.test.ts
│   ├── excelPaste.test.ts
│   └── render.golden.test.ts
├── DESIGN.md                          (copied from xms-contract folder)
├── DESIGN-ADDENDUM.md                 (new; contains adaptations in §2.2)
├── IMPLEMENTATION-PLAN.md             (this document)
├── RELEASE.md
├── README.md
├── package.json
├── tsconfig.json
├── electron-builder.yml
└── vite.config.ts
```

---

## 10. Risks, Unknowns, and Open Questions

### Risks (Known, Mitigated)

**R1. Mammoth HTML fidelity on complex tables.** Mammoth simplifies Word styles; the preview will not be pixel-perfect to the actual .docx. Mitigation: preview is explicitly marketed (even to Archie) as "approximation for field verification, not final proof." Gate final proof on opening the actual exported .docx in Word before sending to client. Severity: low. Already accepted in question #3.

**R2. easy-template-x `{% tr %}` row-loop edge cases on merged cells.** If the template tables have merged cells in the row-loop region, easy-template-x may break. Mitigation: during Phase 1 manual conversion, verify no merged cells in Appendix 1/2 row-loop regions. If merged, un-merge in the template (visually identical, but cleaner XML). Severity: medium. Verifiable in Day 2.

**R3. First-launch macOS Gatekeeper.** Unsigned DMG will show "cannot be opened because it is from an unidentified developer." Mitigation: document right-click-Open workaround in RELEASE.md. Severity: low for self-use. Future: buy Apple Developer ID if distributing beyond Archie.

**R4. Vietnamese amount-in-words library correctness.** Libraries for Vietnamese number-to-words vary in quality. `vn-num2words` is the best npm candidate. Mitigation: write unit tests against 10 known-correct examples (e.g., "1.000.000" → "Một triệu đồng chẵn"). If library fails, write custom in 2-3 hours. Severity: low.

**R5. Draft schema migration on template update.** If template schema evolves (v1.1 adds a field), old drafts become partially invalid. Mitigation: version field on draft JSON (`schemaVersion: 1`). On load, run migration function if version mismatches. Defer implementation to v1.1 when it actually matters. Severity: low for v1.0.

**R6. Font rendering consistency Space Grotesk local vs CDN.** xms-calc loads from Google CDN; if we self-host, version drift possible. Mitigation: self-host Space Grotesk in app, document version, match exactly. Severity: very low.

### Open Questions (Needs Archie Decision)

These are callouts where reasonable defaults can proceed but Archie's preference could change things:

**Q1. Date formatting preference.** Appendix 1 `usingTerm` shows a date range as free text. Should the form expose a "start date / end date" input pair that auto-formats to `01/05/2026 – 30/04/2027`, or a single free-text field matching the existing Word convention? Default assumption: start/end pair with auto-format. Toggle for free-text as escape hatch.

**Q2. VND formatting affordance.** Currency inputs: should typing "1000000" auto-display as "1.000.000" live, or only on blur? Default: on blur, with live format showing grouping separators. Matches Ableton "commit on blur" convention.

**Q3. Default export location.** `~/Documents/XMS Contracts/` is my default assumption. Confirm, or prefer a different path like `~/Desktop/XMS Contracts/` or "remember last" with no default?

**Q4. Party A rep name handling.** Template has `ZHANG QUAN` hardcoded in body and signature block. If a future contract needs a different NCT rep (vacation, delegation), either edit template or make it a Settings field. Default: Settings field defaulting to "ZHANG QUAN" with CEO position, overridable per-contract via a "Use alternate rep" expander in Rack 1.

**Q5. Amount-in-words bilingual.** VN words needed per template. English words mentioned in my plan as optional. Is the template expecting both, or just VN? Default: VN only; EN omitted from template to keep simpler.

**Q6. Auto-fill propagation granularity.** Should `party_b.name` changes also update all open drafts from the same contract party? No, drafts are snapshots. Confirm.

**Q7. Preview CSS strategy.** Should the preview mimic Word exactly (Times New Roman, Calibri, precise margins) or use a simplified document style matching xms-calc's PDF template (Lexend titles, SF Pro Text body)? Default: simplified style matching xms-calc PDF template, to keep brand-cohesion with the rest of the appkit. This explicitly diverges from what Word will actually render, but matches Archie's appkit language.

---

## 11. Confidence Matrix

| Decision | Confidence | Basis |
|---|---|---|
| Stack: Electron + React + easy-template-x | Highly Confident | Proven patterns; xms-calc precedent; one-language stack |
| Template: build-time Jinja conversion | Highly Confident | Standard docxtpl/easy-template-x workflow; one-time manual cost is reasonable |
| Preview: mammoth skeleton + token sub | Moderately Confident | Known 80% fidelity ceiling on mammoth; acceptable for verification use case; downside is tables may look different from Word output |
| Form UX: collapsible Racks | Highly Confident | Aligned with Ableton convention; efficient for 8-rack form |
| Draft storage: per-draft JSON in app data dir | Highly Confident | Standard pattern; no migration complexity until v1.1 |
| Excel paste: tab-detection + modal confirm | Highly Confident | Well-trodden pattern; low implementation risk |
| Amount-in-words: `vn-num2words` | Moderately Confident | Library exists but quality varies; fallback is 2 hours of custom code |
| Timeline: 20 working days | Moderately Confident | Tight for first-time Electron project if agent has no prior Electron experience; add 30% buffer if unfamiliar |
| v1.0.0 acceptance: "indistinguishable from hand-filled" | Moderately Confident | Preview approximates, but exported .docx should match exactly; hinges on manual-conversion thoroughness in Phase 1 |
| Security: sandboxed preview iframe | Highly Confident | Electron best-practice; contextBridge is defense in depth |

---

## 12. Reference Appendix

### A. Ableton Patterns Referenced (Quick Lookup)

| Ableton Element | Used For | Location in App |
|---|---|---|
| Device Rack | Form sections | `<Rack>` component |
| Session Clip Slot | Table cells | `<TableEditor>` cells |
| Browser sidebar | Template library | `LibraryView` |
| Transport Strip | Statusbar | `<StatusBar>` |
| Chain Selector | Preview tabs | `<PreviewPane>` chain tabs |
| Macro Knob Label | Field labels | `<FieldLabel>` |
| Clip Launch Triangle | Row drag handle | TableEditor drag handle |
| Link Icon | Invoice-linked-to-Party-B | Invoice rack toggle |
| MIDI Cyan Highlight | Paste-available signal | Store List rack border flash |

### B. Minimum Package Set

Production: `react`, `react-dom`, `zustand`, `zod`, `@dnd-kit/core`, `@dnd-kit/sortable`, `easy-template-x`, `mammoth`, `date-fns`, `uuid`, `vn-num2words` (or equivalent).

Dev: `electron`, `electron-builder`, `electron-vite`, `typescript`, `vite`, `@types/*`, `vitest`, `@testing-library/react`, `playwright` (for smoke), `eslint`, `prettier`.

### C. Out-of-Plan Decisions for Future Versions

- **v1.1**: Code signing + notarization + electron-updater auto-update.
- **v1.1**: Multi-template library (when second template arrives). Template schema+skeleton+manifest pluggable.
- **v1.2**: PDF export via headless LibreOffice or pure-JS alternative.
- **v1.2**: Draft versioning (keep last 5 versions per draft).
- **v2.0**: Template editor UI (paste any Word doc, mark fields, generate schema). Separate product scope.
- **v2.0**: SQLite for draft storage if draft count exceeds ~200.

---

## 13. Kickoff Checklist for Execution Agent

Before starting Phase 0, the agent should confirm:

1. [ ] Archie has answered Q1 to Q7 in §10 open questions (if not, use listed defaults and flag in first PR).
2. [ ] Archie has a copy of `contract-fullright.dotx` + Microsoft Word on the dev machine (needed for Phase 1 conversion).
3. [ ] `xms-calc` repo is accessible for styles.css reference.
4. [ ] `512x512@2x.icns` icon is in `build/icon.icns` (convert if needed).
5. [ ] `vn-num2words` or chosen amount-in-words library is installable (npm check on Day 1).
6. [ ] Private GitHub repo created with Archie's preferred organization.
7. [ ] Apple Developer ID purchase decision deferred (not blocking v1.0.0 release).

When all confirmed, proceed to Phase 0.
