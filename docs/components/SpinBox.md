# SpinBox

A numeric text field with paired up/down buttons for stepping a value. It is a
**composition**, not a VGUI control: the corpus has an inset `TextEntry` and it
has arrow-button styles, but nothing joins them.

## Purpose

`SpinBox` is for values that are (a) numeric, (b) in a bounded range, and (c)
adjusted in small increments — the sensitivity slider's numeric companion,
a port number, an FOV, a "players" field. When any of those three fails, use
`TextInput`, `Slider` or `Select` instead.

It exists in real Steam-adjacent UIs but not in this corpus's resource set, so
this doc is explicit about which parts are transcribed and which are composed.

## VGUI original

**Composed — no `SpinBox` in the corpus.** A case-insensitive search for
`spinbox`, `spin_box`, `spinner` and numeric-stepper names across every `.res`,
`.layout`, `.styles`, `.menu`, `.vdf`, `.txt`, `.cfg` and `.json` file in
`F:\steam-style\OG-Steam\OG-Steam\` returns **nothing relevant**.

So the component is assembled from three things that *are* in the corpus.

### 1. The field — `TextEntry`

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\styles\steam.styles:2395
```

| Property | Value | Line |
| --- | --- | --- |
| `font-family` | `basefont` | `steam.styles:2397` |
| `font-size` | `14` (`16 [$OSX]`) | `steam.styles:2398-2399` |
| `bgcolor` | `DarkGreenBG` | `steam.styles:2400` |
| `textcolor` | `White` | `steam.styles:2401` |
| `inset` | `"4 0 4 0"` | `steam.styles:2402` |
| `selectedbgcolor` | `MaizeBG` | `steam.styles:2403` |
| `selectedtextcolor` | `White` | `steam.styles:2404` |
| `shadowtextcolor` | `White` | `steam.styles:2405` |

The `render` block gives it the **recessed** bevel — the opposite of a button:

```ini
1="fill( x0, y0, x1, y0 + 1, BorderDark )"     // top
2="fill( x0, y1 - 1, x1, y1, BorderBright )"   // bottom
3="fill( x0, y0, x0 + 1, y1 - 1, BorderDark )" // left
4="fill( x1 - 1, y0, x1, y1, BorderBright )"   // right
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\styles\steam.styles:2406-2413
```

Dark on top and left, bright on bottom and right — the field is sunk into the
surface. `Select.md` and `TextInput.md` document this same recipe; a `SpinBox`'s
field is a `TextInput` and must match it exactly, or the two will not sit
together in a form.

`TextEntry:focus` (`steam.styles:2415`) restates `textcolor = White` and
`bgcolor = DarkGreenBG` and supplies a focus `render` — the field does **not**
change colour on focus, only its border treatment.

### 2. The stepper buttons — but the assets are half missing

The corpus has panel *styles* for arrows, defined in `steam.styles`'s shared
`styles` block:

| Style | Line | Image | Sprite exists? | Size |
| --- | --- | --- | --- | --- |
| `downarrow` | `steam.styles:393` | `graphics/icon_down_default` | ✅ | 9×6 |
| `downarrow:hover` | `steam.styles:398` | `graphics/icon_down_hover` | ✅ | 9×6 |
| `uparrow` | `steam.styles:403` | `graphics/icon_up_default` | ❌ **missing** | — |
| `rightarrow` | `steam.styles:408` | `graphics/icon_right_default` | ✅ | 13×13 |
| `rightarrow:hover` | `steam.styles:413` | `graphics/icon_right_hover` | ✅ | 13×13 |

The whole `icon_*` set was enumerated in `graphics/`. The findings:

- **There is no `icon_up_*` file of any kind.** `uparrow` (`steam.styles:403`)
  points at artwork that does not ship. The up arrow is simply absent from this
  resource set.
- `icon_down_disabled.tga` and `icon_down_focus.tga` **exist on disk** but **no
  style block declares them** — so the disabled and focus arrow states are
  drawn by the C++ control, not by `steam.styles`.
- `icon_left_default.tga` and `icon_left_hover.tga` exist (13×13) with **no
  `leftarrow` style block at all**.
- **No layout in the corpus applies any of these styles.** A search for
  `style="uparrow"`, `style="downarrow"` and `style="rightarrow"` across every
  `.layout` and `.res` returns nothing.

So the stepper vocabulary is: a real 9×6 down arrow, a real 13×13 right arrow,
file-only left/disabled/focus arrows, **a missing up arrow**, no `leftarrow`
style, and no consumer. It is a scrap of a control rather than a control.

**The recommendation follows from that:** do not depend on these sprites. Draw
the stepper glyphs **procedurally**, reusing the arrow primitive that
`Scrollbar.md` already specifies — a 7×4 pixel staircase built from `fill()`
calls, which is how Valve drew the scrollbar arrows and the only arrow geometry
in this theme that is fully specified without an asset. A `SpinBox`'s up arrow is
the down arrow mirrored, which sidesteps the missing `icon_up_default` entirely
and keeps the two arrows provably identical in weight.

### 3. The button — `ComboBox`'s arrow button

The closest thing in the corpus to a small attached arrow button is the
`ComboBox`'s drop-down button:

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

A recessed field, a `3 0 0 0` inset, and a beveled arrow button beside it — the
same visual grammar a `SpinBox` needs, with the button stacked twice instead of
once. `Select.md` covers the single-button case; a `SpinBox` is that pattern with
a 2-row button column.

## Variants

| Variant | What changes | Source |
| --- | --- | --- |
| *(default)* | Integer, field + 2-row stepper column | *(composition)* |
| `--decimal` | Accepts a decimal separator; `step` may be fractional | *(library)* |
| `--horizontal` | Steppers side by side instead of stacked | *(library)* |
| `--compact` | 18px tall, 12px text | *(library)* |
| `--no-steppers` | Field only, with keyboard stepping | *(library)* — for narrow columns |

`--no-steppers` is worth shipping: a `SpinBox` in a dense table cell cannot
afford a button column, but Up/Down arrow keys still work. This is the
accessible fallback and it costs nothing.

## Anatomy

```tsx
<div class="vgui-spin-box" role="group">
  <input class="vgui-spin-box__input" type="text" role="spinbutton"
         aria-valuenow="16" aria-valuemin="1" aria-valuemax="100" value="16" />
  <div class="vgui-spin-box__steppers">
    <button class="vgui-spin-box__step vgui-spin-box__step--up"   aria-label="Increase">…</button>
    <button class="vgui-spin-box__step vgui-spin-box__step--down" aria-label="Decrease">…</button>
  </div>
</div>
```

- **Field** — a `TextInput`-equivalent input, recessed bevel, `DarkGreenBG`.
- **Stepper column** — two buttons stacked vertically, in a small beveled plate.
  Together they are one button column, not two floating buttons; the plate is
  what makes the group read as a single control (the `ComboBox` grammar).
- **Glyphs** — the 7×4 staircase from `Scrollbar.md`, up and down, mirrored.

The stepper column is **outside** the field's border, not overlapping it. In
`ComboBox` the arrow button is a sibling of the field within the recessed frame
(`steam.styles:703`); a `SpinBox` keeps the same relationship.

## States

| State | Field | Steppers | Source |
| --- | --- | --- | --- |
| Normal | `DarkGreenBG` `#3E4637`, recessed bevel | Raised bevel, `--vgui-surface` face | `steam.styles:2400-2413` |
| Focus | **No colour change**; focus `render` applies | — | `steam.styles:2415` |
| Hover (field) | Nothing | — | `TextEntry` declares no `:hover` |
| Hover (stepper) | — | `downarrow:hover` image swap only | `steam.styles:398` |
| Active (stepper) | — | Bevel **inverts**, per `Button` | *(none here)* — `Button:active` |
| Disabled | `--vgui-text-disabled` text; steppers at their limit | Steppers disabled individually | *(library)* |
| At limit | — | The relevant stepper disables | *(library)* — see below |
| Read-only | Field not editable; steppers still live | — | *(library)* |

**The limits behaviour is the important spec.** When the value reaches `max`,
the up stepper must become `disabled`; at `min`, the down stepper must. Valve's
`icon_down_disabled.tga` exists on disk with no style block, which is the only
hint the corpus gives that a disabled arrow state was drawn at all. Disabling the
stepper is also what makes the range discoverable — the user learns the bounds by
hitting them, without an error message.

**Focus does not recolour the field.** `steam.styles:2415` restates the same
`textcolor` and `bgcolor` under `TextEntry:focus`. A `SpinBox` that highlights
its input on focus is not this theme.

**Hold-to-repeat.** Pressing and holding a stepper should repeat. The delay is
not in the corpus; `500ms` before the first repeat, then `50ms` per step, is the
conventional pair. Single activation must always work on its own — repeat is an
accelerator, never the only path (WCAG 2.5.1).

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-surface-dark` `#3E4637` | Field background (`DarkGreenBG`) |
| `--vgui-bevel-dark` `#292D23` | Field top/left; stepper bottom/right |
| `--vgui-bevel-light` `#899281` | Field bottom/right; stepper top/left |
| `--vgui-surface` `#4C5844` | Stepper face |
| `--vgui-surface-light` `#5A6A50` | Optional stepper hover face |
| `--vgui-text-strong` `#FFFFFF` | Field text |
| `--vgui-accent-dark` `#91863C` | Selected text background (`MaizeBG`) |
| `--vgui-text-muted` `#A0AA95` | Glyph colour (matches `Label`, unconfirmed) |
| `--vgui-text-dim` `#758666` | Disabled glyph |
| `--vgui-accent` `#C4B550` | Focus ring |
| `--vgui-spin-box-height` `25px` | Total height, matching `Button` |
| `--vgui-spin-box-step-width` `17px` | Stepper column width |
| `--vgui-spin-box-inset` `4px` | Field text inset |

Component-local metrics keep `var()` fallbacks; palette tokens do not.

The `25px` height and `17px` step column are chosen to match `Button`'s
`min-height: 25px` (`Button.md`) and the `ComboBox`'s proportions, so a `SpinBox`
lines up with the other form controls in a row. The corpus gives no explicit
`SpinBox` height because there is no `SpinBox`.

## CSS recipe

```css
.vgui-spin-box {
  display: inline-flex;
  align-items: stretch;
  min-block-size: var(--vgui-spin-box-height, 25px);
}

/* The field: TextEntry, steam.styles:2395-2414. Recessed, DarkGreenBG. */
.vgui-spin-box__input {
  box-sizing: border-box;
  inline-size: 100%;
  min-inline-size: 0;
  padding: 0 var(--vgui-spin-box-inset, 4px);
  font: inherit;
  font-size: var(--vgui-font-size, 14px);
  line-height: 1;
  color: var(--vgui-text-strong);
  background-color: var(--vgui-surface-dark);
  border-top: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-light);
  border-right: 1px solid var(--vgui-bevel-light);
  /* A spin box is left-aligned numeric; right-align only for money. */
  text-align: left;
  appearance: none;
}

/* Focus restates the same colours — steam.styles:2415. */
.vgui-spin-box__input:focus { outline: none; }

/* The stepper plate: one beveled column, ComboBox grammar. */
.vgui-spin-box__steppers {
  display: grid;
  grid-template-rows: 1fr 1fr;
  inline-size: var(--vgui-spin-box-step-width, 17px);
  flex: none;
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
}

.vgui-spin-box__step {
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--vgui-text-muted);
  cursor: pointer;
  /* A 2-row column means each button is under 24px tall — see Accessibility. */
}

.vgui-spin-box__step:active {
  /* Button:active inverts the bevel. Reuse that, not a translate. */
  box-shadow: inset 1px 1px 0 var(--vgui-bevel-dark),
              inset -1px -1px 0 var(--vgui-bevel-light);
}

.vgui-spin-box__step:disabled {
  color: var(--vgui-text-dim);
  cursor: default;
}

.vgui-spin-box__step:focus-visible {
  outline: 2px solid var(--vgui-accent);
  outline-offset: -2px;
}

/* The glyph: the 7x4 staircase from Scrollbar.md, mirrored for "up". */
.vgui-spin-box__glyph {
  inline-size: 7px;
  block-size: 4px;
  background-color: currentColor;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);   /* down */
}

.vgui-spin-box__step--up .vgui-spin-box__glyph {
  clip-path: polygon(50% 100%, 100% 0, 0 0);      /* up = mirrored, not a new asset */
}

.vgui-spin-box--horizontal .vgui-spin-box__steppers {
  grid-template-rows: none;
  grid-template-columns: 1fr 1fr;
  inline-size: calc(2 * var(--vgui-spin-box-step-width, 17px));
}
```

**Do not use `<input type="number">`.** It brings native spinner buttons that
cannot be styled away consistently, its own inconsistent keyboard handling, and
`aria-valuenow` semantics that fight a custom stepper. Use
`type="text"` with `inputmode="numeric"` (or `"decimal"`), `role="spinbutton"`,
and the full key handling below. The one exception is `--no-steppers`, where
native `type="number"` semantics are a reasonable trade for a cell that already
has no visible steppers — but the visual inconsistency is usually worse than the
convenience.

**The recurrence of the arrow primitive is deliberate.** `Scrollbar.md`
establishes that Valve drew the scrollbar arrows as 7×4 pixel staircases with
`fill()` calls and no sprite. Reusing that geometry here means the `SpinBox`'s
arrows are pixel-identical in weight to the scrollbar's, which is what a real
VGUI screenshot shows — and it is the only way to get an up arrow at all, given
that `icon_up_default` does not exist.

## Keyboard handling

Required, and not optional — the steppers are unreachable by keyboard alone in
many layouts, and the arrow glyphs are under the target-size minimum.

| Key | Action |
| --- | --- |
| `ArrowUp` | `+step` |
| `ArrowDown` | `-step` |
| `PageUp` | `+step × 10` |
| `PageDown` | `-step × 10` |
| `Home` | `min` |
| `End` | `max` |
| `Escape` | Revert to the value at focus time |
| `Enter` | Commit |

With `wrap` enabled, ArrowUp at `max` wraps to `min`. **`wrap` must be off by
default** — wrapping numeric bounds silently is how users set a port to 65535
when they meant 0.

## React API

```tsx
export interface SpinBoxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** Current value. `undefined` renders the input empty. */
  value?: number
  /** Called with the new value on every accepted change. */
  onValueChange?: (value: number) => void
  /** Lower bound, inclusive. */
  min?: number
  /** Upper bound, inclusive. */
  max?: number
  /** Increment applied by the steppers and by ArrowUp/ArrowDown. */
  step?: number
  /** Allow fractional values. Switches keyboard input to a decimal keyboard. */
  decimal?: boolean
  /** Wrap past the bounds instead of disabling the stepper. Off by default. */
  wrap?: boolean
  /** Hide the stepper column. Arrow keys still work. */
  noSteppers?: boolean
  /** Lay the steppers out side by side. */
  horizontal?: boolean
  /** Compact 18px variant, for dense rows. */
  small?: boolean
  /** Text announced in place of the raw number, e.g. "16 players". */
  valueText?: string
}
```

Notes:

- `onValueChange` fires on a committed change, not on every keystroke. Typing
  `1` then `6` to mean 16 must not fire `1` and then `16`. Commit on blur,
  `Enter`, and any stepper press; parse and clamp on commit.
- Clamp on commit for typed input, but **disable the stepper** at the bounds
  rather than clamping silently when a stepper is pressed — the two paths differ
  deliberately.
- `forwardRef<HTMLInputElement>`; `className` merged **last**.

## Accessibility

- **`role="spinbutton"` on the input, with `aria-valuenow`, `aria-valuemin`,
  `aria-valuemax` and preferably `aria-valuetext`.** This is the role a screen
  reader expects to be increasable with the arrow keys. Omitting it means the
  control is announced as a plain text field and the user has no idea a range
  exists.
- **The stepper buttons need accessible names.** A bare triangle announces as
  "button". Label them `aria-label="Increase"` / `"Decrease"` (localisable), or
  use visually hidden text.
- **Do not put the steppers in the tab order.** They are redundant with the
  arrow keys. `tabIndex={-1}` on both keeps the tab stop count at one per control,
  which matters in a form with ten spin boxes. This is a deliberate departure
  from "every control is reachable" — they *are* reachable, via `role="spinbutton"`
  and the arrow keys, and that is the standard pattern.
- **Target size is a real problem here.** A 25px-tall control split into two
  stacked steppers gives each button roughly 12px of height — far below the 24×24
  minimum (WCAG 2.5.8). Two mitigations, and at least one is required:
  1. **`--small` must not be used** in any place where stepping is the primary
     interaction.
  2. **Keep the arrow keys as a first-class path** and say so in the UI's help, or
     use `--horizontal` in forms where stepping matters. A horizontal pair at
     17×25 each is `17px` wide — still short. The honest fix is a taller default
     (say `30px`, giving 15px per stepper) or a wider step column. This doc
     recommends exposing the height and documenting the trade.
- **Contrast of the glyphs.** `--vgui-text-muted` `#A0AA95` on `--vgui-surface`
  `#4C5844` is **3.11:1** (computed here; `foundations.md:436` lists the token
  only against `--vgui-surface-dark`, where it reaches 4.06:1). 3.11:1 clears the
  3:1 that WCAG 1.4.11 wants for a non-text control, so a muted glyph on a green
  panel is *just* acceptable — but only for the glyph, never for the value text.
  The disabled glyph `--vgui-text-dim` `#758666` on `--vgui-surface` is
  **1.92:1** (`foundations.md:440`) — a fail. A disabled stepper is genuinely
  non-interactive so the colour is not the only signal, but it should also drop
  its `cursor: pointer` and, ideally, gain `aria-disabled` on the group.
- **Field text is fine.** `--vgui-text-strong` `#FFFFFF` on `--vgui-surface-dark`
  `#3E4637` is **9.83:1** (computed; `foundations.md:429` is white-on-`surface`
  at **7.54:1**, and `surface-dark` is darker so the ratio is higher). AAA.
- **Selected text.** `MaizeBG` `#91863C` with white text is **3.70:1**
  (`foundations.md:468`) — a fail. Per `foundations.md`'s baseline rule 1
  (`:518`), use `color: #232421` on the selection and it reaches **4.22:1**
  (`:467`).
- **Do not rely on the `shadowtextcolor = White` text shadow**
  (`steam.styles:2405`). A white shadow under white text is a legibility loss on
  a dark field. If the corpus value is reproduced, gate it behind the
  `pixelPerfect` opt-in.

## Assets

**None may be shipped, and the corpus's own stepper assets are incomplete.**
`steam.styles:403` names `graphics/icon_up_default` — no such file exists in
`F:\steam-style\OG-Steam\OG-Steam\graphics\` (nor any other `icon_up_*`). So
even a library willing to redistribute Valve's art could not build a faithful
up arrow from it.

The glyphs are therefore drawn procedurally, reusing the 7×4 staircase geometry
that `Scrollbar.md` derives from Valve's `fill()` calls. The down arrow is the
staircase; the up arrow is the same shape mirrored vertically. This is
asset-free, license-free, and — because both arrows come from one primitive —
guaranteed to be visually consistent, which is more than the corpus's own set is
(`icon_down_*` at 9×6 vs `icon_right_*` at 13×13 are two different weights).

**Art gap:** `F:\steam-style\steam-style-react\` ships **no image assets at
all** — no `public/`, no `src/assets/`. For most components that is a blocker;
here it is a *relief*, because the component's natural artwork is precisely the
half that the corpus lost (`icon_up_*`). `foundations.md` §7 rules binary
sprites out and prescribes inline SVG `data:` URIs or pure CSS geometry; the
staircase is small enough that pure CSS — two borders and a rotation, or a
`polygon()` `clip-path` — is the cheapest faithful option.

## Examples

```tsx
{/* Port number, bounded, stepping by 1. */}
<SpinBox value={port} onValueChange={setPort} min={1} max={65535} aria-label="Port" />

{/* Players, the common case. */}
<SpinBox value={players} onValueChange={setPlayers} min={1} max={32} aria-label="Max players" />

{/* FOV, fractional, with a spoken value. */}
<SpinBox value={fov} onValueChange={setFov} min={54} max={106} step={0.5} decimal
         valueText={`${fov} degrees`} aria-label="Field of view" />

{/* Inside a dense table cell: no steppers, keyboard only. */}
<SpinBox value={tickrate} onValueChange={setTickrate} noSteppers small aria-label="Tickrate" />
```

## Open questions

- **`SpinBox` is not in this corpus at all.** Every resource file was searched;
  the name does not appear. This doc is therefore a composition with transcribed
  parts, not a transcription. The most likely explanation is that the control
  lives in the C++ layer (or that this resource set is a partial extract), which
  is the same situation as `Avatar`. (`ColorPicker` is a *different* case: it is
  a documented library-original with no corpus presence at all — see
  `docs/README.md`.)
- **`icon_up_default` is missing from the resource set.** Two possibilities: the
  up arrow sprite was genuinely never shipped (unlikely, given `uparrow` at
  `steam.styles:403` references it), or this extract of Steam's `graphics/`
  directory is incomplete. **Checking whether the extract is complete would
  resolve this for `icon_up_*`, `icon_left_*` and possibly the avatar art at
  once.**
- **The arrow styles have no consumers.** `uparrow`, `downarrow` and
  `rightarrow` are declared (`steam.styles:393-416`) and never applied by any
  layout. Whatever used them is not in this corpus, which is why the button's
  bevel is taken from `ComboBox` (`:703`) rather than from the arrow styles.
- **The `inset = "4 0 4 0"` reading.** This doc treats the four values as
  left/top/right/bottom, giving 4px of horizontal text padding, matching how
  `Button.md` reads `Button`'s `"4 0 0 0"` as a 4px left inset. If VGUI's order is
  actually top/right/bottom/left, the padding is vertical instead. The pixel
  behaviour is untested here.
- **Nothing specifies the repeat rate** for hold-to-repeat. `500ms`/`50ms` is a
  convention, not a corpus value.
