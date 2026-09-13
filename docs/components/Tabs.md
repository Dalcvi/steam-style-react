# Tabs

## Purpose

A strip of labelled tabs across the top of a page area, one of which is
selected. In the client this is the settings dialog: `Video`, `Audio`,
`Keyboard`, `Multiplayer`. It is the only component in the library whose
*selected* look is produced by **erasing a border**, not by filling a shape.

## VGUI original

`PropertySheet` / `PageTab` in VGUI2 (`PropertySheet.cpp`, `PageTab.cpp`).
`PageTab` and `PageTab:selected` are `steam.styles:1793–1824`:

```
PageTab
{
    font-size = 14
    font-size = 16 [$OSX]
    textcolor = White
    render_bg
    {
        1="fill( x0, y0, x1, y0 + 1, BorderBright )"          // top
        2="fill( x0, y1 - 1, x1, y1, GreenBG )"               // bottom
        3="fill( x0, y0, x0 + 1, y1 - 1, BorderBright )"      // left
        4="fill( x1 - 1, y0, x1, y1, BorderDark )"            // right
        5="fill( x0 + 1, y0 + 1, x1 - 1, y1 - 1, GreenBG )"   // inside
    }
}

PageTab:selected
{
    ...
    textcolor = Over
    render_bg
    {
        1="fill( x0, y0, x1, y0 + 1, BorderBright )"          // top
        2="fill( x0 + 1, y1 - 1, x1 - 1, y1 + 2, GreenBG )"   // bottom
        3="fill( x0, y0 + 1, x0 + 1, y1, BorderBright )"      // left
        4="fill( x1 - 1, y0 + 1, x1, y1, BorderDark )"        // right
        5="fill( x0 + 1, y0 + 1, x1 - 1, y1 - 1, GreenBG )"   // inside
    }
}
```

Supporting facts:

```
steam.styles:336   PropertySheet.TransitionEffectTime   "0"       // no animation
steam.styles:337   PropertySheet.TabGap                 "3"
steam.styles:338   PropertySheet.FlashTabColor          Maize
steam.styles:1826  "PageDragFrame PageTab"              { font-size = 14 }
steam.styles:1832  TabCloseButton { image = "Graphics/Window-Close"
                                    inset = "-6 0 0 0"
                                    render_bg {} }
steam.styles:3130  TabPageCloseButton { padding-right = 16 }
steam-scheme:38    LightClayBG = #686A65   // "property sheet interior, active tab"
steam-scheme:39    LightClayButtonBG = #7D8078 // "buttons on property sheet interior"
```

### Four things to extract

1. **Selected and unselected tabs have the *same* fill.** Both paint
   `GreenBG` inside. Nothing about the selected tab is brighter or darker. The
   entire difference is **(a)** the label colour (`White` → `Over` maize) and
   **(b)** the border treatment. This is the opposite of the modern convention of
   highlighting the active tab with a lighter surface, and it is why a recreation
   that gives the active tab a raised `--vgui-surface-light` fill looks wrong.
2. **The selected tab erases the seam by painting *past* its own edge.**
   `y1 + 2` — two pixels *beyond* the bottom of the tab — is filled with
   `GreenBG`. Those two pixels sit on top of the page area's top border, cutting
   the strip's underline so the tab visually joins the page. The unselected tab
   stops at `y1 - 1`, leaving the border intact beneath it. This is the exact
   same trick as `nav li ul.dropdown { border-top: none }` in the CSS port and as
   `GroupBox`'s legend gap: **VGUI communicates "these two surfaces are one
   surface" by drawing over the boundary, never by removing a border from the
   box model.** A CSS recreation needs `margin-bottom: -1px` on the selected tab
   (or a pseudo-element that overlaps by 2px) to reproduce it.
3. **The selected tab's side borders start one pixel lower (`y0 + 1`).** The
   consequence is that the **top border runs unbroken across the whole strip** —
   the selected tab does not interrupt it, while an unselected tab's left border
   does (it starts at `y0`). So the strip reads as a continuous rail with the
   selected tab hanging off it. Reproducing this in CSS means the selected tab's
   top border must match the strip's, not its own fill.
4. **The page interior is a warm clay grey, not green.** `LightClayBG`
   `#686A65` is annotated in Valve's own scheme as *"property sheet interior,
   active tab"* (`steamscheme.res:38`), and `LightClayButtonBG` `#7D8078` as
   *"buttons on property sheet interior, active tab"* (`:39`). So a real VGUI
   property sheet is **clay-grey inside with green tabs on top** — a
   two-material dialog, not an all-green one. `foundations.md` already carries
   both as `--vgui-clay-light` and `--vgui-clay-button`. A recreation that leaves
   the page `GreenBG` is flattening away half the design.

## Variants

| Variant | Class | Notes |
| --- | --- | --- |
| Default | `vgui-tabs` | Strip only |
| Closable | `--closable` | Each tab carries a `TabCloseButton` glyph |
| Draggable | `--draggable` | `"PageDragFrame PageTab"` — tabs can be reordered |
| Vertical | `--vertical` | Not in the corpus; a modern convenience, see *Open questions* |
| Clay page | `--clay` | Uses the `LightClayBG` interior from `steamscheme.res:38` |
| Flash | `--flash` | `PropertySheet.FlashTabColor = Maize` — the "something changed" pulse |

## Anatomy

```html
<div class="vgui-tabs">
  <div class="vgui-tabs__strip" role="tablist" aria-label="Settings">
    <button class="vgui-tabs__tab vgui-tabs__tab--selected" role="tab" type="button"
            id="tab-video" aria-selected="true" aria-controls="panel-video" tabindex="0">
      <span class="vgui-tabs__label">Video</span>
    </button>
    <button class="vgui-tabs__tab" role="tab" type="button"
            id="tab-audio" aria-selected="false" aria-controls="panel-audio" tabindex="-1">
      <span class="vgui-tabs__label">Audio</span>
      <button class="vgui-tabs__close" type="button" tabindex="-1"
              aria-label="Close Audio tab"></button>
    </button>
  </div>
  <div class="vgui-tabs__panel vgui-tabs__panel--clay" role="tabpanel"
       id="panel-video" aria-labelledby="tab-video" tabindex="0">
    <!-- fields -->
  </div>
</div>
```

Note the nested `<button>` — that is invalid HTML and only shown to make the
close affordance explicit. In the real API the close control must be a sibling
inside the tab (`<span class="vgui-tabs__tab">` + inner button) or the tab must
be a `<div role="tab">` with a nested button, accepting that the outer element
then needs `tabindex` and its own key handling.

## States

| State | Fill | Label | Borders |
| --- | --- | --- | --- |
| Unselected | `#4C5844` (`GreenBG`) | `#FFFFFF` (`White`) | top/left `BorderBright`, bottom `GreenBG`, right `BorderDark` |
| Unselected, hover | `#4C5844` | `#FFFFFF` | *unspecified in the corpus* — see *Open questions* |
| Selected | `#4C5844` — **identical** | `#C4B550` (`Over`) | top `BorderBright`, no bottom, left/right inset by 1px from the top |
| Selected, focused | `#4C5844` | `#C4B550` | + dotted focus ring |
| Disabled | `#4C5844` | `#75806F` + `#282E22` shadow | unchanged |
| Flash (changed) | `#4C5844` | `#C4B550` (`Maize`) | unchanged |
| Page interior | `#686A65` (`LightClayBG`) | `#FFFFFF` | flat 1px `#4A4846` (`PropertySheetBG`) |
| Page buttons | `#7D8078` (`LightClayButtonBG`) | `#FFFFFF` | raised bevel |

## Tokens

| Token | Value | Where |
| --- | --- | --- |
| `--vgui-surface` | `#4C5844` | Tab fill (`GreenBG`) — **both** states |
| `--vgui-text-strong` | `#FFFFFF` | Unselected label |
| `--vgui-heading` | `#C4B550` | Selected label (`Over`) |
| `--vgui-clay-light` | `#686A65` | Page interior (`LightClayBG`, `steamscheme.res:38`) |
| `--vgui-clay-button` | `#7D8078` | Page footer buttons (`LightClayButtonBG`, `:39`) |
| `--vgui-tabs-gap` | `3px` | `PropertySheet.TabGap` (`steam.styles:337`) |
| `--vgui-tabs-overlap` | `1px` | The seam erasure; derived from `y1 + 2` — **new token** |
| `--vgui-tabs-close-slot` | `16px` | `TabPageCloseButton { padding-right = 16 }` (`:3130`) |
| `--vgui-focus-ring` | `#292D23` | Dotted focus ring |

No new colours are needed. `--vgui-tabs-overlap` is a new *metric* token whose
only job is to document that the selected tab must overlap the panel by at least
1px, and why.

## CSS recipe

```css
.vgui-tabs {
  display: flex;
  flex-direction: column;
}

.vgui-tabs__strip {
  display: flex;
  align-items: flex-end;
  gap: var(--vgui-tabs-gap, 3px);     /* PropertySheet.TabGap = 3 */
  /* The strip's own bottom border is the rail the selected tab must erase. */
  border-bottom: 1px solid var(--vgui-bevel-dark);
  padding-left: 0;
}

.vgui-tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 24px;
  padding: 2px 10px;
  border: 0;
  border-radius: 0;                    /* nothing in VGUI is rounded */
  background-color: var(--vgui-surface, #4c5844);
  color: var(--vgui-text-strong, #fff);
  font: inherit;
  font-size: 14px;
  cursor: default;
  /* Raised bevel: bright top/left, dark right; the bottom is the fill so the
     tab appears to merge downward. */
  box-shadow:
    inset 1px 1px 0 var(--vgui-bevel-light),
    inset -1px 0 0 var(--vgui-bevel-dark);
  margin-bottom: 0;
}

.vgui-tabs__tab--selected {
  color: var(--vgui-heading, #c4b550);
  /* The seam erasure: 1px pulls the fill down over the strip's bottom border,
     exactly as fill( x0 + 1, y1 - 1, x1 - 1, y1 + 2, GreenBG ) does. */
  margin-bottom: calc(-1 * var(--vgui-tabs-overlap, 1px));
  padding-bottom: 3px;
  /* The selected tab's side borders start at y0 + 1, so only the top and sides
     below the top are drawn — the top rail stays continuous. */
  box-shadow:
    inset 1px 1px 0 var(--vgui-bevel-light),
    inset -1px 0 0 var(--vgui-bevel-dark);
}

.vgui-tabs__panel {
  background-color: var(--vgui-clay-light, #686a65);
  border: 1px solid #4a4846;           /* PropertySheetBG */
  padding: 8px;
}
```

**`margin-bottom: -1px` on the selected tab is the whole trick.** Everything else
in this recipe is ordinary; this one line is what makes the selected tab read as
continuous with the page. Without it the tab looks like a floating button that
happens to have a maize label, which is what a naive recreation always looks
like.

**Do not use `border-bottom: 0` on the selected tab instead.** That removes the
border from the *layout box*, so the tab is 1px shorter than its siblings and the
strip visibly jitters when you click between tabs. The overlap must be a paint
layer change (negative margin, or a `::after`), never a box-model change.

**`PropertySheet.TransitionEffectTime "0"` is a direct instruction**: no
cross-fade when switching tabs. Wiring a 150ms transition between panels is a
modern reflex and is explicitly disabled in the original.

## React API

```tsx
export interface TabSpec {
  /** Stable identity, used for the id/aria-controls pair. */
  id: string
  /** Visible tab label. */
  label: string
  /** Panel content rendered when this tab is selected. */
  content: React.ReactNode
  /** Renders a close affordance in the tab. */
  closable?: boolean
  /** Called when the close affordance is activated. */
  onClose?: () => void
  /** Renders as disabled and unselectable. */
  disabled?: boolean
  /** Panel content is not rendered until first activation. */
  lazy?: boolean
}

export interface TabsProps {
  /** Tabs in order. The first enabled tab is selected when uncontrolled. */
  tabs: TabSpec[]
  /** Controlled selection. Pair with onValueChange. */
  value?: string
  /** Initial selection when uncontrolled. */
  defaultValue?: string
  /** Called with the newly selected tab id. */
  onValueChange?: (id: string) => void
  /** Selection follows focus, as VGUI's tab strip behaves. Defaults to true. */
  activateOnFocus?: boolean
  /** Panel surface. 'clay' is the VGUI property-sheet interior. */
  variant?: 'clay' | 'green'
}
```

`activateOnFocus` defaults to **true** because a VGUI property sheet switches
page as you move along the strip with the arrow keys — there is no separate
"confirm" step. This is also legitimate ARIA, but it must be chosen deliberately:
with automatic activation, a panel that loads slowly cannot be browsed past.

## Accessibility

- **`role="tablist"` / `role="tab"` / `role="tabpanel"` with the
  `id`/`aria-controls`/`aria-labelledby` triple.** Without the triple the
  relationship is invisible to assistive technology and the panel is orphaned.
- **Roving tabindex: one tab stop for the whole strip.** The selected tab is
  `tabindex="0"`, the rest `-1`; `Left`/`Right` (and `Home`/`End`) move selection
  within the strip, and the strip itself is a single stop. A strip where every
  tab is tabbable is the single most common tabs mistake and it is genuinely
  annoying for keyboard users — Tab would walk through eight tabs to get past the
  dialog.
- **`Tab` must not be captured.** Trapping Tab inside the tablist strands the
  user; the ARIA Authoring Practices are explicit that Tab moves to the next
  widget.
- **Vertical strips need `aria-orientation="vertical"` and Up/Down keys**, not
  Left/Right.
- **`tabindex="0"` on the panel.** Give each `tabpanel` `tabindex="0"` so a
  keyboard user can Tab from the strip into panel content that is not itself
  focusable (a page of read-only text). Without it, the panel is unreachable.
- **The selected label colour fails contrast and must be fixed.**
  `--vgui-heading` `#C4B550` on `--vgui-surface` `#4C5844` is **3.62:1** —
  below the 4.5:1 required for 14px text. This is Baseline rule 1 from
  `foundations.md §10` and it is the same failure as the `Menu` hover row. On the
  clay interior it is far worse: `#C4B550` on `--vgui-clay-light` `#686A65` is
  **2.62:1**. Two acceptable fixes, pick one and record it in Storybook:
  1. Keep the maize but at a lighter tint that reaches 4.5:1 on `#4C5844`
     (`foundations.md` already lists `--vgui-steam-green` and the port's
     `#E3E41F` as candidates; `#E3E41F` measures **5.52:1**).
  2. Keep `--vgui-heading` for the *flash* state only, and carry selection with
     `--vgui-text-strong` white (7.54:1) plus the seam erasure.
- **Colour alone must not signal selection (WCAG 1.4.1).** The seam erasure is
  the non-colour cue, which is exactly why it is load-bearing rather than
  cosmetic — the design already satisfies 1.4.1 through geometry. Keep it even if
  the label colour changes. Add `aria-selected` regardless.
- **The close button inside a tab is a focus-order hazard.** It must be
  `tabindex="-1"` (reachable only once the tab is selected) or the strip becomes
  twice as long to Tab through. Announce it with `aria-label="Close <name> tab"`
  and delete with `Delete`, which is the convention keyboard users already know.
- **`PropertySheet.FlashTabColor` must not be the only cue** that a page changed.
  If a tab flashes to say "this page has unsaved changes", also change the label
  text or add a marker span, or a colourblind user loses the message.
- **Do not animate the tab switch.** `TransitionEffectTime "0"` is explicit, and
  a slide/fade here is both off-period and a vestibular trigger.

## Assets

- `graphics/Window-Close.tga` — the closable-tab glyph, referenced by
  `TabCloseButton` (`steam.styles:1832`) with `inset = "-6 0 0 0"`. In the CSS
  port the same glyph ships as `close.png` / `close2.png`, both **18×18**.
- **Art gap:** `F:\steam-style\steam-style-react\` currently ships **no image
  assets at all** — there is no `public/` and no `src/assets/`. A closable tab
  therefore cannot be built until the 18×18 glyph set is imported. See
  `docs/assets.md`.

No other tab art exists: the strip, bevel, interior and flash are all drawn by
`fill` programs.

## Examples

```tsx
<Tabs
  variant="clay"
  defaultValue="video"
  tabs={[
    { id: 'video', label: 'Video', content: <VideoSettings /> },
    { id: 'audio', label: 'Audio', content: <AudioSettings /> },
    { id: 'multiplayer', label: 'Multiplayer', content: <MultiplayerSettings /> },
    { id: 'advanced', label: 'Advanced', content: <AdvancedSettings />, disabled: true },
  ]}
/>
```

## Open questions

- **Hover and focus states for `PageTab` do not exist in the corpus.**
  `PageTab` declares exactly two blocks and neither is `:hover` or `:focus`.
  `PropertySheet.FlashTabColor = Maize` is the only other state idea the
  stylesheet offers. So any hover treatment is an invention — the safest choices
  are either *none* (faithful, and defensible since every tab is already visible)
  or a `--vgui-surface-light` `#5A6A50` fill, which is what the CSS port uses for
  its nav hover. Flag whichever is chosen as invented.
- **The strip's own bottom rail is never stated.** `PageTab:selected` paints two
  pixels *past* `y1` on the assumption that something is there to erase. What
  draws that something — the `PropertySheet` page border (`PageTabBorder`
  `#747474`, `steam.styles:267`?) or the `Frame` — is not in the stylesheet. The
  recipe above assumes the strip owns a 1px bottom border; verify against a
  screenshot.
- **`PageTabBorder` and `PageTabBorderCorner` are declared but unused by
  `PageTab`.** `steam.styles:267` and `:269` define `#747474` and `#5D5D5D`; no
  `fill` in the `PageTab` family references either. They are very likely the
  page-area border used elsewhere (or dead in this build). Unverified.
- **Tab corners.** `PageTabBorderCorner "93 93 93"` and
  `ButtonBorderCornerSelected "160 154 100"` (`steam.styles:262`) suggest corners
  existed *somewhere*, but `PageTab` draws square corners on all four edges. The
  `160 154 100` value is a maize-tinted corner selected-state colour, which fits
  a tab — but nothing in the file uses it. Do not add corner radius on the
  strength of an unused token; VGUI's `PageTab` is square.
- **`PropertySheet.TabGap "3"` is a `PropertySheet` metric, not a `PageTab`
  one.** Whether the 3px sits *between* tabs or *outside* the strip is not
  stated. The recipe assumes between.
- **A vertical tab strip has no precedent.** `PageTab` draws `GreenBG` on its
  bottom edge, which only makes sense for a horizontal tab whose seam runs along
  the bottom. A vertical variant needs the whole scheme rotated (right edge
  erased) and is genuinely invention.
- **Whether the panel is `LightClayBG` in every dialog.** `steamscheme.res:38`
  annotates it *"property sheet interior, active tab"*, which is strong evidence
  for the settings dialog, but the server browser's own page is green. The
  `variant` prop exists so both are expressible; a per-screenshot survey would
  establish which is more common.
