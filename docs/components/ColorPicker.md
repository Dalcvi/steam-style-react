# ColorPicker

A colour swatch with a palette dropdown. **This component has no evidence in the
corpus** — see the first section — so this doc specifies it as a library-original
built from the theme's own grammar rather than pretending to transcribe Valve.

## Purpose

`ColorPicker` lets a user choose a colour. Steam's use for one is narrow and
period-appropriate: **editing the scheme itself.** The theme's entire visual
identity is a table of 41 named entries (`steamscheme.res:10-71`), and a picker
over that table is the natural way to theme a 2003-era client — which is exactly
what `steamscheme.res` is.

In this library the colour picker therefore has two honest applications:

1. **Picking from the theme's named palette** — the swatch grid *is*
   `steamscheme.res:10-71`. This is the well-supported case.
2. **Picking an arbitrary colour** — requires a saturation field and a hue
   strip, neither of which exists anywhere in VGUI. That is case 2, and it is
   a modern control wearing an old theme.

If a project needs only case 1, `Select` with swatch-rendered options is smaller
and more faithful. `ColorPicker` is for case 2 with case 1 available.

## VGUI original

**No evidence in this corpus. None.**

This is the honest finding, and it was checked thoroughly:

| Search | Scope | Result |
| --- | --- | --- |
| `ColorPicker` (case-insensitive) | every `.res`, `.layout`, `.styles`, `.menu`, `.vdf`, `.txt`, `.cfg`, `.json` in `F:\steam-style\OG-Steam\OG-Steam\` | **0 hits** |
| `ColorPicker` | every `.css`, `.res`, `.layout`, `.styles`, `.scss`, `.ts`, `.tsx`, `.md`, `.html` in all of `F:\steam-style\` (including the `vgui.css` port) | **0 hits** (excluding this library's own docs) |
| swatch / palette / colour-editor class names | same scopes | **0 hits** |

`docs/README.md:121` records the correction: an earlier revision of that file
claimed `ColorPicker` "exists in Steam's client resource set
(`resource/layout/`)". **That claim is not supported by this corpus.** The only
`ColorPicker` strings anywhere under `F:\steam-style\` before this doc was
written were the README's own reference and a cross-reference in `SpinBox.md`.

What the corpus *does* provide is everything needed to build one faithfully.

### What is available instead

**1. The palette itself.** `steamscheme.res:10-71` is a table of **41** named
entries — 40 quoted `"Name" "R G B A"` lines plus one bare alias,
`SecBG GrayBG2` (`:28`) — in 8-bit RGBA string form (see `## Open questions` for
why the count is easy to get wrong):

```ini
"White"				"255 255 255 255"
"OffWhite"			"216 222 211 255"
"GreenBG"			"76 88 68 255"
"DarkGreenBG"		"62 70 55 255"
"BorderBright"		"128 128 128 255"
"BorderDark"		"40 46 34 255"
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\steamscheme.res:10-71
```

This *is* a colour palette in the literal sense — a named list of colours — and
it is the single most colour-picker-shaped artefact in the whole corpus. A
scheme editor's picker shows exactly these swatches.

**2. The dropdown grammar.** `ComboBox` gives the field + beveled arrow button
pattern a picker's dropdown trigger needs:

```ini
ComboBox
{
    bgcolor = DarkGreenBG
    inset = "3 0 0 0"
    textcolor = White
    selectedbgcolor = MaizeBG
    ...
}
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\styles\steam.styles:703
```

`Select.md` covers this in full; a `ColorPicker`'s trigger is a `ComboBox` whose
"text" is a swatch.

**3. The selection tokens.** The scheme names one colour specifically for
selection:

```ini
"BorderSelection"	"0 0 0 255"
```

```powershell
steamscheme.res:70
```

Pure black. That is the box drawn around the currently-selected swatch, and it is
the only selection indicator the scheme defines.

**4. `MaizeBG`.** `"145 134 60 255"` (`steamscheme.res:44`) is the selected-row
fill everywhere else in the theme (`steam.styles:703` is `ComboBox`'s
`selectedbgcolor`). A picker's highlighted swatch uses the same.

### Where Steam's real picker would live

Nothing in this resource set. The most likely explanation is the same as for
`Avatar` and `SpinBox`: the control exists in Steam's compiled client, and this
extract contains only the resource files that reference it (and none do).
Steam's *modern* client does ship a colour picker, but it is a 2010s-era Control
with a saturation/value square and a hue strip — **nothing about it is
period-accurate for this theme**, so copying it would defeat the library's
purpose.

**Recommendation: keep the component, label it library-original.** Every value
below is either (a) a real corpus token, or (b) explicitly marked as invented.
Nothing is presented as a transcription.

## Variants

| Variant | What it is | Evidence |
| --- | --- | --- |
| *(default)* | Palette grid of named scheme colours | `steamscheme.res:10-71` |
| `--hex` | Adds a hex text input beside the grid | *(library)* |
| `--continuous` | Adds a hue strip + SV square | *(library — not period-accurate)* |
| `--alpha` | Adds an alpha slider | *(library — not period-accurate)* |
| `--swatch-only` | Trigger with no hex label | *(library)* |
| `--inline` | Grid always visible, no trigger | *(library)* |

The corpus palette is **RGBA**, not RGB — every literal entry is `"R G B A"`, four
components (`steamscheme.res:13`, `:50`, `:51`). So alpha is a first-class part
of the data model even though the theme contains no semi-transparent colours.
Support it in the value type; do not build a UI for it unless asked.

## Anatomy

```tsx
<div class="vgui-color-picker">
  <button class="vgui-color-picker__trigger">
    <span class="vgui-color-picker__swatch" style="--vgui-swatch: #4c5844" />
    <span class="vgui-color-picker__label">#4C5844</span>
    <span class="vgui-color-picker__arrow" aria-hidden="true" />   {/* 7×4 staircase */}
  </button>
  <div class="vgui-color-picker__panel" role="dialog">
    <div class="vgui-color-picker__grid" role="listbox">…swatches…</div>
  </div>
</div>
```

- **Trigger** — the `ComboBox` grammar: a recessed field containing a swatch, a
  hex label, and the 7×4 staircase arrow that `Scrollbar.md` specifies. This is
  the part with real corpus support.
- **Swatch** — a solid square in the current colour, with the 1px beveled ring
  every surface in this theme has.
- **Panel** — a raised beveled surface, like a `Menu`. It holds the palette grid.
- **Grid** — named swatches from the scheme, laid out as a matrix. This is the
  case-1 path.
- **Case-2 extras** — a hue strip and a saturation/value square. **Invented.**
  Offered behind a prop; not rendered by default.

The default rendering is the **palette grid only**. A VGUI-era colour picker
shows a fixed set of named colours; that is what the corpus's palette is, and it
is the version that does not lie about the period.

## States

| State | Behaviour | Source |
| --- | --- | --- |
| Normal | Trigger: recessed field, raised swatch ring | `steam.styles:703` |
| Hover (trigger) | Nothing — `ComboBox` restates identical values on hover | `steam.styles:722` |
| Focus-visible | Standard theme ring on the trigger | `foundations.md` §4 |
| Open | Panel drawn as a raised `Menu`-style surface | `Menu.md` |
| Swatch hover | `--vgui-surface-light` behind the swatch | *(library)* |
| Swatch selected | 1px `BorderSelection` `#000` box | `steamscheme.res:70` |
| Swatch selected (row) | `MaizeBG` `#91863C` fill | `steam.styles:703` |
| Disabled | `--vgui-text-disabled` label; grid not reachable | *(library)* |
| Invalid hex | `--vgui-danger` label, no colour applied | *(library)* |

**`ComboBox`'s hover restates identical values.** It is worth noting because it
is a theme rule: `steam.styles:722` is a `ComboBox:hover` block whose properties
are the same as the base block's — `bgcolor = DarkGreenBG`,
`selectedbgcolor = MaizeBG`, `selectedtextcolor = White` and the same four
`fill()` calls. The pattern then repeats twice more: `ComboBox:focus`
(`steam.styles:736`) and `ComboBox:focus:hover` (`:750`) restate the same values
again. **Four blocks — base, hover, focus, focus+hover — describe one
appearance.** Hovering or focusing a dropdown trigger in this theme does
nothing, and neither does the combination. Do not add a hover fill to the
`ColorPicker` trigger; a focus ring is required for accessibility, but it is a
documented addition, not a transcription.

Note the two distinct selection treatments, which are easy to conflate:

- **The currently-chosen colour** (the one in the trigger) gets no decoration in
  the grid — the trigger's swatch already shows it.
- **The keyboard-highlighted swatch** (the `aria-activedescendant` in a listbox)
  gets the `BorderSelection` box or the `MaizeBG` fill, matching `Menu`'s
  highlighted-item treatment.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-surface-dark` `#3E4637` | Trigger field (`DarkGreenBG`) |
| `--vgui-bevel-dark` `#292D23` | Trigger top/left; swatch ring |
| `--vgui-bevel-light` `#899281` | Trigger bottom/right |
| `--vgui-surface` `#4C5844` | Panel background |
| `--vgui-surface-light` `#5A6A50` | Swatch hover |
| `--vgui-accent-dark` `#91863C` | Highlighted swatch (`MaizeBG`) |
| `--vgui-text-strong` `#FFFFFF` | Trigger hex label |
| `--vgui-text-muted` `#A0AA95` | Swatch name label |
| `--vgui-text-dim` `#758666` | Swatch names when cramped |
| `--vgui-danger` `#E2251A` | Invalid hex |
| `--vgui-accent` `#C4B550` | Focus ring |
| `--vgui-color-picker-swatch` `18px` | Swatch square size |
| `--vgui-color-picker-columns` `12` | Palette grid columns |
| `--vgui-color-picker-selection` `#000` | `BorderSelection` box |

Component-local metrics keep `var()` fallbacks; palette tokens do not.

`--vgui-color-picker-selection` is `BorderSelection` `"0 0 0 255"`
(`steamscheme.res:70`). It is a real corpus token that no other component doc
has needed, and it is the correct colour for the swatch selection box.

## CSS recipe

```css
.vgui-color-picker { display: inline-block; position: relative; }

/* The trigger is a ComboBox: recessed field, inset 3 0 0 0, DarkGreenBG. */
.vgui-color-picker__trigger {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-block-size: 25px;
  padding: 0 2px 0 3px;                 /* inset "3 0 0 0" */
  font: inherit;
  font-size: var(--vgui-font-size, 14px);
  color: var(--vgui-text-strong);
  background-color: var(--vgui-surface-dark);
  border-top: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-light);
  border-right: 1px solid var(--vgui-bevel-light);
  cursor: pointer;
}

/* Hover does nothing — steam.styles:722 restates the base values. */

.vgui-color-picker__swatch {
  inline-size: var(--vgui-color-picker-swatch, 18px);
  block-size: var(--vgui-color-picker-swatch, 18px);
  background-color: var(--vgui-swatch, transparent);
  /* Every surface in this theme has a 1px bevel; a swatch is a surface. */
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
  flex: none;
}

/* Checkerboard for alpha < 1. Two flat greys — the theme has no gradients. */
.vgui-color-picker__swatch[data-alpha='true'] {
  background-image:
    linear-gradient(45deg, #808080 25%, transparent 25%),
    linear-gradient(-45deg, #808080 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #808080 75%),
    linear-gradient(-45deg, transparent 75%, #808080 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0;
}

.vgui-color-picker__arrow {
  inline-size: 7px;
  block-size: 4px;
  margin-inline-start: auto;
  background-color: currentColor;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);   /* the Scrollbar staircase */
  flex: none;
}

/* The panel is a raised surface, like a Menu. */
.vgui-color-picker__panel {
  position: absolute;
  z-index: 10;
  margin-block-start: 1px;
  padding: 4px;
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
}

.vgui-color-picker__grid {
  display: grid;
  grid-template-columns: repeat(var(--vgui-color-picker-columns, 12), auto);
  gap: 2px;
}

.vgui-color-picker__option {
  inline-size: var(--vgui-color-picker-swatch, 18px);
  block-size: var(--vgui-color-picker-swatch, 18px);
  background-color: var(--vgui-option-color);
  border: 1px solid transparent;
}

/* The keyboard highlight: BorderSelection, "0 0 0 255". */
.vgui-color-picker__option[data-active='true'] {
  border-color: var(--vgui-color-picker-selection, #000);
}

/* The committed choice, where it differs from the trigger. */
.vgui-color-picker__option[aria-selected='true'] {
  background-color: var(--vgui-accent-dark);   /* MaizeBG, steam.styles:703 */
}

/* Continuous mode only — NOT period-accurate. */
.vgui-color-picker--continuous .vgui-color-picker__sv {
  inline-size: 180px;
  block-size: 120px;
  background:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, transparent),
    var(--vgui-hue);
}

@media (prefers-reduced-motion: reduce) {
  .vgui-color-picker__panel { transition: none; }
}
```

**No rounded corners, no shadows, no gradients on the chrome.** The one gradient
in the recipe is the alpha checkerboard's greys and the `--continuous` SV square,
both of which are data visualisations rather than chrome. The SV square in
particular is the single most obviously modern element in this doc, which is why
it is not rendered by default.

## React API

```tsx
export interface ColorPickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Current colour as `#RRGGBB` or `#RRGGBBAA`. */
  value?: string
  /** Called with the new colour when the user commits a choice. */
  onValueChange?: (value: string) => void
  /** Palette to show. Defaults to the scheme's named colours. */
  palette?: Array<{ name: string; value: string }>
  /** Show the hex text input beside the grid. */
  hex?: boolean
  /** Add a hue strip and saturation/value square. Not period-accurate. */
  continuous?: boolean
  /** Allow alpha editing. */
  alpha?: boolean
  /** Grid columns. 12 fits the scheme palette in three tidy rows. */
  columns?: number
  /** Render the swatch alone, with no hex label in the trigger. */
  swatchOnly?: boolean
  /** Grid always visible; no trigger or panel. */
  inline?: boolean
  /** Disable the control and the panel. */
  disabled?: boolean
}
```

Notes:

- The value type is **`#RRGGBB` / `#RRGGBBAA` strings**, not an object, because
  the corpus palette is written as strings (`steamscheme.res:13`) and CSS custom
  properties consume strings directly.
- `palette` defaults to the scheme's named colours, parsed once from the values
  in `foundations.md` §3 — that table *is* the palette.
- The component is **uncontrolled by default and controlled when `value` is
  given**, like `Select`. `onValueChange` fires on commit, not on every drag; a
  `--continuous` drag would otherwise fire hundreds of times a second.
- `forwardRef<HTMLDivElement>`; `className` merged **last**.

## Accessibility

- **The trigger is a `button` with `aria-haspopup="dialog"`**, not a `div`. A
  colour picker's panel is a dialog — it contains a grid the user navigates.
- **The grid is a `role="listbox"`, the swatches are `role="option"`.** Roving
  `tabindex` on the grid, `aria-activedescendant` on the listbox, and arrow-key
  movement in two dimensions (Left/Right within a row, Up/Down by a row). Tab
  moves out of the grid entirely, back to the trigger.
- **Every swatch needs a name.** A grid of 41 anonymous colour squares is
  unusable with a screen reader. `aria-label` each option with the palette entry's
  *name* — `"GreenBG"`, `"DarkGreenBG"` — which is exactly what
  `steamscheme.res` gives you. This is the single biggest accessibility win
  available in this component, and it comes free from the corpus data.
- **A colour swatch alone is not a sufficient indicator.** WCAG 1.4.1 forbids
  colour as the only visual means of conveying information. Two requirements:
  1. **The hex or the name must be visible** next to the swatch in the trigger —
     `swatchOnly` is an accessibility-reducing option and must not be the
     default.
  2. **The selected swatch needs a non-colour cue.** `BorderSelection`
     (`steamscheme.res:10-71`) is a black box outline; a box is a shape, so this
     is satisfied — but only if the box is sufficiently distinguishable from the
     swatch behind it. On a black swatch (`GreenBG`-dark palettes have very few,
     but `"BorderSelection"` itself is `0 0 0`) a black box on black is
     invisible. Add an inner light ring when the swatch luminance is low, or use
     the `MaizeBG` fill as well.
- **Do not encode meaning in the hue alone.** Palette entries must be named and
  the names shown or announced. `ColorPicker` is a control about colour; the
  colour-blindness failure mode is total, not marginal.
- **Contrast of the trigger's hex label.** `--vgui-text-strong` `#FFFFFF` on
  `--vgui-surface-dark` `#3E4637` is well above AAA. Fine.
- **The `--continuous` SV square is not keyboard-operable by default.** If it
  ships, it needs arrow-key control with `step` and a text fallback — a canvas-
  like control that can only be dragged fails WCAG 2.1.1. This is a strong
  argument for leaving it off by default, which is what this doc recommends.
- **Do not fire `onValueChange` continuously.** For both assistive technology and
  performance: commit on pointer-up, `Enter` and `Tab`, not on every `mousemove`.

## Assets

**None.** No colour-picker artwork exists in this corpus, and none is needed: the
swatch is a coloured `div`, the arrow is the 7×4 staircase from `Scrollbar.md`
(drawn with `fill()` in the original, a `clip-path` here), and the panel is the
standard raised bevel. There is nothing to license.

**Assets:** `F:\steam-style\steam-style-react\` ships **no image assets, by
policy** — no `public/`, no `src/assets/`. The one asset that *would* be natural
here is the port's `sliderticks.png` (**15×5**, the alpha/hue slider ticks,
`F:\steam-style\vgui.css\styles\greensteam\sliderticks.png`), but the tick marks
are trivially reproducible with a repeating gradient, so the gap does not block
the `--continuous` or `--alpha` variants. It does block any attempt to ship the
sprite-based original, which is the correct outcome: `foundations.md` §7 rules
binary sprites out and prefers inline SVG `data:` URIs and CSS geometry.

## Examples

```tsx
{/* The faithful case: choose from the scheme's named colours. */}
<ColorPicker value="#4C5844" onValueChange={setColor} hex />

{/* Trigger only, in a dense toolbar. */}
<ColorPicker value={tagColor} onValueChange={setTagColor} swatchOnly
             aria-label="Tag colour" />

{/* A restricted palette — status colours only. */}
<ColorPicker
  value={statusColor}
  onValueChange={setStatusColor}
  palette={[
    { name: 'Online',  value: '#7EA64B' },
    { name: 'Away',    value: '#C4B550' },
    { name: 'Busy',    value: '#E2251A' },
    { name: 'Offline', value: '#758666' },
  ]}
  columns={4}
/>

{/* Not period-accurate; opt in deliberately. */}
<ColorPicker value={c} onValueChange={setC} continuous alpha hex />
```

## Open questions

- **The component has no corpus evidence whatsoever.** This was verified twice:
  no `ColorPicker` (or swatch/palette/colour-editor class name) appears in any
  resource file in `F:\steam-style\OG-Steam\OG-Steam\`, nor anywhere in the
  `vgui.css` port under `F:\steam-style\vgui.css\`. `docs/README.md:108`'s claim
  that it "exists in Steam's client resource set (`resource/layout/`)" is
  **incorrect for this corpus** and has been amended. Either the control is
  compiled into the client with no resource reference (the same situation as
  `Avatar` and `SpinBox`), or the claim came from outside this corpus and cannot
  be cited.
- **Should this component ship at all?** The alternative is to declare it
  unsupported, as `docs/README.md` does for `GroupBox` and `StatusBar` — but
  both of those turned out to be *compositions with real metrics*, whereas this
  has neither a class nor metrics. The strongest position is: ship it, label it
  library-original in the README, and default to `palette`-only so the default
  output is a scheme editor rather than a modern colour wheel.
- **The swatch grid layout is invented.** `--vgui-color-picker-columns` defaults
  to `12` because it is a common picker width and the 41-entry palette then reads
  as three full rows plus a five-wide stub — but there is no grid anywhere in
  VGUI to model it on, and no column count makes 41 rectangular. A screenshot of
  any Valve tooling colour grid would be worth having.
- **How many colours the scheme has is easy to miscount.** The `Colors` block
  (`steamscheme.res:10-71`) contains **41** named entries — 40 of the quoted
  `"Name" "R G B A"` form plus `SecBG GrayBG2` (`:28`), which is a bare alias
  with no quotes and no value of its own. Reading the block with a script: 41
  entries, **31 distinct opaque `R G B` values**, exactly **2 non-opaque** entries
  (`TransparentBlack` `"0 0 0 128"` `:14`, `Blank` `"1 1 1 0"` `:16`), and three
  further aliases (`NotificationBodyText`→`White` `:53`, `TitleBG` and `TitleDimBG`
  →`TestColor` `:64-65`). `TestColor` `"255 0 0 255"` (`:17`) is left over from
  development. So "how many entries" is 41 and "how many distinct colours" is 31;
  both numbers are worth keeping straight. What is *not* settled is whether Valve
  shipped more colours in other schemes (`ClientScheme.res` variants).
- **`BorderSelection` `"0 0 0 255"` may be the wrong token.** It is named for
  selection and it is the only selection-border colour in the scheme, but nothing
  in the corpus *uses* it for a swatch. It might be the general selection border
  for list rows, in which case the swatch box is a re-use rather than a match.
- **Alpha is in the data model but barely in the theme.** Every palette entry is
  RGBA (`steamscheme.res:13`), and exactly **two** of the 41 entries are not
  opaque:
  `TransparentBlack` `"0 0 0 128"` (`:14`) and `Blank` `"1 1 1 0"` (`:16`) — both
  utility entries, neither a colour anyone would pick deliberately. So the
  data model needs alpha, the palette UI does not, and supporting alpha in the
  value type while providing no UI for it is the right default.
