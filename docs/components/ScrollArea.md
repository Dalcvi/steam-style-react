# ScrollArea

## Purpose

An overflow container with the themed scrollbar attached. Every long list,
console, server browser and chat transcript in the client sits inside one. It
exists as a component rather than a `overflow: auto` one-liner because the VGUI
scrollbar is *not* the platform scrollbar: it is 18px wide, has visible arrow
buttons at both ends, a gutter that is lighter than the page, and a beveled
handle.

`ScrollArea` owns the layout and the edge shadows. The scrollbar itself is the
[`Scrollbar`](./Scrollbar.md) component; this file covers the container.

## VGUI original

`ScrollPanel` in both generations, with the scrollbar supplied by `ScrollBar`
(`ScrollBarSlider` is the gutter, `ScrollBarHandle` the thumb). From
`steam.styles`:

```
ScrollBarSlider        { bgcolor "LightGreenBG" ... }
ScrollBarHandle        { bgcolor "GreenBG" ; border <raised bevel> }
```

Note the inversion that surprises people: **the gutter is the *light* green**
(`#5A6A50`) and the handle is the *standard* surface green (`#4C5844`) with a
raised bevel. Most modern themes do the opposite.

## Anatomy

```
.vgui-scroll-area                       ← position: relative, contains the shadows
├── .vgui-scroll-area__viewport         ← the scrolling element
│   └── children
├── .vgui-scroll-area__shadow--top      ← optional 1px fade/shadow, appears on scroll
├── .vgui-scroll-area__shadow--bottom
└── (Scrollbar, rendered by the consumer or by this component)
```

The viewport is a plain `overflow: auto` element. The component's value is the
container query-free layout, the shadow affordances, and the decision of whether
to use the native or the custom scrollbar.

## Variants

| Variant | Class | Use |
| --- | --- | --- |
| Default | — | Native `::-webkit-scrollbar` styling, no arrow glyphs in Firefox |
| Inset | `--inset` | Recessed bevel — a list interior |
| Custom | `customScrollbar` prop | Renders the `<Scrollbar>` component; full fidelity everywhere |
| Horizontal | `--horizontal` | Only a horizontal scrollbar |
| Both | `--both` | Both axes |
| No shadows | `--no-shadows` | Disable the scroll affordance shadows |

## States

| State | Treatment |
| --- | --- |
| At top | No top shadow |
| Scrolled | Top shadow appears; bottom shadow disappears when the end is reached |
| Content shorter than container | Scrollbar hidden entirely — not disabled, *absent*, matching every VGUI list |
| Hovering the viewport | No change; only the scrollbar reacts |
| Focus-visible | `outline: 1px dotted #000; outline-offset: -3px` on the viewport **when the viewport is focusable** (`tabIndex={0}`) |

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-surface-dark` `#3E4637` | Viewport background for `--inset` |
| `--vgui-surface-light` `#5A6A50` | Native scrollbar gutter |
| `--vgui-surface` `#4C5844` | Native scrollbar thumb |
| `--vgui-bevel-light` `#899281` | Thumb and button raised top/left |
| `--vgui-bevel-dark` `#292D23` | Thumb and button raised bottom/right |
| `--vgui-bevel-dark` `#292D23` | Scroll shadows |

## CSS recipe

```css
.vgui-scroll-area {
  position: relative;
  min-height: 0;
  min-width: 0;
}

.vgui-scroll-area__viewport {
  overflow: auto;
  max-height: 100%;
  scrollbar-color: var(--vgui-surface) var(--vgui-surface-light);  /* Firefox */
  scrollbar-width: auto;
}

.vgui-scroll-area--inset .vgui-scroll-area__viewport {
  background-color: var(--vgui-surface-dark);
  border-top: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-light);
  border-right: 1px solid var(--vgui-bevel-light);
}

/* WebKit/Blink: the full 18px scrollbar with arrow buttons. */
.vgui-scroll-area__viewport::-webkit-scrollbar,
.vgui-scroll-area__viewport::-webkit-scrollbar-corner {
  width: 18px;
  height: 18px;
  background-color: var(--vgui-surface-light);
}

.vgui-scroll-area__viewport::-webkit-scrollbar-thumb {
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
}

.vgui-scroll-area__viewport::-webkit-scrollbar-button {
  width: 18px;
  height: 18px;
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
}

.vgui-scroll-area__viewport::-webkit-scrollbar-button:active {
  border-top-color: var(--vgui-bevel-dark);
  border-left-color: var(--vgui-bevel-dark);
  border-bottom-color: var(--vgui-bevel-light);
  border-right-color: var(--vgui-bevel-light);
}

.vgui-scroll-area__viewport::-webkit-scrollbar-button:vertical:decrement {
  background-image: url("data:image/svg+xml,…"); /* up arrow */
}
.vgui-scroll-area__viewport::-webkit-scrollbar-button:vertical:increment {
  background-image: url("data:image/svg+xml,…"); /* down arrow */
}
```

The native path is one-way: **there is no Firefox equivalent for scrollbar
buttons.** `scrollbar-color` recolours the track and thumb and nothing else.
That is the entire reason the `customScrollbar` prop exists.

## React API

```tsx
export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  /** Recess the viewport to the VGUI list-interior look. */
  inset?: boolean
  /** Which axes may scroll. */
  axis?: 'vertical' | 'horizontal' | 'both'
  /** Render the custom `Scrollbar` instead of the platform one. */
  customScrollbar?: boolean
  /** Maximum height of the viewport; omit to fill the parent. */
  maxHeight?: number | string
  /** Show the fade affordances at the scrollable edges. */
  shadows?: boolean
  /** Make the viewport focusable so keyboard users can scroll it. */
  focusable?: boolean
  /** Called with the scroll offset; throttle at the call site if needed. */
  onScrollPositionChange?: (top: number, left: number) => void
}
```

`axis` maps to `overflow-y`/`overflow-x` rather than the `overflow` shorthand,
because `overflow: hidden auto` and `overflow: auto` behave identically in
practice but the intent is clearer split out.

## Accessibility

- **A scrollable region must be reachable by keyboard.** If the viewport contains
  no focusable children, add `tabIndex={0}` plus `role="region"` and an
  `aria-label`, because a `overflow: auto` box is otherwise unscrollable without
  a mouse (WCAG 2.1.1). This is the `focusable` prop; default it to `true` when
  the consumer passes no children that can take focus.
- **Never `outline: none` on a focused viewport.** Replace the ring, don't
  remove it.
- The 18px scrollbar is well above the 24×24 target minimum on one axis; fine.
- **Keyboard scrolling already works** on a focused overflow container: arrows,
  `Page Up`/`Page Down`, `Home`/`End`, `Space`. Do not reimplement it.
- `scroll-behavior: smooth` must sit inside
  `@media (prefers-reduced-motion: no-preference)`. Vestibular disorders make
  smooth scrolling genuinely nauseating.
- **Sticky headers count as focus targets.** If a header is `position: sticky`,
  ensure the tab order after a programmatic scroll does not put focus under it.
  Scroll the header's height into account with `scroll-padding-top`.
- The scroll shadows are decorative and must not be the only cue that content
  continues. They fade out, so a keyboard user at the bottom gets no signal from
  them; the scrollbar position is the real affordance.

## Assets

| Valve sprite | Replacement |
| --- | --- |
| `scroll_up` | Inline SVG up chevron, `fill='%23d8ded3'` |
| `scroll_down` | Inline SVG down chevron |
| `scroll_left` / `scroll_right` | Same for the horizontal axis |
| `minithrobberinactive` | Not applicable here (see `Spinner`) |

The arrows are 7×4 pixel triangles. A `clip-path: polygon(50% 0, 100% 100%, 0
100%)` on a `::before` is a one-line alternative that needs no data URI — but it
cannot be coloured independently of the pseudo-element's `background`, which is
fine here.

## Examples

```tsx
<Panel heading="Server List" style={{ display: 'flex', flexDirection: 'column', height: 400 }}>
  <ScrollArea inset axis="vertical" focusable>
    <Table columns={serverColumns} rows={servers} />
  </ScrollArea>
</Panel>

<ScrollArea axis="both" customScrollbar maxHeight={240}>
  <pre>{longLog}</pre>
</ScrollArea>
```

## Open questions

- The **Firefox fidelity gap** is structural, not a bug. Either accept a
  scrollbar without arrow buttons there, or always use `customScrollbar`. Which
  is the better default for this library is a product decision that has not been
  made.
- Valve's `ScrollPanel` also supported `ScrollBar` "auto-hide" behaviour, where
  the scrollbar faded in on scroll. `steam.styles` does not describe it, so it is
  not specified here.
- `overflow: overlay` would let the scrollbar float over content the way the
  real client's does, but it is deprecated and unimplemented in Firefox.
