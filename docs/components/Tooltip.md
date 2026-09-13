# Tooltip

## Purpose

A small hover panel showing a label, a description, or a keyboard hint. It is
the **one place in this entire theme where the palette inverts** — everything
else is green-on-green, and the tooltip is near-black text on maize. That
inversion is deliberate and is the tooltip's entire visual identity, so it must
not be "themed" back to green.

## VGUI original

`TooltipWindow` in `steam.styles`, plus the `tooltip_headline` and
`tooltip_text` font entries in `steamscheme.res`. Valve's definition is unusual:

```
TooltipWindow
{
    bgcolor  "Orange"
    border   <LightGreenBG on ALL FOUR sides>
}

tooltip_headline   { weight 1000 }
```

Two things are worth pulling out:

1. **The background is `Orange`.** In the Source engine's `SourceScheme.res` that
   is `#FF9B00` — the same orange as selection. This is the single accent
   inversion in the theme.
2. **The border has no shading.** The usual light/dark bevel is replaced by a
   uniform `LightGreenBG` border on all four sides, so the tooltip reads as a
   floating card rather than a raised control.

The text colour is `TextColor "0 0 0 196"` — black at ~77% alpha.

## Anatomy

```
.vgui-tooltip                     ← role="tooltip", the maize card
├── .vgui-tooltip__headline       ← optional bold first line
└── .vgui-tooltip__body           ← descriptive text
```

The trigger is **not** part of this component. The component renders only the
card; positioning and visibility are driven by the consumer through
`aria-describedby` (see §Accessibility).

## Variants

| Variant | Class | Use |
| --- | --- | --- |
| Default | — | Maize card, near-black text, uniform green border |
| Compact | `--compact` | No headline, tighter padding, `12px` text |
| Keyboard | `--keyboard` | Renders the shortcut in a `--vgui-surface` chip |
| Error | `--error` | `--vgui-danger` border with an icon; for validation hints |
| Top / Bottom / Left / Right | `--placement-{top,…}` | Optional placement hints used by the positioning logic |

## States

| State | Treatment |
| --- | --- |
| Hidden | Not in the DOM, or `hidden` — never `opacity: 0` alone, which stays in the accessibility tree |
| Visible | Instant on hover after the delay, instant on keyboard focus with no delay |
| Dismissed with Escape | Hidden and the trigger re-focused; must not reappear until the pointer leaves and re-enters, or focus moves away and back |
| Disabled trigger | No tooltip — a disabled control must not be hoverable for help it cannot act on, unless the hint explains *why* it is disabled |

**The show delay is asymmetric and that matters:** ~600ms on pointer hover, 0ms
on keyboard focus. A keyboard user who tabbed to a control has already expressed
intent; making them wait is a WCAG 2.1.1 problem.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-heading` `#C4B550` | Card background — the inverted surface |
| `--vgui-surface-light` `#5A6A50` | Uniform 1px border on all four sides |
| `#232421` | Text — near-black, not pure black |
| `--vgui-font-size` `14px` | Body text |
| `12px` | `--compact` body text |

## CSS recipe

```css
.vgui-tooltip {
  background-color: var(--vgui-heading);
  border: 1px solid var(--vgui-surface-light);   /* uniform — no bevel */
  color: #232421;
  padding: 4px 8px;
  max-width: 320px;
  font-size: var(--vgui-font-size);
  line-height: var(--vgui-line-height);
  /* Above the window chrome, below a modal overlay. */
  z-index: 1000;
}

.vgui-tooltip__headline {
  font-weight: 1000;    /* Valve's exact value, from tooltip_headline */
  display: block;
}

.vgui-tooltip--compact { padding: 2px 6px; font-size: 12px; }

.vgui-tooltip__key {
  display: inline-block;
  padding: 0 4px;
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
  color: var(--vgui-text);
  font-family: var(--vgui-font-mono);
}
```

`font-weight: 1000` looks like a typo and is not. It is Valve's literal value in
`steamscheme.res` and it resolves to the heaviest available weight in whatever
font is loaded — in a browser without a 1000-weight face it simply clamps to
bold. Keep it for fidelity; do not "fix" it.

`z-index: 1000` is a bare number here because the library ships no z-index scale.
If one is introduced, the tooltip belongs above window chrome and below modals.

## React API

```tsx
export interface TooltipProps {
  /** Tooltip contents — usually a string, but accepts nodes. */
  content: ReactNode
  /** Optional bold first line above the body. */
  headline?: ReactNode
  /** The element the tooltip describes. Must be focusable. */
  children: ReactElement
  /** Where to prefer to render; flips automatically when it would overflow. */
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** Milliseconds before showing on pointer hover. 0 disables the delay. */
  delay?: number
  /** Render the compact variant. */
  compact?: boolean
  /** Controlled visibility. */
  open?: boolean
  /** Called when the tooltip wants to open or close. */
  onOpenChange?: (open: boolean) => void
}
```

Notes:

- `children` is a **single `ReactElement`**, not `ReactNode`. The component must
  clone it to attach `aria-describedby` and the focus/blur handlers, and it
  cannot do that to a string or a fragment.
- `delay` applies to hover only. Focus always shows immediately — see §States.
- Prefer a controlled `open`/`onOpenChange` pair when several tooltips share a
  container; otherwise every tooltip needs its own timer.

## Accessibility

- `role="tooltip"` on the card, and the trigger gets `aria-describedby` pointing
  at the card's `id`. Use `useId()`.
- **Never `aria-label` on the trigger instead of `aria-describedby`.** They mean
  different things: `aria-label` *replaces* the accessible name, so a tooltip
  that says "Deletes the file permanently" would erase the button's real name.
  `aria-describedby` *appends*, which is what a tooltip is.
- Show on **both** `focus` and `pointerenter`; hide on `blur`, `pointerleave` and
  `Escape`. Missing the focus path is the most common tooltip bug.
- The tooltip card must **not** be in the tab order and must **not** contain
  interactive content. A tooltip you can click is a popover, not a tooltip; use
  `Menu` or `Dialog` for that.
- `Escape` must dismiss without moving focus away from the trigger, and the
  tooltip must stay dismissed until the pointer leaves and re-enters (WCAG
  1.4.13 — Content on Hover or Focus, which also requires the content to be
  dismissible, hoverable and persistent).
- **Content on Hover or Focus also requires hoverability**: if the tooltip
  appears under the cursor, moving the pointer *onto* the tooltip must not hide
  it. Because this tooltip is non-interactive this only matters when the tooltip
  overlaps the trigger; still, anchor it so it does not cover the trigger.
- Contrast: `#232421` on `#C4B550` is **7.48:1** (AAA). This is the most legible
  pairing in the whole theme — do not replace the maize background with
  `--vgui-surface-dark`, which would both lose the identity and drop the ratio.
- Long content must wrap with `max-width`, and the positioning logic must flip
  the placement when the card would leave the viewport.

## Assets

None. Valve's `TooltipWindow` was a `render_bg` fill plus a uniform border, so
the CSS is a literal transcription.

## Examples

```tsx
<Tooltip content="Reload the current page" placement="bottom">
  <IconButton icon="reload" label="Reload" />
</Tooltip>

<Tooltip
  headline="Achievements locked"
  content="Launch the game once to unlock your achievement list."
  compact
>
  <span tabIndex={0}>?</span>
</Tooltip>

<Tooltip content={<>Press <kbd className="vgui-tooltip__key">Shift</kbd> to run</>}>
  <input type="text" aria-label="Player name" />
</Tooltip>
```

## Open questions

- **The green-theme background colour is a judgement call.** Valve's client uses
  `Orange` (`#FF9B00`) with `TextColor "0 0 0 196"`. This doc uses
  `--vgui-heading` (`#C4B550`, maize) because that is the same hue family at a
  legible ratio (7.48:1) and matches the hover/heading accent used everywhere
  else in the green theme. Neither the CSS port nor `OldSteam-Theme` ships a
  tooltip override, so there is no community precedent to appeal to.
- Valve's `TextColor` carries an alpha of `196`. This doc uses an opaque
  near-black instead, on the grounds that a semi-transparent tooltip composites
  unpredictably over page content. Revisit if exact fidelity matters more than
  reproducibility.
