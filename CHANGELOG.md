# @dalcvil/steam-green-react

## 1.1.0

### Minor Changes

- [#6](https://github.com/Dalcvi/steam-style-react/pull/6) [`5714984`](https://github.com/Dalcvi/steam-style-react/commit/57149843b7578d1f6de6afab2a7bd9a29fba5791) Thanks [@Dalcvi](https://github.com/Dalcvi)! - Seat the tabs on a shelf and drop the gap between them
  
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

## 1.0.0

### Major Changes

- [#3](https://github.com/Dalcvi/steam-style-react/pull/3) [`f11bf29`](https://github.com/Dalcvi/steam-style-react/commit/f11bf2997fdecd47353fdaa2d7515daa841ae105) Thanks [@Dalcvi](https://github.com/Dalcvi)! - Rename the theme-prefixed components to plain names
  
  `GreenButton` is now `Button` and `GreenPanel` is now `Panel`, and the
  `greensteam-` CSS class prefix is now `vgui-`. The theme belongs in the design
  tokens, not in a component's name — this is a general-purpose UI library with
  one theme, not a theme with components bolted on.
  
  Update code that used the old names:
  
  ```diff
  -import { GreenButton } from '@dalcvil/steam-green-react'
  +import { Button } from '@dalcvil/steam-green-react'
  
  -<GreenButton primary>Join game</GreenButton>
  +<Button primary>Join game</Button>
  ```
  
  ```diff
  -import { GreenPanel } from '@dalcvil/steam-green-react'
  +import { Panel } from '@dalcvil/steam-green-react'
  
  -<GreenPanel heading="Server settings">…</GreenPanel>
  +<Panel heading="Server settings">…</Panel>
  ```
  
  Any custom CSS that targeted `.greensteam-button` or `.greensteam-panel` must be
  repointed at `.vgui-button` / `.vgui-panel`. Modifiers are unchanged apart from
  the prefix (`greensteam-button--primary` → `vgui-button--primary`).
  
  The global theme gains a token layer. Every colour, metric and font now lives as
  a `--vgui-*` custom property on `[data-vgui-theme]` rather than on `:root`, so a
  component dropped into an unthemed page still renders. Theme variants ship as
  `data-vgui-theme="green"` (the default), `"vgui1"`, `"black"`, `"warm"` and
  `"clay"`. Importing `styles/theme.css` is still the way to opt in, and
  `styles/tokens.css` is now exported on its own for consumers who only want the
  variables.

- [#5](https://github.com/Dalcvi/steam-style-react/pull/5) [`09620db`](https://github.com/Dalcvi/steam-style-react/commit/09620db7a3e03b8626d2f5dde59a520e9a063a70) Thanks [@Dalcvi](https://github.com/Dalcvi)! - Make the drawn VGUI scrollbar the default everywhere
  
  The button/gutter/thumb tree that VGUI painted by hand was opt-in as
  `variant="custom"`, which had it backwards: the platform scrollbar cannot be made
  to look like the original at all. Firefox has no `::-webkit-scrollbar-button`, so
  it loses the bevel and the arrows outright, and neither engine can be given the
  18px metric through `scrollbar-width` (`auto | thin | none` only). The drawn bar
  is now the default in every component that scrolls.
  
  ```diff
  -<Scrollbar variant="custom" thickness={19}>
  +<Scrollbar>
     {log}
   </Scrollbar>
  ```
  
  The variant value is renamed to match what it does:
  
  ```diff
  -<Scrollbar variant="custom" />
  +<Scrollbar variant="drawn" />
  
  -<ScrollArea customScrollbar>
  +<ScrollArea variant="drawn" />   {/* the default; can be omitted */}
  ```
  
  `ScrollArea`'s `customScrollbar` boolean is replaced by `variant`, and
  `variant="native"` is the documented fallback for a pane where per-instance DOM
  cost matters more than the arrows. The custom class modifier is now
  `vgui-scroll-region--drawn` / `vgui-scroll-area--drawn`.
  
  Every self-scrolling component — `Table`, `Dialog`, `Console`, `List`, `Select`,
  `Splitter`, `Textarea`, `TreeView` — now shares one platform-bar skin,
  `.vgui-scroll-surface`, which now ships as `styles/scrollbars.css` so a
  self-scrolling element outside the library can opt into the same look. The bar's
  metrics moved into the shared token layer, so restyling every bar on a page is
  one override: `--vgui-scrollbar-size`, `--vgui-scrollbar-button-size`,
  `--vgui-scrollbar-gutter`, `--vgui-scrollbar-thumb`, `--vgui-scrollbar-corner`
  and the glyph's `--vgui-scrollbar-glyph-*` triple. `--vgui-scrollbar-width`,
  which no file ever declared, is gone.
  
  Because the drawn region hides its own overflow and lets the inner box scroll,
  `Scrollbar` now maps the scroll keys (`ArrowUp`/`ArrowDown` or
  `ArrowLeft`/`ArrowRight`, `PageUp`/`PageDown`, `Space`, `Home`/`End`) onto that
  inner box in the drawn path. The native path is untouched and still lets the
  browser handle its own keys.

### Minor Changes

- [#3](https://github.com/Dalcvi/steam-style-react/pull/3) [`f11bf29`](https://github.com/Dalcvi/steam-style-react/commit/f11bf2997fdecd47353fdaa2d7515daa841ae105) Thanks [@Dalcvi](https://github.com/Dalcvi)! - Add the classic VGUI component set
  
  Thirty-eight new components, all built from the design specifications in
  `docs/components/`, cover the rest of the classic Green Steam look:
  
  - **Containers and chrome** — `Window`, `TitleBar`, `GroupBox`, `Divider`,
    `Splitter`, `ScrollArea`, `Tooltip`, `Notification`, `Dialog`.
  - **Form controls** — `IconButton`, `ToggleButton`, `Checkbox`, `Radio` with
    `RadioGroup`, `FieldLabel`, `TextInput`, `Textarea`, `Select`, `Slider`,
    `ProgressBar`, `SpinBox`, `ColorPicker`.
  - **Navigation** — `Link`, `Tabs`, `Menu`, `MenuBar`, `NavBar`, `Toolbar`.
  - **Data display** — `List`, `Table`, `TreeView`, `Scrollbar`, `StatusBar`,
    `StatusLabel`, `Console`, `Spinner`, `LevelMeter`, `Avatar`, `RichText`.
  
  Every component ships its own stylesheet beside it, reads only `--vgui-*`
  tokens, and exports its props type from the package root. Each one is
  accompanied by unit tests (including an axe accessibility assertion) and
  Storybook stories, and all of them are documented in `docs/components/`.
  
  Accessibility notes worth knowing:
  
  - The accessible focus ring is the default. Valve's own 1px dashed rings sit at
    1.87:1 against these surfaces, so they are opt-in through `.vgui-crisp`.
  - Controls that VGUI draws at 18px grow an invisible 24px hit area to meet
    WCAG 2.5.8.
  - Font smoothing stays enabled and `image-rendering: pixelated` is confined to
    `.vgui-crisp`, because both override the user's own rendering preferences.
  
  ### Glyphs are drawn, not fetched
  
  No image files ship with the package, so every component that needs a glyph
  draws it from CSS or an inline `data:` URI rather than referencing a sprite.
  `Toolbar` exposes its stand-ins through `--vgui-toolbar-<glyph>` variables, so a
  consumer who holds their own licence for the artwork can drop it in without
  touching the component API. `docs/assets.md` carries the full inventory of what
  the original client used and what each component draws instead.
  
  Two smaller corrections from the same pass: `StatusLabel` gains a `disabled`
  prop (mapping to `aria-disabled` plus a dimmed colour), and `FieldLabel`'s
  default colour is now the body text token rather than the muted one.

## 0.2.0

### Minor Changes

- [#1](https://github.com/Dalcvi/steam-style-react/pull/1) [`0fc51a9`](https://github.com/Dalcvi/steam-style-react/commit/0fc51a9183e5e941733163e16d0eba1fe0bd1818) Thanks [@Dalcvi](https://github.com/Dalcvi)! - Add `GreenPanel`, a VGUI-style container with an optional uppercase title bar plus `inset` and `rounded` variants, ported from the upstream `.window` / `.box` rules.
