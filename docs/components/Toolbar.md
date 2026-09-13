# Toolbar

## Purpose

A horizontal strip of compact icon buttons acting on the surface below them: a
browser's back/forward/home/reload/stop cluster, a game page's play/store/forum
row, a viewer's zoom and fullscreen controls.

## VGUI original

**There is no `ToolBar` style block in `steam.styles`.** Every other component in
this library has at least one block; the toolbar has none. `Select-String` over
the whole file returns exactly two matches containing "tool", and both are
`TooltipWindow` (`:2623`, `:2637`). A toolbar in VGUI is **a plain `Panel` with
`Button`s placed on it**, which is why there is nothing to style.

That absence is itself the finding: the toolbar's identity comes entirely from
its *buttons*, not from a container. So this document is built from the two
button families that actually appear in toolbars, plus the one real toolbar
layout the corpus ships.

**The browser chrome toolbar** (`steam.styles:2862–2963`) — five icon buttons,
each with four state sprites:

```
BackButton
{
    bgcolor = none
    inset = "0 0 0 0"
    image = "graphics/icon_button_back"
    render_bg {}
}
    BackButton:hover    { image = "graphics/icon_button_back_over" }
    BackButton:active   { image = "graphics/icon_button_back_down" }
    BackButton:disabled { image = "graphics/icon_button_back_disabled" }

ForwardButton { inset = "1 0 -1 0"  ... icon_button_forward ... }
HomeButton    { inset = "-5 0 0 0"  ... icon_button_home ... }
ReloadButton  { inset = "1 0 -1 0"  ... icon_button_reload ... }
StopButton    { inset = "1 0 -1 0"  ... icon_button_stop ... }
```

`render_bg {}` is **empty on all five**. There is no bevel, no fill and no
border: the glyph *is* the button, drawn directly on the panel.

**The bevelled alternative** (`steam.styles:2755–2790`) — the same idea with a
real bevel, shown here in full because its `:active` state is the primitive:

```
FullscreenButton
{
    inset = "-2 0 2 0"
    bgcolor = none
    render_bg
    {
        1="fill( x0, y0, x1, y0 + 1, BorderBright )"      // top
        2="fill( x0, y1 - 1, x1, y1, BorderDark )"        // bottom
        3="fill( x0, y0, x0 + 1, y1 - 1, BorderBright )"  // left
        4="fill( x1 - 1, y0, x1, y1, BorderDark )"        // right
    }
    image = "graphics/icon_controller_bpm"
}
    FullscreenButton:hover  { image = "graphics/icon_controller_bpm_over" }
    FullscreenButton:active
    {
        inset = "-2 0 2 0"
        bgcolor = none
        render_bg =
        {
            1="fill( x0, y0, x1, y0 + 1, BorderDark )"    // top   <-- swapped
            2="fill( x0, y1 - 1, x1, y1, BorderBright )"  // bottom
            3="fill( x0, y0, x0 + 1, y1 - 1, BorderDark )" // left <-- swapped
            4="fill( x1 - 1, y0, x1, y1, BorderBright )"  // right
        }
        image = "graphics/icon_controller_bpm_down"
    }
    FullscreenButton:disabled { image = "graphics/icon_controller_bpm_disabled" }
```

**The real toolbar layout** (`F:\steam-style\OG-Steam\OG-Steam\servers\DialogServerBrowser.res`
and `InternetGamesPage.res`) — the only toolbar-shaped thing in the corpus, and
it is a dialog footer rather than a toolbar:

```
layout
{
    region { name="bottom" align=bottom width=max height=34 margin=0 }
    place { control="AddServerButton,RefreshQuickButton,RefreshButton,ConnectButton"
            region="bottom" margin-right=10 spacing=8 height=24 align=right }
    place { control="Filter,FilterString" region="bottom" height=24 width=max
            end-right="AddServerButton" margin-left=10 spacing=8 }
}
```

A **34px** region holding **24px** controls at **8px** spacing with a **10px**
right margin, right-aligned. The buttons themselves are `104x24`, `104x24`,
`124x24` and `128x24` — widths chosen per label, never a fixed grid.

**The titlebar system button takes a third approach** (`steam.styles:302–303`):

```
FrameSystemButton.Icon          "resource/icon_steam"
FrameSystemButton.DisabledIcon  "resource/icon_steam_disabled"
```

An `.Icon` scheme key rather than a style block, reached through
`FrameMinimizeButton`-style blocks (`:918–961`). A fourth mechanism for the same
job, in the same file.

### Four things to extract

1. **A VGUI toolbar has no chrome.** The buttons sit directly on whatever panel
   they were placed in: no strip background, no border, no separator, no
   grouping, no fixed button width. This is why there is no `ToolBar` block to
   copy and why a modern toolbar — a bordered `div` with a `gap` and a divider
   between groups — looks nothing like it. The toolbar is *transparent*, and
   that is a real design decision, not an omission.
2. **`render_bg {}` empty is the chromeless-button primitive.** The five browser
   buttons are `bgcolor = none` **plus** an empty `render_bg` block. In VGUI
   terms that means "draw nothing behind me, ever". The equivalent CSS is
   `background: none; border: 0;` with the *state* carried purely by swapping to
   a different sprite (`_over`, `_down`, `_disabled`). **The state is a
   different image, not a different background.** In CSS that is four
   `background-image` declarations, and it is the single most important thing to
   get right: no hover tint, no border change, no transform.
3. **Pressed means "rotate the bevel", and it is rotated by hand.** The
   `FullscreenButton:active` block repeats all four `render_bg` lines with
   `BorderBright` and `BorderDark` swapped — top/left dark, bottom/right lit. The
   same trick appears in `ListPanelColumnSelectButton:selected`
   (`steam.styles:1472`, an exact rotation) and in the games-list override
   `"CGamesListPanel ListPanelColumnSelectButton:selected"` (`:1520`), where the
   colours rotate *and* the fills shift by one pixel
   (`3="fill( x0, y0 + 1, x0 + 1, y1, BorderBright )"` against the base block's
   `x0, y0`), so the pressed state also insets. **Everywhere in this theme, a
   pressed state is the same bevel inverted**, and it is spelled out longhand
   each time. In CSS it is one class switching two custom properties.
4. **The glyph insets are hand-tuned per button and include negatives.** Back is
   `"0 0 0 0"`, forward `"1 0 -1 0"`, **home `"-5 0 0 0"`**, reload and stop
   `"1 0 -1 0"`. The home glyph is pulled 5px to the left, and forward/reload/stop
   are pulled 1px right and given 1px less on the right. Every sprite is
   **16×16**, so the differences are optical corrections for glyphs that do not
   fill their canvas — **not** layout. Copying a single uniform padding value
   will misalign four of the five buttons by 1–5px, which is exactly the kind of
   detail that separates a good reconstruction from a poor one.

## Variants

| Variant | Class | Notes |
| --- | --- | --- |
| Chromeless | `vgui-toolbar--bare` | `render_bg {}`: browser chrome, 5 buttons |
| Bevelled | `vgui-toolbar--raised` | `FullscreenButton` style |
| Footer bar | `vgui-toolbar--footer` | 34px region, 24px buttons, 8px spacing |
| Text button group | — | `AddServerButton`/`RefreshButton` at 104–128px |
| With separator | *no precedent* | See Open questions |
| Vertical | *no precedent* | See Open questions |

## Anatomy

```html
<div class="vgui-toolbar vgui-toolbar--bare" role="toolbar" aria-label="Browser">
  <button class="vgui-toolbar__button vgui-toolbar__button--back" type="button"
          aria-label="Back"></button>
  <button class="vgui-toolbar__button vgui-toolbar__button--forward" type="button"
          aria-label="Forward"></button>
  <button class="vgui-toolbar__button vgui-toolbar__button--home" type="button"
          aria-label="Home"></button>
  <button class="vgui-toolbar__button vgui-toolbar__button--reload" type="button"
          aria-label="Reload"></button>
  <button class="vgui-toolbar__button vgui-toolbar__button--stop" type="button"
          aria-label="Stop" disabled></button>
</div>
```

Each button is a real `<button>` with an `aria-label`; the sprite is a CSS
`background-image` and the element has no text at all. Do **not** use
`background-image` on a `<div>` with a click handler — a toolbar is a row of
buttons and must be operable from the keyboard.

## States

| State | Background | Glyph |
| --- | --- | --- |
| Bare, idle | none | `icon_button_*` |
| Bare, hover | none — unchanged | `icon_button_*_over` |
| Bare, active | none — unchanged | `icon_button_*_down` |
| Bare, disabled | none — unchanged | `icon_button_*_disabled` |
| Bare, focus | *unspecified* | *unspecified* |
| Bevelled, idle | bevel top/left `#808080`, bottom/right `#282E22` | `icon_controller_bpm` |
| Bevelled, hover | unchanged | `..._over` |
| Bevelled, active | **bevel rotated** | `..._down` |
| Bevelled, disabled | unspecified | `..._disabled` |

## Tokens

| Token | Value | Where |
| --- | --- | --- |
| `--vgui-toolbar-height` | `34px` | `DialogServerBrowser.res` bottom region |
| `--vgui-toolbar-button-size` | `24px` | `height=24` in the same layout |
| `--vgui-toolbar-gap` | `8px` | `spacing=8` |
| `--vgui-toolbar-edge-margin` | `10px` | `margin-right=10` |
| `--vgui-icon-size` | `16px` | All 16×16 toolbar sprites |
| `--vgui-bevel-light` | `#899281` | *(community `BorderBright`)* |
| `--vgui-bevel-dark` | `#292D23` | *(community `BorderDark`)* |
| `--vgui-toolbar-bg` | transparent | No block defines one — **new token, value `transparent`** |

`--vgui-toolbar-bg: transparent` is a token whose value is "nothing". It exists
so that a theme which wants a toolbar strip can set it once rather than adding a
background to each button, and so that the default is visibly deliberate.

## CSS recipe

```css
.vgui-toolbar {
  display: flex;
  align-items: center;
  gap: var(--vgui-toolbar-gap, 8px);
  height: var(--vgui-toolbar-height, 34px);
  padding: 0 var(--vgui-toolbar-edge-margin, 10px);
  /* There is no ToolBar block in the corpus. A toolbar paints nothing. */
  background: var(--vgui-toolbar-bg, transparent);
  border: 0;
}

.vgui-toolbar__button {
  flex: 0 0 var(--vgui-icon-size, 16px);
  width: var(--vgui-icon-size, 16px);
  height: var(--vgui-icon-size, 16px);
  padding: 0;
  /* render_bg {} — no background, no border, no shadow, ever. */
  background-color: transparent;
  border: 0;
  border-radius: 0;
  background-repeat: no-repeat;
  background-position: center;
  cursor: default;
  /* No transition: the sprite swaps instantly. */
}

/* The state is a different IMAGE, not a different background. */
.vgui-toolbar__button--back              { background-image: url(/icons/icon_button_back.png); }
.vgui-toolbar__button--back:hover        { background-image: url(/icons/icon_button_back_over.png); }
.vgui-toolbar__button--back:active       { background-image: url(/icons/icon_button_back_down.png); }
.vgui-toolbar__button--back:disabled     { background-image: url(/icons/icon_button_back_disabled.png); }

/* Per-glyph optical corrections — these are the corpus's own insets, converted
   from VGUI's "left top right bottom" inset into padding. Do not "tidy" them to
   one shared value; four of the five buttons are off-centre by 1-5px without
   them. */
.vgui-toolbar__button--back    { margin: 0;          }
.vgui-toolbar__button--forward { margin-right: -1px; margin-left: 1px; }
.vgui-toolbar__button--home    { margin-left: -5px;  }
.vgui-toolbar__button--reload  { margin-right: -1px; margin-left: 1px; }
.vgui-toolbar__button--stop    { margin-right: -1px; margin-left: 1px; }

/* ---- Bevelled variant: FullscreenButton ---- */
.vgui-toolbar--raised .vgui-toolbar__button {
  background-color: transparent;
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-right: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-dark);
}

/* Pressed = the bevel rotated 180 degrees, never a colour change. */
.vgui-toolbar--raised .vgui-toolbar__button:active,
.vgui-toolbar--raised .vgui-toolbar__button[aria-pressed='true'] {
  border-top-color: var(--vgui-bevel-dark);
  border-left-color: var(--vgui-bevel-dark);
  border-right-color: var(--vgui-bevel-light);
  border-bottom-color: var(--vgui-bevel-light);
}

/* ---- Footer variant: the server browser's bottom bar ---- */
.vgui-toolbar--footer .vgui-toolbar__button {
  width: auto;
  height: var(--vgui-toolbar-button-size, 24px);
  padding: 0 8px;
}
```

**Do not give the bare variant a hover background.** It is tempting — a hover
tint is what every modern toolbar does — but the corpus's hover is *only* a
different sprite, and the sprites were drawn to be legible with nothing behind
them. Adding a tint makes the `_over` art sit on a surface it was never drawn
for.

**The `-5px` home margin is not a bug.** It comes straight from
`HomeButton { inset = "-5 0 0 0" }`. Verify it against the real sprite before
"fixing" it: the point of the negative inset is that the home glyph's ink does
not start at the sprite's left edge.

**Focus is genuinely missing and must be added.** No block in either family
defines a focus state, and a chromeless 16px glyph with no ring is unusable by
keyboard. Use an inset outline so it cannot be clipped against a neighbouring
button:

```css
.vgui-toolbar__button:focus-visible {
  outline: 1px dotted var(--vgui-text, #d8ded3);
  outline-offset: -3px;
}
```

## React API

```tsx
export interface ToolbarItem {
  /** Stable identity; also the React key. */
  id: string
  /** Accessible name; required because the button is glyph-only. */
  label: string
  /** Sprite base name under the icon set, e.g. "icon_button_back". */
  icon: string
  /** Called on activation. */
  onClick?: () => void
  /** Renders the disabled sprite and blocks activation. */
  disabled?: boolean
  /** Sticky pressed state for toggles, e.g. fullscreen. */
  pressed?: boolean
  /** Renders a text label instead of a sprite. */
  text?: string
}

export interface ToolbarProps {
  /** Items in display order. */
  items: ToolbarItem[]
  /** Bevelled buttons instead of the chromeless default. */
  raised?: boolean
  /** Draws the 34px footer bar with 24px controls. */
  footer?: boolean
  /** Accessible name for the toolbar landmark. */
  label?: string
}
```

## Accessibility

- **`role="toolbar"` with an `aria-label`.** A toolbar is a composite widget, and
  `role="toolbar"` promises arrow-key navigation between its children. Provide
  it: `Left`/`Right` move focus between buttons, `Home`/`End` jump to the ends,
  and the toolbar itself is a **single tab stop** (roving `tabindex`, first
  button at `0`). A toolbar where every button is separately tabbable is
  technically operable but breaks the contract the role announces.
- **Every glyph button needs an `aria-label`, and the sprite needs
  `aria-hidden`.** These buttons have no text content at all, so without a label
  a screen reader announces "button" four times. Back, forward, home, reload and
  stop are also *ambiguous by design* — the arrows and the stop cross are
  near-synonyms to nobody, but the reload icon and the stop icon are frequently
  confused, so the labels are not optional decoration.
- **Reload and stop are mutually exclusive in practice.** The corpus ships both
  as separate buttons with their own disabled sprites, which is the older
  pattern; a modern implementation usually shows one and disables the other. If
  you keep both visible, the disabled one must be `disabled` (or
  `aria-disabled="true"`) and must not be a tab stop. Do not merely grey it.
- **A 16×16 target is well below the 24×24 minimum** in WCAG 2.2 SC 2.5.8
  (Target Size, Minimum). The corpus's glyphs are 16×16 and the five buttons sit
  at 8px spacing, so the visual density is right — but the **hit area** must be
  padded to at least 24×24 while the sprite stays 16×16. Use padding on the
  button and keep `background-position: center`; do not scale the sprite up.
  This is a genuine conflict between fidelity and 2.5.8 and the padding
  resolution is the only acceptable one.
- **`aria-pressed` for toggles like fullscreen and mute**, not a swapped sprite
  alone. `FullscreenButton` carries an `:active` state with a rotated bevel; the
  sticky version of that is `aria-pressed`, and it must be announced.
- **Never encode meaning in the bevel rotation alone.** The `FullscreenButton`
  press is a 1px colour swap between two greys — `#808080` and `#282E22` on a
  transparent button — plus a sprite change. The sprite change carries the state;
  the bevel is a flourish. Do not build a control whose pressed state is only
  the bevel.
- **Group related buttons with `aria-label`led `role="group"` elements** when a
  toolbar holds more than about six items. The corpus has no grouping — no
  separators exist anywhere in the file — so this is an addition, and it is the
  one place a divider is justified.
- **Toolbar buttons must not be the only route to a function.** The in-game
  browser's back/forward are also reachable by keyboard shortcuts. Mirror
  destructive or navigation-critical toolbar items with a menu entry.

## Assets

Measured from the actual `.tga` headers — **every one is 16×16**:

| Asset | Size |
| --- | --- |
| `graphics/icon_button_back.tga` | 16×16 |
| `graphics/icon_button_back_over.tga` | 16×16 |
| `graphics/icon_button_back_down.tga` | 16×16 |
| `graphics/icon_button_back_disabled.tga` | 16×16 |
| `graphics/icon_button_forward*.tga` | 16×16 ×4 |
| `graphics/icon_button_home*.tga` | 16×16 ×4 |
| `graphics/icon_button_reload*.tga` | 16×16 ×4 |
| `graphics/icon_button_stop*.tga` | 16×16 ×4 |
| `resource/icon_steam.tga` | 16×16 |
| `resource/icon_steam_disabled.tga` | 16×16 |

**Twenty toolbar sprites plus two titlebar icons, all the same size** — this is
the cleanest state set in the whole corpus: five glyphs × `{idle, over, down,
disabled}` with no other variation. It is also the clearest evidence for point 2
above, because a four-sprite state set only makes sense if the *sprite* is the
state.

`graphics/icon_controller_bpm{,_over,_down,_disabled}` — referenced by
`FullscreenButton` (`steam.styles:2770–2789`) — are **missing from this corpus
copy**. The block names them; the files are not present. Any bevelled toolbar
button therefore has no art at all today.

**Art gap:** `F:\steam-style\steam-style-react\` ships **no image assets** — no
`public/`, no `src/assets/`. See `docs/assets.md`.

## Examples

```tsx
<Toolbar
  label="Browser"
  items={[
    { id: 'back',    label: 'Back',    icon: 'icon_button_back',    disabled: true },
    { id: 'forward', label: 'Forward', icon: 'icon_button_forward' },
    { id: 'home',    label: 'Home',    icon: 'icon_button_home' },
    { id: 'reload',  label: 'Reload',  icon: 'icon_button_reload' },
    { id: 'stop',    label: 'Stop',    icon: 'icon_button_stop',    disabled: true },
  ]}
/>
```

## Open questions

- **A toolbar with no container block raises a design question the corpus cannot
  answer: what is a `Toolbar` component, if it has no styling?** The honest
  answer used here is "a `Panel` plus layout plus `IconButton`s", and this doc
  exists mainly to record that the container is deliberately bare. If the library
  ships a `Toolbar`, its entire implementation is `display: flex`, `gap` and
  alignment — which is worth saying out loud rather than inventing a strip
  treatment to justify the component.
- **No separator, no group boundary and no vertical toolbar exists** anywhere in
  `steam.styles`. Every modern toolbar has all three; the corpus has none. Any
  divider is an addition, and if added it should reuse the theme's own divider
  rather than a browser default.
- **No focus state is defined for any toolbar button.** The keyboard treatment is
  a pure invention, and it is unavoidable because a chromeless 16px glyph with no
  ring cannot be used without sight of the pointer.
- **The 34px/24px/8px/10px numbers come from `DialogServerBrowser.res`, a dialog
  footer, not from a toolbar.** They are the best available evidence and they are
  self-consistent (24px control + margins inside a 34px region), but they describe
  a button bar at the bottom of a window. Whether the in-game browser's toolbar
  used the same pitch is unverified — a `ClientScheme` or a `.res` for the
  browser would settle it.
- **`icon_controller_bpm*` is missing from this copy of the corpus**, so the
  bevelled variant's art cannot be measured or diffed. The `FullscreenButton`
  block is still usable as a *pattern* (the rotated bevel), which is how it is
  cited here.
- **`stop` and `reload` are the same 16×16 box with inverted glyphs**, and at
  that size they are genuinely hard to tell apart in a screenshot. Whether Valve
  relied on the tooltip is unknown; the `_over` sprite is the only additional cue.
  If the library ships both, consider a stronger shape difference and note the
  departure.
- **The titlebar's system button uses an `.Icon` scheme key rather than a style
  block** (`steam.styles:302`), giving the same control four different
  configuration mechanisms across the file. That does not affect the toolbar, but
  it does mean "find the block for X" is never a reliable strategy in this
  codebase and every claim needs its own citation.
