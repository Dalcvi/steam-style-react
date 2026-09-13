# NavBar

## Purpose

The client's primary application-level navigation: a strip of large, uppercase,
bold labels across the top of the window, each opening a flat-outlined dropdown
menu. This is the "STORE / LIBRARY / COMMUNITY / **username**" row.

It is not a menu bar. It is the frame's own navigation, and it is the largest
type in the entire theme.

## VGUI original

Two blocks do the work, and they are far apart in the file.

**The strip** (`steam.styles:1646–1654`), in full:

```
MainNav
{
    textcolor = White
    selectedtextcolor = Text
    bgcolor = none
    font-family = basefont
    font-size = 21
    font-weight = 700
    font-style = uppercase
}
```

That is the complete definition. **There is no `MainNav:hover`, no
`MainNav:selected`, no `MainNav` bevel and no `bgcolor`** — the strip is
transparent and the labels sit directly on whatever the frame painted beneath.

**The dropdown** (`steam.styles:3135–3170`), which is a menu rather than a nav
element:

```
SuperNavMenu
{
    bgcolor = DarkGreenBG
    inset = "1 0 1 1"
    render_bg
    {
        1="fill( x0, y0, x1, y0 + 1, LightGreenBG )"   // top
        2="fill( x0, y1 - 1, x1, y1, LightGreenBG )"   // bottom
        3="fill( x0, y0, x0 + 1, y1, LightGreenBG )"   // left
        4="fill( x1 - 1, y0, x1, y1, LightGreenBG )"   // right
    }
}

SuperNavMenuItem
{
    font-family = basefont
    font-size = 14
    font-size = 16 [$OSX]
    textcolor = White
}
    SuperNavMenuItem:selected
    {
    }
    SuperNavMenuItem:hover
    {
        bgcolor = MaizeBG
    }

SuperNavMenuDivider
{
    render_bg
    {
        1="fill( x0 , y0 + 1, x1, y1 - 1, SuperDivider )"  // line
    }
}
```

**The `:selected` block is empty.** Not absent — present and containing nothing.
See point 3.

Colour values: `White` `#FFFFFF` (`steamscheme.res:13`), `Text` `#A0AA95`
(`steam.styles:57`), `DarkGreenBG` `#3E4637` (`steamscheme.res:48`),
`LightGreenBG` `#5A6A50` (`steamscheme.res:47`), `MaizeBG` `#91863C`
(`steamscheme.res:44`), `SuperDivider` `#424850` (`steam.styles:129`).

**The CSS port** (`F:\steam-style\vgui.css\styles\greensteam\greensteam.css:1–56`)
supplies the concrete metrics `steam.styles` omits: `line-height: 21px`, the
dropdown at `top: 23px`, `min-width: 150px`, and — importantly — the port's
dropdown **removes** the seam with `border-top: none` while the original paints
over it. See point 4.

### Four things to extract

1. **The selected nav item is *dimmer* than the others.** `textcolor = White`,
   `selectedtextcolor = Text` `#A0AA95`. So the four inactive labels are bright
   white and the one you are currently on is a muted green-grey. Every
   conventional UI does the opposite. It is consistent with the rest of the theme
   — selection in `List`, `Table` and `TreeView` also darkens rather than
   brightens (see `List.md`, point 1) — and it reads as "this one is the surface
   you are already standing on, so it recedes". Both directions are legible:
   White on `DarkGreenBG` is **9.92:1** and `#A0AA95` on it is **4.06:1**.
2. **21px, weight 700, uppercase — the only 21px text and the heaviest weight in
   the corpus.** Everything else is 14px weight 400. This is a deliberate
   statement that application-level navigation outranks everything: the nav is
   **one and a half times** the size of body text. It also makes the labels
   WCAG "large text", which is why the 4.06:1 selected colour is acceptable
   (AA-large needs 3:1) even though the same ratio would fail for a 14px label.
   Shrinking this to a modern 14px nav would remove the contrast headroom *and*
   the look.
3. **Three separate navigation systems exist, and only one of them is a bar.**
   `MainNav` (`:1646`) is the big uppercase strip. `MenuBar` / `"MenuBar
   MenuButton"` (`:1672–1697`) is the classic in-window File/View menu strip.
   `SuperNavMenu` (`:3135`) is the dropdown that hangs off `MainNav`. **A
   dropdown is a menu, whether it belongs to a nav bar or a menu bar** — so
   `NavBar` should be a thin composition over `Menu` and a new strip, not a
   reimplementation. The internal dropdown here shares its flat outline, its
   `MaizeBG` hover and its divider with `Menu.md`; only the menu *button* differs
   (`MainNav` has no `:frameFocus` ladder, whereas `MenuBar MenuButton` rests at
   `TitleDimText` and brightens to `White` on `:frameFocus`).
4. **The dropdown's `:selected` state is an empty block, so an open menu is
   invisible.** `SuperNavMenuItem:selected {}` contains nothing while
   `:hover { bgcolor = MaizeBG }` does. The consequence is stark: a mouse user
   gets a maize highlight as they move down the menu, and a keyboard user — or a
   *touch* user, or anyone whose menu is open with the pointer elsewhere — gets
   **no indication of which item is active at all**. This is the clearest
   accessibility gap in the navigation group and it must be fixed rather than
   reproduced.

## Variants

| Variant | Class | Notes |
| --- | --- | --- |
| Default | `vgui-navbar` | 21px uppercase strip |
| With dropdown | — | `vgui-navbar__item` opens a `Menu` |
| Active item | `--active` | `selectedtextcolor = Text`, i.e. dimmer |
| Focused window | *inherited* | `MainNav` has no `:frameFocus`; the port's `nav a` hover does |
| Divider | `vgui-navbar__divider` | `SuperNavMenuDivider` |

## Anatomy

```html
<nav class="vgui-navbar" aria-label="Main">
  <ul class="vgui-navbar__list">
    <li class="vgui-navbar__item vgui-navbar__item--active">
      <button class="vgui-navbar__button" type="button"
              aria-expanded="false" aria-controls="navbar-store">Store</button>
      <div class="vgui-navbar__dropdown vgui-menu" id="navbar-store" role="menu"
           aria-labelledby="…" hidden>
        <div class="vgui-menu__item" role="menuitem" tabindex="-1">Browse</div>
        <div class="vgui-navbar__divider" role="separator"></div>
        <div class="vgui-menu__item" role="menuitem" tabindex="-1">Wishlist</div>
      </div>
    </li>
    <li class="vgui-navbar__item">
      <button class="vgui-navbar__button" type="button"
              aria-expanded="false" aria-controls="navbar-library">Library</button>
    </li>
  </ul>
</nav>
```

The dropdown reuses `vgui-menu` classes so it inherits the flat
`LightGreenBG` outline and the maize hover from one place; `NavBar` owns only
the strip.

## States

| State | Fill | Text |
| --- | --- | --- |
| Strip | transparent (`bgcolor = none`) | — |
| Item, inactive | transparent | `#FFFFFF` — 9.92:1 on `DarkGreenBG` |
| Item, active | transparent | `#A0AA95` (`Text`) — **4.06:1, dimmer than inactive** |
| Item, hover | *unspecified* | *unspecified* — see Open questions |
| Item, `:frameFocus` | *unspecified* — `MainNav` has no focus block | — |
| Dropdown panel | `#3E4637` (`DarkGreenBG`) | — |
| Dropdown outline | 1px `#5A6A50` (`LightGreenBG`) on all four sides | — |
| Dropdown item, idle | transparent | `#FFFFFF` |
| Dropdown item, hover | `#91863C` (`MaizeBG`) | `#FFFFFF` — **3.70:1, fails** |
| Dropdown item, selected | **nothing** — the block is empty | unchanged |
| Divider | `#424850` (`SuperDivider`) | — 1.07:1, effectively invisible |

## Tokens

| Token | Value | Where |
| --- | --- | --- |
| `--vgui-nav-font-size` | `21px` | `MainNav font-size = 21` — **new token** |
| `--vgui-nav-font-weight` | `700` | `MainNav font-weight = 700` |
| `--vgui-nav-line-height` | `21px` | The port's `line-height: 21px` |
| `--vgui-nav-text` | `#FFFFFF` | `MainNav textcolor` |
| `--vgui-nav-text-active` | `#A0AA95` | `MainNav selectedtextcolor = Text` |
| `--vgui-menu-bg` | `#3E4637` | `SuperNavMenu bgcolor = DarkGreenBG` |
| `--vgui-menu-border` | `#5A6A50` | `SuperNavMenu` outline (`LightGreenBG`) |
| `--vgui-accent-dark` | `#91863C` | Item hover (`MaizeBG`) |
| `--vgui-text-on-accent` | `#232421` | `Down` — **use this instead of white on maize** |
| `--vgui-menu-divider` | `#424850` | `SuperNavMenuDivider` (`SuperDivider`) |
| `--vgui-nav-dropdown-offset` | `23px` | The port's `top: 23px` |

Only `--vgui-nav-font-size` is genuinely new; every colour already exists in
`foundations.md`.

## CSS recipe

```css
.vgui-navbar {
  font-size: var(--vgui-nav-font-size, 21px);
  font-weight: var(--vgui-nav-font-weight, 700);
  text-transform: uppercase;      /* font-style = uppercase */
  /* bgcolor = none: the strip paints nothing. Whatever frame it sits in shows
     through, so the NavBar is not a component you can drop on a white page. */
  background-color: transparent;
}

.vgui-navbar__list {
  display: flex;
  align-items: stretch;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.vgui-navbar__button {
  display: block;
  line-height: var(--vgui-nav-line-height, 21px);
  padding: 0 8px;
  border: 0;
  background: transparent;
  color: var(--vgui-nav-text, #fff);
  font: inherit;
  letter-spacing: inherit;
  cursor: default;
  /* No transition: VGUI has none. */
}

/* The active item is DIMMER, not brighter. Do not invert this to match a
   modern nav bar — the direction of emphasis is a real part of the style. */
.vgui-navbar__item--active > .vgui-navbar__button {
  color: var(--vgui-nav-text-active, #a0aa95);
}

/* ---- Dropdown: SuperNavMenu, reusing Menu's geometry ---- */
.vgui-navbar__dropdown {
  position: absolute;
  top: var(--vgui-nav-dropdown-offset, 23px);
  min-width: 150px;
  background-color: var(--vgui-menu-bg, #3e4637);
  /* Four identical 1px sides in LightGreenBG. Flat outline, no bevel, and
     NO box-shadow — the corpus has no drop shadow anywhere. */
  border: 1px solid var(--vgui-menu-border, #5a6a50);
  box-shadow: none;
}

.vgui-navbar__dropdown .vgui-menu__item {
  color: var(--vgui-nav-text, #fff);
  line-height: 21px;
  padding: 0 6px;
  cursor: default;
}

.vgui-navbar__dropdown .vgui-menu__item:hover,
.vgui-navbar__dropdown .vgui-menu__item[data-active='true'],
.vgui-navbar__dropdown .vgui-menu__item:focus-visible {
  background-color: var(--vgui-accent-dark, #91863c);
  /* White on maize is 3.70:1. Dark is 4.22:1 — use dark. */
  color: var(--vgui-text-on-accent, #232421);
}

.vgui-navbar__divider {
  height: 1px;
  margin: 1px 0;
  background-color: var(--vgui-menu-divider, #424850);
}
```

**Three deliberate departures, each with a reason:**

- **The `:hover` rule also targets `[data-active]` and `:focus-visible`.** The
  corpus paints an open menu's active item **not at all** (`:selected {}` is
  empty). Reproducing that would leave keyboard users navigating blind, so the
  hover fill is promoted to the selected/focused state. This is the one place
  `NavBar` must not be faithful.
- **Dark text on maize.** The corpus's item hover sets `bgcolor = MaizeBG` and
  sets no text colour, so `textcolor = White` is inherited and lands at
  **3.70:1**. `Down` `#232421` reaches **4.22:1**. See `foundations.md §10`.
- **`box-shadow: none` is explicit** because every modern menu defaults to a
  shadow and the original has none — a flat 1px outline on a dark green panel
  that is only *barely* lighter than the page behind it. Removing the shadow is
  what makes a dropdown look 2003 rather than 2015.

**Do not use `border-top: 0` on the dropdown to merge it with the strip.** The
CSS port does exactly that (`greensteam.css`, the `ul.dropdown` rule) because it
is the cheapest way to remove a seam, but it shortens the box and makes the
strip jitter by a pixel when a menu opens. The original's idiom is to **paint
over** the seam (`PageTab:selected` filling `y1 + 2`, `steam.styles:1810`), which
in CSS is the negative-margin version:

```css
.vgui-navbar__dropdown { margin-top: -1px; }
```

That keeps the layout box intact and only changes what is drawn on top. See
`Tabs.md` for the full argument.

## React API

```tsx
export interface NavBarItem {
  /** Stable identity; also the React key. */
  id: string
  /** Label text, rendered uppercase by CSS. */
  label: string
  /** Renders the dimmed active state. */
  active?: boolean
  /** Dropdown content; omit for a plain link with no menu. */
  menu?: React.ReactNode
  /** Href when the item navigates rather than opening a menu. */
  href?: string
  /** Renders disabled and unclickable. */
  disabled?: boolean
}

export interface NavBarProps {
  /** Items in display order. */
  items: NavBarItem[]
  /** Called when an item with a menu is activated. */
  onItemClick?: (id: string) => void
  /** Accessible name for the nav landmark. */
  label?: string
  /** Renders a 1px SuperNavMenuDivider between items. */
  dividers?: boolean
}
```

## Accessibility

- **`<nav aria-label="Main">` is the right landmark, and it needs the label.**
  A page with a `NavBar` and a `MenuBar` has two navigations; unlabelled, a
  screen reader announces "navigation" twice with no way to tell them apart.
- **The active item must be more than a dimmer colour.** This is the one thing
  the original gets backwards for assistive technology: `selected` is expressed
  purely as `#A0AA95` instead of `#FFFFFF`, which is a ~2.4:1 difference between
  two colours and invisible to anyone with a contrast or colour deficiency. Add
  `aria-current="page"` (or `aria-current="true"`) to the active item so the
  state survives without colour, and consider a 1px underline for sighted users
  who cannot see the difference.
- **`aria-current` is the right attribute, not `aria-selected`.** `NavBar` items
  are navigation; `aria-selected` belongs to `tablist`/`listbox` descendants.
- **Each dropdown button needs `aria-expanded` and `aria-controls`.** `false` when
  closed, `true` when open, updated on every toggle. Without `aria-expanded` a
  screen reader cannot tell that activating the button opened anything.
- **The dropdown is a `role="menu"` with `role="menuitem"` children and roving
  tabindex**, and it owes the full menu keyboard model: `Down`/`Up` to move,
  `Home`/`End` to jump, `Escape` to close and return focus to the button, and —
  because it is a *menu bar* — `Left`/`Right` to move between top-level items
  while a menu is open. That last one is the detail most implementations miss.
- **The empty `:selected` block is a genuine bug and must not be copied.** With no
  visual for the active item, a keyboard user pressing `Down` inside the dropdown
  has no feedback whatsoever. The recipe routes hover, focus and selection
  through one highlight for this reason.
- **Maize highlights need dark text.** The corpus never states the text colour on
  a maize background, so white is inherited and lands at **3.70:1** — a fail.
  `Down` `#232421` gives **4.22:1**. This applies to the dropdown, the hamburger
  menus, the list selections and every other maize surface; see
  `foundations.md §10`.
- **The divider is decorative.** `SuperDivider` `#424850` on `DarkGreenBG`
  `#3E4637` is **1.07:1** — essentially invisible. It is a hint of structure, not
  information, so it may be `aria-hidden`; do not rely on it to separate groups,
  and do not use it as the only clue that two clusters of items are different.
- **21px bold uppercase is easy to over-space.** Uppercase text at that weight
  and size loses shape cues; keep `letter-spacing` at the original's (i.e. none,
  which is what the font provides) rather than adding tracking, and check the
  labels are distinguishable in a `prefers-contrast: more` mode.
- **Keyboard focus must be visible even though the strip is transparent.** A
  transparent background means a focus ring drawn with `outline-offset` may be
  clipped by the frame. Use an inset outline
  (`outline-offset: -2px`) and verify it against the darkest surface the strip
  can sit on.

## Assets

**`MainNav` and `SuperNavMenu` reference no images whatsoever.** Both blocks are
type, colour and `render_bg` lines only — there is no nav background strip, no
dropdown shadow sprite and no chevron. The whole navigation is drawn from four
colours and a font.

The only glyph a full nav would want is a dropdown arrow, and **the corpus has
none for this control**. If a chevron is added it should be a CSS triangle or an
inline SVG, and it must be marked `aria-hidden="true"`.

**Assets:** this package ships **no image assets, by policy** — no `public/`,
no `src/assets/`. See `docs/assets.md`.

## Examples

```tsx
<NavBar
  label="Main"
  items={[
    { id: 'store', label: 'Store', menu: (
      <>
        <MenuItem>Browse</MenuItem>
        <MenuItem>Wishlist</MenuItem>
      </>
    ) },
    { id: 'library', label: 'Library', active: true },
    { id: 'community', label: 'Community' },
    { id: 'account', label: 'My account', disabled: true },
  ]}
/>
```

## Open questions

- **`MainNav` has no hover state and no focus state at all** — only the
  `textcolor`/`selectedtextcolor` pair. Hover exists only in the CSS port, where
  `nav a:hover` goes to `#E3E41F` (a bright yellow that appears **nowhere** in
  either corpus file — it is the port author's invention). Whether VGUI's real
  `MainNav` hovered is unknown. The port's colour at least passes: `#E3E41F` on
  `GreenBG` `#4C5844` is **5.52:1**.
- **The strip's background is undefined** (`bgcolor = none`), so the resting
  contrast of the nav labels depends on the frame above it. White is measured
  here against `DarkGreenBG` (9.92:1), which is the most likely parent, but a
  `Frame` title bar or a lighter panel would change the number.
- **Is `MainNav` a `MenuBar`, or its own control?** `steam.styles` has an empty
  `MenuBar {}` at `:1672`, an empty `"Page MenuBar" {}` at `:1674` and a full
  `"MenuBar MenuButton"` ladder at `:1675–1696`, plus `MainNav` at `:1646`. Two
  bars in one file with almost no overlap in styling. Whether they share a
  control class in C++ is not determinable from the styles; this doc treats them
  as separate components and shares only the dropdown geometry.
- **`SuperNavMenu` has `inset = "1 0 1 1"` — 1px top, 0 right, 1px bottom, 1px
  left.** An asymmetric inset is unusual and may be a typo for `"1 1 1 1"`, since
  the `render_bg` draws all four sides. The recipe uses a symmetric border and
  notes the discrepancy.
- **`MenuDivider` (`#4C4E4B`, `steam.styles:285`) versus `SuperDivider`
  (`#424850`, `:129`)** — the menu and the super-nav menu use different divider
  colours, and both are effectively invisible (1.03:1 and 1.07:1) against
  `DarkGreenBG`. Which one a `NavBar` dropdown should use is a genuine coin
  flip; this doc follows `SuperNavMenuDivider` because that is the nav's own
  control.
- **The 23px dropdown offset comes from the CSS port, not from VGUI.** It is a
  hand-measured value and is not in `steam.styles`. It matches a 21px line-height
  plus the 1px outline plus 1px, which is self-consistent, but it is a
  reconstruction rather than a citation.
- **No `[$OSX]` conditional exists on `MainNav`** while `SuperNavMenuItem` has
  one (14px → 16px). So on macOS the nav strip stayed at 21px while its dropdown
  items grew. Whether that was intended is unknown; the Windows values are
  treated as canonical here.
