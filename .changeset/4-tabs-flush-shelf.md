---
'@dalcvil/steam-green-react': minor
---

Seat the tabs on a shelf and drop the gap between them

`Tabs` drew a 3px gap between tabs, which left the selected tab hanging in the
air above the page instead of sitting on it. The gap is now `0` by default —
the tabs' own `BorderBright`/`BorderDark` bevels are the separation, so a gap was
doubling up on a boundary that was already drawn. `steam.styles` still says
`PropertySheet.TabGap "3"`, so the value survives as a token:
`--vgui-tabs-gap` restores it.

The strip now stands on a base, `vgui-tabs__box`: a `--vgui-tabs-box` (6px) band
that is a sibling of the tablist rather than a flex item inside it, so it spans
the whole sheet while a short strip of tabs can end halfway across. It is filled
with the same `--vgui-surface` as the tabs, because `PageTab` fills its own lower
edge with `GreenBG` — the rail the selected tab erases and the shelf it lands on
are meant to read as one surface.

The selected tab also grows 2px, upward, so selection is legible without relying
on colour (WCAG 1.4.1):

```css
min-height: calc(24px + var(--vgui-tabs-grow, 2px) + var(--vgui-tabs-overlap, 1px));
padding-top: calc(var(--vgui-tabs-padding-y, 2px) + var(--vgui-tabs-grow, 2px));
padding-bottom: calc(var(--vgui-tabs-padding-y, 2px) + var(--vgui-tabs-overlap, 1px));
margin-bottom: calc(-1 * var(--vgui-tabs-overlap, 1px));
```

The growth is deliberately only at the top: `align-items: flex-end` pins the
bottom edge, and the bottom padding is grown by exactly the amount the negative
margin takes back out, so the content box — and therefore the label — stays on the
same pixel when selection moves. Verified in a real engine (jsdom computes no
layout): the selected tab's top moves up just over 2px while the label's top does
not move at all. The strip's own height does not change either, so clicking
between tabs cannot make the layout jump.

This release also fixes a bug in the tab box model. A plain tab is a `<button>`
and a closable one is a `<div>`, and the UA stylesheet only box-sizes the button
as `border-box`, so a closable tab used to lay out its padding differently and end
up 4px taller than its siblings. The four new tokens — `--vgui-tabs-gap`,
`--vgui-tabs-box`, `--vgui-tabs-grow`, `--vgui-tabs-padding-y` — all follow the
library's rule of being read as `var(<token>, <literal>)`, so an unthemed `Tabs`
still renders correctly.
