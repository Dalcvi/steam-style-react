# Table

## Purpose

A list with **named, resizable, sortable columns** and a header strip above the
rows. This is the server browser's server list — the single most recognisable
screen in the whole theme — plus the Steam client's games list and the friends
dialog.

`Table` is `List` plus a header. Everything in `List.md` applies here: the
recessed and raised bevels, the `BorderDark` row selection, `PerPixelScrolling`,
`PostSectionLeading`. This document covers only what the header, the columns and
the section collapser add.

## VGUI original

The interesting part is that **Valve already wrote the green column header, and
it is not where the comments say it is.**

**The column header** (`steam.styles:1385–1408`):

```
ListPanelColumnheader
{
    font-family = basefont
    font-size = 14
    font-size = 15 [$OSX]
    font-weight = 100
    textcolor = White
    bgcolor = none
    inset = "1 0 0 0"
    render_bg
    {
        1="fill( x0, y0, x1, y0 + 1, BorderBright )"   // top
        2="fill( x0, y1 - 1, x1, y1, BorderDark )"     // bottom
        3="fill( x0, y0, x0 + 1, y1 - 1, BorderBright )" // left
        4="fill( x1 - 1, y0, x1, y1, BorderDark )"     // right
        5="fill( x0 + 1, y0 + 1, x1 - 2, y1 - 1, GreenBG )" // inside
    }
}
    ListPanelColumnHeader:hover
    {
        textcolor = White
    }
```

**The main-client variant** (`steam.styles:1410–1424`), which differs by three
properties:

```
"Csteamrootdialog ListPanelColumnheader"
{
    font-family = basefont
    font-size = 14
    font-size = 15 [$OSX]
    font-weight = 100
    textcolor = White
    font-style = uppercase      // <-- only here
    bgcolor = none
    inset = "0 0 0 0"           // <-- and no 1px top inset
    padding-top = 1
                                // <-- and no render_bg at all
}
    "Csteamrootdialog ListPanelColumnHeader:hover" { textcolor = White }
```

**It drops `render_bg` entirely.** The base block paints a `GreenBG` interior
and a four-sided bevel; this one does not repeat that `render_bg` and VGUI has no
style-block inheritance, so the main client's header may draw **no fill and no
bevel**, taking whatever is behind it. That is a genuine gap in the stylesheet
rather than an oversight to paper over: either `CSteamRootDialog` supplied the
strip itself, or the header really was flat in the main window and bevelled only
in dialogs. The web implementation cannot rely on inheritance the source does not
have, so `--header-uppercase` in the recipe deliberately keeps the base `head`
bevel and changes **only** the text transform.

**Style-name capitalisation is inconsistent in the file and it matters.**
`:1385` says `ListPanelColumnheader`, `:1405` says `ListPanelColumnHeader:hover`,
`:1374` says `ListPanelColumnHeader ListPanelCheckBox:selected`. VGUI style names
are matched literally, so these are three distinct selectors — a
`ListPanelColumnHeader:hover` rule does **not** apply to a `ListPanelColumnheader`
control. Any implementation that lower-cases or normalises these names is
inventing a lookup mechanism the engine does not have.

**The colour that *claims* to be the column header** (`steam.styles:43`):

```
ButtonFace2="92 89 86 255"    // "for use in main client list panel column header, some button states"
```

That comment belongs to the grey/clay theme. In the shipped green theme the
header's `render_bg` fills `GreenBG` `#4C5844`, and `ButtonFace2` `#5C5956` is
referenced by no green block. **Valve's own comment on `ButtonFace2` is stale**,
and a doc that trusts it will paint the header the wrong colour.

**The column chooser button** (`steam.styles:1441–1486`), commented by Valve as
*"the games list column chooser"*:

```
ListPanelColumnSelectButton // the games list column chooser
{
    inset="2 2 1 0"
    render
    {
        1="fill( x0, y0, x1, y0 + 1, BorderBright )"   // top
        2="fill( x0, y1 - 1, x1, y1, BorderDark )"     // bottom
        3="fill( x0, y0, x0 + 1, y1 - 1, BorderBright )" // left
        4="fill( x1 - 1, y0, x1, y1, BorderDark )"     // right
        5="fill( x0 + 1, y0 + 1, x1 - 1, y1 - 1, GreenBG )" // inside
        6="image( x0 + 6, y0 + 6, x1, y1, graphics/icon_expand )"
    }
}
```

Its `:selected` state (`:1472`) **rotates the bevel** to top/left `BorderDark`
and bottom/right `BorderBright` — pressed in — and swaps the glyph to
`icon_expand_over`. The `"CGamesListPanel ListPanelColumnSelectButton:selected"`
variant (`:1520`) does the same rotation and additionally paints **outside its own
box**:

```
2="fill( x0 + 1, y1 - 1, x1 - 1, y1 + 2, GreenBG )"  // bottom, extended 2px past y1
```

`y1 + 2` is the same trick `PageTab:selected` uses (`steam.styles:1810`) —
**painting past the control's own bounds to erase the seam with the surface
below it.** See `Tabs.md`; it is the single most repeated idiom in the theme.

**The column dragger** (`steam.styles:1536`), in full:

```
ListPanelDragger
{
    bgcolor="none"
}
```

That is the entire definition of the handle used to resize a column. **There is
no visible affordance** — no grip, no highlight, no hover state. Column
resizing was discovered only by moving the pointer until the cursor changed.

**The section collapser** (`steam.styles:1622–1644`):

```
ListPanelSectionCollapser [!$OSX]
{
    bgcolor = none
    inset = "-4 0 0 0"
    padding-top = -2
    padding-bottom = -2
    image = "graphics/icon_expand"
}
ListPanelSectionCollapser:hover          [!$OSX] { image = "graphics/icon_expand_over" }
ListPanelSectionCollapser:selected       [!$OSX] { image = "graphics/icon_collapse" }
ListPanelSectionCollapser:selected:hover [!$OSX] { image = "graphics/icon_collapse_over" }
```

The `[!$OSX]` guard means macOS drew no glyph at all.

**The SDK's `SectionedListPanel`** (`steam.styles:2321–2344`) — a *second*,
independent list-with-sections definition:

```
SectionedListPanel
{
    bgcolor = none
    inset = "0 0 0 0"
    font-family = basefont
    font-size = 14
    font-size = 16 [$OSX]
    font-weight = 400
    textcolor = Text
    selectedtextcolor = White
    selectedbgcolor = MaizeBG
}

"CFriendsDialog SectionedListPanel" { /* identical, no inset */ }
```

**Its section collapser is a different block with *the same* images but no
overhang** (`steam.styles:2347–2365`) — `SectionedlistpanelCollapser`, which
lists the identical four `icon_expand`/`icon_collapse` files as
`ListPanelSectionCollapser` but carries `inset = "0 0 0 0"`, no negative padding
and an `render_bg {}` that is empty. Same 14×9 glyph, drawn flush in its slot
instead of overhanging it. Two blocks, two placements, one glyph.

Note also that the `SectionedListPanel` block declares `bgcolor = none` **twice**
(`:2323` and `:2331`) — harmless in VGUI but a sign of how accreted the file is.

The SDK's `SectionedListPanel` is the **second, independent** list-with-sections
definition:

**The real dialog layout** (`F:\steam-style\OG-Steam\OG-Steam\servers\DialogServerBrowser.res`)
and the page inside it (`servers\InternetGamesPage.res`) supply the metrics the
stylesheet omits:

```
CServerBrowserDialog   Frame        602 x 387
GameTabs               PropertySheet  1, 17   638 x 345   autoResize 3
StatusLabel            Label       11, 362   544 x 24    style="status"
InternetGames          CInternetGames  0, 28   624 x 278
gamelist               ListPanel     8,  8   608 x 226   <-- a plain ListPanel, not SectionedListPanel
ConnectButton          Button     512, 244   104 x 24
RefreshButton          Button     399, 244   104 x 24
RefreshQuickButton     Button     267, 244   124 x 24
Filter                 ToggleButton  8, 244   128 x 24
layout: region "bottom" align=bottom height=34 margin=0
        buttons spacing=8 margin-right=10 height=24 align=right
```

`Button` height in this dialog is a uniform **24px**, and the bottom button bar
is a **34px** region holding 24px controls with **8px** spacing. Those three
numbers are the ones to keep.

The page also carries an inline style block, which proves the corpus styles
controls *per dialog* via `.res` rather than only via class names:

```
styles { status { bgcolor="none"  inset="8 0 0 0" } }
```

### Four things to extract

1. **The server browser's list is a plain `ListPanel`, not a
   `SectionedListPanel`.** `servers\InternetGamesPage.res` sets `"gamelist"` →
   `"ControlName" "ListPanel"`. So the iconic server list uses the `ListPanel`
   bevel and the `BorderDark` row selection, **not** maize. Anyone reconstructing
   the server browser from memory will reach for the wrong block: the
   `SectionedListPanel` with its maize selection belongs to the SDK and the
   friends dialog, not to the server browser.
2. **The column header is `GreenBG` `#4C5844` with `White` 14px weight-100 text —
   5.50:1, comfortably AA — and it is a raised bevel** (top/left
   `BorderBright`, bottom/right `BorderDark`). The header sits on top of a
   recessed `ListPanel`, so header-lifted-over-well-recessed is the whole visual
   grammar of the server browser in one line of CSS.
3. **`ListPanelDragger` defines no visual at all** — resizing a column had no
   affordance beyond the cursor. On the web this is a 1.4.11 failure by
   construction: there is no visible indicator. A recreation needs a visible
   divider, and that is a deliberate, documented departure.
4. **The header's hover state is a no-op and the uppercase header is
   window-specific.** `ListPanelColumnHeader:hover` sets `textcolor = White` when
   `textcolor` is already `White`; only
   `"Csteamrootdialog ListPanelColumnheader"` adds `font-style = uppercase`.
   So column headers are uppercase **in the main client window only** and
   title-case in dialogs. Reproducing one global uppercase style is wrong.

## Variants

| Variant | Class | Notes |
| --- | --- | --- |
| Default | `vgui-table` | Recessed rows + `GreenBG` header |
| Uppercase header | `--header-uppercase` | `"Csteamrootdialog ListPanelColumnheader"` |
| Sectioned | `--sectioned` | `SectionedListPanel`: `MaizeBG` rows |
| Resizable | `--resizable` | Requires a **visible** dragger, see departure note |
| Sortable | `--sortable` | No VGUI precedent, see Open questions |
| Selectable columns | `--column-chooser` | `ListPanelColumnSelectButton` |
| Header checkbox | — | `ListPanelColumnheader ListPanelCheckBox` |

## Anatomy

```html
<div class="vgui-table" role="grid" aria-label="Servers" aria-rowcount="42">
  <div class="vgui-table__head" role="row">
    <div class="vgui-table__th" role="columnheader" aria-sort="descending"
         aria-colindex="1" tabindex="0">
      <span class="vgui-table__th-label">Servers</span>
    </div>
    <div class="vgui-table__th" role="columnheader" aria-colindex="2" tabindex="-1">
      <span class="vgui-table__th-label">Map</span>
    </div>
    <div class="vgui-table__th" role="columnheader" aria-colindex="3" tabindex="-1">
      <span class="vgui-table__th-label">Players</span>
    </div>
    <div class="vgui-table__th" role="columnheader" aria-colindex="4" tabindex="-1">
      <span class="vgui-table__th-icon vgui-table__th-icon--secure"
            aria-hidden="true"></span>
      <span class="vgui-table__th-label">VAC</span>
    </div>
    <div class="vgui-table__dragger" role="separator"
         aria-orientation="vertical" aria-label="Resize Map column"
         aria-valuenow="120" tabindex="0"></div>
  </div>
  <div class="vgui-table__body" role="rowgroup">
    <div class="vgui-table__row vgui-table__row--selected" role="row"
         aria-selected="true" aria-rowindex="1">
      <div class="vgui-table__cell" role="gridcell">My favourite server</div>
      <div class="vgui-table__cell" role="gridcell">de_dust2</div>
      <div class="vgui-table__cell" role="gridcell">12/24</div>
      <div class="vgui-table__cell" role="gridcell">
        <span class="vgui-table__icon vgui-table__icon--secure" aria-label="VAC secured"></span>
      </div>
    </div>
  </div>
</div>
```

`role="grid"` (not `listbox`) is the right role once there are columns: it makes
`aria-colindex`/`aria-sort` meaningful and lets a screen reader announce "Servers,
column 1 of 4".

## States

| State | Fill | Text |
| --- | --- | --- |
| Header strip | `#4C5844` (`GreenBG`) via `render_bg` | `#FFFFFF`, 14px, weight 100 — 5.50:1 |
| Header bevel | top/left `#808080`; bottom/right `#282E22` | — |
| Header, hover | unchanged | `#FFFFFF` — **identical to idle, i.e. a no-op** |
| Header, sorted | *unspecified* | *unspecified* — see Open questions |
| Header, pressed | bevel rotated (top/left `#282E22`, bottom/right `#808080`) | `#FFFFFF` |
| Dragger | transparent | none at all |
| Row, idle | transparent over `#3E4637` | `#FFFFFF` |
| Row, selected | `#282E22` (`BorderDark`) | `#FFFFFF` — 13.96:1 |
| Row, selected (`SectionedListPanel`) | `#91863C` (`MaizeBG`) | `#FFFFFF` — **3.70:1, fails** |
| Section header | transparent | `#C4B550` (`Over`) — 4.72:1 |
| Column chooser | `#4C5844`, glyph at `+6,+6` | — |

## Tokens

Everything from `List.md`, plus:

| Token | Value | Where |
| --- | --- | --- |
| `--vgui-table-header-bg` | `#4C5844` | `ListPanelColumnheader` render_bg fill (`GreenBG`) — same value as `--vgui-surface` |
| `--vgui-table-header-text` | `#FFFFFF` | `textcolor White` |
| `--vgui-table-header-weight` | `400`→`100 (CSS)` | `font-weight = 100`, VGUI's lightest — **new token** |
| `--vgui-table-dragger-width` | `1px` | No corpus value; the dragger is invisible — **inferred** |
| `--vgui-table-row-height` | `17px` | Same inference as `List` |

`font-weight = 100` is VGUI's lightest weight; in CSS the nearest equivalent is
`font-weight: 200` with Tahoma, or `300` with a fallback stack. Do **not** map it
to `font-weight: 100` blindly — most fonts lack a 100 weight and the browser will
silently use 400, which is a different look from the original's light headers.

## CSS recipe

```css
.vgui-table {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  /* The body keeps List's bevel; the head sits outside it. */
}

/* ---- Header: ListPanelColumnheader ---- */
.vgui-table__head {
  display: flex;
  background-color: var(--vgui-table-header-bg, #4c5844);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-right: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  color: var(--vgui-table-header-text, #fff);
  font-weight: 200;             /* VGUI font-weight 100; see Tokens */
  /* Do NOT add a :hover rule — the corpus hover is a no-op. A real hover here
     is a departure; if taken, make it the header's own pressed/rotated bevel,
     not a colour change, so it stays inside the vocabulary. */
}

.vgui-table--header-uppercase .vgui-table__head {
  text-transform: uppercase;    /* "Csteamrootdialog ListPanelColumnheader" */
}

.vgui-table__th {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 4px;
  cursor: default;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
}

/* ---- Dragger: ListPanelDragger ---- */
/* The corpus draws NOTHING here. A visible 1px divider is a deliberate,
   documented departure — see Accessibility. */
.vgui-table__dragger {
  flex: 0 0 var(--vgui-table-dragger-width, 1px);
  align-self: stretch;
  background-color: var(--vgui-bevel-dark);
  cursor: col-resize;
}

.vgui-table__dragger:focus-visible {
  outline: 1px dotted var(--vgui-text, #d8ded3);
  outline-offset: -1px;
}

/* ---- Body: same grammar as List ---- */
.vgui-table__body {
  background-color: var(--vgui-list-bg, #3e4637);
  border-top: 0;                       /* the head already painted the seam */
  border-left: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-light);
  overflow-y: auto;
}

.vgui-table__row {
  display: flex;
  min-height: var(--vgui-table-row-height, 17px);
  color: var(--vgui-text-strong, #fff);
  cursor: default;
}

.vgui-table__row[aria-selected='true'] {
  background-color: var(--vgui-list-selected-bg, #282e22);
}

.vgui-table__cell {
  padding: 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Header sits on a lit strip and rows sit on a dark one, so the two need
   different contrast partners: GreenBG for the header, DarkGreenBG for rows.
   Getting this backwards is the most likely styling mistake in this component. */
```

**The `border-top: 0` on the body is the seam erasure.** The header's
`border-bottom` is `BorderDark` and the body's `border-top` would be
`BorderDark` too, producing a 2px double line. Removing the body's top border
reproduces what `PageTab:selected` does with its `y1 + 2` fill: **paint the
boundary once, from the element above.** Prefer that to `margin-top: -1px`, which
changes the paint order and can hide the header's own bottom edge behind the
body — see `Tabs.md` for the full argument.

## React API

```tsx
export interface TableColumn<Row> {
  /** Stable identity; also the aria-colindex key. */
  id: string
  /** Header label. */
  header: string
  /** Cell renderer for a row. */
  cell: (row: Row) => React.ReactNode
  /** Fixed width in pixels; omit to flex. */
  width?: number
  /** Initial width when resizable and uncontrolled. */
  defaultWidth?: number
  /** Makes the header a sort button for this column. */
  sortable?: boolean
  /** Header alignment; VGUI headers are left-aligned. */
  align?: 'start' | 'center' | 'end'
  /** Optional header glyph, e.g. the VAC shield. */
  headerIcon?: React.ReactNode
}

export interface TableProps<Row> {
  /** Column definitions, in display order. */
  columns: TableColumn<Row>[]
  /** Row data. */
  rows: Row[]
  /** Returns the stable id used for selection and React keys. */
  rowId: (row: Row) => string
  /** Controlled selection. Use string[] when multi is set. */
  selected?: string | string[]
  /** Initial selection when uncontrolled. */
  defaultSelected?: string | string[]
  /** Allows Ctrl/Shift multi-selection. */
  multi?: boolean
  /** Called with the new selection. */
  onSelectedChange?: (ids: string | string[]) => void
  /** Controlled sort. */
  sort?: { columnId: string; direction: 'asc' | 'desc' }
  /** Called when a sortable header is activated. */
  onSortChange?: (sort: { columnId: string; direction: 'asc' | 'desc' }) => void
  /** Allows column resizing with a visible dragger. */
  resizable?: boolean
  /** Called with the new width after a resize gesture ends. */
  onColumnResize?: (columnId: string, width: number) => void
  /** Renders headers in uppercase, as the main client window does. */
  headerUppercase?: boolean
  /** Sticky header. No corpus precedent; see Open questions. */
  stickyHeader?: boolean
}
```

## Accessibility

- **`role="grid"` with `role="row"`, `role="columnheader"`, `role="gridcell"`**,
  plus `aria-colindex` on every header and cell and `aria-rowcount`/`aria-rowindex`
  on the grid. Without the indices a screen reader announces cells with no
  position, and a table is exactly the case where position is the information.
- **Sorting must be announced, not just shown.** `aria-sort` goes on the
  *sorted* header only, with a value of `ascending`/`descending`/`none` — never
  on the others. A visual triangle alone is invisible to assistive technology.
- **Sortable headers are buttons.** Wrap the label in a `<button>` (or make the
  `columnheader` focusable with a roving `tabindex`) so it is reachable and
  activatable by keyboard. `Enter` and `Space` must both sort, and the sort
  direction must cycle `ascending` → `descending` → (optionally) unsorted.
- **The resizable divider is a `role="separator"` that must be keyboard
  operable.** `WRIA` requires arrow keys to resize when a separator is focusable,
  and `aria-valuenow` must reflect the column width. **This is the clearest
  departure in the component:** `ListPanelDragger { bgcolor="none" }` gives the
  original no visible and no keyboard-accessible resizing at all. A recreation
  must supply both, and should say so.
- **The header contrast is fine, and the row contrast is not.** White on
  `GreenBG` `#4C5844` is **5.50:1** ✓. White on the selected row's `#282E22` is
  **13.96:1** ✓, but the selected *fill* against the row interior is
  **1.41:1** ✗ — the same 1.4.11 problem as `List`, and it needs the same
  non-colour cue. The `SectionedListPanel` variant is worse in a different way:
  `White` on `MaizeBG` is **3.70:1** ✗, and it should use `Down` `#232421`
  (**4.22:1**) instead. **Do not ship white-on-maize.**
- **`GameslistText` `#E6ECE0` is the right row colour for this table.** It gives
  **7.06:1** on `GrayBG` and **12.73:1** on the dark interiors, and Valve created
  it specifically for the games list. There is no reason to use anything dimmer.
- **Column headers must be reachable.** A grid with `tabindex="-1"` on every
  header and no entry point leaves keyboard users unable to sort. Give the grid a
  single tab stop that lands on the first header, then rove.
- **Icon-only columns need names.** The VAC/lock/bots columns
  (`icon_password_column`, `icon_robotron_column`, `icon_secure_deny`, all
  **16×16**) convey meaning entirely through a glyph. The header must carry a
  text alternative (`aria-label="VAC secured"`) and each cell's icon needs its own
  label or `role="img"` with a name — a bare `background-image` is invisible to
  assistive technology and to anyone who cannot distinguish the glyphs.
- **Do not rely on the 2px seam trick for information.** The `y1 + 2` overdraw is
  purely decorative; nothing about state may depend on a pixel that lives outside
  its owner's box, because it disappears under `overflow: hidden`.
- **Empty and loading states.** The server browser has both (a refresh in
  progress, and no matches). The corpus's `GameslistFadingBG` `#3D423D` hints at
  the refresh treatment but no duration or use site exists — treat the fade as
  invention and pair it with an `aria-live` status plus `aria-busy="true"` on the
  grid.

## Assets

Measured from the actual `.tga` headers:

| Asset | Size | Role |
| --- | --- | --- |
| `servers/icon_secure_deny.tga` | 16×16 | VAC/secured column glyph |
| `servers/icon_bots_column.tga` | 16×16 | "has bots" column header glyph |
| `servers/icon_password_column.tga` | 16×16 | Password column header glyph |
| `servers/icon_robotron_column.tga` | 16×16 | Robot-players column header glyph |
| `servers/icon_bots.tga` | 16×16 | Row-level bots glyph |
| `servers/icon_password.tga` | 16×16 | Row-level password glyph |
| `servers/icon_robotron.tga` | 16×16 | Row-level robot glyph |
| `graphics/icon_expand.tga` | 14×9 | Column-chooser glyph (`x0 + 6, y0 + 6`) |
| `graphics/icon_expand_over.tga` | 14×9 | Chooser hover and `:selected` |
| `graphics/chk*_Sm.tga` | 12×12 | Header checkbox, six states (see `List.md`) |

Two things worth noting. The `_column` variants are **the same 16×16 size as the
row glyphs**, which means the column header is *text plus a 16×16 icon*, not a
pre-rendered header strip — the header can be laid out rather than sliced. And
the column chooser reuses `icon_expand`, the *section collapser* glyph, for a
completely different job; there is no dedicated chooser sprite.

The port's green asset set contains **none** of these; it has no server-browser
art at all. This package ships **no image assets, by policy** — no `public/`, no
`src/assets/`. See `docs/assets.md`.

## Examples

```tsx
<Table
  resizable
  headerUppercase
  rowId={(s) => s.address}
  columns={[
    { id: 'name', header: 'Servers', cell: (s) => s.name, sortable: true },
    { id: 'map', header: 'Map', cell: (s) => s.map, width: 120 },
    { id: 'players', header: 'Players', cell: (s) => `${s.players}/${s.max}` },
    { id: 'vac', header: 'VAC', cell: (s) => <SecureIcon secured={s.vac} />,
      headerIcon: <SecureColumnIcon />, width: 48 },
  ]}
  rows={servers}
/>
```

## Open questions

- **There is no sorted or unsorted header state in the corpus.** A sortable
  server list obviously had one, but `ListPanelColumnheader` declares only the
  base and the no-op `:hover`. The sorted indicator was drawn in C++ by
  `CInternetGames`. Any triangle, arrow or colour change for sorted columns is
  **invented** and must be designed to sit inside the bevel vocabulary rather
  than being a generic web arrow.
- **The dragger has no affordance, so any visible divider is a departure.** How
  much the original relied on the cursor alone is unclear without a video of
  someone resizing a column. The recipe uses a 1px `BorderDark` line and is
  explicit that this departs from the source.
- **No column widths are defined anywhere.** The `servers\InternetGamesPage.res`
  layout gives the list a 608×226 box (`margin-left=10 margin-right=10
  margin-top=10 margin-bottom=43` inside a 624×278 region) but the columns are
  sized in code. Defaults must be chosen, not copied.
- **`ListPanel` has no row height and no column header height.** The same
  inference problem as `List`, doubled — the header strip's height is not stated
  either. Assuming the same 17px as a row is a guess.
- **`SectionedListPanel` vs `ListPanel` remains unresolved.** The server browser
  uses `ListPanel`; the friends dialog uses `SectionedListPanel`; the SDK offers
  both. This doc presents them as variants of one component, but they have
  different selection colours and different collapser images, and unifying them
  means picking one selection vocabulary.
- **`ButtonFace2`'s comment contradicts the shipped block.** `steam.styles:43`
  says `#5C5956` is *"for use in main client list panel column header"* while
  `ListPanelColumnheader` fills `GreenBG`. One of the two is stale — almost
  certainly the comment, which belongs to an earlier clay-toned iteration — but
  it should be resolved by finding `ButtonFace2` in a `.res` or the client, not
  by assumption. This is the same two-theme problem as `ButtonBorder` at `:50`
  versus `:254`.
- **Sticky headers have no precedent.** VGUI's header is part of the list control
  and scrolled with it in some contexts and not others. Whether the server
  browser's header stayed pinned is not determinable from the styles. Do not
  claim fidelity for either choice.
- **`font-weight = 100` on the header versus `400` on the rows** is a real, two-
  step difference in weight that the browser may not be able to render. Check the
  chosen font stack actually has a 100/200 face before this ships.
