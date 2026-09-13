# Menu

## Purpose

The dropdown panel that appears below a menu-bar item or a `Select`. A flat list
of `MenuItem` rows separated by `MenuSeparator` rules, where one row can be
hovered, checked, disabled, or open a submenu.

## VGUI original

`Menu` in VGUI1 (`vgui_dll/include/VGUI_Menu.h`), `Menu`/`MenuItem`/
`MenuSeparator` in VGUI2. `steam.styles` **lines 1657–1741**:

```
Menu
{
    bgcolor = DarkGreenBG
    inset = "1 0 1 1"
    render_bg
    {
        1="fill( x0, y0, x1, y0 + 1, LightGreenBG )"  // top
        2="fill( x0, y1 - 1, x1, y1, LightGreenBG )"  // bottom
        3="fill( x0, y0, x0 + 1, y1, LightGreenBG )"  // left
        4="fill( x1 - 1, y0, x1, y1, LightGreenBG )"  // right
    }
}

MenuSeparator
{
    padding-right = 3
    render_bg { 1="fill( x0 , y0 + 1, x1, y1 - 1, MenuDivider )" }
}

MenuItem
{
    font-family = basefont
    font-size = 14
    textcolor = White
}
    MenuItem:hover    { bgcolor = MaizeBG }
    MenuItem:disabled { textcolor = DisabledText1 }
```

The same block is duplicated for the client's own nav dropdowns at
`steam.styles:3135–3170` as `SuperNavMenu` / `SuperNavMenuItem` /
`SuperNavMenuDivider`, with one difference — `SuperNavMenuItem:selected {}` is
**an empty block**, so a selected row in a nav dropdown has no highlight at all.

### Four things to extract

1. **The border is not a bevel.** All four sides are `LightGreenBG` `#5A6A50` —
   a flat 1px outline. A bevel would be bright-top/dark-bottom; this is neither.
   It reads as the panel sitting *on* the background rather than carved into it.
   (`SuperNavMenu` is byte-identical, which confirms it was deliberate.)
2. **There is no drop shadow.** Nothing in `steam.styles` or either `.layout`
   file draws one. This is the single hardest thing to accept when rebuilding the
   menu for the web, because every modern dropdown has an elevation shadow. A
   shadow immediately breaks the period look. If the menu needs to separate from
   busy content, use the `#5A6A50` outline — that is what it is for.
3. **`inset = "1 0 1 1"`** (left 1, top 0, right 1, bottom 1) pushes the item
   list 1px in from the sides and bottom, which is what keeps the hover fill from
   painting over the outline.
4. **The separator is a single flat line, not an engraved groove.**
   `MenuDivider` `= 76 78 75` → `#4C4E4B`, one `1`-row fill at `y0 + 1` and a
   `padding-right = 3` so it stops 3px short of the right edge. Compare
   `Divider`, which *is* two-row engraved (`steam.styles:872`). Inside a menu,
   Valve used the cheap version.

## Variants

| Variant | Class | Notes |
| --- | --- | --- |
| Default | — | Flat list |
| Submenu parent | `--has-submenu` | Right-aligned arrow glyph, opens on hover *and* focus |
| Checkable | — | `MenuItem` with `checkable`; the tick is drawn in the gutter |
| Separator | `vgui-menu__separator` | `#4C4E4B` line, 3px right inset |
| Group label | `vgui-menu__label` | Non-interactive `--vgui-text-muted`, uppercase |
| Nav dropdown | `--nav` | `SuperNavMenu`: identical chrome, no selected state |

## Anatomy

```html
<div class="vgui-menu" role="menu" aria-labelledby="menu-trigger">
  <div class="vgui-menu__label">Filters</div>
  <button class="vgui-menu__item" role="menuitem" type="button">
    <span class="vgui-menu__gutter"></span>
    <span class="vgui-menu__text">Show full servers</span>
  </button>
  <button class="vgui-menu__item" role="menuitemcheckbox" aria-checked="true" type="button">
    <span class="vgui-menu__gutter" aria-hidden="true">✓</span>
    <span class="vgui-menu__text">Not full</span>
  </button>
  <button class="vgui-menu__item vgui-menu__item--has-submenu" role="menuitem" type="button" aria-haspopup="menu" aria-expanded="false">
    <span class="vgui-menu__gutter"></span>
    <span class="vgui-menu__text">Anti-cheat</span>
    <span class="vgui-menu__arrow" aria-hidden="true"></span>
  </button>
  <div class="vgui-menu__separator" role="separator"></div>
  <button class="vgui-menu__item" role="menuitem" type="button" disabled>
    <span class="vgui-menu__gutter"></span>
    <span class="vgui-menu__text">Remove from favourites</span>
  </button>
</div>
```

The `__gutter` is a fixed-width (16px) spacer so checked and unchecked rows' text
aligns. Every action row is a real `<button type="button">`; the menu is not a
`<ul>` of click handlers, because only a button gives keyboard activation,
`aria-disabled`, and a focus ring for free.

## States

| State | Row background | Text | Border |
| --- | --- | --- | --- |
| Panel | `#3E4637` | — | 1px `#5A6A50`, all four sides |
| Row, idle | transparent | `#FFFFFF` (`White`) | — |
| Row, hover | `#91863C` (`MaizeBG`) | **`#232421`** — not white | — |
| Row, focus-visible | `#91863C` | `#232421` | focus ring, see below |
| Row, pressed | `#91863C` | `#232421` | — |
| Row, selected (nav) | *unchanged* | `#FFFFFF` | — |
| Row, disabled | transparent | `#75806F` (`DisabledText1`), over `#282E22` shadow | — |
| Panel, disabled | — | — | never — the whole menu is either open or shut |

**The hover text colour is the interesting decision.** `steam.styles` offers
`MenuItem:disabled { textcolor = DisabledText1 }` but says nothing about the
hover text colour, because `bgcolor = MaizeBG` implies the renderer keeps drawing
`White`. White on `#91863C` is **3.70:1** and fails. `#232421` reaches **4.22:1**.
This is Baseline rule 1 from `foundations.md §10` — use dark text on every maize
highlight, and note that doing so is a *deliberate departure* from the original
rather than a faithful reproduction.

**Hover and focus-visible must look identical**, because the mouse and keyboard
user are in the same visual state. Do not make focus a lighter maize than hover.

## Tokens

| Token | Value | Where |
| --- | --- | --- |
| `--vgui-surface-dark` | `#3E4637` | Panel fill (`DarkGreenBG`) |
| `--vgui-surface-light` | `#5A6A50` | The 1px outline (`LightGreenBG`) |
| `--vgui-accent-dark` | `#91863C` | Hover row fill (`MaizeBG`) |
| `--vgui-text-strong` | `#FFFFFF` | Idle row text (`White`) |
| `#232421` | — | Hover row text — literal, see Baseline rule 1 |
| `--vgui-menu-divider` | `#4C4E4B` | Separator (`MenuDivider`) — **new token** |
| `--vgui-text-disabled` | `#75806F` | Disabled row text |
| `--vgui-text-disabled-shadow` | `#282E22` | Disabled text offset shadow |
| `--vgui-text-muted` | `#A0AA95` | Group label |
| `--vgui-menu-min-width` | `150px` | From the CSS port, see below |
| `--vgui-menu-item-height` | `24px` | Derived, see below |

Two new tokens are needed: `--vgui-menu-divider` `#4C4E4B` (the `MenuDivider`
colour appears in no existing token — `--vgui-bevel-dark` is `#292D23` and would
be far too dark and too green) and a menu-specific min-width.

## CSS recipe

```css
.vgui-menu {
  min-width: var(--vgui-menu-min-width, 150px);
  padding: 0 1px 1px;                /* Menu inset = "1 0 1 1" */
  background-color: var(--vgui-surface-dark);
  /* Flat 1px outline on all four sides — NOT a bevel. */
  border: 1px solid var(--vgui-surface-light);
  /* No box-shadow. See "Four things to extract", point 2. */
}

.vgui-menu__item {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-height: var(--vgui-menu-item-height, 24px);
  padding: 2px 8px 2px 4px;
  border: 0;
  background: transparent;
  color: var(--vgui-text-strong);
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: default;                   /* VGUI menus are not link-cursors */
}

.vgui-menu__item:hover,
.vgui-menu__item:focus-visible {
  background-color: var(--vgui-accent-dark);
  color: #232421;                    /* 4.22:1; white is 3.70:1 and fails */
}

.vgui-menu__item:focus-visible {
  outline: 1px dotted #232421;
  outline-offset: -3px;
  /* The dotted focus ring inverts with the fill, so it stays visible. */
}

.vgui-menu__item:disabled {
  color: var(--vgui-text-disabled);
  text-shadow: 1px 1px 0 var(--vgui-text-disabled-shadow);
}

.vgui-menu__separator {
  height: 1px;
  margin: 1px 3px 1px 0;             /* padding-right = 3 */
  background-color: var(--vgui-menu-divider);
}

.vgui-menu__gutter {
  flex: 0 0 16px;
  text-align: center;
}
```

**Why `cursor: default` and not `pointer`.** In VGUI a menu item is not a link
and Valve did not change the cursor. The CSS port follows this. A `pointer`
cursor is a web convention leaking in; it also over-promises ("this navigates")
for what is often a toggle. Keep `default`.

**Positioning and the vertical gap.** The CSS port opens nav dropdowns at
`top: 23px` with the *bar* being 21px of line-height — so the menu overlaps the
nav's bottom border by design. Menus in VGUI are drawn *adjacent* to the trigger
with no gap, because a gap lets the pointer leave the trigger and close the menu
before it arrives. **Any hover-open menu must have zero gap or a hover bridge.**

## React API

```tsx
export interface MenuItemSpec {
  /** Stable identity and React key. */
  id: string
  /** Visible label. */
  label: string
  /** Invoked on activation. Omit to render a non-interactive row. */
  onSelect?: () => void
  /** Renders as a disabled row. */
  disabled?: boolean
  /** Renders as `menuitemcheckbox` with a tick in the gutter. */
  checked?: boolean
  /** Renders an arrow and opens a nested Menu. */
  items?: MenuItemSpec[]
  /** Renders a group label instead of an action row. */
  type?: 'item' | 'label' | 'separator'
}

export interface MenuProps {
  /** Rows, in order. Separators and labels are entries in the same array. */
  items: MenuItemSpec[]
  /** id of the element the menu is anchored to; becomes aria-labelledby. */
  labelledBy?: string
  /** Called when the menu should close. */
  onClose?: () => void
  /** Keyboard behaviour. Defaults to 'auto': reaches for a MenuBar ancestor. */
  orientation?: 'auto' | 'vertical'
}
```

Menu item height is **not** taken from `steam.styles`, which never states it. It
is the client's row pitch; `24px` is the value the `.layout` files place menu
buttons at (see `MenuBar`). Treat it as a derived metric and revisit it if a
screenshot measurement says otherwise.

## Accessibility

- **`role="menu"` / `role="menuitem"`, with `aria-haspopup="menu"` and
  `aria-expanded` on the trigger.** `role="menu"` is a *composite widget*: once
  it opens, focus moves *into* it and the container owns arrow-key navigation.
  A menu that opens but leaves focus on the trigger is not a menu — use a
  disclosure pattern with a plain `role="group"` instead.
- **Roving tabindex.** Exactly one item has `tabindex="0"`; the rest are `-1`.
  Up/Down move the focus and the tabindex together. Do not put every item in the
  tab order — a menu is one tab stop.
- **Keys:** `Up`/`Down` move, `Home`/`End` jump, `Escape` closes and returns focus
  to the trigger, `Right` opens a submenu, `Left` closes it, `Enter`/`Space`
  activate. `Tab` closes the menu without trapping focus.
- **Typeahead.** First-letter navigation over the item labels is expected of
  `role="menu"`. It is easy to omit and its absence is noticeable.
- **Hover-open menus need `pointerleave` grace.** The port opens on
  `nav li:hover`. That is fine for a demo and hostile in practice: a diagonal
  mouse path to a lower item clips a sibling row and swaps the open menu.
  Use a short close delay (~150ms) and cancel it on re-entry.
- **Contrast — the shipped original fails and must not be copied.** White on
  `MaizeBG` is **3.70:1**. Use `#232421` (**4.22:1**).
- **The separator at `#4C4E4B` is 1.03:1 against the menu's own `#3E4637`** —
  effectively invisible. It is decorative; mark it `role="separator"` and do not
  let it be the only thing distinguishing two groups. Where the grouping carries
  meaning, use a `__label` row with text.
- **Disabled rows must use `disabled` on the button, not `aria-disabled` alone**,
  so they are skipped by pointer, keyboard and AT alike. `aria-disabled="true"`
  on an otherwise-live button is a trap for keyboard users.
- **The submenu arrow is decorative.** `aria-haspopup` on the parent already
  announces the relationship; the glyph needs `aria-hidden="true"`.
- **Never nest a menuitem's label in an element that is not the accessible name.**
  Put the text in a `<span>` inside the button and let the button's content be
  the name; add `aria-checked` for checkbox rows rather than relying on the tick.

## Assets

None. The menu's chrome, border, separators and arrow are all drawn with `fill`
programs in `steam.styles` — no `.tga` is referenced by `Menu`, `MenuItem`,
`MenuSeparator` or `SuperNavMenu*`. The checkmark that a checkable item needs is
the only borrowed asset; `greensteam.css` ships `checkmark.png` at **13×13** (see
`Checkbox`), which suits a 16px gutter and should be reused rather than redrawn.

## Examples

```tsx
<Menu
  labelledBy="filters-button"
  items={[
    { id: 'label-1', type: 'label', label: 'Filters' },
    { id: 'notfull', label: 'Server not full', checked: true },
    { id: 'hasusers', label: 'Has users playing' },
    { id: 'notpassword', label: 'Is not password protected' },
    { id: 'sep-1', type: 'separator' },
    { id: 'vac', label: 'Anti-cheat', items: [
      { id: 'vac-secure', label: 'Secure' },
      { id: 'vac-unsecure', label: 'Not secure' },
    ] },
    { id: 'favourites', label: 'Remove from favourites', disabled: true },
  ]}
/>
```

## Open questions

- **`MenuButton`'s own text colours are contradictory across the two files.**
  `steam.styles:1697` gives `MenuButton { textcolor = White }` with
  `:hover { textcolor = Over }` and `:selected { textcolor = Over }`, while
  `steam.styles:1675` gives `"MenuBar MenuButton" { textcolor = TitleDimText }`
  with `:frameFocus { White }` and `:frameFocus:selected { Over }`. So the
  top-level bar item is *dim by default* and the popup item is *white by
  default*; the port chose a third option (nav links are `#C4B550` maize). Which
  of the three is right depends on the client version. See `MenuBar`.
- **No `MinWidth` is stated anywhere.** The `150px` in the recipe comes from the
  CSS port's `nav li ul.dropdown` and is plausible but unverified against VGUI.
- **The `24px` row height is inferred**, not read. `.layout` files place
  account-menu buttons at `height=24`; menu rows were presumably the same,
  but a screenshot measurement would settle it.
- **`MenuDivider` `#4C4E4B` vs `SuperDivider` `#424850`** are two different
  divider colours for the same visual role (menu vs nav dropdown). Neither is in
  the current token set. The recipe standardises on `MenuDivider`; if the `nav`
  variant is built, it needs `--vgui-nav-divider` as well.
- **Does a `Menu` scroll?** VGUI's `Menu` could exceed the screen and Valve's
  `Menu` block declares no scrollbar style, unlike `RichText` and `ListPanel`
  which declare interiors. Long menus in the client appear to scroll, but the
  mechanism is not in the stylesheet — likely the `Menu` is hosted in a
  `ScrollableEditablePanel` at the call site. Unverified.
