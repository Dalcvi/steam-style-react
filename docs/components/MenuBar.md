# MenuBar

## Purpose

The horizontal strip of top-level words at the top of a window — **File · Edit ·
View · Help** — each of which opens a `Menu`. It is the strip *only*: the
dropdowns are `Menu`, and the client's big nav is `NavBar`.

## VGUI original

`MenuBar` / `MenuBar::MenuButton` in VGUI2 (`MenuBar.cpp`). The style is
remarkably sparse — `steam.styles:1672` and `:1674` are literally:

```
MenuBar {}
"Page MenuBar" {}
```

Both are **empty blocks**. There is no background, no border, no height: the bar
is invisible chrome and everything about its appearance comes from its
`MenuButton` children (`steam.styles:1675–1696`):

```
"MenuBar MenuButton"
{
    font-family = basefont
    font-size = 14
    font-size = 16 [$OSX]
    textcolor = TitleDimText
    padding-right = -2
    inset = "1 0 1 0"
}
    "MenuBar MenuButton:frameFocus"          { textcolor = White }
    "MenuBar MenuButton:frameFocus:hover"    { textcolor = White }
    "MenuBar MenuButton:frameFocus:selected" { textcolor = Over  }
```

### Four things to extract

1. **An empty `MenuBar` is the correct starting point, not a shortcut.** Because
   both `MenuBar` blocks are empty, there is nothing to reproduce: the strip must
   have `background: none; border: 0`. A recreation that gives the menu bar a
   `#4C5844` background and a bevel is inventing chrome Valve never drew — the
   bar sits directly on the window body (`Page`).
2. **The resting text is *dim*, not white — in the corpus.** `TitleDimText =
   136 145 128` → `#889180`, the same token that colours an unfocused window
   title. Menu-bar words only reach `White` when the **frame has focus**, and only
   reach maize `Over` `#C4B550` when the frame has focus *and* the item is open.
   That is a three-level state ladder (dim → white → maize) driven as much by
   *window* focus as by the item, and it is the detail a recreation is most likely
   to flatten into "white, maize on hover". **This library drops the dim level**,
   because `#889180` on `GreenBG` is 2.31:1 — see *Accessibility*. The shipped
   ladder is white → maize plus the open fill.
3. **`frameFocus` is a window-level state selector, not `:focus`.** In VGUI every
   control in an unfocused `Frame` dims together. On the web the nearest
   equivalent is `:focus-within` on the window. **Not implemented**, because the
   dim level it would restore is the inaccessible one. Getting it wrong otherwise
   makes every menu bar on the page light up at once.
4. **`padding-right = -2` is a real negative padding.** It tightens the gap
   between adjacent words so the strip reads as a continuous run rather than four
   separated buttons. There is no CSS equivalent; reproduce it by *reducing* the
   horizontal padding and accepting the overlap, rather than by adding a negative
   margin (which would also pull the hit area, and hit areas must not shrink).

## Anatomy

```html
<div class="vgui-menubar" role="menubar">
  <button class="vgui-menubar__item" role="menuitem" type="button"
          aria-haspopup="menu" aria-expanded="false" id="mb-file">File</button>
  <button class="vgui-menubar__item" role="menuitem" type="button"
          aria-haspopup="menu" aria-expanded="false">Edit</button>
  <button class="vgui-menubar__item" role="menuitem" type="button"
          aria-haspopup="menu" aria-expanded="false">View</button>
</div>
```

## States

| State | Text | Background |
| --- | --- | --- |
| Idle | `#FFFFFF` — `--vgui-text-strong`, not the corpus `TitleDimText` (see *Tokens*) | transparent |
| Focused, hover | `#FFFFFF` | transparent — *the original never fills* |
| Focused, item open | `#C4B550` (`Over`) | transparent in `steam.styles`; `#5A6A50` in the CSS port |
| Keyboard focus-visible | `#FFFFFF` | transparent + focus ring |
| Disabled | `#75806F` | transparent |

`steam.styles` gives the open item **no background at all** — the maize text is
the only cue. That is technically legible (`#C4B550` on `#4C5844` is 3.61:1,
which passes WCAG 1.4.11's 3:1 for a state indicator) but it is thin, so this
library adds the `--vgui-surface-light` fill used by the CSS port and by every
plausible VGUI screenshot.

## Tokens

| Token | Value | Where |
| --- | --- | --- |
| `--vgui-text-strong` | `#FFFFFF` | Resting word, focused window, and hover — see the departures below |
| `--vgui-heading` | `#C4B550` | Open item (`Over`) |
| `--vgui-surface-light` | `#5A6A50` | Open/hover fill (added, see *States*) |
| `--vgui-text-hover` | `#E3E41F` | CSS-port nav hover — **not** used here, see `NavBar` |
| `--vgui-text-disabled` | `#75806F` | Disabled word |
| `--vgui-menubar-height` | `24px` | Corpus-derived, see *Open questions* |

> **The corpus resting colour is not used, and the collision it caused is moot.**
> `steam.styles` rests a menu-bar word on `TitleDimText` `#889180`, which on a
> `GreenBG` surface is **2.31:1** — far below the 4.5:1 WCAG 1.4.3 asks for. The
> accessibility section below makes the resting word `--vgui-text-strong`
> (`#FFFFFF`, **7.54:1**), so `#889180` is **not** promoted to a token at all and
> `--vgui-text-dim` keeps its single meaning, `#758666` (`DimListText`) for
> de-emphasised *list* text. An earlier draft of this doc proposed minting
> `--vgui-text-dim-chrome: #889180` to avoid the collision; with the dimension
> dropped, no second token is needed.

## CSS recipe

```css
.vgui-menubar {
  /* MenuBar {} in steam.styles is an empty block: no fill, no border. */
  display: flex;
  align-items: stretch;
  gap: 0;
  background: none;
  border: 0;
}

.vgui-menubar__item {
  /* padding-right = -2 in VGUI. There is no CSS equivalent, so use a tight
     symmetric padding and let the words sit close together. */
  padding: 2px 4px 2px 2px;
  border: 0;
  background: transparent;
  color: var(--vgui-text-strong);     /* NOT TitleDimText — 2.31:1, see Tokens */
  font: inherit;
  font-size: 14px;
  line-height: var(--vgui-menubar-height, 24px);
  cursor: default;
}

/* "Focused, hover" is white on transparent — the original never fills — so hover
   only has to hold the resting colour. */
.vgui-menubar__item:hover {
  color: var(--vgui-text-strong);
}

.vgui-menubar__item[aria-expanded='true'] {
  color: var(--vgui-heading);
  background-color: var(--vgui-surface-light);
}

.vgui-menubar__item:focus-visible {
  outline: 1px dotted #292d23;
  outline-offset: -3px;
}

.vgui-menubar__item:disabled {
  color: var(--vgui-text-disabled);
  text-shadow: 1px 1px 0 var(--vgui-text-disabled-shadow);
}
```

**`line-height: 24px` on the item is load-bearing.** The hit area must be the
full height of the strip, not the height of the glyphs. `steam.styles` sets
`inset = "1 0 1 0"` (left 1, right 1, no vertical inset), which only means
anything if the item already fills the bar vertically.

## React API

```tsx
export interface MenuBarItemSpec {
  /** Stable identity and React key. */
  id: string
  /** The visible word, e.g. "File". */
  label: string
  /** Access key, announced and bound to Alt+<key>. */
  accessKey?: string
  /** Menu contents; see Menu's MenuItemSpec[]. */
  items: MenuItemSpec[]
  /** Renders a disabled, unopenable word. */
  disabled?: boolean
}

export interface MenuBarProps {
  /** Top-level words, in order. */
  items: MenuBarItemSpec[]
  /** Layout direction. Menu bars are horizontal; vertical exists for side panes. */
  orientation?: 'horizontal' | 'vertical'
  /** Called with the open item's id, or undefined when everything closed. */
  onOpenChange?: (openId: string | undefined) => void
}
```

## Accessibility

- **`role="menubar"` with `role="menuitem"` children.** As with `Menu`, this is a
  composite widget and therefore **one tab stop**, not four: roving tabindex,
  `Left`/`Right` to move between words, `Down` to open, `Escape` to close.
- **Do not use `role="menubar"` for site navigation.** A menubar is an
  application menu. If the strip is a nav, it is a `<nav>` with a list of links —
  see `NavBar`. Using `menubar` on navigation is one of the most common ARIA
  misuses and it makes the links unreachable by the expected key sequences.
- **No mouse-only behaviour.** VGUI menu bars open on click *and* stay open while
  the pointer slides across siblings ("menu switching"). Reproduce that for
  pointer users, but the keyboard path must not depend on it.
- **The dim resting colour is the accessibility problem, and it is the reason the
  corpus value is not used.** `#889180` on `--vgui-surface` `#4C5844` is
  **2.31:1** — below the 4.5:1 needed for 14px text, and below even 3:1. In the
  original this is *intentional*: an unfocused window's menu bar is dimmed to say
  "this window is not active". The web equivalent is worse, because a browser
  window can hold many panes and only one has focus — so a user reading a form's
  menu bar with focus elsewhere gets unreadable words. **Shipped:** the resting
  word is `--vgui-text-strong` (**7.54:1**) and the ladder is white → maize, with
  the open fill as the third cue. The dim level is dropped entirely rather than
  gated on application focus, because `document.hasFocus()` is unreliable and the
  state is invisible to assistive tech either way.
- **Access keys are a period feature with modern hazards.** `Alt+F` collides
  with the browser's own menus. Announce `accessKey` but treat the binding as
  best-effort and never as the only way to reach a menu.
- **The strip needs a visible boundary when it floats over content.** Since
  `MenuBar` has no background, place it inside a `Panel`/`Window`; over a busy
  background even the strong white loses its edge.

## Assets

None. `MenuBar` and `"Page MenuBar"` are empty style blocks and reference no
`.tga`. Its only child needing an asset is the `Menu` it opens, and that needs
none either.

## Examples

```tsx
<Window title="Server Browser">
  <MenuBar
    items={[
      { id: 'file', label: 'File', accessKey: 'f', items: [
        { id: 'refresh', label: 'Refresh' },
        { id: 'sep', type: 'separator' },
        { id: 'quit', label: 'Quit' },
      ] },
      { id: 'view', label: 'View', accessKey: 'v', items: [
        { id: 'favourites', label: 'Favourites', checked: true },
        { id: 'history', label: 'History', checked: false },
      ] },
    ]}
  />
</Window>
```

## Open questions

- **The bar's height is not in `steam.styles`.** `inset = "1 0 1 0"` and
  `font-size = 14` are the only vertical facts. `24px` is inferred from the
  account-menu buttons in `accountbutton.layout` (`height=24`) and is plausible
  for a 14px font, but it is a derived metric. **A screenshot measurement would
  settle it.**
- **`padding-right = -2` may be a typo in the stylesheet.** VGUI's
  `Label::SetContentAlignment`/padding handling does accept negatives, and the
  same file uses `padding-right = 3` and `padding-right = 16` elsewhere, so a
  deliberate `-2` is credible — but it might have been meant as `2`. It only
  shifts words 2px, so either reading is acceptable visually; noted for honesty.
- **Whether `MenuBar` and `MainNav` share code.** Their style blocks share
  nothing (14px dim vs 21px bold uppercase maize) but the *behaviour* — a strip
  of top-level words with hover-open dropdowns — is identical. Whether the
  library should ship one component with two skins or two components is a
  packaging question this doc does not settle. The inventory currently lists them
  separately; see `NavBar`.
- **Where the access-key underline was drawn.** VGUI underlined the access-key
  letter in some controls. No `render` program in `MenuBar`/`MenuButton` draws
  one, so either it was drawn by the control in C++ or it was absent. Unverified.
