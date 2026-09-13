# Window

## Purpose

A `Panel` you can pick up. `Window` adds a draggable titlebar, a control cluster
in the top-right corner (icon, minimize, maximize, close), and a resize grip in
the bottom-right. It is the container for anything that behaves like a
top-level dialog in the original client: the server browser, the settings
dialog, the friends list, the screenshot manager.

Reach for `Panel` when content is inline, and `Window` when it is a floating,
movable, closeable unit.

## VGUI original

`Frame` in both VGUI1 (`vgui_dll/include/VGUI_Frame.h`) and VGUI2
(`source-sdk-2013: src/public/vgui_controls/Frame.cpp`). Valve's `steam.styles`
defines the surface and the focus variant:

```
Frame
{
    bgcolor  "GreenBG"
    border   "FrameBorder"
    ...
}

Frame:FrameFocus
{
    border   "FrameBorderFocused"
    ...
}
```

`steamscheme.res` `LayoutTemplates` then pins the exact geometry:

| Element | Position |
| --- | --- |
| Titlebar | full width, **28px** tall (Valve) / **18px** (CSS port) |
| Icon button | `20 × 20`, `ypos 8`, `xpos` from the left |
| Minimize | `20 × 20`, `ypos 8`, right-aligned at `r50` |
| Maximize | `20 × 20`, `ypos 8`, right-aligned at `r72` |
| Close | `20 × 20`, `ypos 8`, right-aligned at `r28` |
| Resize grip | `14 × 14` (Valve) / `12 × 12` (CSS port), bottom-right |

> The right-aligned offsets (28, 50, 72) are measured **from the right edge**, so
> close sits nearest the corner and the buttons run right-to-left in order
> close → maximize → minimize. Copying literal `left` values reproduces the
> cluster mirrored.

## Anatomy

```
.vgui-window                                  ← beveled surface + position context
├── .vgui-window__titlebar                    ← 18/28px drag handle
│   ├── .vgui-window__icon                    ← optional 16px app glyph
│   ├── .vgui-window__title                   ← uppercase caption
│   └── .vgui-window__controls
│       ├── .vgui-window__control--minimize
│       ├── .vgui-window__control--maximize
│       └── .vgui-window__control--close
├── .vgui-window__body                        ← scrollable content region
└── .vgui-window__grip                        ← 12px resize handle
```

## States

| State | Treatment |
| --- | --- |
| Normal | Raised bevel, `--vgui-surface` body, `--vgui-text-strong` title |
| Focused | "Focused" bevel — Valve lights the frame border when the window has focus. In practice: swap `--vgui-bevel-light` for `--vgui-bevel-light-strong` (`#B8C4AD`) and use `--vgui-clay-glyph` for the control glyphs. |
| Unfocused | Control glyphs drop to `--vgui-clay-glyph-dim` (`#A6ACA2`) and the title dims to `--vgui-text-muted` |
| Dragging | Bevel unchanged; cursor becomes `move`, `user-select: none` on the titlebar |
| Maximized | Grip hidden, `inset: 0`, no border radius, `width/height: 100%` |
| Minimizing | No animation in VGUI — do not invent a scale transition |
| Modal | An overlay sibling dims the rest of the page (see `Dialog`) |

There is no hover state on the window body. The titlebar and the three control
buttons each have their own hover treatment.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-surface` `#4C5844` | Window body |
| `--vgui-bevel-light` `#899281` | Raised top/left; unfocused border |
| `--vgui-bevel-dark` `#292D23` | Raised bottom/right |
| `--vgui-bevel-light-strong` `#B8C4AD` | Focused border highlight |
| `--vgui-text-strong` `#FFFFFF` | Title text |
| `--vgui-text-muted` `#A0AA95` | Title text when unfocused |
| `--vgui-clay-glyph` `#ADB5A8` | Control glyphs, focused |
| `--vgui-clay-glyph-dim` `#A6ACA2` | Control glyphs, unfocused |

## CSS recipe

```css
.vgui-window {
  box-sizing: border-box;
  position: relative;
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
  padding: 10px;
  min-width: 220px;
  min-height: 120px;
}

.vgui-window--focused {
  border-top-color: var(--vgui-bevel-light-strong);
  border-left-color: var(--vgui-bevel-light-strong);
}

.vgui-window__titlebar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 18px;
  line-height: 18px;
  margin-bottom: 1em;
  cursor: move;
  user-select: none;
  touch-action: none;          /* let pointer events own the gesture */
}

.vgui-window__title {
  flex: 1 1 auto;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 12px;
  font-weight: bold;
  color: var(--vgui-text-strong);
}

.vgui-window__controls { display: flex; gap: 2px; }

.vgui-window__control {
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1px solid transparent;   /* transparent, not none — keeps the box */
  background-color: transparent;
  cursor: pointer;
}
.vgui-window__control:hover { border-color: var(--vgui-bevel-light); }
.vgui-window__control:active {
  border-color: var(--vgui-bevel-dark);
  background-color: var(--vgui-surface-light);
}

.vgui-window__grip {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
  background-image: url("data:image/svg+xml,…");   /* see Assets */
}
```

Positioning (`left`/`top`/`transform`) is **the consumer's** job. The component
renders an unstyled-by-default box; a `position` prop or plain `style` passthrough
lets the app place it. Do not bake in `position: fixed`.

## React API

```tsx
export interface WindowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Uppercase text in the title bar. */
  title: ReactNode
  /** Optional 16px application glyph shown before the title. */
  icon?: ReactNode
  /** Show the minimize control. */
  minimizable?: boolean
  /** Show the maximize control. */
  maximizable?: boolean
  /** Show the close control. */
  closable?: boolean
  /** Show the bottom-right resize grip. */
  resizable?: boolean
  /** Render the focused border and glyph colours. */
  focused?: boolean
  /** Show the maximize glyph in its toggled state. */
  maximized?: boolean
  /** Fires when a control is activated; `close` also fires on Escape. */
  onAction?: (action: 'minimize' | 'maximize' | 'restore' | 'close') => void
  /** Called continuously while dragging the title bar, with the pointer delta. */
  onDrag?: (deltaX: number, deltaY: number) => void
  /** Accessible label for the control group. */
  controlsLabel?: string
}
```

Notes:

- `title` is `Omit`ted from `HTMLAttributes` and redeclared as `ReactNode`. The
  native `title` tooltip attribute must still be reachable — re-expose it as
  `tooltip?: string`.
- `onAction` instead of four separate callbacks keeps the DOM to three buttons
  and lets the consumer decide what "minimize" means.
- The component does **not** own `open`/`maximized` state. `focused` and
  `maximized` are presentation props so the component stays controlled.

## Accessibility

- The window is `role="dialog"` when modal (see `Dialog` for the full contract)
  and a plain `<section aria-labelledby>` otherwise. Never `role="dialog"` on a
  non-modal floating panel — it hijacks screen-reader navigation.
- Each of the three controls needs a real accessible name. Do not rely on the
  glyph: render an `.vgui-visually-hidden` span with "Minimize", "Maximize",
  "Close", and set `aria-label` on the button when `controlsLabel` isn't enough.
- **Keyboard dragging is mandatory.** The titlebar must be `tabIndex={0}` with
  `role="toolbar"`-free semantics and respond to arrow keys, because a
  pointer-only drag handler fails WCAG 2.1.1. Implement arrows = 8px nudge,
  `Shift`+arrows = 1px nudge.
- `Escape` closes only when `closable` **and** the window is modal. A non-modal
  window must not swallow the key.
- `user-select: none` on the titlebar is correct; do not spread it to the body.
- The unicode glyphs `–`, `□`, `×` are fine as a fallback but render
  inconsistently across platforms. Prefer the SVG data URIs in §Assets.
- Contrast: title is `#FFFFFF` on `#4C5844` = **7.54:1** (AAA). Unfocused title
  at `#A0AA95` on `#4C5844` is **3.0:1** — below AA for small text, so the
  *focused* state must not be the only way to read the title. Keep the title at
  `--vgui-text-strong` and dim only the glyphs.

## Assets

Three `.tga` sprites are replaced:

| Valve sprite | Replacement |
| --- | --- |
| `Window-Min` | Inline SVG: a 6×2 filled rect, `fill='%23adb5a8'` |
| `Window-Max` / `Window-Restore` | Inline SVG: a 7×7 outlined square, or two offset squares for restore |
| `Window-Close` | Inline SVG: a 7×7 `M0 0 L7 7 M7 0 L0 7` X, `stroke-width='1.5'` |
| `resizer` | Inline SVG: a 12×12 right triangle of three 1px diagonal lines. `GridSrc` in the CSS port ships `resize.png`; the SVG equivalent is required to avoid a binary asset. |

Glyph colour must follow `--vgui-clay-glyph` / `--vgui-clay-glyph-dim`. Because
a `data:` URI cannot read a CSS variable, either (a) ship the SVG twice with the
two hardcoded greens, or (b) mask it —
`background: var(--vgui-clay-glyph); mask-image: url("data:…")` — which is the
better option because it recolours for free under every theme variant.

## Examples

```tsx
<Window
  title="Servers"
  icon={<SteamGlyph />}
  onAction={(a) => a === 'close' && setOpen(false)}
  style={{ position: 'fixed', top: 80, left: 120, width: 620 }}
>
  <Table columns={serverColumns} rows={servers} />
</Window>
```

## Open questions

- **Titlebar height.** Valve's `LayoutTemplates` say `28px`; the CSS port uses
  `18px`. This doc follows the port for consistency with `Panel`, but the
  difference should be resolved once and applied everywhere.
- **Dragging implementation.** Nothing in the VGUI sources indicates whether the
  max/min buttons should be `20 × 20` at `ypos 8` (Valve) or inline in the flow
  (CSS port). The layout above follows the CSS port because it survives a 28px
  titlebar if that change lands.
- Valve ships **no** `Frame` close-confirmation behaviour; `MessageBox` handles
  that as a separate window. Do not add an `onBeforeClose` gate to `Window`.
