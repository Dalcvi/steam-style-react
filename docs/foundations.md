# Foundations

Everything in this documentation set is derived from Valve's own shipped UI
resources, cross-checked against two independent community reimplementations.
Read this page first — the component docs deliberately do **not** repeat the
palette, the bevel recipe or the accessibility baseline.

---

## 1. What this style actually is

**VGUI** (Valve GUI) is Valve's in-house widget toolkit:

| Era | Toolkit | Games / clients |
| --- | --- | --- |
| 1998–2004 | **VGUI1** | Half-Life, Counter-Strike 1.6, Day of Defeat, the original Steam client |
| 2004–present | **VGUI2** | Half-Life 2 and every Source engine game, the Steam client up to ~2023 |
| 2012–present | **Panorama** | Dota 2, CS:GO/CS2, the modern Steam client and game overlay |

VGUI2 replaced VGUI1 rather than extending it, and Panorama replaced VGUI2, so
"the green VGUI look" is specifically the **VGUI1-era Steam client**, roughly
2003–2010, before the 2010-05 UI overhaul moved Steam to greys.

A naming caveat worth keeping in mind: **"Green Steam" and "classic green VGUI"
are community labels, not Valve terms.** Valve's own files never name the theme.
`steamscheme.res` is headed `Tracker scheme resource file`, and the palette is
just a set of named `Colors` entries. Do not attribute the name to Valve in any
public-facing copy.

The look is defined by three things, in this order of importance:

1. **The two-tone 1px bevel.** Every raised surface is lit on its top and left
   edge and shadowed on its bottom and right edge; every recessed surface
   inverts that. Nothing in this style uses a gradient, a drop shadow, or a
   rounded corner.
2. **The desaturated mossy-green palette**, with one maize/yellow accent
   reserved almost entirely for headings, selection and hover.
3. **Integer pixel metrics on a fixed grid** — 15, 18, 20, 25, 26px are the
   recurring numbers. Nothing is fluid, nothing is `em`-based.

---

## 2. Sources of truth

| Rank | Source | Why it matters |
| --- | --- | --- |
| 1 | `OG-Steam/OG-Steam/resource/steamscheme.res` | Valve's own VGUI1 scheme. The authoritative `Colors`, `Fonts` and `LayoutTemplates` blocks. |
| 2 | `OG-Steam/OG-Steam/resource/styles/steam.styles` | Valve's VGUI2 style sheet (3218 lines). Every control's `render` / `render_bg` border program and state variants. |
| 3 | `OG-Steam/OG-Steam/graphics/*.tga` | The actual state sprites — checkboxes, radios, arrows, frame buttons, the resize grip. These are what the CSS port has to replace. |
| 4 | `vgui.css` (`styles/steam_shared.css`, `styles/greensteam/greensteam.css`) | AlpyneDreams' MIT CSS port of the same theme. Currently the direct upstream of this library. |
| 5 | `OldSteam-Theme/css/universal.css` | Community Steam skin. Preserves Valve's **original token names** (`--GreenBG`, `--BorderBright`, …) and ships a second "TF2-esque" warm palette. |

Where sources 1–2 and source 4 **disagree**, this documentation says so
explicitly rather than silently picking one. The known disagreements are
catalogued in §8.

---

## 3. The palette

Most of these are **Valve's own names**, taken verbatim from the `Colors` block
of `steamscheme.res`. They are worth preserving because community skins key off
them.

| Token | Hex | Valve name | Role |
| --- | --- | --- | --- |
| `--vgui-surface` | `#4C5844` | `GreenBG` | Window bodies, button faces, toolbar chrome |
| `--vgui-surface-light` | `#5A6A50` | `LightGreenBG` | Hovered nav item, scrollbar gutter |
| `--vgui-surface-dark` | `#3E4637` | `DarkGreenBG` | Text inputs, dropdowns, list interiors, code blocks |
| `--vgui-bevel-light` | `#899281` | *(community `BorderBright`)* | The **lit** edge — top & left of a raised surface |
| `--vgui-bevel-dark` | `#292D23` | *(community `BorderDark`)* | The **shadowed** edge — bottom & right |
| `--vgui-bevel-light-strong` | `#B8C4AD` | *(community `@shadelighter`)* | Optional second-row highlight |
| `--vgui-text` | `#D8DED3` | `OffWhite` | Body text |
| `--vgui-text-strong` | `#FFFFFF` | `White` | Button labels, active tab, window title |
| `--vgui-text-muted` | `#A0AA95` | `Label` | Secondary labels |
| `--vgui-text-dim` | `#758666` | `DimListText` | De-emphasised list text |
| `--vgui-text-disabled` | `#75806F` | `DisabledText1` | Disabled label text (drawn **over** the shadow below) |
| `--vgui-text-disabled-shadow` | `#282E22` | `DisabledText2` | The offset shadow that produces the sunken disabled look |
| `--vgui-heading` | `#C4B550` | `Maize` / `Over` | Headings, hovered controls, progress text |
| `--vgui-accent` | `#C4B550` | `Maize` | Selection text, focus accents |
| `--vgui-accent-dark` | `#91863C` | `MaizeBG` | Selected-row fill in lists and dropdowns |
| `--vgui-accent-darker` | `#96892D` | *(community)* | `::selection` background, progress bar fill |
| `--vgui-text-hover` | `#E3E41F` | *(community)* | Nav item hover — the one genuinely bright colour |
| `--vgui-link` | `#AAAAAA` | *(community)* | Anchors |
| `--vgui-steam-green` | `#7EA64B` | `FullGreen` | "Online" / running status |
| `--vgui-success` | `#1AE225` | *(community)* | Positive status text only |
| `--vgui-warning` | `#C4B550` | *(community)* | Warning status text only |
| `--vgui-danger` | `#E2251A` | *(community)* | Error status text only (scheme's own `Highlight3` is `#AD4547` — see §8) |
| `--vgui-info` | `#0900FF` | *(community)* | Period-accurate link blue — see the note below |
| `--vgui-ping-low` | `#6A1610` | *(community)* | Server-browser ping bars, worse than 150ms |
| `--vgui-ping-medium` | `#91863C` | *(community)* | Server-browser ping bars, 100–150ms |
| `--vgui-ping-high` | `#4C5844` | *(community)* | Server-browser ping bars, better than 100ms |

**Friends / roster family** — from the `Friends.*` block at
`steam.styles:358-362`, used by the friends list and its notifications and now
by `Avatar.md`:

| Token | Hex | Valve name | Role |
| --- | --- | --- | --- |
| `--vgui-friends-selected` | `#111111` | `Friends.PanelSelected` | Selected row in the friends list — much darker than `--vgui-accent-dark` |
| `--vgui-friends-ignored` | `#F86C4F` | `Friends.IgnoredColor` | Ignored-user name text |
| `--vgui-friends-avatar-over` | `#FFFFFF` | `Friends.NoAvatarOver` | The placeholder ring drawn over a missing avatar |

**Clay / grey family** — used by the *settings* and *property sheet* chrome,
which in the real client is deliberately less green than the rest of the UI:

| Token | Hex | Valve name | Role |
| --- | --- | --- | --- |
| `--vgui-clay-surface` | `#464646` | `ClayBG` | Property sheet background |
| `--vgui-clay-light` | `#686A65` | `LightClayBG` | Property sheet header |
| `--vgui-clay-button` | `#7D8078` | `LightClayButtonBG` | Property sheet footer buttons |
| `--vgui-clay-bottom` | `#5C5957` | `ClaySheetBottom` | Property sheet bottom strip |
| `--vgui-clay-dark` | `#2F312D` | `DarkClayBG` | Clay insets |
| `--vgui-clay-glyph` | `#ADB5A8` | `ClayLightGreen` | Titlebar glyphs |
| `--vgui-clay-glyph-dim` | `#A6ACA2` | `ClayDimLightGreen` | Unfocused titlebar glyphs |

> **Unverified:** `--vgui-info` (`#0900FF`) is community-derived and is *not*
> legible on any surface in this theme (1.15:1). Treat it as a period detail to
> be reproduced in a server-browser mock-up, not as a usable token.

---

## 4. The bevel — the one primitive that matters

A bevel is nothing more than a 1px border whose colour depends on the side.
Two states exist, and they are exact inverses of each other.

```css
/* Raised / outset: lit top & left, shadowed bottom & right */
.vgui-bevel {
  border-top:    1px solid var(--vgui-bevel-light);
  border-left:   1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right:  1px solid var(--vgui-bevel-dark);
}

/* Recessed / inset: the exact inverse */
.vgui-bevel--inset {
  border-top:    1px solid var(--vgui-bevel-dark);
  border-left:   1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-light);
  border-right:  1px solid var(--vgui-bevel-light);
}
```

In Valve's `.styles` syntax the same thing is a `render_bg` program:

```
render_bg
{
    1="fill(x0,y0,x1,y0+1,BorderBright)"       // top row      -> lit
    2="fill(x0,y1-1,x1,y1,BorderDark)"         // bottom row   -> shadowed
    3="fill(x0,y0,x0+1,y1,BorderBright)"       // left column  -> lit
    4="fill(x1-1,y0,x1,y1,BorderDark)"         // right column -> shadowed
}
```

### How to implement it — and how not to

| Approach | Verdict |
| --- | --- |
| Four explicit `border-*` declarations (above) | ✅ **Use this.** Deterministic, respects `box-sizing`, degrades to a real border in forced-colors mode. |
| `box-shadow: inset 1px 1px 0 light, inset -1px -1px 0 dark` | ✅ Fine, and the only option for scrollbar pseudo-elements. Costs `outline` coexistence. |
| `border-color: light dark dark light` shorthand | ✅ Works, but the four-value order (`top right bottom left`) is a permanent readability trap. |
| `border-style: inset` / `outset` | ❌ **Do not.** The browser derives both shades from the element's *own* `background-color`, so the bevel silently changes the moment it sits on a different surface or a theme is applied. |
| 9-slice background images | ❌ Not worth it for a 1px bevel; loses `box-sizing` behaviour and cannot be recoloured. |

**Pressed states invert the bevel, they do not shift the content.** A VGUI
button at `:active` swaps light and dark; it does *not* translate by 1px. The
perceived movement is entirely the bevel flipping.

**Bevel edges never mirror for RTL.** Valve never mirrored them, so
`dir="rtl"` must not flip `border-left`/`border-right`. Light stays light.

### Focus rings

Two distinct rings exist in Valve's styles and they are not interchangeable:

| Control class | Ring |
| --- | --- |
| Buttons, scrollbar buttons, file inputs | `outline: 1px dashed var(--vgui-bevel-dark); outline-offset: -4px;` |
| Text inputs, checkboxes, radios, sliders, selects | `outline: 1px dotted #000; outline-offset: -3px;` |

The real Steam client is more elaborate — a 2px `BorderBright` ring plus a 1px
black inner ring on buttons — but the dashed/dotted pair above is what the CSS
port ships and what this library should reproduce.

> **Accessibility note.** `outline: 1px dotted black` on a `#3E4637` input is
> effectively invisible (black on dark green). Every component doc specifies a
> `:focus-visible` ring that meets WCAG 2.4.11; treat the literal Valve ring as
> the *fallback* and the high-contrast ring as the default.

---

## 5. Typography

Valve's `steamscheme.res` declares a font roster. The web port collapses it to
one stack, which is a deliberate simplification worth documenting.

**Valve's roster (`steamscheme.res` `Fonts` block):**

| Name | Face | Size / weight | Used for |
| --- | --- | --- | --- |
| `Default` | Arial | 13 | Body |
| `DefaultBold` | Arial | 15 | Emphasis |
| `DefaultSmall` | Arial | 11 / 800 | Captions |
| `DefaultVerySmall` | Arial | 12 / 800 | Dense chrome |
| `DefaultLarge` | Arial | 18 | Dialog headings |
| `ListSmall` | Arial | 12 | List rows |
| `UiBold` | Arial | 14 / 1000 | Buttons, labels, tabs |
| `UiHeadline` | Arial | 13 / 1000 | Section headings |
| `HeadlineLarge` | Arial | 22 / 1000 | Title text |
| `MenuLarge` | Arial | 16 / 600 | Main menu |
| `DefaultFixed`, `ConsoleText` | Lucida Console | 10 | Console, code |
| `Marlett` | Marlett | 14 / 16 | Titlebar glyphs (see §7) |
| `FriendsSmall` / `FriendsMedium` / `FriendsVerySmall` | Arial | 12 / 13 / 12, weight 800 | Friends list |

`steam.styles` additionally names `basefont="WineTahomaBit"` and
`basefontbold="Tahoma Bold"`, which is why the community KDE theme ships a
`WineTahomaBit.ttf`. **In a browser context, use the CSS port's stack.**

**Web stack (use this):**

```css
--vgui-font: "Trebuchet MS", "Verdana", "DejaVu Sans", Tahoma, sans-serif;
--vgui-font-mono: "Lucida Console", "DejaVu Sans Mono", Consolas, monospace;
--vgui-font-size: 14px;
--vgui-line-height: 1.25;
```

**Independent of the stack, two rules are non-negotiable:**

1. **Uppercase + wide tracking for chrome labels.** Window titles, legends and
   section headings are `text-transform: uppercase; letter-spacing: 2px;
   font-size: 12px; font-weight: bold; color: #fff`. This is the single most
   recognisable typographic signature of the theme.
2. **Pixel-crisp rendering is opt-in.** The CSS port sets
   `-webkit-font-smoothing: none` and `image-rendering: pixelated` globally.
   Both override the user's own rendering preferences and measurably hurt
   legibility, so this library exposes them as a `.vgui-crisp` opt-in class
   rather than shipping them on `body`.

---

## 6. Metrics

| Thing | Value | Source |
| --- | --- | --- |
| Bevel width | `1px` | universal |
| Button height | `25px` | `steam_shared.css` |
| Button min-width | `75px` | `steam_shared.css` |
| Button text inset | `4px 0 0 0`, `text-align: left` | `steam.styles` |
| Checkbox / radio | `15 × 15px` | `steam_shared.css` |
| Text input inset | `4px 0 4px 0` | `steam.styles` |
| Titlebar height | `18px` (web) / `28px` (Valve `LayoutTemplates`) | both |
| Frame control buttons | `20 × 20px` at `ypos 8` | `steamscheme.res` |
| Frame resize grip | `14 × 14px` (Valve) / `12 × 12px` (web) | both |
| Scrollbar width | `18px` | `steam_shared.css` |
| Scrollbar button | `18 × 18px` | `steam_shared.css` |
| Progress bar height | `26px` outer, `16px` fill, `4px` gutter | `steam_shared.css` |
| Slider thumb | `8 × 16px` on a `4px` track | `steam_shared.css` |
| Dialog button | `92 × 24px` | `steamscheme.res` `LayoutTemplates` |
| Window max-width (web) | `780px` | `steam_shared.css` |

A recurring spacing scale falls out of these: **2, 4, 6, 8, 10, 12, 18, 20,
25, 26**. There is no 4px/8px grid — do not impose one.

---

## 7. Assets — replacing Valve's sprites

The real client draws checkmarks, radio dots, scrollbar arrows, frame buttons
and the resize grip as `.tga` sprites in `OG-Steam/OG-Steam/graphics/`:

```
chkUnselStd chkSelStd chkUnselFocus chkSelFocus chkUnselDis chkSelDis
chkIndeterminate chkSomeSelStd
radUnselStd radSelStd radSelFocus radUnselDis radSelDis   (no radUnselFocus exists)
icon_down_{default,hover,disabled,focus}   9x6
icon_left_{default,hover}  icon_right_{default,hover}   13x13
icon_up_*                                  ABSENT — see below
icon_button_{back,forward,home,reload,stop,detail}_{,over,down,disabled}
scroll_up scroll_down scroll_left scroll_right
Window-{Close,Max,Min,Restore} resizer
minithrobber01..12 minithrobberinactive
rampUp_1..4 rampDown_1..4 sliderticks loop_1..8
```

**Measured sizes, and two gaps in this extract.** Every sprite above was
measured from its `.tga` header (width at bytes 12–13, height at 14–15,
little-endian):

- All 13 `minithrobber*` and all 8 `ramp*` sprites are **20×20**.
- `icon_down_*` is **9×6**; `icon_left_*` and `icon_right_*` are **13×13**.
  The arrow families are **not the same size or weight**, so drawing all four
  directions from one primitive is the only consistent option.
- **`icon_up_*` does not exist** — not one file of any kind, despite `uparrow`
  at `steam.styles:403` referencing `graphics/icon_up_default`. `SpinBox.md` §9
  covers the consequence.
- `icon_down_disabled` and `icon_down_focus` exist on disk but **no style block
  declares them**; only `_default` and `_hover` are referenced
  (`steam.styles:393`/`:398`).
- `downarrow`, `uparrow` and `rightarrow` are declared (`steam.styles:393–416`)
  and **applied by no layout anywhere in the corpus**.

**Whether this extract is complete is unresolved.** The missing `icon_up_*`
suggests it is not. That matters because several components would otherwise
inherit Valve's exact metrics.

**`ThrobberImagePanel` has no stylesheet block at all.** Its only style is the
layout-local `Panel_transparent` (`uinavigatorpanel.layout:491-494`), which sets
`bgcolor="none"` and nothing else. There is no `Throbber*` entry in
`steam.styles`.

**`rampDown_4` is the only ramp sprite any layout references**, and it is used as
a *static* `ImagePanel` placeholder — named `PageLoadThrobber` — at
`htmlpopup.layout:16` and `overlaywebbrowser.layout:18`. The other 15 ramp
sprites are referenced nowhere. `LevelMeter.md` §9 covers this.

This library must **not** ship binary sprites. Two proven replacement strategies
exist, both used by the reference projects:

**a) Inline SVG as a `data:` URI.** `HL1.css` does exactly this for its
scrollbar arrows and close button. It keeps the sprite pixel-exact, needs no
extra request, is recolourable by editing the data URI, and survives bundling.

```css
.vgui-scrollbar-button--down {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='7' height='4'%3E%3Cpath d='M0 0h7L3.5 4z' fill='%23d8ded3'/%3E%3C/svg%3E");
}
```

**b) Pure CSS geometry.** Checkmarks and radio dots are small enough to draw
with two rotated borders / a `radial-gradient`. Cheaper, but harder to keep
pixel-identical to the original.

Use **(a)** for anything with a distinctive silhouette (arrows, frame glyphs,
the resize grip) and **(b)** for checkmarks and radio dots.

**Frame glyphs and the Marlett font.** Valve's minimise, maximise and close
glyphs come from Marlett, a symbol font shipped with Windows. Marlett is not
licensed for web embedding. **Unverified:** the exact codepoints Valve used.
Treat the glyphs as SVGs and do not attempt to reproduce Marlett.

**`image-rendering: pixelated` must be scoped to the sprite rules only.** Applied
globally it blockily upscales every photograph and vector in the page.

---

## 8. Known disagreements between sources

Documented rather than resolved, because both are period-accurate.

| Question | Valve VGUI1 (`steamscheme.res`) | Valve VGUI2 (`steam.styles`) | Community CSS port |
| --- | --- | --- | --- |
| Bevel light | `128 128 128` → `#808080` | `BorderBright` | `#899281` (greened) |
| Bevel dark | `40 46 34` → `#282E22` | `BorderDark` | `#292D23` |
| Bevel opacity | opaque | `196/255` ≈ 77% | opaque |
| Selection | `145 134 60` → `#91863C` (`MaizeBG`) | `#FF9B00` orange | `#96892D` |
| Error red | *(not defined)* | `Highlight3` `173 69 71` → `#AD4547` | `#E2251A` |

Two further quirks worth knowing before you read a stylesheet and draw a
conclusion from it:

- **`Text` and `Label` are the same colour.** `steam.styles` defines both as
  `160 170 149` (`#A0AA95`) — `Text` at line 57, `Label` at line 67. A control
  written with `textcolor = Text` and one written with `textcolor = Label` are
  visually identical, so *do not* read a semantic distinction into the choice.
  Where a control really does look different when selected (`MainNav`,
  `ListPanel`), the difference comes from `selectedtextcolor = White`, not from
  the `Text`/`Label` split.
- **The error red is a later addition and is much darker than the CSS port's.**
  `Highlight3 = #AD4547` is described in `steam.styles:91` as "red for errors,
  blocked, etc.". The port's `#E2251A` is roughly twice the chroma. `#AD4547`
  on `--vgui-surface` `#4C5844` is **1.89:1**; `#E2251A` is **2.06:1**. Both
  fail as text on the panel, which is why §10 insists error state is never
  colour-only.

This documentation standardises on the **community/CSS-port values**
(`#899281` / `#292D23`) because they are the ones this library already ships and
because they are opaque, which makes them reproducible. The `#808080`/`#282E22`
pair is available as the `--vgui-theme-vgui1` variant for anyone chasing exact
2003 fidelity.

> **Open question, low priority:** which Steam client versions shipped which
> pair is not established. Closing it would mean diffing
> `SteamTracking/SteamTracking:resource/steamscheme.res` across 2007–2015.

---

## 9. The theme layer

VGUI has **no theme system**. A client loaded exactly one scheme at a time via
`SetScheme("ClientScheme.res")` and changing it required a restart. There is no
light mode, no dark mode, no system-preference following, and no per-component
override.

This library therefore has to invent one, and the natural mapping is a single
attribute on a root element:

```html
<body data-vgui-theme="green">
```

| Variant | Defines | Precedent |
| --- | --- | --- |
| `green` *(default)* | §3 above | Valve's VGUI1 scheme |
| `vgui1` | `--vgui-bevel-light: #808080; --vgui-bevel-dark: #282E22` | `steamscheme.res` exact |
| `black` | Black-green palette | `vgui.css` `blacksteam` variant |
| `warm` | Beige/clay palette | `OldSteam-Theme` "TF2-esque" variant |
| `clay` | Grey property-sheet chrome | `ClayBG` family |

Two rules for the theme layer:

1. **Every token is defined on `[data-vgui-theme]`, never on `:root`.** A
   component that reads a token outside a themed subtree must still render.
2. **No component may hardcode a shared value.** If a shared value is missing
   from §3, that is a signal the token list is incomplete — add it there. A
   *component-local* metric or drawing value is declared on the component root as
   `--vgui-<name>-*`, and when it aliases a shared token it is written with the
   literal as a fallback (`var(--vgui-text-strong, #ffffff)`) so the component
   still resolves when it is rendered outside any themed subtree. That fallback
   is the only place a hex value is allowed outside this token list.

The tokens live in `src/styles/tokens.css`; `src/styles/theme.css` imports them
and adds only the document-level element defaults. Both are published, so a
consumer who wants the variables without the element defaults can import
`@dalcvil/steam-green-react/styles/tokens.css` alone.

---

## 10. Accessibility baseline

Contrast was computed, not estimated. Ratios are against the surface each token
is actually used on.

| Foreground | Surface | Ratio | WCAG |
| --- | --- | --- | --- |
| `--vgui-text-strong` `#FFFFFF` | `--vgui-surface` `#4C5844` | **7.54:1** | AAA |
| `--vgui-text` `#D8DED3` | `--vgui-surface-dark` `#3E4637` | **7.17:1** | AAA |
| `#232421` | `--vgui-heading` `#C4B550` (tooltip) | **7.48:1** | AAA |
| `--vgui-text` `#D8DED3` | `--vgui-surface` `#4C5844` | **5.49:1** | AA |
| `--vgui-success` `#1AE225` | `--vgui-surface-dark` `#3E4637` | **5.59:1** | AA |
| `--vgui-heading` `#C4B550` | `--vgui-surface-dark` `#3E4637` | **4.72:1** | AA |
| `--vgui-link` `#AAAAAA` | `--vgui-surface-dark` `#3E4637` | **4.23:1** | AA-large only |
| `--vgui-text-muted` `#A0AA95` | `--vgui-surface-dark` `#3E4637` | **4.06:1** | AA-large only |
| `--vgui-heading` `#C4B550` | `--vgui-surface` `#4C5844` | **3.61:1** | AA-large only |
| `--vgui-steam-green` `#7EA64B` | `--vgui-surface-dark` `#3E4637` | **3.48:1** | AA-large only |
| `--vgui-link` `#AAAAAA` | `--vgui-surface` `#4C5844` | **3.24:1** | AA-large only |
| `--vgui-text-dim` `#758666` | `--vgui-surface` `#4C5844` | **1.92:1** | ❌ fails |
| `--vgui-text-disabled` `#75806F` | `--vgui-surface` `#4C5844` | **1.82:1** | ❌ fails |
| `--vgui-danger` `#E2251A` | `--vgui-surface-dark` `#3E4637` | **2.11:1** | ❌ fails |
| `--vgui-info` `#0900FF` | `--vgui-surface-dark` `#3E4637` | **1.15:1** | ❌ fails |
| bevel light `#899281` | `--vgui-surface` `#4C5844` | **2.33:1** | ❌ fails 1.4.11 |
| bevel dark `#292D23` | `--vgui-surface` `#4C5844` | **1.87:1** | ❌ fails 1.4.11 |
| `--vgui-friends-ignored` `#F86C4F` | `--vgui-surface-dark` `#3E4637` | **3.39:1** | ❌ fails |
| `--vgui-friends-ignored` `#F86C4F` | `--vgui-surface` `#4C5844` | **2.60:1** | ❌ fails |
| `--vgui-friends-selected` `#111111` | `--vgui-surface` `#4C5844` | **1.24:1** | ❌ fails 1.4.11 |

A second pass measured the pairs that only appear inside specific components —
the gutters of fields in both variants, the selection highlight, the clay chrome,
and the *cross-surface* comparisons used to justify "this state is not
perceivable":

| Foreground | Surface | Ratio | WCAG |
| --- | --- | --- | --- |
| `--vgui-text` `#D8DED3` | `black` variant field `#080808` | **14.60:1** | AAA |
| `--vgui-heading` `#C4B550` | `black` variant field `#080808` | **9.61:1** | AAA |
| bevel light `#899281` | `black` variant field `#080808` | **6.19:1** | AA |
| `--vgui-text-dim` `#758666` | `black` variant field `#080808` | **5.11:1** | AA |
| `--vgui-text` `#D8DED3` | `green` field `#3E4637` | **7.17:1** | AAA |
| `--vgui-heading` `#C4B550` | `green` field `#3E4637` | **4.72:1** | AA |
| `--vgui-text-muted` `#A0AA95` | `green` field `#3E4637` | **4.06:1** | AA-large only |
| bevel light `#899281` | `green` field `#3E4637` | **3.04:1** | ✅ 1.4.11 |
| `--vgui-text-strong` `#FFFFFF` | `--vgui-clay-button` `#7D8078` | **4.01:1** | AA |
| `#232421` | `--vgui-accent-darker` `#96892D` | **4.39:1** | AA |
| `#232421` | `--vgui-accent-dark` `#91863C` (selected row) | **4.22:1** | AA |
| `--vgui-text-strong` `#FFFFFF` | `--vgui-accent-dark` `#91863C` | **3.70:1** | ❌ fails |
| `--vgui-text-strong` `#FFFFFF` | `--vgui-accent-darker` `#96892D` | **3.55:1** | ❌ fails |
| `--vgui-accent-dark` `#91863C` | `--vgui-surface-dark` `#3E4637` | **2.66:1** | ❌ fails 1.4.11 |
| `--vgui-text` `#D8DED3` | `--vgui-accent-dark` `#91863C` | **2.70:1** | ❌ fails |
| `--vgui-text` `#D8DED3` | `--vgui-accent-darker` `#96892D` | **2.59:1** | ❌ fails |
| `--vgui-text-dim` `#758666` | `green` field `#3E4637` | **2.51:1** | ❌ fails |
| `--vgui-text-disabled` `#75806F` | `green` field `#3E4637` | **2.38:1** | ❌ fails |
| slider track `#000` | `--vgui-surface` `#4C5844` | **2.14:1** | ❌ fails 1.4.11 |
| `--vgui-surface-light` `#5A6A50` | `--vgui-surface` `#4C5844` | **1.30:1** | ❌ fails 1.4.11 |
| `--vgui-surface-dark` `#3E4637` | `--vgui-surface` `#4C5844` | **1.30:1** | ❌ fails 1.4.11 |
| bevel dark `#292D23` | `green` field `#3E4637` | **1.43:1** | ❌ fails 1.4.11 |
| bevel dark `#292D23` | `black` variant field `#080808` | **1.42:1** | ❌ fails 1.4.11 |

Four conclusions follow directly from these numbers and they recur throughout
the component specs:

- **The field interior is `DarkGreenBG`, not black — and that costs the
  placeholder.** `steam.styles:2402` gives `TextEntry` `bgcolor = DarkGreenBG`,
  and the CSS port agrees (`greensteam.css:190` is `background: #3e4637`). Body
  text on it is excellent (**7.17:1**, AAA). But the `TextEntry:empty` hint style
  is `textcolor = Label` (`#A0AA95`, **4.06:1**, AA-large only) and the CSS
  port's dimmer `#758666` falls to **2.51:1** — a real failure, not a rounding
  quirk. **The black interior in the second table belongs to the `black` variant**
  (`blacksteam.css:190` is `#080808`), where the same placeholder is fine
  (**5.11:1**). Do not carry the black theme's placeholder colour into the green
  theme: use `--vgui-text-muted` for hint text, and never `--vgui-text-dim`.
- **`#000` appears in the green theme in exactly two places: the slider track
  and the text field interior.**
  `greensteam.css:215`, `:260` and `:270` paint the range track black. It is
  **2.14:1** against `--vgui-surface`, so the track's *extent* is invisible and
  only the 8×16 thumb locates it — which is why `Slider` (§`components/Slider.md`)
  needs tick marks and a numeric readout rather than relying on the track. Every
  `TextEntry`/`ComboBox` interior is also genuinely black, which is the one place
  the theme leaves its palette; that interior is `--vgui-field-bg`.
- **State changes expressed only as a face-colour shift are invisible.** Every
  cross-surface pair here lands between **1.30:1** and **2.33:1**. Hover, pressed
  and selected states therefore *cannot* rely on the fill — the bevel inversion
  and a shape cue have to carry them.
- **The default selection highlight was broken as shipped; it is fixed.**
  `theme.css` set `::selection { background-color: #96892D }` with no `color`,
  so the inherited `#D8DED3` was used: **2.59:1**. It now also sets
  `color: var(--vgui-selection-text)` (`#232421`), which reaches **4.39:1**.
- **Colour is never a sufficient indicator on its own (WCAG 1.4.1).** This theme
  is built entirely from colour, so the two components that *encode state in
  colour* are the ones that need explicit non-colour cues: `Avatar` (status ring
  — see `components/Avatar.md` §8) and `ColorPicker` (swatches — see
  `components/ColorPicker.md` §8). Both must pair the colour with a shape, a
  label or a name. `--vgui-friends-ignored` `#F86C4F` fails contrast on **both**
  surfaces (**3.39:1** / **2.60:1**), so an ignored user's name is not legible
  from colour alone at any size.

**Eight baseline rules apply to every component in this library:**

1. **Every maize highlight needs dark text.** `::selection` uses
   `#96892D`, and selected list/menu/option rows use `--vgui-accent-dark`
   `#91863C`. Against both, `--vgui-text-strong` white is a failure (**3.55:1**
   and **3.70:1**) and `--vgui-text` is worse (**2.59:1** / **2.70:1**). Use
   `color: #232421`, which reaches **4.39:1** / **4.22:1** and happens to match
   how Valve draws selected list rows. This pattern repeats in `Select`, `Menu`,
   `List`, `Table` and `TreeView` — it is a palette-level rule, not a
   per-component one.
2. **The tooltip is the one place the theme inverts.** Valve's real tooltip is
   `BgColor Orange` + near-black text. In green, `#C4B550` background with
   `#232421` text gives 7.48:1 — use it. Keep `role="tooltip"` +
   `aria-describedby`.
3. **The disabled treatment is decorative, not semantic.** `DisabledText1` over
   `DisabledText2` is a 1.82:1 outline-shadow trick. It is illegible by design.
   Never carry meaning through it — a disabled control must still be announced
   as disabled by assistive tech, and any *reading* text must use a legible token.
4. **The bevel alone fails WCAG 1.4.11.** The lit edge is 2.33:1 against the
   button face and 1.87:1 for the shadowed edge; the requirement for a UI
   component boundary is 3:1. Any control whose only affordance is the bevel
   needs an additional cue — a text label, an icon, or a 3:1 outline.
5. **Never use `appearance: none` without a real element underneath.** Every
   custom-drawn control must be a genuine `<input>`/`<button>`/`<select>` with a
   visible `<label>` (`htmlFor`/`id`), so `:invalid`, `:required` and the
   accessible name survive.
6. **Fixed heights must not clip text.** `height: 25px` on a button breaks at
   200% text zoom (WCAG 1.4.4). Specify `min-height: 25px` plus vertical padding
   and let the bevel own the border box. Where a fixed height is unavoidable
   (the `18px` scrollbar, the `20 × 20` frame buttons), the *minimum target size*
   rule in WCAG 2.5.8 (24×24) applies instead and the control needs an expanded
   hit area via padding or a `::before` overlay.
7. **`::-webkit-scrollbar` is non-standard.** Firefox has no way to draw
   scrollbar arrow buttons, so a fully custom scrollbar needs a JS-driven
   `<div role="scrollbar">`. Motion must respect `prefers-reduced-motion`.
8. **Motion is opt-in and minimal.** VGUI was a static toolbar; the only real
   animation in the client was the `minithrobber` spinner. Anything this library
   animates must be wrapped in `@media (prefers-reduced-motion: no-preference)`.

---

## 11. Component conventions

**Naming.** Components in this library are named for what they *are*, never for
the theme: `Button`, `Panel`, `TextInput`, `ProgressBar`. The theme lives in the
tokens; it is not part of a component's identity.

**CSS classes.** Scoped `vgui-<name>` with BEM-style modifiers:

```
vgui-button
vgui-button--full-width
vgui-button__label
```

**File layout.** One directory per component under `src/components/<Name>/`:

```
<Name>.tsx            implementation
<Name>.css            colocated styles, imported by the .tsx
<Name>.stories.tsx    Storybook story, one per variant
index.ts              re-exports the value AND the props type
```

Every new component is also re-exported from `src/index.ts`, which is the only
public entry point. Keep components tree-shakable: the CSS import is the only
side effect allowed.

**Props.** Public props carry a one-line `/** … */` doc comment so Storybook's
autodocs table is filled in.

**Validation.** `pnpm run typecheck`, `pnpm test`, `pnpm run build`,
`pnpm run build-storybook`.

---

## 12. Documentation template

Every file in `docs/components/` follows the same sections:

1. **Purpose** — one paragraph, what it is for.
2. **VGUI original** — the VGUI1/VGUI2 control name and the `steam.styles` section it comes from, or an explicit note that the control is composed.
3. **Anatomy** — the DOM/visual parts, in order.
4. **States** — normal / hover / active / focus-visible / disabled, plus selected, indeterminate, etc.
5. **Tokens** — every colour, size and font it uses.
6. **CSS recipe** — the bevel and any signature declarations.
7. **React API** — props with one-line doc comments.
8. **Accessibility** — markup, ARIA, keyboard, contrast caveats.
9. **Assets** — which `.tga` sprites it replaces and how.
10. **Examples** — realistic usage.
11. **Open questions** — anything not established from the primary sources.
