# Divider

## Purpose

A 1px horizontal (or vertical) rule that reads as *engraved* rather than drawn:
one dark row on top, one light row beneath. It is the separator in the server
browser's filter pane, between menu sections, and under section captions.

A `Divider` is not a `<hr>`. The default `<hr>` is a solid single-colour line;
this is a two-row two-tone groove, which is why it needs its own component and
its own recipe.

## VGUI original

`Divider` is a genuine VGUI control in both generations
(`vgui_dll/include/VGUI_...`, and the `Divider` section of `steam.styles`). The
`.styles` definition is a `render_bg` with two fills:

```
Divider
{
    render_bg
    {
        1="fill(x0,y0,x1,y0+1,BorderDark)"        // top row    -> shadowed
        2="fill(x0,y0+1,x1,y0+2,BorderBright)"    // second row -> lit
    }
}
```

That is the whole control: two 1px rows, dark above light. The inversion
(`--inset`: light above dark) is the `Divider`'s inset counterpart and appears
where a rule is meant to sit on a recessed surface.

## Anatomy

```html
<div class="vgui-divider" role="separator"></div>
```

One element. No children, no wrapper.

When used as a group separator inside a list or menu, add the `aria-orientation`
attribute implicitly via `role="separator"` — vertical orientation is the
default in ARIA, so a horizontal rule needs `aria-orientation="horizontal"`
explicitly.

## Variants

| Variant | Class | Use |
| --- | --- | --- |
| Default | — | Horizontal, dark-over-light |
| Inset | `--inset` | Horizontal, light-over-dark; for recessed surfaces |
| Vertical | `--vertical` | `width: 1px`, full height; toolbar groups, tree connectors |
| Spaced | `--spaced` | Adds the standard `20px` vertical margin |

## States

None. A divider is purely decorative or purely structural — it has no hover,
focus, active or disabled state. It is never interactive.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-bevel-dark` `#292D23` | Top / left row |
| `--vgui-bevel-light` `#899281` | Bottom / right row |
| `--vgui-surface-dark` `#3E4637` | Background of the `<hr>` fallback implementation |

## CSS recipe

Implementation uses `background-image` with a two-stop `linear-gradient` rather
than `border` + `box-shadow`, because a 2px-tall element needs a 1px row at the
exact top and a 1px row at the exact bottom, and `linear-gradient` expresses
that in one declaration that cannot be broken by a stray `border-radius`.

```css
.vgui-divider {
  display: block;
  width: 100%;
  height: 2px;
  margin: 0;
  border: 0;
  padding: 0;
  background-image: linear-gradient(
    to bottom,
    var(--vgui-bevel-dark) 0,
    var(--vgui-bevel-dark) 1px,
    var(--vgui-bevel-light) 1px,
    var(--vgui-bevel-light) 2px
  );
}

.vgui-divider--inset {
  background-image: linear-gradient(
    to bottom,
    var(--vgui-bevel-light) 0,
    var(--vgui-bevel-light) 1px,
    var(--vgui-bevel-dark) 1px,
    var(--vgui-bevel-dark) 2px
  );
}

.vgui-divider--vertical {
  width: 2px;
  height: 100%;
  min-height: 1em;
  background-image: linear-gradient(
    to right,
    var(--vgui-bevel-dark) 0,
    var(--vgui-bevel-dark) 1px,
    var(--vgui-bevel-light) 1px,
    var(--vgui-bevel-light) 2px
  );
}

.vgui-divider--spaced { margin: 20px 0; }
```

The `1px` stop positions must be unitless numbers in a gradient when the element
is taller than 2px — prefer keeping the element exactly 2px tall and using
`margin` for spacing so the gradient stops never need to be percentage-based.

## React API

```tsx
export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  /** Invert the two rows, for a rule sitting on a recessed surface. */
  inset?: boolean
  /** Draw a vertical rule instead of a horizontal one. */
  vertical?: boolean
  /** Add the standard 20px vertical margin. */
  spaced?: boolean
}
```

The component renders a `<div role="separator">`, **not** an `<hr>`. An `<hr>`
carries a default `border` and `margin` from the UA stylesheet that fights the
gradient, and `role="separator"` gives an unambiguous accessible name story.

## Accessibility

- `role="separator"` on a non-focusable element is **decorative**: assistive
  technology ignores it. That is usually correct — a separator that carries no
  semantic grouping adds nothing.
- **If the divider expresses a real grouping boundary** in a list or a menu,
  the correct markup is a *focusable* separator (`tabIndex={-1}` plus
  `aria-orientation`), which is what windows managers expose. Only do this inside
  a composite widget that manages focus.
- `aria-orientation="horizontal"` must be set explicitly for the horizontal
  variant; ARIA's default is vertical.
- **Contrast is fine here and is not the problem** — the two rows are
  `2.33:1` and `1.87:1` against the surrounding surface, and a purely decorative
  rule is exempt from 1.4.11. The moment the divider carries meaning, that
  exemption is lost and it needs a 3:1 cue (a caption, or a darker variant).
- In forced-colors mode the gradient is discarded and the element renders as
  nothing. Add `@media (forced-colors: active) { .vgui-divider { forced-color-adjust: none; background-image: none; border-top: 1px solid CanvasText; } }`.

## Assets

None. Valve drew the divider with two `fill()` calls, and the gradient is a
literal transcription of them.

## Examples

```tsx
<Panel heading="Filters">
  <Checkbox label="Has players" />
  <Checkbox label="Not full" />
  <Divider spaced />
  <Checkbox label="Secure" />
</Panel>

<Menu>
  <MenuItem>Join game</MenuItem>
  <MenuItem>View server info</MenuItem>
  <Divider />
  <MenuItem>Add to favourites</MenuItem>
  <MenuItem disabled>Copy address</MenuItem>
</Menu>

// Toolbar grouping
<Toolbar>
  <IconButton icon="back" label="Back" />
  <Divider vertical />
  <IconButton icon="reload" label="Reload" />
</Toolbar>
```

## Open questions

- Valve's `Divider` has no documented spacing. `20px` comes from the CSS port's
  `margin-bottom: 20px` on `nav` and `hr { margin: 20px 0 }`, which is a
  coincidence of values rather than a derived metric. `--spaced` is opt-in for
  that reason.
- Whether a vertical `Divider` existed in VGUI1 is not established; the vertical
  variant here is a composition for toolbar groups, where Valve used a 2px-wide
  `Panel` instead.
