# List

## Purpose

A vertically scrolling column of selectable rows on a dark interior with a full
four-sided inset bevel. This is the friends list, the games list, the server
browser's row area and every file picker in the client.

## VGUI original

Three separate definitions govern lists, and the parse order between them is the
most important thing in this document.

**1. The `.Scheme` colour keys** (`steam.styles:313–322`) — the fallback:

```
ListPanel.TextColor                  White
ListPanel.BgColor                    GrayBG
ListPanel.SelectedTextColor          White
ListPanel.SelectedBgColor            DarkGreenBG
ListPanel.SelectedOutOfFocusBgColor  DarkGreenBG
ListPanel.DisabledTextColor          LightGreenBG
ListPanel.DisabledSelectedTextColor  DarkGreenBG
ListPanel.EmptyListInfoTextColor     OffWhite
ListPanel.PerPixelScrolling          "1"
ListPanel.PostSectionLeading         "10"
```

**2. The `ListPanel` style block** (`steam.styles:1156–1173`) — this is what the
client actually draws:

```
ListPanel
{
    font-family = basefont
    textcolor = White
    selectedtextcolor = White
    inset = "0 0 0 0"
    bgcolor = none
    selectedbgcolor = BorderDark
    render_bg
    {
        1="fill( x0, y0, x1, y0 + 1, BorderDark )"     // top
        2="fill( x0, y1 - 1, x1, y1, BorderBright )"   // bottom
        3="fill( x0, y0, x0 + 1, y1 - 1, BorderDark )" // left
        4="fill( x1 - 1, y0, x1, y1, BorderBright )"   // right
        5="fill( x0 + 1, y0 + 1, x1 - 1, y1 - 1, DarkGreenBG )" // inside
    }
}
```

`"Page ListPanel"` (`:1176–1191`) is byte-for-byte the same except it omits the
font. **So `steam.styles` style blocks outrank the `.Scheme` keys**: the scheme
says the selection is `DarkGreenBG` and the block says `BorderDark`, and the
block wins. Likewise `bgcolor = none` does not mean "transparent" — `render_bg`
paints `DarkGreenBG` into the whole interior every frame. Reading only the
`.Scheme` block gives the wrong colour twice.

**3. `CGamesListPanel`** (`steam.styles:1193–1211`) — the games list / server
browser's own class, and it differs in kind:

```
"CGamesListPanel"
{
    inset = "0 0 0 0"
    bgcolor = DarkGreenBG
    font-family = basefont
    font-size = 14
    font-weight = 400
    textcolor = White
    selectedtextcolor = White
    selectedbgcolor = BorderDark
    render_bg
    {
        1="fill( x0, y0, x1, y0 + 1, BorderBright )"      // top
        2="fill( x0, y1 - 1, x1, y1, BorderDark )"        // bottom
        3="fill( x0, y0, x0 + 1, y1 - 1, BorderBright )"  // left
        4="fill( x1 - 1, y0, x1, y1, BorderDark )"        // right
    }
}
```

The bevel is **inverted** — lit on the top and left, shadowed on the bottom and
right. `ListPanel` is a **recessed** well; `CGamesListPanel` is a **raised**
slab. Rotating the bevel 180° is a small change in CSS and a completely
different feel, and it is the difference between the games list and every other
list in the client.

**Supporting colours** — `steamscheme.res` carries Valve's own annotation:

```
steamscheme.res:25 GrayBG           = 73  78  73   = #494E49
steamscheme.res:44 MaizeBG          = 145 134 60   = #91863C  // "background color of any selected text or menu item"
steamscheme.res:48 DarkGreenBG      = 62  70  55   = #3E4637  // "background of text edit panes"
steamscheme.res:50 DisabledText1    = 117 128 111  = #75806F
steamscheme.res:57 Over             = 196 181 80   = #C4B550
steamscheme.res:58 Down             = 35  36  33   = #232421
steamscheme.res:69 BorderDark       = 40  46  34   = #282E22  // "the dark/unlit side of a control"
steamscheme.res:68 BorderBright     = 128 128 128  = #808080  // "the lit side of a control"
steam.styles:279  ListpanelBackground = 37 37 37   = #252525
steam.styles:281  ListpanelCorner     = 76 76 76   = #4C4C4C
steam.styles:287  GameslistFadingBG   = 61 66 61   = #3D423D
steam.styles:289  GameslistText       = 230 236 224 = #E6ECE0
steam.styles:345  SectionedListPanel.CollapserWidth "16"
```

`GameslistText` `#E6ECE0` is the brightest text colour in the whole corpus and
exists **specifically for the games list** — a dedicated, near-white row colour,
which is a strong hint that Valve found the generic greys too dim on this
interior.

### Four things to extract

1. **Selection is `BorderDark` — a colour Valve annotates as "the dark/unlit side
   of a control" — in four separate places: `ListPanel` `:1162`,
   `"Page ListPanel"` `:1182`, `CGamesListPanel` `:1203` and `TreeNodeText`
   `:2660`.** That is a deliberate house style rather than a slip: **selecting a
   list or tree row does not light it up, it pushes it in.** The selected row is
   *darker* than its interior. `#282E22` on `DarkGreenBG` `#3E4637` is
   **1.41:1**, and white text on it is **13.96:1** — so the *text* carries the
   state and the fill is a whisper. On the web this fails WCAG 1.4.11's 3:1 for a
   UI state indicator, and it is the central accessibility decision in this
   component; see *Accessibility*.
2. **The interior is `DarkGreenBG` `#3E4637`, painted by `render_bg` — not
   `GrayBG`.** `bgcolor = none` plus a `render_bg` fill means the list always
   paints its own interior, so nothing shows through from the parent. This gives
   white row text **9.92:1**, comfortably AAA, and it answers the "what provides
   the background" question: the list does. The `.Scheme` key's `GrayBG`
   `#494E49` would give 8.50:1 — still fine, but it is the *wrong* colour, and
   `GrayBG` is a desaturated grey that would make the list read as a text field.
3. **The recessed-versus-raised distinction is the whole difference between the
   two lists.** `ListPanel`: top/left `BorderDark`, bottom/right `BorderBright`
   → sunk. `CGamesListPanel`: top/left `BorderBright`, bottom/right `BorderDark`
   → lifted. Same four colours, same 1px widths, opposite assignment. A library
   that ships one list with one bevel has thrown away a real distinction, and it
   is invisible unless the `render_bg` lines are read.
4. **Two small metrics that carry a lot of the feel.**
   `PerPixelScrolling "1"` means the wheel scrolls smoothly by pixels rather than
   jumping a whole row — a 2003 interface with free pixel scrolling. And
   `PostSectionLeading "10"` is 10px of air before each section heading, which is
   what makes a sectioned list read as sections rather than one long column.

## Variants

| Variant | Class | Notes |
| --- | --- | --- |
| Default (recessed) | `vgui-list` | `ListPanel`: the well |
| Raised | `vgui-list--raised` | `CGamesListPanel`: the slab |
| Sectioned | `--sectioned` | Section headers + 14×9 collapser |
| Multi-select | `--multi` | Ctrl/Shift ranges |
| With checkbox column | `--checkable` | 12×12 `chk*_Sm` sprites |
| Disabled rows | — | Per-row `disabled` |
| Empty | `--empty` | `EmptyListInfoTextColor OffWhite` message |

## Anatomy

```html
<div class="vgui-list vgui-list--recessed" role="listbox" aria-label="Servers">
  <div class="vgui-list__interior">
    <div class="vgui-list__section" role="presentation">
      <button class="vgui-list__collapser" type="button" aria-expanded="true"
              aria-controls="sec-1-rows" aria-label="Favourites">
        <span class="vgui-list__collapser-glyph" aria-hidden="true"></span>
      </button>
      <span class="vgui-list__section-title" aria-hidden="true">Favourites</span>
    </div>
    <div id="sec-1-rows" role="group" aria-labelledby="sec-1-label">
      <div class="vgui-list__row vgui-list__row--selected" role="option"
           aria-selected="true" tabindex="0" id="row-1">
        <span class="vgui-list__label">Favourite server</span>
      </div>
      <div class="vgui-list__row" role="option" aria-selected="false"
           tabindex="-1" id="row-2">
        <span class="vgui-list__label">Another server</span>
      </div>
    </div>
  </div>
</div>
```

`__interior` exists so the bevel and the fill can move together and the
scrollbar can sit outside the painted region — matching `ListPanelInterior`'s
`inset = "0 0 0 1"` (`steam.styles:1541`), which reserves one pixel at the
bottom for the scrollbar's channel.

## States

| State | Fill | Text |
| --- | --- | --- |
| Interior (recessed) | `#3E4637` (`DarkGreenBG`) via `render_bg` | — |
| Interior (raised) | `#3E4637` (`bgcolor`) | — |
| Bevel, recessed | top/left `#282E22`; bottom/right `#808080` | — |
| Bevel, raised | top/left `#808080`; bottom/right `#282E22` | — |
| Row, idle | transparent | `#FFFFFF` |
| Row, hover | *unspecified — see Open questions* | *unspecified* |
| Row, selected | `#282E22` (`BorderDark`) — **darker than the interior** | `#FFFFFF` (13.96:1) |
| Row, disabled | transparent | `#5A6A50` (`LightGreenBG`) + `#282E22` shadow |
| Empty message | transparent | `#D8DED3` (`OffWhite`) |
| Section header | transparent | `#C4B550` (`Over`) — 4.72:1 |
| Section header, hover | transparent | `#C4B550` — **identical to the base state, i.e. a no-op** |
| Section collapser | transparent | 14×9 sprite, 4 states |

## Tokens

| Token | Value | Where |
| --- | --- | --- |
| `--vgui-list-bg` | `#3E4637` | Interior fill (`DarkGreenBG`) — currently identical to `--vgui-surface-dark` |
| `--vgui-list-selected-bg` | `#292D23` | Selected row (`BorderDark`) — currently identical to `--vgui-bevel-dark` |
| `--vgui-bevel-light` | `#899281` | Lit side (`BorderBright`) |
| `--vgui-bevel-dark` | `#292D23` | Unlit side (`BorderDark`) |
| `--vgui-text-strong` | `#FFFFFF` | Row text (`ListPanel.textcolor White`) |
| `--vgui-text-list-disabled` | `#5A6A50` | `ListPanel.DisabledTextColor LightGreenBG` — **new token** |
| `--vgui-text-section` | `#C4B550` | Section header (`Over`) — **new token** |
| `--vgui-text` | `#A0AA95` | `Text`, used only by the SDK's `SectionedListPanel` |
| `--vgui-text-list-strong` | `#E6ECE0` | `GameslistText`, the games-list row colour — **new token** |
| `--vgui-surface-fading` | `#3D423D` | `GameslistFadingBG` — **new token** |
| `--vgui-list-interior-dark` | `#252525` | `ListpanelBackground` — **new token** |
| `--vgui-collapser-width` | `16px` | `SectionedListPanel.CollapserWidth` — **new token** |
| `--vgui-collapser-overhang` | `4px` | `ListPanelSectionCollapser inset "-4 0 0 0"` — **new token** |
| `--vgui-list-post-section-leading` | `10px` | `ListPanel.PostSectionLeading` — **new token** |
| `--vgui-scrollbar-corner` | `#4C4C4C` | `ListpanelCorner` — **new token** |

Two of the "new" tokens are aliases of existing values: `--vgui-list-bg` equals
`--vgui-surface-dark` and `--vgui-list-selected-bg` equals `--vgui-bevel-dark`.
They are declared separately so a theme can move one without the other, but if
that flexibility is not wanted they should collapse into the existing tokens
rather than multiply the surface area.

## CSS recipe

```css
.vgui-list {
  position: relative;
  color: var(--vgui-text-strong, #fff);
  font-size: 14px;
  overflow: hidden;                     /* the interior scrolls, not the frame */
  /* PerPixelScrolling "1": the browser already scrolls by pixels. Do NOT add
     scroll-snap — it re-introduces the row-jumping this metric exists to
     avoid. */
}

/* Recessed: ListPanel — top/left dark, bottom/right lit. */
.vgui-list--recessed > .vgui-list__interior {
  background-color: var(--vgui-list-bg, #3e4637);
  border-top: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-light);
  overflow-y: auto;
  /* ListPanelInterior inset "0 0 0 1" — one pixel reserved at the bottom. */
  padding-bottom: 1px;
}

/* Raised: CGamesListPanel — the same four lines with the sides swapped. */
.vgui-list--raised > .vgui-list__interior {
  background-color: var(--vgui-list-bg, #3e4637);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-right: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  overflow-y: auto;
}

.vgui-list__row {
  display: flex;
  align-items: center;
  min-height: 17px;
  padding: 0 4px;
  cursor: default;
  /* No transitions: VGUI selection is instantaneous. */
}

/* The games list has a dedicated, brighter row colour. */
.vgui-list--raised .vgui-list__row {
  color: var(--vgui-text-list-strong, #e6ece0);
}

.vgui-list__row[aria-selected='true'] {
  /* Darker than the interior: "pressed in", not "picked out". */
  background-color: var(--vgui-list-selected-bg, #282e22);
  color: var(--vgui-text-strong, #fff);
}

.vgui-list__row[aria-disabled='true'] {
  color: var(--vgui-text-list-disabled, #5a6a50);
  text-shadow: 1px 1px 0 var(--vgui-bevel-dark);
}

.vgui-list__section-title {
  color: var(--vgui-text-section, #c4b550);
  font-size: 14px;
  padding: 0 4px;
}

/* PostSectionLeading: 10px of air before each new section. */
.vgui-list__section + .vgui-list__section {
  margin-top: var(--vgui-list-post-section-leading, 10px);
}

.vgui-list__collapser {
  flex: 0 0 var(--vgui-collapser-width, 16px);
  width: var(--vgui-collapser-width, 16px);
  height: 16px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: default;
}

/* ListPanelSectionCollapser: inset "-4 0 0 0", padding-top/-bottom "-2" — the
   14x9 glyph overhangs its 16px slot by 4px on the left. */
.vgui-list__collapser-glyph {
  display: block;
  width: 14px;
  height: 9px;
  margin-left: calc(-1 * var(--vgui-collapser-overhang, 4px));
  background-repeat: no-repeat;
}
```

**Selection must be legible, and the corpus value is not.** Two ways to fix
1.41:1 without leaving the palette:

- **Keep `BorderDark` and add a lighter top-and-left inner shadow**, so the row
  reads as a well rather than a slightly-different-dark rectangle. This stays
  closest to the original and is the recommendation for a fidelity-first theme.
- **Or use `MaizeBG` `#91863C` with `Down` `#232421` text** (the
  `SectionedListPanel` vocabulary, 4.22:1) — what the SDK's own list class does
  and what most people actually remember, because menus and the friends dialog
  both use it.

Whichever is chosen must be recorded in `foundations.md`, because it is a
library-wide statement about what "selected" means and the corpus does not have
a single answer.

## React API

```tsx
export interface ListRow {
  /** Stable identity; also the React key. */
  id: string
  /** Row content when used flat; see Table for named columns. */
  content: React.ReactNode
  /** Renders as non-interactive and dimmed. */
  disabled?: boolean
  /** Arbitrary payload returned by onSelectedChange. */
  data?: unknown
}

export interface ListSection {
  /** Stable identity for the section. */
  id: string
  /** Optional heading, rendered in the Over/maize colour. */
  title?: string
  /** Rows in this section. */
  rows: ListRow[]
}

export interface ListProps {
  /** Rows, or sections when grouped is set. */
  items: ListRow[] | ListSection[]
  /** Treats items as ListSection[] and renders collapsers. */
  grouped?: boolean
  /** Uses the raised CGamesListPanel bevel instead of the recessed well. */
  raised?: boolean
  /** Controlled selection. Use string[] when multi is set. */
  selected?: string | string[]
  /** Initial selection when uncontrolled. */
  defaultSelected?: string | string[]
  /** Allows Ctrl/Shift multi-selection. */
  multi?: boolean
  /** Called with the new selection. */
  onSelectedChange?: (ids: string | string[]) => void
  /** Message rendered when there are no rows. */
  emptyMessage?: string
  /** Row pitch in pixels. Defaults to 17. */
  rowHeight?: number
}
```

## Accessibility

- **`role="listbox"` with `role="option"` rows, and `aria-selected` on the
  selected ones.** The listbox is a single tab stop and owns arrow-key
  navigation (roving `tabindex`), so `Up`/`Down`/`Home`/`End` move the *active*
  row and `Space`/`Enter` toggles selection. Do not make every row a tab stop.
- **Multi-select needs `aria-multiselectable="true"`** on the listbox, and the
  active row must be distinguishable from the selected rows — in a
  `aria-multiselectable` listbox the arrow keys move a *focus* separate from
  selection, which is a real visual state to design.
- **Typeahead.** A real listbox lets you type a letter to jump. Cheap, and its
  absence is noticeable in a long server list.
- **The selected-row fill fails WCAG 1.4.11 at 1.41:1** (`#282E22` on `#3E4637`)
  against the 3:1 minimum for a UI state indicator. The state is carried almost
  entirely by the white text (13.96:1) and by the fill changing *direction* of
  contrast, both of which are real cues — but a user who cannot perceive
  dark-green versus darker-green sees only "the text changed colour". **Add a
  non-colour cue** to the selected row: a leading marker, bold text, or a 1px
  inset shadow. Record whichever is chosen.
- **The games list interior against `--vgui-surface` `#4C5844` is 1.03:1** —
  effectively invisible. The bevel provides the boundary, so the bevel is
  load-bearing for 1.4.11 and must not be dropped for a "flat" variant without a
  replacement boundary. Never rely on the fill alone to delimit the list.
- **`PerPixelScrolling` has a keyboard consequence:** in a pixel-scrolling list
  the arrow keys move the *selection*, not the viewport, and the viewport
  follows just enough to keep the selected row visible. Do not let the row under
  the pointer and the selected row be the same concept.
- **Announce selection changes in a live region** when the list is a picker
  (e.g. "Favourite server, selected, 1 of 3"). `aria-selected` changes are not
  announced on their own in most screen readers.
- **Disabled rows must use `aria-disabled="true"`, not be removed from the
  DOM** — they must stay reachable by arrow keys so their existence is
  discoverable, but activation must do nothing.
- **Empty state.** Render `emptyMessage` in `OffWhite` and associate it via
  `aria-describedby`; a blank panel gives no clue that the list loaded.
- **`aria-expanded` belongs on the section collapser, not on the row**, and the
  section's rows should be wrapped with `role="group"` so `aria-expanded` has a
  defined scope.
- **The section header's `Over` colour passes at 4.72:1** but is a saturated
  yellow-green — the only place in the corpus where a *text* element uses `Over`
  rather than `White`. Do not "normalise" it to white; the maize heading is a
  genuine part of the look.

## Assets

Measured from the actual `.tga` headers:

| Asset | Size | Used by |
| --- | --- | --- |
| `graphics/icon_expand.tga` | 14×9 | `ListPanelSectionCollapser` (`:1622`) |
| `graphics/icon_expand_over.tga` | 14×9 | `:1631` |
| `graphics/icon_collapse.tga` | 14×9 | `:1636` |
| `graphics/icon_collapse_over.tga` | 14×9 | `:1641` |
| `graphics/chkUnselStd_Sm.tga` | 12×12 | `ListPanelCheckBox` (`:1317`) |
| `graphics/chkUnselFocus_Sm.tga` | 12×12 | `ListPanelCheckBox:focus` (`:1327`) |
| `graphics/chkSelStd_Sm.tga` | 12×12 | `ListPanelCheckBox:selected` (`:1334`) |
| `graphics/chkSelFocus_Sm.tga` | 12×12 | `ListPanelCheckBox:selected:focus` (`:1338`) |
| `graphics/chkUnselDis_Sm.tga` | 12×12 | `ListPanelCheckBox:disabled` (`:1345`) |
| `graphics/chkUnselDis.tga` | 12×12 | `ListPanelCheckBox:disabled:select` (`:1351`) — **not** a `_Sm` |

Two notes on this table. The collapser glyph is **14 wide but its slot is 16**
(`SectionedListPanel.CollapserWidth`), which is why the block carries
`inset = "-4 0 0 0"` and negative vertical padding — the glyph deliberately
overhangs. And the last row is a real inconsistency in Valve's own art:
`ListPanelCheckBox:disabled:select` points at `graphics/chkUnselDis` with **no
`_Sm` suffix**, i.e. a full-size sprite in a small-slot list, and the comment
directly above it reads `//!! bug - this needs to look disabled`
(`steam.styles:1349–1350`). Do not copy it.

The port's green asset set contains **none** of these ten files; its closest
equivalents are `checkmark.png` (13×13) and `scroll_up.png`/`scroll_down.png`
(9×6). This package ships **no image assets, by policy** — no `public/`, no
`src/assets/`. See `docs/assets.md`.

## Examples

```tsx
<List
  raised
  grouped
  emptyMessage="No servers match your filters."
  items={[
    { id: 'fav', title: 'Favourites', rows: [
      { id: 'a', content: 'My favourite server' },
    ] },
    { id: 'net', title: 'Internet', rows: [
      { id: 'b', content: 'Some server' },
      { id: 'c', content: 'Another server', disabled: true },
    ] },
  ]}
/>
```

## Open questions

- **No row hover state exists anywhere in the corpus.** `ListPanel`,
  `CGamesListPanel`, `ListPanelInterior` and the `.Scheme` keys between them
  declare idle, selected, disabled and focus — but never a row hover. Hover
  exists only on the *column header* (`ListPanelColumnHeader:hover`, `:1405`)
  and the *section header* (`ListPanelSectionHeader:hover`, `:1592`), and **both
  of those blocks set exactly the same value as their base state**, i.e. both are
  no-ops. Either VGUI rows never hovered, or the hover was drawn in C++. A list
  with no pointer feedback is faithful; one with a hover fill is usable and
  unexpected. Any hover treatment is invented and must be visually cheaper than
  selection.
- **Row height is nowhere stated.** `PerPixelScrolling "1"` implies the row pitch
  is a runtime value, not a style value. The `17px` in the recipe is **inferred**
  from the 14px font plus VGUI's tight leading and must be treated as a guess; a
  screenshot measured with a pixel ruler is the evidence needed.
- **`GameslistFadingBG` `#3D423D` has no block that uses it.** The games list
  fades its rows when the list refreshes; neither the colour's use site nor the
  fade duration is in `steam.styles`. Reproducing the refresh fade would need the
  `CInternetGames` source.
- **`ListpanelBackground` `#252525` and `ListpanelCorner` `#4C4C4C` are referenced
  by no block either** — they are scheme-only values consumed by code. Whether
  `#252525` was ever the real interior, as opposed to `DarkGreenBG`, is
  unresolved; the `render_bg` fill on `ListPanel` argues that it was not.
- **Which selection vocabulary wins is a library decision, not a fact.** The
  corpus contains three answers: `BorderDark` (recessed, 1.41:1), `DarkGreenBG`
  (the overridden `.Scheme` value, 1.17:1 against `GrayBG`), and `MaizeBG` (the
  SDK's `SectionedListPanel` and every menu, 4.22:1 with `Down` text). This doc
  recommends picking one and writing it into `foundations.md`; it currently leans
  on `BorderDark` for fidelity and `MaizeBG` for access, and that tension is
  real.
- **`ListPanel` has no `font-size` while `CGamesListPanel` and
  `SectionedListPanel` both say 14 (16 on macOS `[$OSX]`).** Whether a plain
  `ListPanel` inherits 14 or some other default is not stated. The recipe assumes
  14.
- **The `[$OSX]` conditionals are a portability trap.** macOS switches `basefont`
  to Helvetica and bumps every 14px to 16px with looser spacing. These docs record
  the Windows values as canonical because that is the look being recreated, but a
  faithful macOS mode is what Valve shipped and is a legitimate future theme.
