# ToggleButton

## Purpose

A button that stays down. Where `Checkbox` says "this setting is on", a
`ToggleButton` says "this mode is active" — the same boolean with a different
weight. In the client it drives the toolbar's view-style switcher (list / grid),
the friends-list filter buttons, and the "Show" toggles in the server-browser
sidebar.

## VGUI original

`ToggleButton` in VGUI2 (`vgui_controls/ToggleButton.cpp`), a subclass of
`Button` that remembers its state. `steam.styles`:

```
ToggleButton
{
    font                 "UiBold"
    textcolor            "White"
    bgcolor              "GreenBG"
    border               "ToggleButtonBorder"
    render_bg            { ... raised ... }
}

ToggleButton:Selected
{
    border               "ToggleButtonSelectedBorder"   /* bevel inverted */
    bgcolor              "DarkGreenBG"
}

ToggleButton:MouseOver
{
    border               "ToggleButtonMouseOverBorder"
}
```

Three things worth extracting:

1. **`:Selected` inverts the bevel *and* darkens the face** to `DarkGreenBG`
   `#3E4637`. This is the one control in the theme where a "pressed" look
   persists rather than being a transient `:active`.
2. **`ToggleButton` *has* a `MouseOver` border**, even though `Button` does not.
   That is a real, recorded asymmetry between the two classes, and it is the
   cleanest evidence that the client was not uniformly hover-less.
3. **`font "UiBold"`** — same as `Button`, so a toggle button is
   dimensionally identical to a normal one. They mix freely in a toolbar.

VGUI1 did not have `ToggleButton`; the GoldSrc-era equivalent was a `Button` with
`SetSelected()` or, more commonly, a hand-rolled `CheckButton`-aped look.

## Anatomy

```html
<button class="vgui-toggle-button" aria-pressed="true">
  <svg class="vgui-toggle-button__icon" aria-hidden="true">…</svg>
  <span class="vgui-toggle-button__label">Grid</span>
</button>
```

Identical to `Button`, with two additions: an optional leading icon, and
`aria-pressed`.

## Variants

| Variant | Class | Use |
| --- | --- | --- |
| Default | — | Text label, 25px |
| Icon-only | `--icon-only` | Square, glyph only — becomes an `IconButton` with `toggled`, but keeping it here means one component covers both |
| Segmented | `--segmented` | Shares edges with siblings; only the group's outer edges keep their bevel |
| Clay | `--clay` | Property-sheet face |

**`--segmented` is the right way to build a view switcher.** VGUI's toolbar had
adjacent toggle buttons with overlapping borders; a CSS group with
`margin-left: -1px` and `border-radius: 0` reproduces that, and the group gets
`role="group"` so assistive tech reads it as one control set.

## States

| State | Bevel | Face | Text |
| --- | --- | --- | --- |
| Off | Raised: `bevel-light` top/left, `bevel-dark` bottom/right | `--vgui-surface` `#4C5844` | `--vgui-text-strong` |
| Off hover | Raised, **plus a hover border** | `--vgui-surface` | `--vgui-text-strong` |
| On (selected) | **Inverted**: `bevel-dark` top/left, `bevel-light` bottom/right | `--vgui-surface-dark` `#3E4637` | `--vgui-text-strong` |
| On hover | Inverted | `--vgui-surface-dark` | `--vgui-text-strong` |
| Pressing (off) | Inverted (transient) | `--vgui-surface` | `--vgui-text-strong` |
| Focus-visible | unchanged | unchanged | `outline: 1px dashed var(--vgui-bevel-dark); outline-offset: -4px` |
| Disabled | unchanged | unchanged | `--vgui-text-disabled` + shadow |

Note the interaction between **pressing** and **state**: pressing an *off* toggle
inverts the bevel exactly as pressing a normal button does. Pressing an *on*
toggle would, under a naive implementation, un-invert it and make it look off
while the finger is down. Valve's `Button:Active` border wins over `:Selected`,
so the pressed look should stay inverted regardless of state — i.e.
`:active` always sets the inverted borders, and `--on` also sets them. Do not let
`:active` be a no-op when on.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-surface` `#4C5844` | Off face |
| `--vgui-surface-dark` `#3E4637` | On face |
| `--vgui-bevel-light` `#899281` / `--vgui-bevel-dark` `#292D23` | Bevel |
| `--vgui-accent` `#C4B550` | High-contrast focus ring |
| `--vgui-text-strong` `#FFFFFF` | Label |
| `--vgui-text-disabled` / `-shadow` | Disabled label |
| `--vgui-clay-button` `#7D8078` | Clay face |

## CSS recipe

```css
.vgui-toggle-button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  min-height: 25px;
  min-width: 75px;
  padding: 0 8px 0 4px;
  font: inherit;
  font-weight: lighter;
  color: var(--vgui-text-strong);
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
  cursor: pointer;
}

/* ToggleButton — unlike Button — has a hover affordance in steam.styles. */
.vgui-toggle-button:hover {
  background-color: var(--vgui-surface-light);
}

/* :active and --on both invert. Order matters only for the face colour. */
.vgui-toggle-button:active,
.vgui-toggle-button[aria-pressed="true"] {
  border-top-color: var(--vgui-bevel-dark);
  border-left-color: var(--vgui-bevel-dark);
  border-bottom-color: var(--vgui-bevel-light);
  border-right-color: var(--vgui-bevel-light);
}

.vgui-toggle-button[aria-pressed="true"] {
  background-color: var(--vgui-surface-dark);
}

.vgui-toggle-button:focus-visible {
  outline: 1px dashed var(--vgui-bevel-dark);
  outline-offset: -4px;
}

/* Segmented group: collapse the shared edges. */
.vgui-toggle-group { display: inline-flex; }
.vgui-toggle-group .vgui-toggle-button + .vgui-toggle-button {
  margin-left: -1px;
}
.vgui-toggle-group .vgui-toggle-button { min-width: 0; }
```

**Style from `[aria-pressed="true"]`, not `--on`.** The attribute is the source
of truth that assistive tech reads; a class would be a second, divergable copy of
the same bit. This is the one place where the state selector and the a11y
selector can be the same selector, so make them the same selector.

## React API

```tsx
export interface ToggleButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> {
  /** Controlled pressed state. Omit for uncontrolled. */
  pressed?: boolean
  /** Initial pressed state when uncontrolled. */
  defaultPressed?: boolean
  /** Called with the next pressed state. */
  onPressedChange?: (pressed: boolean) => void
  /** Optional leading glyph. */
  icon?: ReactNode | string
  /** Square variant, glyph only. Requires `label`. */
  iconOnly?: boolean
  /** Accessible name. Required when `iconOnly` — a glyph is not a name. */
  label?: string
  /** Compact variant for toolbars. */
  small?: boolean
  /** Grey property-sheet face. */
  clay?: boolean
}
```

The naming (`pressed` / `defaultPressed` / `onPressedChange`) matches the
`aria-pressed` attribute rather than mirroring `checked`. That choice is
deliberate: a `ToggleButton` is not a checkbox and `checked` would invite people
to use it as one, which then produces the wrong announcement.

## Accessibility

- **`aria-pressed` belongs on `<button>`, not `aria-checked`.** A toggle button
  announces as "Grid view, pressed, toggle button"; a checkbox announces as
  "Grid, checked, checkbox". The former is a mode, the latter is a setting. Pick
  based on semantics, not looks.
- **Toggle *buttons* and toggle *switches* are different things.** A toggle
  button's label must not change when toggled ("Grid" stays "Grid"; it does not
  become "List"). If the label describes the current state instead of the action,
  `aria-pressed` is wrong — use a plain `Button` with a changing label, or a
  switch. This is the single most common misuse of this component.
- **The dotted dashed focus ring is 1.87:1** on `#4C5844` and fails WCAG 1.4.11.
  Ship `outline: 2px solid var(--vgui-accent)`.
- **The pressed state needs a non-colour cue.** Inverting a 1px bevel at
  ~2:1 contrast is not a perceivable difference for many users. `aria-pressed`
  covers assistive tech, but for a sighted low-vision user the `#3E4637` vs
  `#4C5844` face change is only **1.30:1**. If a toggle's state is
  consequential, add a checkmark glyph in the pressed state (which is what
  Steam's own later toolbar did) or keep the label.
- **Segmented groups need a group name.** `role="group"` with an
  `aria-label` ("View style"), so "Grid, pressed, 2 of 3" has a scope.
- **Toolbar roving tabindex** applies here exactly as in `IconButton`: one tab
  stop for the group, arrow keys within.
- `min-width: 75px` is VGUI's, and it clears the 24×24 target minimum. The
  `--segmented` variant's `min-width: 0` must be compensated with real padding —
  do not let it collapse below 24px wide.
- The hover face change to `--vgui-surface-light` `#5A6A50` is **1.30:1** against
  the base surface. It is decorative and must never be the only signal that
  something is interactive; the cursor and the bevel carry that.

## Assets

None. Like `Button`, this is entirely `border` + `background-color`. The `:hover`
and `:Selected` borders in `steam.styles` are `Border` blocks, not sprites.

## Examples

```tsx
// Standalone
<ToggleButton pressed={showDetails} onPressedChange={setShowDetails}>
  Show details
</ToggleButton>

// Segmented view switcher
<ToggleGroup value={view} onValueChange={setView} label="View style">
  <ToggleButton value="list" icon="list">List</ToggleButton>
  <ToggleButton value="grid" icon="grid">Grid</ToggleButton>
  <ToggleButton value="details" icon="details">Details</ToggleButton>
</ToggleGroup>

// Icon-only toolbar button
<ToggleButton iconOnly icon="pin" label="Pin panel" pressed={pinned} onPressedChange={setPinned} />
```

## Open questions

- **`ToggleButton` has a `MouseOver` border and `Button` does not.** This is
  recorded in `steam.styles` and should be believed, but it is surprising enough
  to flag: it means the client's buttons were *not* uniformly hover-less, and it
  weakens the blanket "no hover states in VGUI" claim that this doc set makes
  elsewhere. The `Button.md` claim should probably be softened to "no hover
  border in `steam.styles`" rather than "no hover affordance".
- Whether `ToggleGroup` should be a separate component or a `ToggleButton`
  modifier is unresolved. The `value`/`onValueChange` shape above implies a
  context provider like `RadioGroup`; a pure CSS `--segmented` modifier plus
  manual `pressed` props would be simpler and more tree-shakable.
- The exact `ToggleButtonBorder` / `ToggleButtonSelectedBorder` values were not
  located as concrete hex; this doc assumes they are the standard
  `bevel-light`/`bevel-dark` pair inverted, which is what the CSS port does.
