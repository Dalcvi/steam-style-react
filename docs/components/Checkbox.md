# Checkbox

## Purpose

A 15×15 box that toggles a boolean. In the client it governs every settings
option: "Run in a window", "Enable voice", "Remember password", "Automatically
log me in".

## VGUI original

`CheckButton` in VGUI1 (`vgui_dll/include/VGUI_CheckButton.h`) and VGUI2
(`vgui_controls/CheckButton.cpp`). `steam.styles`:

```
CheckButton
{
    font                "Default"
    textcolor           "OffWhite"
    inset               "3 0 0 0"
    border              "CheckButtonBorder"
    bgcolor             "CheckButtonBG"
    render_bg           { ... raised bevel around the box ... }
    image               { CheckButtonUnSelected  CheckButtonSelected }
}
```

The checkmark is **a sprite**, not a glyph. The complete set in
`OG-Steam/graphics/`, verbatim:

```
chkUnselStd      chkUnselFocus    chkUnselDis
chkSelStd        chkSelFocus      chkSelDis        chkSelDown
chkIndeterminate chkSomeSelStd
                                                 (+ *_sm and *@2x variants)
```

Four things fall out of that listing and each one is a design decision:

1. **`chkIndeterminate` is a real, distinct third state** — a horizontal bar, not
   a check — and it matters. Tri-state exists in Valve's own UI (the "select all"
   checkbox in the server list's filter tree) and it is one of the few places
   where a retro recreation has to make a genuine accessibility choice.
2. **There is no `chkIndeterminateFocus`.** The indeterminate state has exactly
   one sprite, with no focus or disabled variant. Whether that is an oversight in
   the original or intentional is unknowable; either way, the port needs a focus
   treatment for it and cannot transcribe one.
3. **Only `chkSel` has a `Down` variant.** `chkSelDown` exists; there is no
   `chkUnselDown`. So a checkbox gains a pressed appearance *only when unchecked
   and being pressed on its way to checked*, and loses it once checked. This is
   almost certainly a leftover rather than a designed asymmetric interaction, and
   this doc does not reproduce it.
4. **`chkSomeSelStd` is a separate sprite from `chkIndeterminate`.** They are not
   the same asset renamed — `SomeSel` means "some descendants selected" in a
   tree, `Indeterminate` means `BS_AUTO3STATE`-style. This doc treats them as one
   visual state, which is argued in *Open questions*.

**The border is inverted.** In the CSS port:

```css
input[type="checkbox"] {
    -webkit-appearance: none;
    appearance: none;
    width: 15px;  height: 15px;
    background-color: #4c5844;
    border-top: 1px solid #292d23;      /* dark on TOP and LEFT */
    border-left: 1px solid #292d23;
    border-bottom: 1px solid #899281;   /* light on BOTTOM and RIGHT */
    border-right: 1px solid #899281;
}
```

This is the **inset** bevel: a checkbox reads as a hole in the panel, not a
raised button. Getting this backwards is a common mistake when hand-rolling the
style, because it is the opposite of `Button`.

The `3px` inset is the gap between the box and its label.

## Anatomy

```html
<label class="vgui-checkbox">
  <input type="checkbox" class="vgui-checkbox__input" />
  <span class="vgui-checkbox__box" aria-hidden="true"></span>
  <span class="vgui-checkbox__label">Run in a window</span>
</label>
```

The `<input>` is visually hidden but **present and focusable** — never
`display: none`. The box is a sibling span so the checkmark can be drawn with a
pseudo-element. The whole thing is wrapped in a `<label>` so clicking the text
toggles, which is both correct and period-accurate (VGUI's `labelTextOffset`
makes the label part of the hit area).

## States

| State | Box | Mark |
| --- | --- | --- |
| Unchecked | Inset bevel, `--vgui-surface` fill | none |
| Checked | Inset bevel | Checkmark in `--vgui-text-strong` |
| Indeterminate | Inset bevel | Horizontal bar in `--vgui-text-strong` |
| Hover | Unchanged (VGUI has no `CheckButton:MouseOver` in `steam.styles`) | unchanged |
| Focus-visible | `outline: 1px dotted #000; outline-offset: -3px` on the box | unchanged |
| Disabled | Unchanged | Label `--vgui-text-disabled` with the `+1px` shadow |

The `chk*Focus` sprites exist and show a dotted inner rectangle. In CSS that
maps exactly to `outline: 1px dotted #000; outline-offset: -3px` — the signature
VGUI focus treatment for all form controls. It is also, at **1.15:1** against
`#4C5844`, nearly invisible; see the accessibility section.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-surface` `#4C5844` | Box fill |
| `--vgui-bevel-dark` `#292D23` | Inset top/left |
| `--vgui-bevel-light` `#899281` | Inset bottom/right |
| `--vgui-text-strong` `#FFFFFF` | Checkmark and bar |
| `--vgui-text` `#D8DED3` | Label |
| `--vgui-text-disabled` / `-shadow` | Disabled label |

## CSS recipe

```css
.vgui-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 3px;                        /* the "3 0 0 0" inset */
  cursor: pointer;
}

.vgui-checkbox__input {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px; padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.vgui-checkbox__box {
  flex: 0 0 auto;
  box-sizing: border-box;
  position: relative;
  width: 15px;
  height: 15px;
  background-color: var(--vgui-surface);
  /* INSET: dark top/left, light bottom/right — inverse of .vgui-button */
  border-top: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-light);
  border-right: 1px solid var(--vgui-bevel-light);
}

/* Pure-CSS checkmark: a rotated rect with two borders drawn. No sprite. */
.vgui-checkbox__input:checked + .vgui-checkbox__box::after {
  content: "";
  position: absolute;
  left: 4px;
  top: 1px;
  width: 5px;
  height: 8px;
  border-right: 2px solid var(--vgui-text-strong);
  border-bottom: 2px solid var(--vgui-text-strong);
  transform: rotate(45deg);
}

/* Indeterminate: a horizontal bar. */
.vgui-checkbox__input:indeterminate + .vgui-checkbox__box::after {
  content: "";
  position: absolute;
  left: 2px;
  top: 5px;
  width: 9px;
  height: 3px;
  background-color: var(--vgui-text-strong);
  transform: none;
  border: 0;
}

.vgui-checkbox__input:focus-visible + .vgui-checkbox__box {
  outline: 1px dotted var(--vgui-focus-ring);
  outline-offset: -3px;
}

.vgui-checkbox__input:disabled ~ .vgui-checkbox__label {
  color: var(--vgui-text-disabled);
  text-shadow: 1px 1px 0 var(--vgui-text-disabled-shadow);
}
```

`:indeterminate` is a **DOM property, not an attribute** — it can only be set via
`element.indeterminate = true`, which means React needs a `ref` + `useEffect`.
There is no `<input indeterminate>` attribute. Plan for this in the component.

## React API

```tsx
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** The label. Rendered as part of the clickable area. */
  label?: ReactNode
  /** Render the indeterminate third state. */
  indeterminate?: boolean
  /** Put the box after the label instead of before. */
  labelPosition?: 'start' | 'end'
}
```

`indeterminate` is a visual-only state. It does **not** change `checked`, and the
component must not synchronise them: the standard pattern is
`indeterminate ? true : checked`. Assistive tech announces indeterminate
correctly only if the property is set on the real input, which is another reason
not to fake it with a class.

## Accessibility

- **Use a real `<input type="checkbox">`.** `role="checkbox"` + `aria-checked`
  on a `div` requires reimplementing `Space` handling, form participation and the
  indeterminate state. There is no benefit.
- **The dotted black focus ring is a failure.** `#000` on `#4C5844` is
  **1.15:1** against WCAG 1.4.11's required 3:1. The literal Valve treatment is
  documented above for the `pixelPerfect` opt-in, but the shipped default should
  be `outline: 2px solid var(--vgui-accent)` (`#C4B550`, 3.61:1) with
  `outline-offset: -3px` so the geometry still reads as VGUI.
- **The box alone is not the target.** The `15 × 15` box is well under 24×24.
  Wrapping in a `<label>` gives the whole row as the hit area, which fixes it for
  any checkbox that has a label — which is all of them. `label` should therefore
  be effectively required in practice, and a label-less checkbox should warn in
  development.
- **Never use a checkbox for an action.** "Reload" is a button. A checkbox that
  does something on check is a lie to screen-reader users who toggle it twice to
  "undo".
- **Tri-state needs words.** An indeterminate checkbox announces as "mixed".
  When the state comes from a "select all" parent, the accessible name should
  disambiguate it — "All servers, mixed" rather than a bare "All servers".
- **`chkIndeterminate` is drawn as a bar, and a bar is easy to miss.** Pair it
  with the announced "mixed" state; do not rely on the sprite.
- Disabled: the colour is decorative (1.82:1). The `disabled` attribute carries
  the meaning, which is correct — just make sure the cursor changes too.
- Colour is **not** the only signal for checked/unchecked: the mark's presence is
  the signal, and it is a shape. This component passes 1.4.1 by construction.

## Assets

Three sprites, all replaced with CSS geometry — no `data:` URIs needed:

| Valve sprite | Replacement |
| --- | --- |
| `chkSelStd` | Two borders on a `rotate(45deg)` box |
| `chkUnselStd` | Nothing (the empty inset box) |
| `chkIndeterminate` | A `9 × 3` filled rect |
| `chkSomeSelStd` | Same treatment as `chkIndeterminate` (see *Open questions*) |
| `chkSelFocus` / `chkUnselFocus` | `outline: 1px dotted …; outline-offset: -3px` |
| `chkSelDis` / `chkUnselDis` | `--vgui-text-disabled` mark and label |
| `chkSelDown` | *(not reproduced — see note 3 above)* |
| `chkselstd_sm` / `chkunselstd_sm` / `chkselfocus_sm` / `chkunseldis_sm` | The `--small` variant's 12×12 box |

The `_sm` sprites are a genuinely different asset set, not a scaled copy of the
standard ones, and they use inconsistent casing
(`chkselstd_sm` vs `chkSelStd`) — that is Valve's own filename inconsistency, not
a transcription error here. The `@2x` files are HiDPI variants of the standard
set and need no separate handling under a CSS implementation.

The `--small` variant needs **adjusted** mark geometry (a 3×6 checkmark at
`left: 3px; top: 1px`), not a scaled one; a `transform: scale()` on a
2px-bordered mark gives blurry 1.5px borders.

## Examples

```tsx
<Checkbox label="Run in a window" defaultChecked />
<Checkbox label="Enable voice" />
<Checkbox label="Remember password" disabled />
<Checkbox
  label={`All servers${someSelected && !allSelected ? ' (mixed)' : ''}`}
  checked={allSelected}
  indeterminate={someSelected && !allSelected}
  onChange={toggleAll}
/>
```

## Open questions

- **Checkmark geometry is invented.** Valve's `chkSel` is a 9×9 pixel-art tick;
  the CSS `rotate(45deg)` bordered-box recipe above is the standard web
  equivalent and is visually close, but it is not a pixel-for-pixel transcription.
  Achieving that would require an inline SVG `mask-image` traced from the `.tga`.
- `chkSomeSelStd` vs `chkIndeterminate`: both exist and the docs treat them as
  the same state, but whether the client used them in different contexts (tree
  vs list) is unverified.
- The port's inverted border has a `1px` light bottom/right that makes the box
  look 1px larger than a same-sized button. Whether Valve's `CheckButtonBorder`
  did the same is not confirmed — the `steamscheme.res` `Border` block for
  checkbuttons was not located.
