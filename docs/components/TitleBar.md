# TitleBar

## Purpose

The uppercase caption strip that names a `Window`, `Panel` or `Dialog`. It is
one of the two most recognisable typographic signatures of the theme (the other
being the bevel), and it is small enough to be its own component so that
`Panel`, `Window`, `Dialog` and `GroupBox` can all share one implementation
without duplicating the tracking and casing rules.

Use `TitleBar` directly when you are building a surface that is not a `Panel` or
`Window` — a custom toolbar, a section header inside a list, a mock-up of a
client screen.

## VGUI original

VGUI1 declares `VGUI_FrameTitle` (`vgui_dll/include/`) and VGUI2 names the style
`FrameTitle` in `steam.styles`. Both are a single-line, left-aligned caption
belonging to a frame, with no background of its own — the titlebar's appearance
is entirely the frame's.

The typography comes from the CSS port rather than from the `.res` file, because
Valve's scheme expressed it as a font reference (`UiBold14`) whereas the port
made the uppercase-and-tracked treatment explicit:

```css
.window::before,
.titlebar,
legend {
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 12px;
  color: white;
  font-weight: bold;
}
```

`18px` height and `text-indent: 24px` come from the same rule.

## Anatomy

```
.vgui-titlebar                       ← flex row, 18px tall
├── .vgui-titlebar__icon             ← optional leading glyph
├── .vgui-titlebar__text             ← the caption itself
└── .vgui-titlebar__actions          ← optional trailing controls/children
```

When used inside `Window` the DOM is different (the controls sit in a sibling
container), but the text styling is identical. `TitleBar` is the **styling**
contract; `Window` composes it.

## Variants

| Variant | Class | Use |
| --- | --- | --- |
| Default | — | Green chrome |
| Clay | `--clay` | Grey property-sheet chrome (settings dialogs) |
| Subdued | `--subdued` | Section header inside a scrolling body |
| With actions | *(children)* | Anything in `.vgui-titlebar__actions` |

## States

| State | Treatment |
| --- | --- |
| Static | `--vgui-text-strong` |
| Unfocused window | Optional `--subdued`: `--vgui-text-muted` (see the contrast caution below) |
| Draggable | `cursor: move`, `user-select: none` — but only when `Window` owns it |
| Truncated | `text-overflow: ellipsis`, `white-space: nowrap`, `min-width: 0` on `__text` |

A `TitleBar` is not focusable and has no hover state on its own.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-text-strong` `#FFFFFF` | Default caption |
| `--vgui-text-muted` `#A0AA95` | `--subdued` caption |
| `--vgui-clay-glyph` `#ADB5A8` | `--clay` caption |
| `--vgui-font` | Font stack |
| `--vgui-heading` `#C4B550` | Optional accent variant |

## CSS recipe

```css
.vgui-titlebar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 18px;
  margin-bottom: 1em;
  box-sizing: border-box;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 12px;
  font-weight: bold;
  line-height: 18px;
  color: var(--vgui-text-strong);
}

.vgui-titlebar__text {
  flex: 1 1 auto;
  min-width: 0;                 /* required for ellipsis inside a flex row */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vgui-titlebar__actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 2px;
  letter-spacing: normal;       /* do not track buttons */
  text-transform: none;
}

.vgui-titlebar--subdued { color: var(--vgui-text-muted); }
.vgui-titlebar--clay    { color: var(--vgui-clay-glyph); }
```

Three details that are easy to get wrong:

1. **`letter-spacing` bleeds.** It inherits into any child, including buttons
   placed in `__actions`. Always reset it there.
2. **`min-width: 0` is mandatory** on `__text`. Without it a flex item refuses to
   shrink below its content width and the ellipsis never appears.
3. **`min-height`, not `height`.** At 200% zoom an 18px fixed height clips the
   text (WCAG 1.4.4).

## React API

```tsx
export interface TitleBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Caption text. Rendered uppercase regardless of the casing you pass. */
  children?: ReactNode
  /** Optional 16px leading glyph. */
  icon?: ReactNode
  /** Trailing controls, e.g. Window's minimize/maximize/close cluster. */
  actions?: ReactNode
  /** Render the grey property-sheet chrome instead of the green. */
  clay?: boolean
  /** Dim the caption; for a window that does not have focus. */
  subdued?: boolean
  /** Heading level for the caption, so it appears in the document outline. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** Accessible name for the trailing control group. */
  actionsLabel?: string
}
```

`level` renders `<h{level}>` for `__text` instead of a `<span>`. Default is
undefined (a span), because a caption inside a `Window` that already has
`aria-labelledby` should not also be a heading.

## Accessibility

- **A caption is not automatically a heading.** Only pass `level` when the
  titlebar genuinely introduces a section of the page outline. Marking every
  window title as an `<h2>` bloats the heading list and makes navigation worse.
- When `actions` is provided, the container should be
  `role="group"` with `aria-label={actionsLabel}` — otherwise the buttons are
  announced without context ("Close, button" out of nowhere).
- **Uppercase is presentational, not content.** Because `text-transform` is used
  rather than transforming the string, screen readers read the original casing
  and copy/paste gets the original too. Never uppercase the text in JavaScript.
- **`letter-spacing: 2px` is a legibility tax.** It is the single biggest reason
  the theme reads as "retro", but at 12px it measurably slows reading. Provide a
  `prefers-contrast: more` or density override that drops it to `0.5px`.
- **Do not dim the caption below AA.** `--vgui-text-muted` `#A0AA95` on
  `--vgui-surface` `#4C5844` is 3.0:1 — below the 4.5:1 small-text minimum. Use
  `--subdued` only for a caption whose text is repeated in an accessible name
  elsewhere, or keep the colour and dim the *border* instead.
- Emoji and long unbroken strings in the caption need `overflow-wrap` care; the
  ellipsis rule above handles normal text but a single 200-character word will
  still overflow without `overflow-wrap: anywhere`.

## Assets

None. Pure text and CSS. Valve used no titlebar sprite — the caption was drawn
with the scheme's font and the frame provided all the pixels.

## Examples

```tsx
// Standalone section header
<TitleBar level={3}>Player List</TitleBar>

// Property-sheet chrome
<TitleBar clay actions={<IconButton label="Close" icon="close" />}>
  Downloads
</TitleBar>

// Inside a custom surface
<div className="vgui-panel">
  <TitleBar icon={<SteamGlyph />}>Friends</TitleBar>
  …
</div>
```

## Open questions

- Valve's `steam.styles` binds the caption to `FrameTitle` and gives the frame a
  separate `FrameTitleFocused` treatment, but the exact focused/unfocused colour
  pair is only partially established from `steamscheme.res`. The `--subdued`
  variant here is an interpretation, not a transcription.
- `text-indent: 24px` in the CSS port is a fixed offset that assumes no icon.
  Using a flex row with `gap` is equivalent when there is an icon and different
  when there is not. Prefer the flex version and drop the indent.
