# Splitter

## Purpose

A draggable divider between two panes that sets their relative size. The old
Steam client used it sparingly — the friends list / chat area pair, and the
server browser's filter pane — but it is essential for reproducing a
multi-pane client shell, and it is the component that most needs keyboard
support added.

`Splitter` is the handle. The two panes are the consumer's layout; the component
manages only the drag gesture and the size it produces.

## VGUI original

VGUI2 uses `Splitter` (`vgui_controls/Splitter.cpp`) in the public SDK, and the
underlying drag primitive is `Dragger` plus the `SplitterHandle` style from
`steam.styles`:

```
SplitterHandle
{
    bgcolor  "DarkGreenBG"
    border   ...
}
```

The handle itself is a **3px-wide recessed bar** — narrower than a scrollbar and
with no arrows, because it is dragged rather than clicked. Valve renders it with
the inset bevel (dark top/left, light bottom/right) so it reads as a groove
between the two panes.

VGUI1 has no `Splitter`; the equivalent is two `Panel`s with a manual
`BorderLayout` gap. Treat the VGUI2 control as the precedent.

## Anatomy

```
.vgui-splitter                         ← grid or flex container
├── .vgui-splitter__pane--first
├── .vgui-splitter__handle             ← role="separator", 3px, draggable
│   └── .vgui-splitter__handle-grip    ← optional centred texture
└── .vgui-splitter__pane--second
```

The handle is a sibling of the panes, not a child, so that `role="separator"`
sits on the same level as the content it separates.

## Variants

| Variant | Class | Use |
| --- | --- | --- |
| Horizontal | `--horizontal` | Panes side by side; handle is vertical, `cursor: col-resize` |
| Vertical | `--vertical` | Panes stacked; handle is horizontal, `cursor: row-resize` |
| Gripped | *(default)* | Centred 3-dot grip texture on the handle |
| Plain | `--plain` | Bare groove, no grip dots |

## States

| State | Treatment |
| --- | --- |
| Default | `--vgui-surface-dark` fill, inset bevel |
| Hover | Handle lightens to `--vgui-surface`; cursor changes |
| Active (dragging) | Handle keeps the hover fill, `user-select: none` on the whole document, and the pointer captures the handle |
| Focus-visible | **Required.** `outline: 2px solid var(--vgui-accent); outline-offset: -2px` — the handle is a focusable widget |
| Disabled | `cursor: default`, `aria-disabled="true"`, `tabIndex={-1}`; the bevel stays identical |

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-surface-dark` `#3E4637` | Handle fill |
| `--vgui-surface` `#4C5844` | Handle fill on hover/drag |
| `--vgui-bevel-dark` `#292D23` | Inset top/left |
| `--vgui-bevel-light` `#899281` | Inset bottom/right |
| `--vgui-accent` `#C4B550` | Focus ring |

## CSS recipe

```css
.vgui-splitter {
  display: grid;
  min-width: 0;
  min-height: 0;
}

.vgui-splitter--horizontal {
  grid-template-columns: var(--vgui-splitter-size, 1fr) 3px 1fr;
}

.vgui-splitter--vertical {
  grid-template-rows: var(--vgui-splitter-size, 1fr) 3px 1fr;
}

.vgui-splitter__handle {
  background-color: var(--vgui-surface-dark);
  border-top: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-light);
  border-right: 1px solid var(--vgui-bevel-light);
  touch-action: none;
}

.vgui-splitter--horizontal .vgui-splitter__handle { cursor: col-resize; }
.vgui-splitter--vertical   .vgui-splitter__handle { cursor: row-resize; }

.vgui-splitter__handle:hover,
.vgui-splitter__handle[data-dragging='true'] {
  background-color: var(--vgui-surface);
}

.vgui-splitter__handle:focus-visible {
  outline: 2px solid var(--vgui-accent);
  outline-offset: -2px;
}

.vgui-splitter__pane {
  min-width: 0;      /* without this a wide table forces the pane open */
  min-height: 0;
  overflow: auto;
}
```

Two non-obvious requirements:

1. **`min-width: 0` / `min-height: 0` on the panes.** Grid and flex items default
   to `min-width: auto`, which means a table with a long line refuses to shrink
   and the splitter appears stuck. This is the most common bug in splitter
   implementations.
2. **`touch-action: none` on the handle only**, never on the panes, or the panes
   stop scrolling on touch devices.

Sizing is published as a single custom property (`--vgui-splitter-size`) that the
component updates. Consumers can then override the layout without touching the
component.

## React API

```tsx
export interface SplitterProps extends HTMLAttributes<HTMLDivElement> {
  /** Layout direction of the panes. */
  orientation?: 'horizontal' | 'vertical'
  /** Size of the first pane: a percentage, or a number of pixels. Uncontrolled. */
  defaultSize?: number | string
  /** Controlled size of the first pane. Pair with `onResize`. */
  size?: number | string
  /** Called with the new size while dragging and after keyboard nudges. */
  onResize?: (size: number | string) => void
  /** Smallest the first pane may become, in pixels. */
  minSize?: number
  /** Largest the first pane may become, in pixels. */
  maxSize?: number
  /** Accessible name; defaults to "Resize panel". */
  label?: string
  /** Content for the first pane. */
  first: ReactNode
  /** Content for the second pane. */
  second: ReactNode
}
```

Controlled and uncontrolled modes mirror the standard React pattern: pass `size`
to control it, `defaultSize` otherwise. `onResize` fires during the drag (the
consumer is expected to throttle, or the component does), and after each arrow
key press.

## Accessibility

This is the component with the largest gap between what VGUI did and what WCAG
requires, so read this section carefully.

- **The handle must be focusable.** VGUI's handle is drag-only; that is a
  WCAG 2.1.1 failure. Render it as a `<div role="separator" tabIndex={0}>` with
  `aria-orientation` matching the layout.
- **It must expose a value.** A focusable separator is a widget, so it needs
  `aria-valuenow`, `aria-valuemin` and `aria-valuemax`. Without these, a screen
  reader announces "separator" and nothing else.
- **It must be keyboard operable.** Arrow keys move it: the arrow *across* the
  splitter (`←`/`→` horizontally, `↑`/`↓` vertically) resizes by 10px, `Shift`
  plus that arrow resizes by 1px, and `Home`/`End` snap to `minSize`/`maxSize`.
  This is the ARIA window-splitter pattern.
- **`aria-valuetext` beats `aria-valuenow` here.** "42 percent" is more useful
  than "420", especially when the two panes are of unknown pixel width.
- **Hit target.** The 3px handle is far below the 24×24 minimum target size
  (WCAG 2.5.8). Keep the visible groove at 3px but add an invisible hit area via
  `::before` with `inset: -8px` (or `padding` on a wrapper) so the pointer can
  actually catch it.
- **`prefers-reduced-motion`** does not apply strongly here, but any animated
  snap-back on release must be suppressed.
- Pointer events must use `setPointerCapture`, so a fast drag that leaves the
  window does not strand the gesture.

## Assets

None. The grip dots, if wanted, are a `radial-gradient` repeating pattern rather
than Valve's TGA:

```css
.vgui-splitter__handle-grip {
  background-image: radial-gradient(var(--vgui-bevel-light) 1px, transparent 1px);
  background-size: 3px 3px;
  background-position: center;
}
```

## Examples

```tsx
<Splitter
  orientation="horizontal"
  defaultSize="30%"
  minSize={180}
  maxSize={600}
  label="Resize filter pane"
  first={<FiltersPane />}
  second={<Table columns={serverColumns} rows={servers} />}
/>
```

## Open questions

- The exact `SplitterHandle` thickness in Valve's client is not confirmed from
  `steam.styles`; `3px` follows the CSS port's groove width. VGUI2's
  `Splitter.cpp` uses a `SplitterHandle` of `4px` in some configurations.
- There is no evidence of a gripped variant in the Steam client — the grip dots
  are borrowed from the `resizer` sprite's visual language. Marked `--plain` as
  the more faithful default if fidelity matters.
