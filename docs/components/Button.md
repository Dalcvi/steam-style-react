# Button

## Purpose

The workhorse. A 25px-tall rectangle with a two-tone 1px bevel that inverts when
pressed. It is the single most-used control in the client — every dialog footer,
every settings pane, every "Join game" action is one of these.

## VGUI original

`Button` in VGUI1 (`vgui_dll/include/VGUI_Button.h`) and VGUI2
(`vgui_controls/Button.cpp`). The `steam.styles` definition is the reference for
every metric on this page:

```
Button
{
    font                 "UiBold"
    textcolor            "White"
    inset                "4 0 0 0"
    bgcolor              "GreenBG"
    border               "ButtonBorder"
    render_bg            { ... raised bevel ... }
}

Button:Active
{
    border               "ButtonDepressedBorder"   /* bevel inverted */
}

Button:Focus
{
    border               "ButtonBorderFocused"     /* 2px BorderBright + 1px Black */
}

Button:Disabled
{
    textcolor            "DisabledText2"
    shadowtextcolor      "DisabledText1"
}
```

The CSS port pins the geometry: **`height: 25px`, `min-width: 75px`,
`text-align: left`, `font-weight: lighter`, `color: white`.**

Two details that are easy to miss:

1. **The label is left-aligned**, not centred. That is not a mistake in the port
   — VGUI buttons are left-aligned with a `4px` inset. `text-align: center` is
   the most common way a "VGUI" button ends up looking wrong.
2. **`inset "4 0 0 0"` is left padding only.** Top, right and bottom insets are
   zero; the 25px height centres the text vertically.

## Anatomy

```html
<button class="vgui-button">
  <span class="vgui-button__label">Join game</span>
</button>
```

A single `<button>` with an optional inner span. The span exists so the label can
be truncated with an ellipsis independently of any icon while the button keeps
its padding.

## Variants

| Variant | Class | Differs how |
| --- | --- | --- |
| Default | — | 25px, raised bevel, white left-aligned label |
| Full width | `--full-width` | `width: 100%; display: block` |
| Small | `--small` | `min-height: 18px`, `min-width: 60px`, `12px` text |
| Large | `--large` | `min-height: 30px`, `16px` text |
| Primary | `--primary` | Label stays `--vgui-text-strong`; **no colour change** (see below) |
| Danger | `--danger` | `--vgui-danger` 1px outline in addition to the bevel |
| Icon | `--icon` | Not used — that is [`IconButton`](./IconButton.md) |
| Clay | `--clay` | `--vgui-clay-button` face, for property-sheet footers |

> **On `--primary`.** VGUI has no primary/secondary hierarchy. A "primary" button
> in the original client is simply the default button with `autoFocus` and a
> `ButtonBorderFocused` ring — there is no filled or coloured variant. This
> library should keep `--primary` purely as an *emphasis hook* (heavier weight,
> or the focus ring drawn persistently), never as a background fill, or the
> result stops reading as VGUI.

## States

| State | Bevel (top/left, bottom/right) | Background | Text |
| --- | --- | --- | --- |
| Normal | `light` / `dark` | `--vgui-surface` | `#FFFFFF` |
| Hover | unchanged | `--vgui-surface` | unchanged |
| Active | **`dark` / `light`** (inverted) | `--vgui-surface` | unchanged |
| Focus-visible | unchanged | unchanged | unchanged; `outline: 1px dashed var(--vgui-bevel-dark); outline-offset: -4px` |
| Focus (high-contrast) | unchanged | unchanged | unchanged; `outline: 2px solid var(--vgui-accent); outline-offset: -3px` |
| Disabled | unchanged | unchanged | `--vgui-text-disabled` `#75806F` with a `1px 1px` `--vgui-text-disabled-shadow` `#282E22` |

**There is no hover treatment.** This is not an omission: `steam.styles` defines
no `Button:MouseOver` border, and the real client's buttons do not change on
hover. Adding a hover fill is the second most common way a "VGUI" button stops
looking right. If an affordance is needed, do it with `cursor: pointer`
(already present) rather than colour.

**The disabled text is the classic sunken trick.** `DisabledText1` is drawn at
`+1px +1px` *underneath* `DisabledText2`, so the label looks pressed into the
surface. Reproduce it with `text-shadow`, not with two elements.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-surface` `#4C5844` | Face |
| `--vgui-bevel-light` `#899281` | Raised top/left |
| `--vgui-bevel-dark` `#292D23` | Raised bottom/right |
| `--vgui-text-strong` `#FFFFFF` | Label |
| `--vgui-text-disabled` `#75806F` | Disabled label |
| `--vgui-text-disabled-shadow` `#282E22` | Disabled label shadow |
| `--vgui-accent` `#C4B550` | High-contrast focus ring |
| `--vgui-danger` `#E2251A` | `--danger` outline |
| `--vgui-clay-button` `#7D8078` | `--clay` face |
| `--vgui-font` | Label font |

## CSS recipe

```css
.vgui-button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;         /* VGUI is LEFT-aligned */
  min-height: 25px;                    /* min-, not height: survives text zoom */
  min-width: 75px;
  padding: 0 8px 0 4px;                /* the "4 0 0 0" inset, plus a right pad */
  font: inherit;
  font-weight: lighter;
  text-align: left;
  color: var(--vgui-text-strong);
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
  cursor: pointer;
  -webkit-font-smoothing: none;
}

/* Active INVERTS the bevel. It does not translate the button. */
.vgui-button:active {
  border-top-color: var(--vgui-bevel-dark);
  border-left-color: var(--vgui-bevel-dark);
  border-bottom-color: var(--vgui-bevel-light);
  border-right-color: var(--vgui-bevel-light);
}

.vgui-button:focus-visible {
  outline: 1px dashed var(--vgui-bevel-dark);
  outline-offset: -4px;
}

.vgui-button:disabled {
  cursor: default;
  color: var(--vgui-text-disabled);
  text-shadow: 1px 1px 0 var(--vgui-text-disabled-shadow);
  -webkit-font-smoothing: auto;
}

.vgui-button--full-width { display: flex; width: 100%; }

.vgui-button__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

Note `min-height` rather than `height`, and `padding` rather than a bare `4px`
left inset — both are deliberate deviations from the port that fix WCAG 1.4.4
(text must survive 200% zoom without clipping) and 2.5.8 (target size).

## React API

```tsx
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Stretch the button across the full width of its container. */
  fullWidth?: boolean
  /** Compact variant for dense chrome: 18px tall, 12px text. */
  small?: boolean
  /** Taller variant for dialog footers: 30px tall, 16px text. */
  large?: boolean
  /** Emphasis hook for a dialog's default action. Never a background fill. */
  primary?: boolean
  /** Draw a danger outline around the button. */
  danger?: boolean
  /** Render the grey property-sheet face instead of the green one. */
  clay?: boolean
}
```

Notes:

- `type` defaults to `'button'`, not `'submit'`. A VGUI button inside a form
  should never accidentally submit; pass `type="submit"` explicitly.
- `forwardRef<HTMLButtonElement>`, `className` merged **last**.
- `displayName` set explicitly (matching the existing `Button`).

## Accessibility

- **`<button>` or nothing.** A `div` with `role="button"` needs hand-written
  `Enter`/`Space` handling and is worse in every way. There is no reason to do
  it here.
- **`outline: 1px dashed var(--vgui-bevel-dark)` on a `#4C5844` face is 1.87:1.**
  It is essentially invisible. This library must default to a visible ring
  (`2px solid var(--vgui-accent)` at 3.61:1, or the Source-style 2px
  `BorderBright` + 1px black double ring) and offer the literal Valve dashed ring
  only under an explicit `pixelPerfect` opt-in.
- **`-webkit-font-smoothing: none`** is in the port because it makes bitmap-ish
  text look right. It overrides the user's subpixel rendering preference and
  hurts legibility. Gate it behind the same `.vgui-crisp` opt-in class as
  `foundations.md` §5 describes; do not ship it on the default button.
- **The disabled look must not be the only signal.** `#75806F` on `#4C5844` is
  1.82:1. The `disabled` attribute is what assistive tech uses, so that is
  covered — but a sighted low-vision user gets nothing from the colour. Add a
  `not-allowed` cursor and, where the reason matters, an adjacent tooltip.
- **Target size.** `25px` tall and `75px` wide clears the 24×24 minimum (WCAG
  2.5.8) comfortably. The `--small` variant at `18px` does **not** — it needs
  either a larger hit area via `padding`/`::before` or `--small` should be
  reserved for non-essential chrome.
- **Label contrast** is `#FFFFFF` on `#4C5844` = **7.54:1** (AAA). The `--clay`
  face is `#FFFFFF` on `#7D8078` = **4.01:1**, which still clears AA for normal
  text but drops most of the headroom — worth a follow-up check if the clay
  variant ever grows a smaller font size.
- `autoFocus` is allowed through and is the correct way to make a dialog's
  default button the initial focus target — do not add a bespoke `defaultFocus`
  prop, and do not use `outline` suppression to hide the resulting ring.

## Assets

None. The button is entirely `border` + `background-color`; Valve used a
`render_bg` program for the face, not a sprite, so the port is a literal
transcription.

## Examples

```tsx
<Button onClick={joinGame}>Join game</Button>
<Button fullWidth>Scan for servers</Button>
<Button small clay>Browse…</Button>
<Button danger onClick={remove}>Remove</Button>
<Button autoFocus onClick={confirm}>OK</Button>
<Button disabled>Unavailable</Button>
```

## Open questions

- **The real focused border.** Valve's `ButtonBorderFocused` is a 2px
  `BorderBright` ring *plus* a 1px black inner ring. The CSS port collapses this
  to a single dashed outline. Which to ship as the default is a trade-off between
  fidelity and WCAG 2.4.11; this doc recommends the Source-style double ring and
  lists the dashed version as the `pixelPerfect` alternative.
- `font-weight: lighter` in the port produces a *thin* button label, which is the
  opposite of what `UiBold` (weight 1000) implies in `steamscheme.res`. That is a
  genuine contradiction between the two sources and has not been resolved.
- Whether the label should be left-aligned in a `--full-width` button (as
  specified) or centred (as most modern UIs do) is a design decision, not a
  transcription.
