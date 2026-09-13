# @dalcvil/steam-green-react

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
