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
container query-free layout, the shadow affordances, and the choice between the
two ways to paint the bar (`variant`): the drawn `Scrollbar` tree, which is the
default, or the platform's own bar wearing the Green Steam skin, which is the
fallback for when the extra markup is unwanted.

## Variants

| Variant | Class | Use |
| --- | --- | --- |
| Drawn (default) | `--drawn` | Renders the `<Scrollbar>` tree: identical in every engine, arrow glyphs included |
| Native | `--native` | Skins the platform bar via `.vgui-scroll-surface`; Firefox loses the bevel and the arrows |
| Inset | `--inset` | Recessed bevel — a list interior |
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
| `--vgui-scrollbar-gutter` `#5A6A50` | Scrollbar gutter (the *light* green) |
| `--vgui-scrollbar-thumb` `#4C5844` | Scrollbar thumb and arrow buttons |
| `--vgui-scrollbar-size` `18px` | Bar thickness on both axes |
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
}

/* The native path: the shared skin from `styles/scrollbars.css`, applied by
   putting `.vgui-scroll-surface` on the viewport. */
.vgui-scroll-surface {
  scrollbar-color: var(--vgui-scrollbar-thumb) var(--vgui-scrollbar-gutter);  /* Firefox */
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
.vgui-scroll-surface::-webkit-scrollbar,
.vgui-scroll-surface::-webkit-scrollbar-corner {
  width: 18px;
  height: 18px;
  background-color: var(--vgui-surface-light);
}

.vgui-scroll-surface::-webkit-scrollbar-thumb {
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
}

.vgui-scroll-surface::-webkit-scrollbar-button {
  width: 18px;
  height: 18px;
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
}

.vgui-scroll-surface::-webkit-scrollbar-button:active {
  border-top-color: var(--vgui-bevel-dark);
  border-left-color: var(--vgui-bevel-dark);
  border-bottom-color: var(--vgui-bevel-light);
  border-right-color: var(--vgui-bevel-light);
}

.vgui-scroll-surface::-webkit-scrollbar-button:vertical:decrement {
  background-image: url("data:image/svg+xml,…"); /* up arrow */
}
.vgui-scroll-surface::-webkit-scrollbar-button:vertical:increment {
  background-image: url("data:image/svg+xml,…"); /* down arrow */
}
```

The platform path is one-way: **there is no Firefox equivalent for scrollbar
buttons.** `scrollbar-color` recolours the track and the thumb and stops there,
so the bevel and the arrows are lost in Firefox and only there. That gap is why
the drawn tree is the default and the platform bar the fallback, rather than the
other way round. It is also why the glyph above is four stacked gradient layers:
a scrollbar button has no `::before` for a `clip-path` triangle.

## React API

```tsx
export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  /** Recess the viewport to the VGUI list-interior look. */
  inset?: boolean
  /** Which axes may scroll. */
  axis?: 'vertical' | 'horizontal' | 'both'
  /**
   * Which scrollbar to paint. `"drawn"` renders the 18px Green Steam bar, which
   * looks the same in every browser; `"native"` drops the extra markup and skins
   * the platform's own bar instead. Defaults to `"drawn"`.
   */
  variant?: 'drawn' | 'native'
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
- **Keyboard scrolling already works** on a focused `overflow: auto` container:
  arrows, `Page Up`/`Page Down`, `Home`/`End`, `Space`. That is the `--native`
  path, and it needs no help. The drawn path is different: its region hides its
  own overflow and the inner box scrolls, so there is no scroll container for
  the engine to move and `Scrollbar` maps those keys onto the scroller itself.
  Keyboard users must still be able to reach every position the thumb can.
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

<ScrollArea axis="both" maxHeight={240}>
  <pre>{longLog}</pre>
</ScrollArea>

<ScrollArea axis="both" variant="native" maxHeight={240}>
  <pre>{longLog}</pre>
</ScrollArea>
```

## Open questions

- Valve's `ScrollPanel` also supported `ScrollBar` "auto-hide" behaviour, where
  the scrollbar faded in on scroll. `steam.styles` does not describe it, so it is
  not specified here.
- `overflow: overlay` would let the scrollbar float over content the way the
  real client's does, but it is deprecated and unimplemented in Firefox.
