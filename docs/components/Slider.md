# Slider

## Purpose

A draggable thumb on a track, for choosing a number from a range. In the client
it sets master volume, voice transmit volume, mouse sensitivity, and the
"crosshair size" in a few game configs. It is drawn with **more care than any
other control in the theme** — the track is a black groove with tick marks, and
the thumb is a small raised plateau.

## VGUI original

Two classes that share the look:

- `Slider` — VGUI1 (`vgui_dll/include/VGUI_Slider.h`) and VGUI2
  (`vgui_controls/Slider.cpp`). The base control: a track, a thumb, `SetRange`,
  `SetValue`, a `sliderMoved` callback. VGUI2's `Slider` is **abstract** — it
  draws a track and thumb but the `Slider` class itself does not style the
  track; that is the job of `SliderHoriz`.
- `SliderHoriz` — the horizontal concrete subclass. `steam.styles` styles both:

```
Slider
{
    bgcolor         "SliderBG"
    border          "SliderBorder"
}

SliderHoriz
{
    image           { SliderThumbHorizontal }
    size            "8 16"          /* thumb */
}
```

The port's geometry — **exact**, from `steam_shared.css:171-232`:

```css
input[type=range] {
  appearance: none;
  min-width: 200px;
  color: #b8c4ad;                    /* min/max labels */
  background: none;
  position: relative;
}
input[type=range]::before,
input[type=range]::after {
  display: inline;
  position: absolute;
  font-size: 10px;
  top: 10px;
  font-family: monospace;
}
input[type=range]::before { left: 0;  content: attr(min); }
input[type=range]::after  { right: 0; content: attr(max); }

input[type=range]::-webkit-slider-runnable-track {
  background: black;
  height: 4px;
  border-top: solid 1px #292d23;
  border-bottom: solid 1px #899281;
  border-left: solid 1px #292d23;
  border-right: solid 1px #899281;
  margin: 6px 0;
}
input[type=range]::-webkit-slider-thumb {
  appearance: none;
  background: #4c5844;
  border-top: solid 1px #899281;
  border-bottom: solid 1px #292d23;
  border-left: solid 1px #899281;
  border-right: solid 1px #292d23;
  width: 8px;
  height: 16px;
  position: relative;
  top: -7px;
  border-radius: 0;
}
input[type=range]:focus {
  outline: 1px dotted black;
  outline-offset: 2px;
}
input[type=range].ticks {
  background: url("sliderticks.png") repeat-x;
  background-position: bottom left 2px;
  background-size: 19px 5px;
}
```

Read the track and thumb blocks next to each other and the whole design is
visible:

- **The track is inset** — dark top/left, light bottom/right, black inside.
  It is a groove cut into the panel.
- **The thumb is raised** — light top/left, dark bottom/right, `--vgui-surface`
  inside. It is a physical slider resting in the groove.
- **Thumb `8 × 16`, track `4px`.** The thumb is exactly twice the track height
  and overlaps it, which is what makes the "riding in a slot" illusion work.
- **The thumb is centred with `position: relative; top: -7px`, not `margin-top`.**
  That matters: `top` also shifts the *hit area*, so the draggable region sits
  half outside the input's own box. A `margin-top` on the thumb would move the
  box instead and change the track's layout height.

**The min/max labels are part of the component, not decoration.** The port uses
`::before { content: attr(min) }` and `::after { content: attr(max) }` to print
the range endpoints in `10px` monospace, `#b8c4ad`
(`--vgui-bevel-light-strong`), pinned to the ends of the track below it. That is
a real, useful feature that is easy to miss when skimming the file, and it is why
the base rule carries a `color` at all — the range input has no text of its own.
The `--small` and `--vertical` variants have to reposition those labels, and any
port that drops them loses information the original showed.

**The `-7px` is derived, not arbitrary:** for a 4px track and a 16px thumb, the
thumb must move up by roughly (16 − 4)/2 = 6px to be centred, plus 1px for the
border. Express it as
`top: calc((var(--vgui-slider-thumb-h) - var(--vgui-slider-track-h)) / -2 - 1px)`
so changing either metric keeps the thumb in its groove.

**One inconsistency in the port to fix rather than copy.** The `-moz-range-track`
rule is duplicated — once with `height: 4px` and again with `height: 2px`
(`greensteam.css:268-281`). Whichever wins, the Firefox track is not the same
height as the WebKit one, so the same slider looks different in the two engines.
Standardise on `4px`.

The `sliderticks` sprite provides the tick marks. VGUI's `Slider` drew them
behind the thumb at `numTicks` intervals; the sprite is a single-row tile, so the
CSS equivalent is a `repeating-linear-gradient`.

## Anatomy

```html
<span class="vgui-slider">
  <input type="range" class="vgui-slider__input vgui-slider__input--ticks"
         min="0" max="100" step="1" />
</span>
```

The wrapper carries layout only. **The min/max labels and the tick tile live on
the input itself**, because the labels come from `content: attr(min)` /
`attr(max)` — an `attr()` lookup can only see the attributes of the element it is
applied to. Moving the labels into a sibling span would mean duplicating `min`
and `max` as text and keeping them in sync by hand. That is the reason VGUI's
port does it this way and it is worth preserving rather than "cleaning up".

## Variants

| Variant | Class | Use |
| --- | --- | --- |
| Default | — | Horizontal, `8 × 16` thumb, no ticks |
| With ticks | `--ticks` | `sliderticks` groove marks; for stepped values |
| Vertical | `--vertical` | The client rarely used these; see *Open questions* |
| With value | `--with-value` | A numeric readout to the right, the way Valve paired a slider with a spin box |
| Small | `--small` | `6 × 12` thumb, `3px` track, for dense property rows |
| Disabled | — | via the `disabled` attribute |

## States

| State | Track | Thumb |
| --- | --- | --- |
| Normal | Inset bevel, `#000` groove | Raised bevel, `--vgui-surface` |
| Hover | unchanged | unchanged — the port defines no thumb hover |
| Active (dragging) | unchanged | **Inset** bevel — the thumb presses *into* the groove while dragged |
| Focus | `outline: 1px dotted #000; outline-offset: 2px` around the whole input, per the port | unchanged |
| Disabled | unchanged | `--vgui-surface-dark`, bevel removed — **an invention**; see *Open questions* |

The thumb inverting while dragged is a nice touch that the port does not
implement but that the bevel logic implies, and it is worth adding: it is the one
moment the user needs feedback that they are holding the control.

**The port's focus ring is present but nearly invisible.** `1px dotted #000` at
`outline-offset: 2px` sits over `--vgui-surface` `#4C5844` (**1.15:1**) on the
`--with-value` layout and over the page background elsewhere. Unlike the form
controls, whose dotted rings are drawn inside a black field, a slider has no dark
interior to hide in. See the accessibility section.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-field-bg` (`#000`) | Track groove |
| `--vgui-surface` `#4C5844` | Thumb face |
| `--vgui-bevel-dark` `#292D23` | Track top/left, thumb bottom/right |
| `--vgui-bevel-light` `#899281` | Track bottom/right, thumb top/left |
| `--vgui-bevel-light-strong` `#B8C4AD` | Min/max endpoint labels |
| `--vgui-text-dim` `#758666` | Tick marks |
| `--vgui-text` `#D8DED3` | Associated numeric readout |
| `--vgui-accent` `#C4B550` | Replacement focus ring |

Add metric tokens to `theme.css` — `--vgui-slider-track-h: 4px`,
`--vgui-slider-thumb-w: 8px`, `--vgui-slider-thumb-h: 16px`, and
`--vgui-slider-tick-pitch: 19px` (the `sliderticks` tile size) — so the `--small`
variant, the thumb `top` `calc()` and the tick gradient all derive from one
place. **There is no `--vgui-field-bg` yet**; see
[`TextInput`](./TextInput.md#tokens) for why it is needed.

## CSS recipe

```css
.vgui-slider {
  --vgui-slider-track-h: 4px;
  --vgui-slider-thumb-w: 8px;
  --vgui-slider-thumb-h: 16px;
  --vgui-slider-tick-pitch: 19px;

  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 24px;                 /* target size: the 16px thumb is too small */
  min-width: 200px;                 /* from the port */
  width: 100%;
  padding-bottom: 12px;             /* room for the min/max labels */
}

.vgui-slider__input {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  margin: 0;
  background: none;
  cursor: pointer;
  /* The port paints the endpoint labels with attr() on the input itself. */
  color: var(--vgui-bevel-light-strong);
}

/* Endpoint labels, straight from the port: content: attr(min)/attr(max). */
.vgui-slider__input::before,
.vgui-slider__input::after {
  position: absolute;
  bottom: 0;
  font-family: var(--vgui-font-mono);
  font-size: 10px;
  line-height: 1;
  pointer-events: none;
}
.vgui-slider__input::before { left: 0;  content: attr(min); }
.vgui-slider__input::after  { right: 0; content: attr(max); }

/* The groove — INSET — with the port's 6px vertical margin. */
.vgui-slider__input::-webkit-slider-runnable-track {
  height: var(--vgui-slider-track-h);
  margin: 6px 0;
  background-color: var(--vgui-field-bg);
  border-top: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-light);
}

/* The thumb — RAISED, centred with `top` (which moves the hit area too). */
.vgui-slider__input::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  box-sizing: border-box;
  position: relative;
  top: calc((var(--vgui-slider-thumb-h) - var(--vgui-slider-track-h)) / -2 - 1px);
  width: var(--vgui-slider-thumb-w);
  height: var(--vgui-slider-thumb-h);
  background-color: var(--vgui-surface);
  border-radius: 0;
  border-top: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-light);
  border-right: 1px solid var(--vgui-bevel-dark);
}

/* Firefox: same 4px track (the port ships 4px AND 2px — a bug; pick 4px). */
.vgui-slider__input::-moz-range-track,
.vgui-slider__input::-moz-range-progress {
  height: var(--vgui-slider-track-h);
  margin: 6px 0;
  background-color: var(--vgui-field-bg);
  border-top: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-light);
}
.vgui-slider__input::-moz-range-thumb {
  box-sizing: border-box;
  width: var(--vgui-slider-thumb-w);
  height: var(--vgui-slider-thumb-h);
  border-radius: 0;
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-light);
  border-right: 1px solid var(--vgui-bevel-dark);
}

.vgui-slider__input:active::-webkit-slider-thumb,
.vgui-slider__input:active::-moz-range-thumb {
  border-top-color: var(--vgui-bevel-dark);
  border-bottom-color: var(--vgui-bevel-light);
  border-left-color: var(--vgui-bevel-dark);
  border-right-color: var(--vgui-bevel-light);
}

/* Replace the port's invisible dotted ring. */
.vgui-slider__input:focus-visible {
  outline: 2px solid var(--vgui-accent);
  outline-offset: 2px;
}

/* Ticks: the sliderticks tile is 19×5, positioned bottom-left +2px. */
.vgui-slider__input--ticks {
  background-image: repeating-linear-gradient(
    90deg,
    var(--vgui-text-dim) 0 1px,
    transparent 1px var(--vgui-slider-tick-pitch)
  );
  background-repeat: repeat-x;
  background-position: bottom 2px left;
  background-size: var(--vgui-slider-tick-pitch) 5px;
}
```

**`::-webkit-` and `::-moz-` are not interchangeable**, and there is no working
`::-ms-` for the modern engine. This is the one component in the library that
needs parallel selector blocks, and the port's own duplication
(`::-moz-range-track` declared twice with different heights) shows how easy it is
to get wrong.

**Firefox and the `top` offset.** The port applies `position: relative; top:
-7px` to both `::-webkit-slider-thumb` and `::-moz-range-thumb`. Gecko centres
the thumb on the track itself, so applying both the engine's centring *and* a
`-7px` offset double-displaces it. The recipe above therefore offsets only the
WebKit thumb and lets Firefox centre its own. **This needs visual verification in
both engines** — it is the kind of thing that looks right in the developer's
browser and wrong in everyone else's.

## React API

```tsx
export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Inclusive minimum. Defaults to 0. */
  min?: number
  /** Inclusive maximum. Defaults to 100. */
  max?: number
  /** Step increment. Defaults to 1. */
  step?: number
  /** Controlled value. */
  value?: number
  /** Called continuously while dragging. */
  onValueChange?: (value: number) => void
  /** Called once when the drag ends — use this for expensive work. */
  onValueCommit?: (value: number) => void
  /** Draw the sliderticks groove marks. */
  ticks?: boolean
  /** Show the current value in a readout after the slider. */
  showValue?: boolean
  /** How to format `showValue`. */
  formatValue?: (value: number) => string
  /** Small variant for dense property rows. */
  small?: boolean
}
```

`onValueChange` vs `onValueCommit` mirrors the native `input` vs `change` event
pair, which is exactly what a slider needs: react to every frame of a drag for
the label, and only persist on release. Exposing both is what prevents consumers
from writing a network call into `onValueChange`.

## Accessibility

- **Use `<input type="range">`.** It has `role="slider"` semantics, arrow-key
  stepping, `Home`/`End` to the extremes, `PageUp`/`PageDown` for large steps and
  correct announcement for free. Every custom `div` slider reimplements these
  badly.
- **`Home`/`End`/`PageUp`/`PageDown` are the drag-alternative for WCAG 2.5.7.**
  They work natively; **do not** add a `keydown` handler that swallows them.
- **`aria-valuetext` is required when the number is not meaningful on its own.**
  A volume slider at `0.75` must announce "75 percent", not "0 point 7 5". Set
  `aria-valuetext` from `formatValue` whenever `formatValue` is provided — couple
  them so it cannot be forgotten.
- **The `16px` thumb and `4px` track are well under the 24×24 target minimum.**
  The wrapper's `min-height: 24px` is not enough on its own because the *thumb*
  is the target. Either make the input 24px tall (so the thumb's hit area
  includes the full input height — which is how `input[type=range]` actually
  works, the entire input is draggable) or accept that the effective target is
  the full track height and document it. In practice, clicking anywhere on a
  `range` input's box moves the thumb, so a `min-height: 24px` input is
  compliant. Verify this in each browser; WebKit and Gecko differ on whether a
  click on the *track* jumps the thumb.
- **Focus ring must be visible, and the port's is not.** The port uses
  `outline: 1px dotted #000; outline-offset: 2px`, which is drawn outside the
  input — i.e. over the panel's `#4C5844`, where black is **1.15:1**. Unlike the
  text-input rings, there is no black interior for it to hide inside.
  `outline: 2px solid var(--vgui-accent); outline-offset: 2px` gives **4.72:1**
  (`#C4B550` on `#3E4637`) and encircles the thumb wherever it is. **Do not**
  write `outline: none` on a range input; it is the most common slider
  accessibility bug.
- **The min/max labels are the accessible fallback for the range.** `attr(min)`
  and `attr(max)` render the endpoints visually but are *not* announced — they
  are pseudo-elements and assistive tech does not see them. Set `aria-valuemin`,
  `aria-valuemax` and `aria-valuetext` explicitly so the announced range matches
  the painted one. If the slider has no visible `FieldLabel`, it also needs
  `aria-label`.
- **The groove contrast is fine, the tick contrast is not.** `--vgui-text-dim`
  `#758666` ticks on `--vgui-surface` `#4C5844` are **1.92:1**. Ticks are
  decorative and never carry the value — the position of the thumb does — so this
  is acceptable, but the ticks must be `aria-hidden` and must not be the only
  indicator of a meaningful threshold. If a slider has a *critical* threshold
  (a "safe" boundary), that needs a labelled mark, not a faint tick.
- **Never make a slider the only control for a value the user must set
  precisely.** Pair it with a `SpinBox` or a `TextInput`, which is what Valve did
  for volume and sensitivity (`--with-value`). Keyboard-only users will thank
  you.
- **Do not animate the thumb** except for the 1px press inversion. And wrap even
  that in `@media (prefers-reduced-motion: no-preference)` if it transitions.
- **Vertical sliders** need `writing-mode: vertical-lr; direction: rtl` or an
  explicit `-webkit-appearance: slider-vertical` per engine. It is inconsistent
  across browsers and should probably not ship in v1.

## Assets

| Valve sprite | Replacement |
| --- | --- |
| `SliderThumbHorizontal` | Pure CSS bevel box, `8 × 16` |
| `sliderticks` (`19 × 5` tile) | `repeating-linear-gradient` at `1px` on a `19px` pitch, `background-size: 19px 5px` |
| `SliderThumbVertical` | Same box, rotated dimensions — if `--vertical` ships |

No `data:` URIs. The thumb is a bevel, not a texture.

The port references the tile as `url("sliderticks.png")`, confirming the sprite
was converted to PNG upstream; the gradient replaces it so no binary asset
travels with the library.

## Examples

```tsx
<FieldLabel htmlFor="volume">Master volume</FieldLabel>
<Slider
  id="volume"
  min={0} max={100} step={1}
  value={volume}
  onValueChange={setVolume}
  onValueCommit={(v) => save('volume', v)}
  formatValue={(v) => `${v}%`}
  showValue
  ticks
/>
```

```tsx
// Slider + SpinBox, the way Valve pairs them for precise values
<Slider
  min={0.1} max={20} step={0.1}
  value={sensitivity}
  onValueChange={setSensitivity}
  aria-label="Mouse sensitivity"
  aria-valuetext={`${sensitivity} times`}
/>
<SpinBox value={sensitivity} min={0.1} max={20} step={0.1} onChange={setSensitivity} />
```

## Open questions

- **`Slider` vs `SliderHoriz`.** `steam.styles` defines `Slider` (track/background)
  and `SliderHoriz` (thumb image) separately, and VGUI2's `Slider` is an abstract
  base. Whether a *vertical* slider was ever actually used and styled in the
  client is unverified; `SliderThumbVertical` is a plausible sprite name but was
  not confirmed in the asset listing. Recommend shipping horizontal-only in v1
  and treating `--vertical` as a later addition.
- **No disabled thumb appearance is defined.** `steam.styles` and the CSS port
  both leave the thumb unchanged when disabled; only the `cursor` differs, and
  the port does not even change that. A disabled slider that looks identical to
  an enabled one is a genuine usability problem. The recommendation is to drop
  the thumb face to `--vgui-surface-dark` and remove the raised bevel so it
  reads as immovable.
- Whether the thumb inverts while dragging is an inference from the bevel logic,
  not a transcription. The port does not implement it.
- The `sliderticks` pitch is **`19px`**, taken from the port's
  `background-size: 19px 5px`. Whether that tile matched Valve's `sliderticks.tga`
  is unverified, and the *number of ticks* a given slider showed would have been
  a per-control `numTicks` setting, so the pitch is a visual default rather than
  a rule.
- **A `range` input's hit area behaviour is engine-dependent.** Some browsers
  require a click on or near the thumb; others jump the thumb to any click on the
  track. The WCAG 2.5.8 analysis above depends on which, and it has not been
  verified across engines.
