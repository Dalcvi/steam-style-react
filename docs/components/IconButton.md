# IconButton

## Purpose

A small square button whose entire content is a glyph: back, forward, reload,
home, stop, minimize, maximize, close, the scrollbar arrows, the combobox caret,
the tree expander. The client is full of these, and they are a distinct component
from `Button` because their metrics are driven by the sprite's pixel size rather
than by a text label.

## VGUI original

There is no `IconButton` class. VGUI builds them as a `Button` whose child is an
`ImagePanel` — `Button` with `SetImage()` in VGUI1, and a `Label` with a
`image`/`imagepos` binding in VGUI2. `steam.styles` therefore does not define it
either; instead it defines the individual *sprites*:

```
icon_down_default  icon_down_hover  icon_down_focus        (+ up/left/right)
icon_button_back_{,over,down,disabled}
icon_button_forward_{,over,down,disabled}
icon_button_home_{,over,down,disabled}
icon_button_reload_{,over,down,disabled}
icon_button_stop_{,over,down,disabled}
icon_button_detail_{,over,down,disabled}
```

Every one of those has four state variants, which is the key architectural fact:
**an icon button's states are separate sprites, not CSS recolourings.** When
porting, each state becomes either a distinct inline SVG or a `mask-image` swap.

## Anatomy

```html
<button class="vgui-icon-button" aria-label="Reload">
  <svg class="vgui-icon-button__glyph" aria-hidden="true">…</svg>
</button>
```

No inner span is needed — there is no label text to truncate.

## Variants

| Variant | Class | Size | Use |
| --- | --- | --- | --- |
| Default | — | `20 × 20` | Frame controls, dense chrome |
| Small | `--small` | `15 × 15` | Inline glyphs inside rows |
| Large | `--large` | `25 × 25` | Toolbars |
| Gutter | `--gutter` | `18 × 18` | Scrollbar and combobox buttons |
| Frameless | `--frameless` | as above | No bevel; used for tree expanders and the `?` hint |
| Toggled | `--toggled` | as above | Inverted bevel, for latched toolbar buttons |

## States

| State | Treatment |
| --- | --- |
| Normal | Raised bevel, glyph at `--vgui-text` |
| Hover | **Raised bevel unchanged**, glyph brightens to `--vgui-text-strong`. The `_over` sprites are brighter glyphs, not a different face. |
| Active | **Bevel inverts**; glyph stays bright. `icon_button_*_down` also shows the glyph 1px lower. |
| Focus-visible | `outline: 1px dashed var(--vgui-bevel-dark); outline-offset: -4px`; fall back to the accent ring |
| Disabled | `icon_button_*_disabled` — the glyph drops to `--vgui-text-disabled` and, on the `--frameless` variant, there is no bevel at all |
| Toggled | Bevel inverted and *stays* inverted; glyph uses the `over` colour |

The `_down` sprites shifting the glyph down by 1px is the only place in the theme
where content moves on press. `Button` inverts the bevel and stays put; an icon
button does both.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-surface` `#4C5844` | Face |
| `--vgui-bevel-light` / `--vgui-bevel-dark` | Bevel |
| `--vgui-text` `#D8DED3` | Glyph, normal |
| `--vgui-text-strong` `#FFFFFF` | Glyph, hover and active |
| `--vgui-text-disabled` `#75806F` | Glyph, disabled |
| `--vgui-accent` `#C4B550` | High-contrast focus ring |
| `--vgui-clay-button` `#7D8078` | Clay chrome variant |

## CSS recipe

```css
.vgui-icon-button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  min-width: 20px;
  padding: 0;
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
  cursor: pointer;
  color: var(--vgui-text);
}

.vgui-icon-button:hover { color: var(--vgui-text-strong); }

.vgui-icon-button:active,
.vgui-icon-button--toggled {
  border-top-color: var(--vgui-bevel-dark);
  border-left-color: var(--vgui-bevel-dark);
  border-bottom-color: var(--vgui-bevel-light);
  border-right-color: var(--vgui-bevel-light);
}

.vgui-icon-button:active .vgui-icon-button__glyph { transform: translateY(1px); }

.vgui-icon-button:disabled {
  color: var(--vgui-text-disabled);
  cursor: default;
}

.vgui-icon-button--frameless {
  border-color: transparent;
  background-color: transparent;
}
.vgui-icon-button--frameless:hover {
  border-color: var(--vgui-bevel-light) var(--vgui-bevel-dark)
                var(--vgui-bevel-dark) var(--vgui-bevel-light);
}

.vgui-icon-button__glyph {
  display: block;
  width: 100%;
  height: 100%;
  background-color: currentColor;             /* recolours per state for free */
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: 12px 12px;
}
```

**Use `mask-image` + `background-color: currentColor`, not `background-image`
with a hardcoded `fill`.** A `data:` URI cannot read a CSS custom property, so a
`background-image` glyph would need to be duplicated once per colour (six
variants × four states = 24 URIs per glyph). A mask needs one URI and recolours
from `currentColor`, which means it also works under every theme variant for
free. This is the single most important implementation decision in this file.

## React API

```tsx
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name. Required — a glyph alone is not a name. */
  label: string
  /** The glyph, as an inline SVG or a mask-image class name. */
  icon: ReactNode | keyof typeof glyphs
  /** Edge length in pixels. Defaults to 20. */
  size?: 15 | 18 | 20 | 25
  /** Render without a bevel until hovered. */
  frameless?: boolean
  /** Latched on: inverted bevel that persists. */
  toggled?: boolean
  /** Render the grey property-sheet face. */
  clay?: boolean
}
```

`label` is **required** and non-optional in the type. This is deliberate: an icon
button without an accessible name is an unlabelled button, and making it
optional guarantees that consumers forget it. `label` sets `aria-label` unless
`children` supply a visually-hidden span.

## Accessibility

- **`label` is mandatory** and must be a real description of the action, not the
  glyph name. "Reload", not "Reload icon"; "Close", not "X".
- The `<svg>` gets `aria-hidden="true"` and `focusable="false"`. Without
  `focusable="false"` an inline SVG becomes a tab stop in IE/old Edge; it is
  harmless elsewhere and worth keeping.
- **Hit target.** `20 × 20` is below the WCAG 2.5.8 minimum of `24 × 24`. Two
  options: use the `--large` (25×25) variant for primary actions, or keep the
  visual size and expand the hit area with `::before { inset: -2px }`. Do one of
  them — do not ship a wall of 20px targets in a toolbar as the only route to
  common actions.
- **Toolbars must be keyboard-navigable.** A toolbar of icon buttons should be a
  single tab stop with arrow-key movement between buttons (`role="toolbar"` plus
  roving `tabIndex`). Tabbing through twelve 20px buttons is a miserable
  experience and is the reason `role="toolbar"` exists.
- **The 1px glyph shift on `:active` is fine** because it is decorative and
  mirrors the bevel inversion. Under `prefers-reduced-motion` it is not motion —
  it is a state change — so it does not need suppressing.
- Disabled icon buttons still need their `label`. Assistive tech announces
  "Reload, dimmed, button", which is exactly the information a sighted user gets
  from the greyed sprite.
- Glyph contrast: `--vgui-text` `#D8DED3` on `#4C5844` is **5.49:1** (AA) and the
  hover `#FFFFFF` is **7.54:1** (AAA). Both fine. A frameless button on an
  arbitrary page background is the case to check.

## Assets

Every glyph is an inline SVG used as a `mask-image`. The full set, in the order
they appear in `OG-Steam/graphics/`:

| Sprite family | Glyph |
| --- | --- |
| `icon_button_back_*` | Left-pointing chevron |
| `icon_button_forward_*` | Right-pointing chevron |
| `icon_button_home_*` | House |
| `icon_button_reload_*` | Circular arrow |
| `icon_button_stop_*` | Filled square |
| `icon_button_detail_*` | Right-pointing triangle / "more" |
| `icon_down_*` | Down triangle, **9×6** |
| `icon_left_*` / `icon_right_*` | Solid triangles, **13×13** |
| `icon_up_*` | *(absent from this extract — see below)* |
| `Window-Min` / `Window-Max` / `Window-Restore` / `Window-Close` | Titlebar control glyphs |

**There is no `icon_up_*` sprite in this extract**, even though `uparrow`
(`steam.styles:403`) references `graphics/icon_up_default`. And the two arrow
families that do exist are not the same size or weight: `icon_down_*` is **9×6**
while `icon_left_*` and `icon_right_*` are **13×13**. A single "7×4 triangle"
primitive does not match either, so **draw all four directions from one
inner-centred SVG triangle** rather than scaling Valve's mismatched originals —
see `Scrollbar.md` §9 for the 7×4 staircase used by scrollbar arrows and
`SpinBox.md` §9 for the missing up arrow. `ColorPicker.md` reuses the same
primitive.

Because the mask approach needs only one URI per glyph, the "four state variants
per sprite" problem from Valve's originals disappears entirely — the states are
handled by `currentColor`.

## Examples

```tsx
<Toolbar>
  <IconButton icon="back" label="Back" size={25} />
  <IconButton icon="forward" label="Forward" size={25} />
  <IconButton icon="reload" label="Reload" size={25} />
  <Divider vertical />
  <IconButton icon="stop" label="Stop loading" size={25} disabled />
</Toolbar>

<IconButton icon="close" label="Close" onClick={onClose} />
<IconButton icon="chevron-down" label="Show options" frameless />
<IconButton icon="grid" label="Grid view" toggled />
```

## Open questions

- Whether the `_over` (hover) sprite is genuinely a *brighter* glyph or an
  identical glyph on a lightened face is not confirmed from the `.tga` files
  without rendering them. This doc assumes brighter glyph, which is also what the
  CSS port's `nav li a:hover { color: #E3E41F }` implies for nav items.
- The `--toggled` state has no direct VGUI precedent for icon buttons;
  `ToggleButton` covers the text case. Whether Valve's toolbar buttons latched is
  not established.
- Glyph metrics (`12 × 12` mask size inside a `20 × 20` face) are derived from
  the sprite dimensions in `OG-Steam/graphics/`, not from a style rule.
