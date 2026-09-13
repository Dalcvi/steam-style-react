# RichText

## Purpose

A block of styled inline text on a recessed dark surface, where individual runs
carry their own formatting — links, bold, emphasis — rather than the paragraph
carrying one style.

## VGUI original

```
RichText
{
    bgcolor = DarkGreenBG
    textcolor = White
    selectedtextcolor = White
    selectedbgcolor = MaizeBG
    font-family = basefont
    font-size = 14
    font-size = 16 [$OSX]
    font-weight = 400
    inset = "0 0 0 0"
    render_bg
    {
        // lines around
        1="fill( x0, y0, x1, y0 + 1, BorderDark )"       // top
        2="fill( x0, y1 - 1, x1, y1, BorderBright )"     // bottom
        3="fill( x0, y0, x0 + 1, y1 - 1, BorderDark )"   // left
        4="fill( x1 - 1, y0, x1, y1, BorderBright )"     // right

        5="fill( x0 + 1, y0 + 1, x1 - 1, y1 - 1, DarkGreenBG )"  // inside
    }
}

RichTextInterior {}

// style of links in a rich text control
"RichText url"
{
    font-size = 14
    font-size = 16 [$OSX]
    textcolor = White
    selectedtextcolor = White
    font-style = underline
}

"RichText url:hover"
{
    textcolor = White
}

"CFriendPanel RichText URL"
{
    textcolor = White
    font-style = underline
    font-size = 14
    font-size = 16 [$OSX]
}

// style of bold text in a rich text control
"RichText bold"
{
    font-size = 14
    font-size = 16 [$OSX]
    font-weight = 1000
}

"RichText emphasis"
{
    font-size = 14
    font-size = 16 [$OSX]
    font-style = italic
}
```

Line ranges: `RichText` `:1935`, `RichTextInterior` `:1958`, `"RichText url"`
`:1961`, `"RichText url:hover"` `:1970`, `"CFriendPanel RichText URL"` `:1976`,
`"RichText bold"` `:1985`, `"RichText emphasis"` `:1992`.

**The bevel is inverted**: top/left is `BorderDark` and bottom/right is
`BorderBright`, the reverse of `Button` (`:418`) and `ScrollBarHandle` (`:2238`).
That is the theme's recessed orientation, and `ListPanel` (`:1156`) uses the
**identical** `render_bg` — same four fills, same `DarkGreenBG` interior. A
`RichText` and a `ListPanel` are the same surface, which is why text reads the
same in both.

Per-place overrides exist because a `RichText` inside a list must match the list
rather than the panel — and they change the text colour as well as the frame:

```
"ListPanel RichText"
{
    textcolor = Text
    font-family = basefont
    font-size = 14
    font-size = 16 [$OSX]
    bgcolor = none
    render_bg {}
}

"ListPanel RichText url"
{
    textcolor = Text
    font-family = basefont
    font-size = 14
    font-size = 16 [$OSX]
    font-style = underline
}

"ListPanel RichTextInterior"
{
    bgcolor=none
    render_bg {} 
}

"CFriendPanel RichText URL"
{
    textcolor = White
    font-style = underline
    font-size = 14
    font-size = 16 [$OSX]
}
```

Line ranges: `"ListPanel RichText"` `:1597`, `"ListPanel RichText url"` `:1607`,
`"ListPanel RichTextInterior"` `:1616`, `"CFriendPanel RichText URL"` `:1976`.

Two differences that matter. **Inside a list, the text is `Text`, not `White`** —
a `RichText` on a `Panel` is white and the same `RichText` in a `List` is not —
and **the frame is removed with an empty `render_bg {}`** rather than by hiding a
border. The `--list` variant is therefore not a cosmetic override; it is a
different foreground colour and no frame at all.

Metrics, from the layout-template block:

```
RichText.InsetX   "6"     :340
RichText.InsetY   "6"     :341
```

### Six things to extract

1. **`"RichText url:hover"` is a no-op.** It sets `textcolor = White`, and so does
   the base `"RichText url"` block. **Links in this theme have no hover
   feedback** beyond the underline they always carry. That is a real break from
   `Link`/`URLLabel`, whose base colour is `Label` (`160 170 149`) and which
   *does* turn `White` on hover (`URLLabel:Hover`, `:2692`). Do not copy
   `Link`'s hover into inline rich-text links if the goal is fidelity — but see
   Accessibility.
2. **Bold is `font-weight = 1000`, not `700`.** `steamscheme.res` uses the
   thousand-step scale, and `1000` is the top of it: `DefaultBold`
   (`steamscheme.res:262`, `weight 1000` at `:268`), `UiBold` (`:324`),
   `UiHeadline` (`:333`) and `HeadlineLarge` (`:442`) all reach it, while
   `DefaultSmall` (`:281`) stops at `800` (`:287`). In CSS `font-weight: 1000`
   clamps to the heaviest available face. If only Regular and Bold are loaded,
   the visual result is Bold — so the token should be
   `--vgui-font-weight-bold: 700` in practice, with 1000 recorded as the
   original.
3. **`RichTextInterior {}` is completely empty**, and its `"ListPanel
   RichTextInterior"` override at `:1616` carries only `bgcolor = none` and
   another empty `render_bg {}`. An empty block is not "no styling" —
   it is a *named hook* that the engine resolves and finds nothing in. It exists
   so a scheme can restyle the interior without touching the frame. In CSS it is
   an unused `class` on the inner element, and it is worth emitting so the hook
   is not lost.
4. **`inset = "0 0 0 0"` contradicts `RichText.InsetX/InsetY = "6"`.** The block
   says no inset; the scheme's template says 6px on both axes. Both are in the
   same corpus and only one can be live. **6px is the value used here**, because
   a recessed text surface with a 0px inset puts glyphs directly on the 1px
   border, which is visibly wrong, and because the `.InsetX`/`.InsetY` keys exist
   specifically for this control.
5. **Text selection and menu highlighting share one colour.** `selectedbgcolor =
   MaizeBG` (`145 134 60`) — and `MaizeBG` is commented in `steamscheme.res:44`
   as `// background color of any selected text or menu item`. So selected text
   in a paragraph and a hovered menu row are the same maize. That is a deliberate
   economy of palette, and it is why `Menu` and `RichText` look related.
6. **`font-size = 14` locally, `font-size = 16 [$OSX]`.** Every text block in the
   corpus carries the same OSX override, so the theme has two sizes: 14 on
   Windows/Linux and 16 on macOS. Represent it as one token that the platform
   media query adjusts, not as two hard-coded values per component.

Note also `RichTextCorner = "21 20 24 255"` (`steam.styles:283`) — a much darker
corner colour than anything else in the green palette, and **no block in the file
references it.** Another declared-but-unused token.

## Variants

| Variant | Class | Notes |
| --- | --- | --- |
| Standalone | `vgui-rich-text` | `RichText`, recessed frame |
| In a list | `vgui-rich-text--list` | `"ListPanel RichText"` |
| Bare | `vgui-rich-text--interior` | `RichTextInterior {}` — no frame |
| In-line runs | — | `url`, `bold`, `emphasis` |

## Anatomy

```html
<div class="vgui-rich-text">
  <p class="vgui-rich-text__interior">
    The server will restart in
    <strong class="vgui-rich-text__bold">five minutes</strong>.
    See <a class="vgui-rich-text__url" href="/rules">the rules</a>
    for <em class="vgui-rich-text__emphasis">why</em>.
  </p>
</div>
```

`<p>`, `<strong>`, `<em>` and `<a>` are the correct elements — the three named
styles map one-to-one onto them, and using them gives the outline, the emphasis
semantics and the link behaviour for free.

## States

| Run | Idle | Hover | Selected |
| --- | --- | --- | --- |
| Base text | `White` on `DarkGreenBG` | — | `White` on `MaizeBG` *(orig.)* |
| `url` | `White`, underlined | `White`, underlined — **no change** | `White` on `MaizeBG` *(orig.)* |
| `bold` | `font-weight: 1000` | — | — |
| `emphasis` | `italic` | — | — |
| Disabled | **not defined anywhere** | — | — |
| Focus | **not defined anywhere** | — | — |

There is **no disabled and no focus style for `RichText`** in the corpus. The
"Selected" column records the transcribed originals; the CSS recipe deliberately
replaces the selection text colour with `#232421`, for the contrast reason given
under `## Accessibility`.

## Tokens

| Token | Value | Where |
| --- | --- | --- |
| `--vgui-richtext-bg` | `#3E4637` (`62 70 55`) | `DarkGreenBG`, `steamscheme.res:48` |
| `--vgui-richtext-text` | `#FFFFFF` | `textcolor = White` (`steam.styles:1938`) |
| `--vgui-richtext-selection-bg` | `#91863C` (`145 134 60`) | `MaizeBG`, `steamscheme.res:44` |
| `--vgui-richtext-inset` | `6px` | `RichText.InsetX/InsetY`, `steam.styles:340–341` |
| `--vgui-richtext-font-weight-bold` | `700` (origin `1000`) | `"RichText bold"`, `:1985` |
| `--vgui-text-hover` | `#E3E41F` | **new use** — the hover for `url`; `foundations.md:83` |
| `--vgui-focus-ring` | `#292D23` | **new use** — the `url` focus ring. **Not in `foundations.md`**; the value is `BorderDark` / `--vgui-bevel-dark`, used by `TextInput`, `Link`, `Tabs`, `Checkbox`, `Radio`. Worth adding to §3. |
| `--vgui-bevel-light` | `#899281` | *(community `BorderBright`)* |
| `--vgui-bevel-dark` | `#292D23` | *(community `BorderDark`)* |
| `--vgui-richtext-corner` | `#151418` (`21 20 24`) | `RichTextCorner` — **declared, unused** |

## CSS recipe

```css
.vgui-rich-text {
  position: relative;
  background-color: var(--vgui-richtext-bg, #3e4637);
  color: var(--vgui-richtext-text, #fff);
  font-family: var(--vgui-font, 'Trebuchet MS', 'Verdana', sans-serif);
  font-size: 14px;                    /* 16px on macOS, see foundations §5 */
  font-weight: 400;
  /* Recessed: top/left dark, bottom/right lit — the inverse of Button. */
  border-top: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-light);
  /* RichText.InsetX / InsetY = 6. The block's inset = "0 0 0 0" is not used. */
  padding: var(--vgui-richtext-inset, 6px);
}

.vgui-rich-text__interior {   /* RichTextInterior {} — an empty hook, kept */
  margin: 0;
}

.vgui-rich-text::selection,
.vgui-rich-text ::selection {
  /* Two maizes exist: the corpus's selectedbgcolor (MaizeBG #91863C) and the
     theme layer's ::selection (#96892D). Dark text is required on both. */
  background-color: var(--vgui-richtext-selection-bg, #91863c);
  color: #232421;                     /* 4.22:1; White is only 3.70:1 */
}

.vgui-rich-text__bold {
  font-weight: var(--vgui-richtext-font-weight-bold, 700);
}

.vgui-rich-text__emphasis {
  font-style: italic;
}

.vgui-rich-text__url {
  color: inherit;
  text-decoration: underline;
  /* "RichText url:hover" sets the same white as the base block: no hover
     change. A hover colour is added here anyway — see Accessibility. */
  text-underline-offset: 2px;
}

.vgui-rich-text__url:hover,
.vgui-rich-text__url:focus-visible {
  /* Not in the corpus — "RichText url:hover" is a no-op. --vgui-text-hover is
     the documented hover token (foundations.md:83; 7.20:1 on DarkGreenBG);
     LabelFocus #C7C4C2 (steam.styles:70, 5.67:1) is the quieter alternative. */
  color: var(--vgui-text-hover, #e3e41f);
}

.vgui-rich-text__url:focus-visible {
  outline: 1px dotted var(--vgui-focus-ring, #292d23);
  outline-offset: 2px;
}

.vgui-rich-text--list {
  /* "ListPanel RichText" — inside a list the frame is the list's, not ours. */
  border: 0;
  padding: 0;
  background: transparent;
}
```

**Do not forget the `5=` interior fill.** `RichText`'s `render_bg` draws the
bevel *and* fills the interior with `DarkGreenBG`, which is what makes the 1px
border read as a carved edge rather than an outline. Setting only `border-color`
without the matching `background-color` produces a hollow box — that is what
`RichTextInterior {}`'s emptiness would look like if you took it literally.

## React API

```tsx
export interface RichTextProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Sanitised HTML. Never pass untrusted markup — see Accessibility. */
  children?: React.ReactNode
  /** Drops the recessed frame; use inside a List or Panel. */
  interior?: boolean
}
```

Inline runs are ordinary elements, not components: `<strong>`, `<em>`, `<a>`.
Where a React-level API is needed, expose `RichTextLink`, `RichTextBold` and
`RichTextEmphasis` that render those tags with the matching class.

## Accessibility

- **Selection colours must be set on `::selection`, not just `selectedbgcolor`.**
  The corpus's `selectedbgcolor = MaizeBG` is meaningless to a browser unless it
  is mapped onto the `::selection` pseudo-element. Without it the platform
  highlight appears and the theme breaks at the exact moment the user interacts.
- **`MaizeBG` (`145 134 60`) with `White` text is only 3.70:1** — below the
  4.5:1 that WCAG 1.4.3 asks for body text, and selected text is body text.
  `foundations.md` §10 (baseline rule 1) is explicit about the remedy: **every
  maize highlight takes dark text.** `#232421` on `MaizeBG` `#91863C` is
  **4.22:1** and on the theme's `::selection` maize `--vgui-accent-darker`
  `#96892D` it is **4.39:1** — both AA. So `selectedtextcolor = White`
  (`steam.styles:1939`) is transcribed into the Tokens table as the original
  value but **is not mirrored in the recipe**; the selection rule uses
  `color: #232421`, exactly as `TextInput.md` does for
  `.vgui-text-input__field::selection`. This is a deliberate departure from the
  corpus, recorded here rather than hidden.
- **Inline links need a distinguishable state.** The corpus gives `"RichText
  url"` and `"RichText url:hover"` the same `White`, so a link is signalled
  *only* by its underline. That is technically compliant (WCAG 1.4.1 allows
  colour-plus-underline, and here it is underline alone), but underline-only is
  the weaker signal, and inside a paragraph of white text the link reads as
  emphasis rather than as a control. The recipe above adds a `:hover` and
  `:focus-visible` colour; that is a deliberate, documented departure.
- **`font-weight: 1000` must not be trusted to look like bold.** If the loaded
  font has no such face, browsers synthesise it or fall back to 700; if neither
  exists the text is *not bold at all*. Ship at least two real weights, and make
  `--vgui-richtext-font-weight-bold` the value that actually resolves.
- **`<p>`, `<strong>` and `<em>` carry semantics** that `<span style="font-weight:
  bold">` does not. The three named styles map exactly onto those elements, so
  there is no reason to use a `span` and lose the emphasis for screen readers.
- **Never render untrusted HTML.** A "rich text" component is the classic XSS
  sink. `RichText` must accept a React node or pre-sanitised markup, and the
  documentation must say so; `dangerouslySetInnerHTML` with server-supplied
  strings is the failure mode this component invites.
- **The `6px` inset is measured content, not a safe area.** Because the block
  says `inset = "0 0 0 0"` and the template says 6, a consumer may reasonably
  choose either. Whichever is chosen, the 1px bevel must remain outside the text —
  a 0px inset puts glyphs on the border, which is both ugly and, at 1px,
  effectively removes the boundary the theme relies on.
- **A recessed surface must still be reachable by the keyboard** if it contains
  links. `RichText` itself is not focusable and should not be; its `<a>` children
  are. Do not add `tabindex` to the container to "make it work" — fix the links.

## Assets

**None.** `RichText` is drawn entirely from colours and fills
(`steam.styles:1935–1956`); it references no image. `RichTextCorner`
(`:283`) is a colour, not a file, and nothing uses it.

**Art gap:** `F:\steam-style\steam-style-react\` ships **no image assets** — no
`public/`, no `src/assets/`. `RichText` is unaffected because it needs none; the
inventory of sprites the library *does* eventually need, and the two sanctioned
ways of replacing them (inline SVG `data:` URIs and pure CSS geometry), are in
`foundations.md` §7.

## Examples

```tsx
<RichText>
  <p className="vgui-rich-text__interior">
    Team Fortress 2 requires a <strong className="vgui-rich-text__bold">DirectX 9</strong>{' '}
    capable GPU. <a className="vgui-rich-text__url" href="/sysreq">Full requirements</a>
    {' '}are <em className="vgui-rich-text__emphasis">below</em>.
  </p>
</RichText>
```

## Open questions

- **`inset = "0 0 0 0"` versus `RichText.InsetX/InsetY = "6"` is unresolved.** The
  docs use 6. A running client would settle it, and the difference is visible to
  the nearest pixel — this is not a rounding question.
- **`"RichText url:hover"` being a no-op is either a bug or a decision.** If
  Valve intended links to be hover-static, then `Link`'s hover colour
  (`:2692`) is the odd one out and the two components disagree. The docs add a
  hover colour to inline links and flag it.
- **`RichTextCorner` and `"ListPanel RichTextInterior"` are both empty or
  unused**, making the interior hook unverifiable. It is emitted anyway so the
  extension point survives.
- **No disabled or focus style exists.** A read-only `RichText` (a common need
  for license text) has no precedent in the corpus.
- **The `[$OSX]` size override doubles every text block.** Whether a single
  token with a media query is faithful is a judgement call the docs make
  silently; a purist would keep both values per component.
- **Bold at weight 1000 is unachievable with a two-weight font**, so the corpus's
  intent cannot be reproduced without shipping a variable or multi-weight face.
  Nothing in the corpus ships a font file, so the weight is aspirational.
