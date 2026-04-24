# UI Overhaul Plan — XMS Contract

> **Purpose**: This document is a step-by-step execution plan for an agent to refine the UI.
> **Files to edit**: `src/renderer/src/styles/styles.css`, `src/renderer/src/components/Rack.tsx`, `src/renderer/src/views/FormView.tsx`, `src/renderer/src/views/LibraryView.tsx`, `src/renderer/src/components/StatusBar.tsx`
> **Reference**: The Ableton-inspired design system from `/Users/mhdquan/Desktop/xms-calc/src/renderer/styles/styles.css`

---

## Problem Summary

1. **Color monotony**: Almost everything uses `--pear` (lime green) or `--picton` (cyan). Ableton uses a 12-color cue palette where each track/section has its own identity color. Currently every rack LED, every focus ring, every active tab, every chip — all pear. It's flat.
2. **No breathing/glow**: CSS defines `ledBreathe` and `pulse` keyframes but they're barely visible. No elements actually glow.
3. **Missing micro-animations**: Rack open/close snaps instantly (height:auto with no transition). No staggered entrance. No hover micro-feedback beyond border color changes. No view transition.
4. **Missing Ableton elements**: No color strip on rack left edge (like `store-item-color` in xms-calc). No VU-meter segmented progress bar. No radial-gradient breathe overlays on active buttons (like `vat-active-breathe` in xms-calc).

---

## TASK 1 — Ableton Color Cue Palette

### 1A. Add CSS variables

In `styles.css`, inside `:root { }` (after line 30, after `--daw-yellow-dim`), add these cue color tokens:

```css
/* ── Ableton Cue Palette ── */
--cue-rose: #E56B6B;
--cue-rose-dim: rgba(229, 107, 107, 0.12);
--cue-rose-glow: rgba(229, 107, 107, 0.25);
--cue-gold: #FFD300;
--cue-gold-dim: rgba(255, 211, 0, 0.12);
--cue-gold-glow: rgba(255, 211, 0, 0.25);
--cue-green: #62C462;
--cue-green-dim: rgba(98, 196, 98, 0.12);
--cue-green-glow: rgba(98, 196, 98, 0.25);
--cue-teal: #3CC8B4;
--cue-teal-dim: rgba(60, 200, 180, 0.12);
--cue-teal-glow: rgba(60, 200, 180, 0.25);
--cue-blue: #5C7AFF;
--cue-blue-dim: rgba(92, 122, 255, 0.12);
--cue-blue-glow: rgba(92, 122, 255, 0.25);
--cue-indigo: #8E6FFF;
--cue-indigo-dim: rgba(142, 111, 255, 0.12);
--cue-indigo-glow: rgba(142, 111, 255, 0.25);
--cue-violet: #C474E3;
--cue-violet-dim: rgba(196, 116, 227, 0.12);
--cue-violet-glow: rgba(196, 116, 227, 0.25);
--cue-magenta: #FF6EB4;
--cue-magenta-dim: rgba(255, 110, 180, 0.12);
--cue-magenta-glow: rgba(255, 110, 180, 0.25);
```

### 1B. Rack cue-color CSS custom property system

Each `.rack` element will receive a `style={{ '--rack-cue': 'var(--cue-X)', '--rack-cue-dim': 'var(--cue-X-dim)', '--rack-cue-glow': 'var(--cue-X-glow)' }}` from TSX. The CSS will reference `var(--rack-cue)` instead of hardcoded pear. Add these rules in the DEVICE RACK section of `styles.css`:

```css
/* Rack Cue Color Strip — 3px left border like Ableton track color */
.rack {
  --rack-cue: var(--text-dim);
  --rack-cue-dim: rgba(104, 104, 112, 0.12);
  --rack-cue-glow: rgba(104, 104, 112, 0.2);
  border-left: 3px solid var(--rack-cue);
  border-left-color: color-mix(in srgb, var(--rack-cue) 40%, transparent);
}
.rack-open {
  border-left-color: var(--rack-cue);
}
.rack:hover {
  border-left-color: color-mix(in srgb, var(--rack-cue) 70%, transparent);
}
```

Replace existing `.rack-led-complete` (line 195) with:
```css
.rack-led-complete {
  background: var(--rack-cue);
  --led-color: var(--rack-cue-glow);
  animation: ledBreathe 2.4s ease-in-out infinite;
}
.rack-led-partial {
  background: var(--rack-cue);
  opacity: 0.5;
}
```

Replace `.field-input:focus` (line 220) inside racks to use cue color. Add a new rule:
```css
.rack .field-input:focus {
  border-color: var(--rack-cue);
  box-shadow: 0 0 0 2px var(--rack-cue-dim);
}
```

### 1C. Rack color assignments in FormView.tsx

In `FormView.tsx`, each `<Rack>` needs a `cueColor` prop. Here is the mapping:

| Rack id | title | cueColor value |
|---------|-------|----------------|
| `meta` | CONTRACT METADATA | `picton` (cyan — this IS an appropriate use of brand color for the primary info section) |
| `partyB` | PARTY B IDENTITY | `rose` |
| `partyBBank` | PARTY B BANK | `gold` |
| `term` | TERM | `green` |
| `pricing` | SERVICE PRICING | `daw-orange` (use existing --daw-orange) |
| `invoice` | VAT INVOICE INFO | `violet` |
| `contacts` | CONTACT PERSONS | `teal` |
| `stores` | STORE LIST | `blue` |
| `fees` | FEE TABLE | `indigo` |

Each Rack call in FormView should look like:
```tsx
<Rack id="meta" title="CONTRACT METADATA" filled={...} total={2} defaultOpen cueColor="picton">
<Rack id="partyB" title="PARTY B IDENTITY" filled={...} total={6} cueColor="rose">
<Rack id="partyBBank" title="PARTY B BANK" filled={...} total={3} cueColor="gold">
<Rack id="term" title="TERM" filled={...} total={2} cueColor="green">
<Rack id="pricing" title="SERVICE PRICING" filled={0} total={9} cueColor="daw-orange">
<Rack id="invoice" title="VAT INVOICE INFO" filled={0} total={3} cueColor="violet">
<Rack id="contacts" title="CONTACT PERSONS" filled={0} total={6} cueColor="teal">
<Rack id="stores" title="STORE LIST (APPENDIX 1)" filled={0} total={0} badge="0 rows" cueColor="blue">
<Rack id="fees" title="FEE TABLE (APPENDIX 2)" filled={0} total={0} badge="computed" cueColor="indigo">
```

### 1D. Rack.tsx — accept and apply cueColor prop

Update `Rack.tsx` to:
1. Add `cueColor?: string` to the Props interface
2. Map cueColor string to CSS variables in a style object on the root `.rack` div

```tsx
// Cue color mapping
const CUE_MAP: Record<string, { cue: string; dim: string; glow: string }> = {
  picton:      { cue: 'var(--picton)',      dim: 'var(--picton-dim)',      glow: 'rgba(68,204,255,0.25)' },
  rose:        { cue: 'var(--cue-rose)',    dim: 'var(--cue-rose-dim)',    glow: 'var(--cue-rose-glow)' },
  gold:        { cue: 'var(--cue-gold)',    dim: 'var(--cue-gold-dim)',    glow: 'var(--cue-gold-glow)' },
  green:       { cue: 'var(--cue-green)',   dim: 'var(--cue-green-dim)',   glow: 'var(--cue-green-glow)' },
  'daw-orange':{ cue: 'var(--daw-orange)',  dim: 'var(--daw-orange-dim)', glow: 'var(--daw-orange-glow)' },
  violet:      { cue: 'var(--cue-violet)',  dim: 'var(--cue-violet-dim)', glow: 'var(--cue-violet-glow)' },
  teal:        { cue: 'var(--cue-teal)',    dim: 'var(--cue-teal-dim)',    glow: 'var(--cue-teal-glow)' },
  blue:        { cue: 'var(--cue-blue)',    dim: 'var(--cue-blue-dim)',    glow: 'var(--cue-blue-glow)' },
  indigo:      { cue: 'var(--cue-indigo)',  dim: 'var(--cue-indigo-dim)', glow: 'var(--cue-indigo-glow)' },
}

// In the component, compute style:
const cue = cueColor ? CUE_MAP[cueColor] : undefined
const rackStyle = cue ? {
  '--rack-cue': cue.cue,
  '--rack-cue-dim': cue.dim,
  '--rack-cue-glow': cue.glow,
} as React.CSSProperties : undefined

// Apply on root div:
<div className={`rack${open ? ' rack-open' : ''}`} id={`rack-${id}`} style={rackStyle}>
```

---

## TASK 2 — De-pear-ify (Remove Pear/Picton Overuse)

The brand colors `--pear` and `--picton` should ONLY appear at:
- The logo/brand mark in the Library topbar
- The primary CTA "NEW" button on template cards
- The "EXPORT DOCX" button when ready state
- The `::selection` highlight
- The `.primary-btn` in modals

**Remove pear from these (replace with neutral or cue-specific):**

| Selector | Current | Replace with |
|----------|---------|-------------|
| `.lib-chip.active` (line 88) | `background: var(--pear); border-color: var(--pear); color: #000` | `background: var(--text-secondary); border-color: var(--text-secondary); color: #000` |
| `.preview-tab.active` (line 238) | `color: var(--pear); border-bottom-color: var(--pear)` | `color: var(--text-primary); border-bottom-color: var(--text-secondary)` |
| `.form-back-btn:hover` (line 165) | `border-color: var(--pear); color: var(--pear)` | `border-color: var(--text-secondary); color: var(--text-primary)` |
| `.split-handle:hover .split-handle-bar` (line 179) | `background: var(--pear)` | `background: var(--text-tertiary)` |
| `.statusbar-pct` (line 256) | `color: var(--pear)` | `color: var(--text-primary)` |
| `.statusbar-bar-fill` (line 258) | `background: var(--pear)` | `background: linear-gradient(90deg, var(--cue-teal), var(--cue-green))` — a gradient that gives the status bar its own identity |
| `.field-input:focus` (line 220) | `border-color: var(--pear); box-shadow: 0 0 0 2px var(--pear-dim)` | `border-color: var(--text-secondary); box-shadow: 0 0 0 2px rgba(176, 176, 184, 0.12)` — this is the DEFAULT outside of racks; inside racks the `.rack .field-input:focus` rule from Task 1 will use the cue color |

**Keep pear on:**
- `.tpl-new-btn` (line 121) — this is a primary CTA ✓
- `.template-card:hover .tpl-new-btn` glow (line 124) ✓
- `.tpl-led` (line 126) ✓
- `.primary-btn` (line 292) ✓
- `::selection` (line 41) ✓
- `.signal-dot` (line 57-58) ✓

---

## TASK 3 — Breathing & Glow Effects

### 3A. Enhanced keyframes

Replace the current animation block (lines 51-55) with this expanded set:

```css
/* ─── ANIMATIONS ───────────────────────────────────────────────────────── */
@keyframes pulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes ledBreathe {
  0%, 100% { box-shadow: 0 0 3px var(--led-color); opacity: 0.85; }
  50% { box-shadow: 0 0 10px var(--led-color), 0 0 20px color-mix(in srgb, var(--led-color) 30%, transparent); opacity: 1; }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 4px var(--glow-color); filter: brightness(1); }
  50% { box-shadow: 0 0 14px var(--glow-color); filter: brightness(1.06); }
}
@keyframes breatheOverlay {
  0%, 100% { opacity: 0.2; transform: scaleX(0.97); }
  50% { opacity: 0.6; transform: scaleX(1); }
}
@keyframes rackSlideDown {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 600px; }
}
@keyframes staggerFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### 3B. LED glow on rack headers

The LED dots should visibly glow when a rack has data. Update `.rack-led-complete`:

```css
.rack-led-complete {
  background: var(--rack-cue);
  --led-color: var(--rack-cue-glow);
  animation: ledBreathe 2.4s ease-in-out infinite;
  box-shadow: 0 0 6px var(--rack-cue-glow);
}
```

### 3C. Hover glow on interactive buttons

Add glow feedback to buttons that currently only change border color:

```css
/* Settings button glow */
.lib-settings-btn:hover {
  border-color: var(--daw-yellow);
  color: var(--daw-yellow);
  box-shadow: 0 0 8px rgba(255, 211, 0, 0.15);
}

/* Template card hover glow */
.template-card:hover {
  border-color: var(--border-dim);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px var(--pear-dim);
}

/* Back button hover glow */
.form-back-btn:hover {
  border-color: var(--text-secondary);
  color: var(--text-primary);
  box-shadow: 0 0 6px rgba(176, 176, 184, 0.15);
}

/* Rack add-btn breathing when hovered */
.rack-add-btn:hover {
  border-color: var(--rack-cue);
  color: var(--rack-cue);
  box-shadow: 0 0 10px var(--rack-cue-dim);
}
```

### 3D. Export button breathing when ready

The export button should breathe/pulse when form is complete:

```css
.statusbar-btn.export-action.ready {
  background: var(--daw-orange);
  border-color: var(--daw-orange);
  color: #000;
  --glow-color: var(--daw-orange-glow);
  animation: glowPulse 2.0s ease-in-out infinite;
  position: relative;
  isolation: isolate;
}
.statusbar-btn.export-action.ready::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: 2px;
  background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2), transparent 60%);
  animation: breatheOverlay 2.0s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}
```

---

## TASK 4 — Micro-Animations

### 4A. Rack open/close smooth transition

Currently `rack-body` uses `height: auto` toggle which can't animate. Replace with `max-height` + CSS transition or use `grid-template-rows` trick.

In `Rack.tsx`, change the body div from:
```tsx
<div className="rack-body" style={{ height: open ? 'auto' : 0, overflow: 'hidden', opacity: open ? 1 : 0 }}>
```
to:
```tsx
<div className={`rack-body${open ? ' rack-body-open' : ''}`}>
```

In `styles.css`, update `.rack-body`:
```css
.rack-body {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 250ms var(--ease-out), opacity 200ms 50ms;
}
.rack-body-open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.rack-content {
  overflow: hidden;
  padding: 0 12px;
  transition: padding 250ms var(--ease-out);
}
.rack-body-open .rack-content {
  padding: 14px 12px;
}
```

### 4B. Staggered rack entrance

Each rack should fade in with a stagger delay. In `FormView.tsx`, pass an `index` prop to each Rack (0–8). In `Rack.tsx`, apply:
```tsx
style={{ ...rackStyle, animationDelay: `${index * 40}ms` }}
```

In CSS, update `.rack`:
```css
.rack {
  /* existing styles... */
  animation: staggerFadeIn 300ms var(--ease-out) both;
}
```

### 4C. Rack header triangle rotation

Currently the triangle is text that swaps between ▼ and ▶. Replace with a CSS-rotated chevron SVG for smooth rotation:

In `Rack.tsx`, replace `<span className="rack-triangle">{open ? '▼' : '▶'}</span>` with:
```tsx
<span className={`rack-triangle${open ? ' rack-triangle-open' : ''}`}>
  <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
    <path d="M2 1l4 3-4 3z"/>
  </svg>
</span>
```

In CSS:
```css
.rack-triangle {
  display: flex; align-items: center; justify-content: center;
  width: 12px; color: var(--text-dim);
  transition: transform 200ms var(--ease-out), color 200ms;
}
.rack-triangle-open {
  transform: rotate(90deg);
  color: var(--rack-cue);
}
```

### 4D. Input focus micro-animation

Add a subtle scale on focus:
```css
.field-input {
  /* add to existing */
  transition: border-color 200ms, box-shadow 200ms, transform 100ms;
}
.field-input:focus {
  transform: translateY(-0.5px);
}
```

### 4E. Tab switch indicator animation

Replace instant border-bottom swap with an animated underline using a pseudo-element:

```css
.preview-tab {
  position: relative;
}
.preview-tab::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--text-secondary);
  transition: width 200ms var(--ease-out), left 200ms var(--ease-out);
}
.preview-tab.active::after {
  width: 100%;
  left: 0;
}
```
Remove `border-bottom: 2px solid transparent` and `border-bottom-color` from the existing `.preview-tab` and `.preview-tab.active` rules.

### 4F. Draft chip hover micro-interaction

```css
.draft-chip:hover {
  border-color: var(--border-dim);
  background: var(--bg-elevated);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.draft-chip {
  /* add to existing transition */
  transition: all 180ms var(--ease-out);
}
```

### 4G. View transition (Library → Form)

Wrap the view switch in App.tsx with a fade. Add a CSS class:
```css
.view-enter {
  animation: fadeIn 250ms var(--ease-out) both;
}
```
In `App.tsx`, wrap each view with `<div className="view-enter" key={view.type}>`.

---

## TASK 5 — Missing Ableton Elements

### 5A. VU-meter style segmented progress bar in StatusBar

Replace the plain progress bar in the status bar with a VU-meter style segmented bar (like `store-vu` in xms-calc).

In `StatusBar.tsx`, replace the statusbar-bar div:
```tsx
<div className="statusbar-vu">
  <div className="statusbar-vu-fill" style={{ width: `${completeness}%` }} />
</div>
```

In CSS:
```css
.statusbar-vu {
  width: 100px;
  height: 4px;
  background: var(--bg-elevated);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}
.statusbar-vu::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    90deg,
    transparent, transparent 3px,
    var(--bg-inset) 3px, var(--bg-inset) 4px
  );
  z-index: 1;
}
.statusbar-vu-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cue-teal), var(--cue-green));
  border-radius: 2px;
  transition: width 400ms var(--ease-spring);
}
```

Remove the old `.statusbar-bar` and `.statusbar-bar-fill` CSS rules.

### 5B. Rack header hover — cue color accent line

When hovering a rack header, show a subtle left accent:
```css
.rack-header:hover {
  background: var(--bg-hover);
  box-shadow: inset 3px 0 0 var(--rack-cue);
}
```

### 5C. Active chip breathing dot

When the "ALL" chip is active, add a tiny breathing dot before the text. In `LibraryView.tsx`, update the active chip:
```tsx
<button className="lib-chip active">
  <span className="chip-dot" />ALL
</button>
```

In CSS:
```css
.chip-dot {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #000;
  margin-right: 6px;
  animation: pulse 2s ease-in-out infinite;
  vertical-align: middle;
}
```

### 5D. Rack counter — use cue color when partial/complete

Update `.rack-counter` and `.rack-badge` to reflect the cue color when data exists:

```css
.rack-counter {
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 0.1em;
  font-weight: 600;
  transition: color 300ms;
}
.rack-open .rack-counter {
  color: color-mix(in srgb, var(--rack-cue) 70%, var(--text-dim));
}
.rack-badge {
  font-size: 9px;
  color: var(--rack-cue);
  letter-spacing: 0.1em;
  font-weight: 600;
  text-transform: uppercase;
}
```

---

## TASK 6 — Polish Details

### 6A. Scrollbar cue tint

When scrolling the form pane, tint the scrollbar thumb with a subtle color:
```css
.form-scroll::-webkit-scrollbar-thumb {
  background: var(--border-dim);
}
.form-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--text-dim);
}
```

### 6B. Template card thumbnail lines — animate on hover

The abstract document lines in template cards should animate width on hover:
```css
.tpl-line {
  height: 3px;
  background: var(--border-dim);
  border-radius: 1px;
  transition: background 300ms, width 400ms var(--ease-spring);
}
.template-card:hover .tpl-line:nth-child(odd) {
  width: 95% !important;
}
.template-card:hover .tpl-line:nth-child(even) {
  width: 70% !important;
}
```

### 6C. Modal entrance animation

Enhance the modal with a scale + fade entrance:
```css
.modal-content {
  animation: modalIn 220ms var(--ease-out);
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-overlay {
  animation: fadeIn 200ms ease-out;
}
```

### 6D. StatusBar dot — use daw-orange when active (not yellow)

Currently `.statusbar-dot.active` uses `--daw-yellow`. Keep as-is, but add a glow:
```css
.statusbar-dot.active {
  background: var(--daw-yellow);
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 0 0 6px var(--cue-gold-glow);
}
```

---

## Execution Order

1. **CSS variables first** (Task 1A) — add all cue color tokens to `:root`
2. **Rack CSS changes** (Task 1B, 3B, 4A, 5B, 5D) — all rack-related CSS updates
3. **De-pear replacements** (Task 2) — swap pear usages to neutral
4. **Animation keyframes** (Task 3A) — add new keyframe definitions
5. **Glow effects** (Task 3C, 3D) — button hover glows and breathe effects
6. **Micro-animation CSS** (Task 4B–4G, 5A–5C, 6A–6D) — remaining CSS additions
7. **Rack.tsx** (Task 1D, 4A, 4C) — add cueColor prop, CSS grid body, SVG triangle
8. **FormView.tsx** (Task 1C, 4B) — add cueColor prop to each Rack, add index
9. **StatusBar.tsx** (Task 5A) — replace progress bar with VU meter
10. **LibraryView.tsx** (Task 5C) — add chip-dot
11. **App.tsx** (Task 4G) — wrap views with transition class

## Verification Checklist

After implementing, visually verify:
- [ ] Each rack has a unique colored left strip (3px)
- [ ] LED dots glow and breathe when rack has data
- [ ] Racks open/close with smooth CSS grid animation (no snap)
- [ ] Triangle chevron rotates smoothly (not text swap)
- [ ] Input focus rings match the rack's cue color
- [ ] No pear/lime-green on: chips, tabs, back button, split handle, progress bar
- [ ] Pear ONLY on: NEW button, brand logo, Export ready, primary-btn, ::selection
- [ ] Template card lines animate width on hover
- [ ] Status bar has VU-meter segmented style progress
- [ ] Export button breathes/pulses when form is 100% complete
- [ ] Racks stagger-animate on mount (40ms delay between each)
- [ ] Preview tab underline animates on switch
- [ ] Modal has scale+fade entrance
- [ ] Settings gear button has yellow glow on hover
- [ ] Draft chips lift slightly on hover with shadow

---

*Generated for agent execution. All code snippets are copy-paste ready. All line numbers reference the current state of files as of this plan's creation.*
