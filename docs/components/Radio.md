# Radio

## Purpose

A 15×15 circle for picking one option from a small set. In the client it appears
in the settings dialogs — window resolution mode, microphone device type, the
"which folder" prompt — and in a few server-browser filters.

## VGUI original

`RadioButton` in VGUI1 (`vgui_dll/include/VGUI_RadioButton.h`) and VGUI2
(`vgui_controls/RadioButton.cpp`). `steam.styles` treats it as a `CheckButton`
sibling:

```
RadioButton
{
    font        "Default"
    textcolor   "OffWhite"
    inset       "3 0 0 0"
    border      "RadioButtonBorder"
    bgcolor     "RadioButtonBG"
    image       { RadioButtonUnSelected  RadioButtonSelected }
}
```

The sprite set, verbatim from `OG-Steam/graphics/`:

```
radUnselStd    radUnselFocus    radUnselDis
radSelStd      radSelFocus      radSelDis      radSelDown
```

**The geometry is identical to `Checkbox`.** Same `15 × 15`, same `3px` inset,
same *inverted* (inset) bevel, same dotted focus ring. The only differences are
the shape (circle vs square) and the mark (a filled dot vs a tick). If you are
implementing both, the shared base styles should be one class —
`vgui-check-control` — with `Checkbox` and `Radio` as modifiers, otherwise the
two will drift.

Notice what is **absent** from that listing: there is no `radIndeterminate`.
A radio cannot be tri-state, which is correct per the platform conventions of
every OS this theme imitates. Do not add one. Conversely, `radSelDown` exists
where `chkUnselDown` does not — the two sibling components were not kept
consistent in the original assets, so the "which states does this control have"
question has to be answered per control rather than once for the pair.

## Anatomy

```html
<label class="vgui-radio">
  <input type="radio" name="mode" class="vgui-radio__input" />
  <span class="vgui-radio__circle" aria-hidden="true"></span>
  <span class="vgui-radio__label">Fullscreen</span>
</label>
```

Use `border-radius: 50%` for the circle. VGUI's sprite was a pixel-art circle
with hard corners; the rounded CSS version is the modern substitute and the
difference is imperceptible at 15px. A pixel-exact `mask-image` circle is
possible but there is no reason to.

## Grouping

Radios are meaningless alone. The group has a real implementation consequence and
deserves an explicit component:

```tsx
<RadioGroup label="Display mode" value={mode} onValueChange={setMode} name="display-mode">
  <Radio value="fullscreen" label="Fullscreen" />
  <Radio value="windowed"   label="Run in a window" />
  <Radio value="borderless" label="Borderless window" />
</RadioGroup>
```

`RadioGroup` renders `<fieldset>` + `<legend>` rather than `role="radiogroup"` +
`aria-label`. The native elements do the same job, come with correct
implementation, and are styleable here because the theme already draws its own
legend (`GroupBox`).

`name` must be shared across the group for native arrow-key behaviour to work. If
`name` is omitted, React radio inputs will **not** be mutually exclusive; the
component should `useId()` a fallback rather than warn.

## States

| State | Circle | Mark |
| --- | --- | --- |
| Unselected | Inset bevel, `--vgui-surface` | none |
| Selected | Inset bevel | Filled `--vgui-text-strong` dot, ~5px, centred |
| Hover | Unchanged | unchanged |
| Focus-visible | `outline: 1px dotted #000; outline-offset: -3px` | unchanged |
| Disabled | Unchanged | Label `--vgui-text-disabled` + `1px 1px` shadow |

## Tokens

Identical to `Checkbox`:

| Token | Where |
| --- | --- |
| `--vgui-surface` `#4C5844` | Circle fill |
| `--vgui-bevel-dark` `#292D23` | Inset top/left |
| `--vgui-bevel-light` `#899281` | Inset bottom/right |
| `--vgui-text-strong` `#FFFFFF` | The dot |
| `--vgui-text` `#D8DED3` | Label |
| `--vgui-text-disabled` / `-shadow` | Disabled label |

## CSS recipe

```css
.vgui-radio {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
}

.vgui-radio__input {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px; padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.vgui-radio__circle {
  flex: 0 0 auto;
  box-sizing: border-box;
  position: relative;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-light);
  border-right: 1px solid var(--vgui-bevel-light);
}

.vgui-radio__input:checked + .vgui-radio__circle::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 5px;
  height: 5px;
  margin: -2.5px 0 0 -2.5px;
  border-radius: 50%;
  background-color: var(--vgui-text-strong);
}

.vgui-radio__input:focus-visible + .vgui-radio__circle {
  outline: 1px dotted var(--vgui-focus-ring);
  outline-offset: -3px;
}

.vgui-radio__input:disabled ~ .vgui-radio__label {
  color: var(--vgui-text-disabled);
  text-shadow: 1px 1px 0 var(--vgui-text-disabled-shadow);
}
```

## React API

```tsx
export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Value reported to the enclosing RadioGroup. */
  value: string
  /** The label. Rendered as part of the clickable area. */
  label?: ReactNode
}

export interface RadioGroupProps {
  /** Group legend, rendered as a <legend>. */
  label: ReactNode
  /** Controlled selected value. */
  value?: string
  /** Initial value for uncontrolled use. */
  defaultValue?: string
  /** Called with the newly selected value. */
  onValueChange?: (value: string) => void
  /** Shared input name; useId() is used when omitted. */
  name?: string
  /** Lay the radios out horizontally rather than stacked. */
  orientation?: 'vertical' | 'horizontal'
  /** Disable the whole group. */
  disabled?: boolean
  children: ReactNode
}
```

`RadioGroup` is a **context provider**, not a DOM wrapper for logic — it passes
`name`, `checked`, `onChange` and `disabled` down so `Radio` stays a thin
`<input>` wrapper. Do not clone children or read their props.

## Accessibility

- **Native `<input type="radio">` in a `<fieldset>`/`<legend>`.** The whole
  point of radios is the browser-provided arrow-key navigation within the group,
  the `Space` toggle, and the "1 of 3" announcement. `role="radiogroup"` on a
  `div` throws all of that away.
- **The legend is the group's accessible name**, and it is what makes "Fullscreen,
  selected, radio button, 1 of 3" intelligible. A radio group without a legend is
  a set of values with no question.
- **The dotted black focus ring is a 1.15:1 failure** against `#4C5844`, exactly
  as with `Checkbox`. Ship `outline: 2px solid var(--vgui-accent)` and offer the
  dotted version only under `pixelPerfect`.
- **Arrow keys must work.** They do, for free, with native inputs sharing a
  `name`. This is the strongest argument for not reimplementing.
- **Do not use a radio for anything but exclusive choice from a visible set.** A
  binary thing is a `Checkbox`; a large exclusive set is a `Select`; an
  instant-apply setting is a `ToggleButton`.
- **Target size** is solved the same way as `Checkbox` — the `<label>` makes the
  whole row clickable, so the effective target is the row height.
- **Horizontal `RadioGroup` labels must wrap, not clip.** At 200% zoom a
  horizontal row of three radios will overflow; use
  `flex-wrap: wrap; row-gap: 4px` rather than `nowrap`.
- Selection is signalled by **a shape** (the dot), not just colour, so 1.4.1 is
  satisfied without extra work. The only near-miss is at very small zoom where a
  5px dot becomes sub-pixel — the `--small` variant should keep the dot at 4px
  minimum.

## Assets

| Valve sprite | Replacement |
| --- | --- |
| `radSelStd` | `::after` — a centred `5 × 5` `border-radius: 50%` fill |
| `radUnselStd` | Nothing (the empty inset circle) |
| `rad*Focus` | `outline: 1px dotted …; outline-offset: -3px` |
| `rad*Dis` | `--vgui-text-disabled` dot and label |
| `radSelDown` | *(not reproduced; see note 3 in [`Checkbox`](./Checkbox.md))* |

No `data:` URIs. The circle and the dot are both pure geometry, which is why this
component ports more cleanly than `Checkbox`.

## Examples

```tsx
<RadioGroup label="Display mode" defaultValue="windowed">
  <Radio value="fullscreen" label="Fullscreen" />
  <Radio value="windowed"   label="Run in a window" />
  <Radio value="borderless" label="Borderless window" />
</RadioGroup>

<RadioGroup label="Microphone" orientation="horizontal" value={mic} onValueChange={setMic}>
  <Radio value="off"    label="Disabled" />
  <Radio value="open"   label="Open mic" />
  <Radio value="ptt"    label="Push to talk" />
</RadioGroup>

<RadioGroup label="Quality" disabled>
  <Radio value="low"  label="Low" />
  <Radio value="high" label="High" />
</RadioGroup>
```

## Open questions

- Whether `RadioButtonBorder` in `steamscheme.res` is genuinely identical to
  `CheckButtonBorder` was not confirmed; this doc assumes it is, based on the CSS
  port using one rule for both.
- The exact dot radius. Valve's `radSelStd` sprite is a pixel-art dot of roughly
  7×7 inside the 15×15 box; this doc specifies 5px to leave a visible ring of
  background between the dot and the border, which is what the sprite shows.
  Verifying requires rendering the `.tga`.
- Whether `radSelDown` was ever reachable. VGUI's `RadioButton` had no pressed
  state in `steam.styles`, yet the sprite exists — the same loose end as
  `chkSelDown`. This doc ignores both.
- `RadioGroup` as a component is an invention. VGUI1 grouped radios by parent
  panel and a `RadioButton` group id; there is no `RadioGroup` class. The
  component here exists purely to give the group a `<legend>`.
