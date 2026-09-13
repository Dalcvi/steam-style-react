# Scrollbar

`Scrollbar` is the one control VGUI draws entirely by hand: four arrow buttons, a
gutter and a thumb, every pixel of them described in `steam.styles` as a stack of
half-open `fill()` rectangles. It is also the richest block in the whole style
file — sixteen separate style blocks for four buttons — and the only place in the
corpus where a press is expressed by inverting the bevel primitive rather than by
moving or recolouring anything.

Because the native scrollbar belongs to the user agent, most of this document is
about what can be reproduced in CSS (`scrollbar-color`, `::-webkit-scrollbar`) and
what cannot. The honest summary is that the *colours* transfer completely, the
*geometry* transfers only in WebKit, and the *arrows* do not transfer as art at all.

## Purpose

Render the scrollbar of a scrolling region — list, console, rich-text pane — in the
Green Steam palette, with the inverted-bevel pressed state that the original uses
throughout the toolkit. The component must stay an ordinary scrollbar: it is a
decoration over a native scrolling mechanism, never a replacement for one.

Valve's own file treats the scrollbar as five unrelated styles rather than one
component (`Scrollbar` at `steam.styles:1999`, `Scrollbar.Horizontal` at `:2005`,
`ScrollBarButton.<direction>` at `:2011`/`:2069`/`:2128`/`:2183`, `ScrollBarHandle`
at `:2238`, `ScrollBarSlider` at `:2288`). Composing them is this document's job.

## VGUI original

All line numbers below are from
`F:\steam-style\OG-Steam\OG-Steam\resource\styles\steam.styles` (3218 lines).

The scrollbar spans `:1999`–`2319`, a contiguous run that ends exactly where
`SectionedListPanel` begins at `:2321`. Two container blocks declare nothing but
transparency and an inset (`steam.styles:1999`–`:2009`):

```
		Scrollbar
		{
			bgcolor = none
			inset = "0 0 3 1"
		}

		Scrollbar.Horizontal
		{
			bgcolor = none
			inset = "0 1 1 3"
		}
```

Then the vertical decrement button, in full. Idle (`steam.styles:2011`–`:2029`) —
this is the block to read carefully, because it is the structure the other fifteen
repeat:

```
		ScrollBarButton.up
		{
			inset = "-1 2 0 0"
			bgcolor = GreenBG
			render_bg
			{
				// lines around
				1="fill( x0, y0, x1, y0 + 1, BorderBright )"  // top
				2="fill( x0, y1 - 1, x1, y1, BorderDark )"  // bottom
				3="fill( x0, y0, x0 + 1, y1 - 1, BorderBright )"  // left
				4="fill( x1 - 1, y0, x1, y1, BorderDark )"  // right

				//Up Arrow
				10="fill( x0 + 8, y0 + 6, x0 + 9, y0 + 7, Label )"
				11="fill( x0 + 7, y0 + 7, x0 + 10, y0 + 8, Label )"
				12="fill( x0 + 6, y0 + 8, x0 + 11, y0 + 9, Label )"
				13="fill( x0 + 5, y0 + 9, x0 + 12, y0 + 10, Label )"
			}
		}
```

Hover (`:2030`–`:2048`) reproduces that whole block one indent level deeper — the
bevel fills at `:2037`–`:2040` are character-for-character the fills at
`:2018`–`:2021` — and changes only the arrow colour. Quoting just the diff:

```
			//Up Arrow                                        // :2042
			10="fill( x0 + 8, y0 + 6, x0 + 9, y0 + 7, White )"   // :2043
			11="fill( x0 + 7, y0 + 7, x0 + 10, y0 + 8, White )"   // :2044
			12="fill( x0 + 6, y0 + 8, x0 + 11, y0 + 9, White )"   // :2045
			13="fill( x0 + 5, y0 + 9, x0 + 12, y0 + 10, White )"  // :2046
```

Active (`:2049`–`:2067`) — note the lowercase `b` in the style name, unlike `:2011`
— rewrites the bevel with the polarity reversed and keeps the arrow `White`:

```
			// lines around                                    // :2055
			1="fill( x0, y0, x1, y0 + 1, BorderDark )"    // top     :2056
			2="fill( x0, y1 - 1, x1, y1, BorderBright )"  // bottom  :2057
			3="fill( x0, y0, x0 + 1, y1 - 1, BorderDark )"  // left  :2058
			4="fill( x1 - 1, y0, x1, y1, BorderBright )"  // right   :2059

			//Up Arrow                                        // :2061
			10="fill( x0 + 8, y0 + 6, x0 + 9, y0 + 7, White )"   // :2062
			11="fill( x0 + 7, y0 + 7, x0 + 10, y0 + 8, White )"   // :2063
			12="fill( x0 + 6, y0 + 8, x0 + 11, y0 + 9, White )"   // :2064
			13="fill( x0 + 5, y0 + 9, x0 + 12, y0 + 10, White )"  // :2065
```

The three remaining buttons are the same construction rotated and renamed — down
(`:2069`, `:2088`, `:2108`), left (`:2128`, `:2146`, `:2164`) and right (`:2183`,
`:2201`, `:2219`) — so the family is sixteen blocks, four per direction. Note the
inconsistent capitalisation in the corpus: `ScrollBarButton.up` at `:2011` but
`Scrollbarbutton.up:active` at `:2049`. VGUI style names are case-insensitive, so
this is cosmetic, but it means a naive text search for either spelling misses half
the family.

The thumb and gutter (`:2238`, `:2288`, `:2297`, `:2306`, `:2315`):

```
		ScrollBarHandle
		{
			bgcolor = GreenBG
			render_bg
			{
				// lines around
				1="fill( x0, y0, x1, y0 + 1, BorderBright )"  // top
				2="fill( x0, y1 - 1, x1, y1, BorderDark )"  // bottom
				3="fill( x0, y0, x0 + 1, y1 - 1, BorderBright )"  // left
				4="fill( x1 - 1, y0, x1, y1, BorderDark )"  // right
			}
		}
```

```
		"SliderHoriz"  //horizontal scrollbar thumb
		{
			bgcolor = GreenBG
			render
			{
				// lines around
				1="fill( x0, y0, x1, y0 + 1, BorderBright )"  // top
				2="fill( x0, y1 - 1, x1, y1, BorderDark )"  // bottom
				3="fill( x0, y0, x0 + 1, y1 - 1, BorderBright )"  // left
				4="fill( x1 - 1, y0, x1, y1, BorderDark )"  // right
			}
		}
```

`"SliderHoriz:hover"` (`:2263`–`:2274`) and `"SliderHoriz:active"` (`:2275`–`:2286`)
repeat those four fills one indent level deeper with no other change; there is
nothing to quote because nothing differs. The gutters:

```
		ScrollBarSlider // gutter
		{
			bgcolor = LightGreenBG
			render_bg
			{
				5="fill( x0 + 1, y0 + 1, x1 - 1, y1 - 1, LightGreenBG )" // inside
			}
		}

		ScrollBarSliderHoriz // gutter
		{
			bgcolor = none
			render_bg
			{
				5="fill( x0 + 1, y0 + 1, x1 - 1, y1 - 1, LightGreenBG )" // inside
			}
		}

		"GamesPage_Details ListPanel ScrollBarSlider" // gutter in games list detail view
		{
			bgcolor = none
			render_bg
			{
				5="fill( x0 + 1, y0 + 1, x1 - 1, y1 - 1, LightGreenBG )" // inside
			}
		}

		ScrollBarSlider:disabled
		{
			bgcolor = none
			render_bg {}
		}
```

Four numbers in this region of the file are metrics, not styles
(`steam.styles:340`–`345`, whitespace normalised here):

```
		RichText.InsetX	"6"
		RichText.InsetY	"6"
		ScrollBar.Wide	"19"
		SectionedListPanel.CollapserWidth	"16"
```

### Four things to extract

1. **Hover and active are two different mechanisms, and the glyph is not the
   thing that changes on press.** Idle→hover recolours the arrow only, from `Label`
   to `White`, with all four bevel fills unchanged (`:2018`–`:2021` against
   `:2037`–`:2040`; the only difference is one extra level of indentation).
   Hover→active leaves the glyph `White` and flips the polarity of *all four*
   bevels: top and left become `BorderDark`, bottom and right become
   `BorderBright` (`:2018`–`:2021` vs `:2056`–`:2059`). A press is therefore
   signalled entirely by the box, never by the arrow. The same split repeats at
   `:2069`/`:2088`/`:2108`, `:2128`/`:2146`/`:2164` and `:2183`/`:2201`/`:2219`.

2. **The arrow is a hard-edged staircase of four half-open rectangles, 7 px wide
   and 4 px tall, and its apex sits at column `x0+8`.** Reading `:2024`–`:2027`
   with the half-open convention `fill(x0,y0,x1,y1)` excludes `x1`/`y1`: the rows
   are 1, 3, 5 and 7 pixels wide at `y0+6`, `+7`, `+8`, `+9`; the base spans
   `x0+5`…`x0+11`. That base is 7 px with its centre at `x0+8.5`, so the glyph is
   only exactly centred in a **17 px** box. The arrow is drawn, not blitted — there
   is no arrow sprite anywhere in the corpus.

3. **The gutter is lighter than the thumb, and Valve's own comment says otherwise.**
   The gutter is `LightGreenBG` (`:2291`) and the thumb is `GreenBG` (`:2240`),
   i.e. `#5A6A50` behind `#4C5844` (`steamscheme.res:47` and `:46`). The comment on
   `LightGreenBG` in that same file reads "darker background color", which is
   simply false. Separately, `steam.styles` declares a whole set of scrollbar
   colours that the scrollbar in that same file never references: `ScrollBG
   "77 74 72"` with the comment "color of the scroll bar gutter"
   (`steam.styles:76`), plus `ScrollGlyph "204 198 192"` "the color of the scroll
   bar arrows" (`steam.styles:72`), `ScrollGlyphDisabled "77 74 72"`
   (`steam.styles:73`) and `ScrollGlyphFocus "242 242 242"` (`steam.styles:74`).
   None of the four appears in any `fill()` in `steam.styles` — verified by
   searching the file — and none of the four exists in `steamscheme.res` at all.
   So Valve declared a complete, coherent scrollbar colour set (a light glyph on
   a dark gutter, a near-white focus glyph) and then built the buttons with the
   generic `BorderBright`/`BorderDark` bevel instead. Those four names are the
   best evidence in the corpus of what a scrollbar was *meant* to look like.

4. **The horizontal thumb has no state feedback at all.** The horizontal thumb is
   not `ScrollBarHandle`; it is the *slider knob* style reused, `"SliderHoriz"` at
   `:2251`, and it is the only block in this family that uses `render` rather than
   `render_bg`. Its `:hover` (`:2263`–`:2274`) and `:active` (`:2275`–`:2286`)
   blocks are identical to the idle block apart from one extra level of
   indentation. Dragging the horizontal thumb therefore
   produces no visual change whatsoever — a genuine bug in the shipped stylesheet,
   reproduced here so we do not file it as our own regression.

Two smaller details worth recording. First, each button's `inset` is
direction-specific and asymmetric: `"-1 2 0 0"` for up (`:2013`), `"-2 0 0 0"` for
down (`:2071`), and **no `inset` at all** for left (`:2128`) or right (`:2183`).
Reading those as left/top/right/bottom trims — which is VGUI's documented order —
the up button is inset 1 px at the left and 2 px at the top, the down button 2 px
at the left, and the horizontal pair are not inset. Treat this interpretation as
inferred; what is certain is that the four buttons are not inset identically.
Second, the gutter is themed per ancestor: `"GamesPage_Details ListPanel
ScrollBarSlider"` (`:2306`) is the same three lines as the generic
`ScrollBarSliderHoriz` (`:2297`), which tells us the scrollbar inside a list panel
on the details page was expected to need its own override even though it does not,
in fact, differ.

## Variants

| Variant | Class | Source | Notes |
| --- | --- | --- | --- |
| Vertical (default) | `vgui-scrollbar--vertical` | `steam.styles:1999` | Gutter `LightGreenBG`, thumb `GreenBG`, two 17 px buttons |
| Horizontal | `vgui-scrollbar--horizontal` | `steam.styles:2005` | Same colours; thumb is the `"SliderHoriz"` block at `:2251` |
| Wide metric | — | `steam.styles:343` `ScrollBar.Wide "19"` | 19 px is the only width the corpus states |
| Inside a list panel | — | `steam.styles:2306` | Style name `"GamesPage_Details ListPanel ScrollBarSlider"`; identical values, kept as a reminder that the original supported ancestor-scoped overrides |
| Native (recommended) | — | this library | `scrollbar-color` / `scrollbar-width`, see `## CSS recipe` |

There is no colour variant. The port ships exactly one scrollbar recipe
(`vgui.css/styles/greensteam/greensteam.css:395`–`434`), which is why this
component has no `--vgui-theme-vgui1` counterpart to test.

## Anatomy

```html
<div class="vgui-scroll-region">
  <div class="vgui-scroll-region__content">…</div>

  <div class="vgui-scrollbar vgui-scrollbar--vertical" aria-hidden="true">
    <button class="vgui-scrollbar__button vgui-scrollbar__button--decrement" tabindex="-1">
      <span class="vgui-scrollbar__glyph vgui-scrollbar__glyph--up"></span>
    </button>

    <div class="vgui-scrollbar__gutter">
      <div class="vgui-scrollbar__thumb" style="--vgui-scrollbar-thumb-offset: 0;
                                              --vgui-scrollbar-thumb-length: 40px"></div>
    </div>

    <button class="vgui-scrollbar__button vgui-scrollbar__button--increment" tabindex="-1">
      <span class="vgui-scrollbar__glyph vgui-scrollbar__glyph--down"></span>
    </button>
  </div>
</div>
```

The markup above is the *custom* path, which this component recommends only when a
pane genuinely cannot use the native scrollbar. In the default path the component
emits no scrollbar markup at all: it sets `scrollbar-color` on the scroll region and
lets the user agent draw the rest. `aria-hidden="true"` is correct on the custom
tree precisely because it duplicates a native affordance — if the custom tree were
the only way to scroll, the same attribute would be an accessibility defect, which
is the strongest argument against shipping it.

## States

| Part | State | Colour / geometry | Source |
| --- | --- | --- | --- |
| Container (`Scrollbar`) | — | `bgcolor = none`, `inset = "0 0 3 1"` | `steam.styles:1999`–`:2003` |
| Container (horizontal) | — | `bgcolor = none`, `inset = "0 1 1 3"` | `steam.styles:2005`–`:2009` |
| Arrow button | idle | `bgcolor = GreenBG`; bevel top/left `BorderBright`, bottom/right `BorderDark`; glyph `Label` | `steam.styles:2011`–`:2029` |
| Arrow button | hover | Bevel **unchanged**; glyph `Label` → `White` | `steam.styles:2030`–`:2048` |
| Arrow button | active (pressed) | All four bevels **inverted** (top/left `BorderDark`, bottom/right `BorderBright`); glyph stays `White` | `steam.styles:2049`–`:2067` |
| Arrow button | focus | No `:focus` block exists for any of the sixteen scrollbar blocks. The nearest thing the corpus declares is `ScrollGlyphFocus "242 242 242"` (`steam.styles:74`), which **no style block uses** | `steam.styles:74` (declaration only) |
| Arrow button | disabled | No block. `ScrollGlyphDisabled "77 74 72"` (`steam.styles:73`) is likewise unreferenced | `steam.styles:73` (declaration only) |
| Thumb (vertical) | idle | `bgcolor = GreenBG` + the same four bevel fills, no glyph | `steam.styles:2238`–`:2249` |
| Thumb (vertical) | hover / drag | **Not defined anywhere in the corpus** | — |
| Thumb (horizontal) | idle | `"SliderHoriz"`, uses `render` not `render_bg` | `steam.styles:2251`–`:2262` |
| Thumb (horizontal) | hover / active | Identical to idle — a no-op | `steam.styles:2263`–`:2274`, `:2275`–`:2286` |
| Gutter | idle | `bgcolor = LightGreenBG` plus `fill(x0+1,y0+1,x1-1,y1-1,LightGreenBG)` | `steam.styles:2288`–`:2295` |
| Gutter | disabled | `bgcolor = none` and an **empty** `render_bg {}` — paints nothing | `steam.styles:2315`–`:2319` |

The disabled gutter is the only disabled state in the entire scrollbar family, and
it is worth pausing on: the block overrides `bgcolor` to `none` *and* provides an
empty `render_bg`, so a disabled scrollbar region loses its gutter fill and nothing
replaces it. There is no disabled appearance for the arrows or the thumb.

The port agrees with the style file on the one state that matters — it inverts the
button bevel on press (`greensteam.css:417`–`422`) — but it implements no `:hover`
at all, so the `Label` → `White` arrow change is unrepresented in CSS today.

## Tokens

| Token | Value | Where it comes from |
| --- | --- | --- |
| `--vgui-surface` | `#4C5844` | `GreenBG` (`steamscheme.res:46`) — the button face and the thumb fill (`steam.styles:2011`, `:2238`) |
| `--vgui-surface-light` | `#5A6A50` | `LightGreenBG` (`steamscheme.res:47`) — the gutter (`steam.styles:2290`, fill at `:2293`). `foundations.md:68` already names the scrollbar gutter as this token's use |
| `--vgui-bevel-light` | `#899281` | The community bevel bright side. The corpus's own `BorderBright` is `#808080` (`steamscheme.res:68`) — see below |
| `--vgui-bevel-dark` | `#292D23` | The community bevel dark side. The corpus's own `BorderDark` is `#282E22` (`steamscheme.res:69`) |
| `--vgui-text-muted` | `#A0AA95` | `Label` (`steam.styles:67`) — the idle glyph |
| `--vgui-text-strong` | `#FFFFFF` | `White` (`steamscheme.res:13`) — the hover and active glyph |
| `--vgui-focus-ring` | — | See `foundations.md` §4. The scrollbar family defines no focus style of its own; do not reuse the active bevel as one |
| `--vgui-scrollbar-width` | `19px` | **NEW.** `ScrollBar.Wide "19"` (`steam.styles:343`). The port uses 18px (`greensteam.css:398`) |
| `--vgui-scrollbar-glyph-width` | `7px` | **NEW.** Base width of the arrow staircase, `x0+5`…`x0+12` (`steam.styles:2027`) |
| `--vgui-scrollbar-glyph-height` | `4px` | **NEW.** Four rows at `y0+6`…`y0+10` (`steam.styles:2024`–`:2027`) |
| `--vgui-scrollbar-button-size` | `18px` | **NEW, from the port only.** `greensteam.css:409`–`410` sets `::-webkit-scrollbar-button { width: 18px; height: 18px }`. The `.styles` never states a button size; 18 is the only concrete number either source gives |

**The bevel conflict, stated plainly.** `steam.styles` fills its bevels with
`BorderBright` = `#808080` and `BorderDark` = `#282E22` (`steamscheme.res:68`,
`:69`), while this library's `--vgui-bevel-light` / `--vgui-bevel-dark` are the
community pair `#899281` / `#292D23`. `foundations.md:379`–`382` already resolved
this in favour of the community pair, with the scheme pair available as
`--vgui-theme-vgui1`, and the CSS port uses the community pair too
(`greensteam.css:403`–`406`). The scrollbar is the component where the choice is
most visible, because the pressed state is *nothing but* the bevel. Against the
`#4C5844` face:

| Bevel | Colour | Contrast against the face | Source |
| --- | --- | --- | --- |
| Community bright | `#899281` | **2.33:1** (fails 1.4.11) | `foundations.md:444` |
| Community dark | `#292D23` | **1.87:1** (fails 1.4.11) | `foundations.md:445` |
| Corpus bright | `#808080` | **1.91:1** (fails 1.4.11) | computed here from `steamscheme.res:68` |
| Corpus dark | `#282E22` | **1.85:1** (fails 1.4.11) | computed here from `steamscheme.res:69` |

The corpus pair is *worse* on both sides, so this is not a case where fidelity and
accessibility pull apart in opposite directions — both variants fail, and the
community pair fails marginally less.

## CSS recipe

```css
/* --- Native path. This is the default: no markup, no JS. --------------- */
.vgui-scroll-region {
  /* Chromium/WebKit do not read scrollbar-color, and Firefox ignores
     ::-webkit-scrollbar entirely, so the two paths are exclusive. */
  scrollbar-color: var(--vgui-surface) var(--vgui-surface-light);
  scrollbar-width: var(--vgui-scrollbar-width);
  overflow: auto;
  overscroll-behavior: contain;
}

/* --- WebKit path. Needed only for the arrows and the pressed bevel. ---- */
.vgui-scroll-region::-webkit-scrollbar {
  width: var(--vgui-scrollbar-width);
  height: var(--vgui-scrollbar-width);
  background-color: var(--vgui-surface-light);   /* the gutter, 2291 */
}

.vgui-scroll-region::-webkit-scrollbar-corner {
  background-color: var(--vgui-surface-light);
}

.vgui-scroll-region::-webkit-scrollbar-thumb {
  /* 2240: bgcolor = GreenBG, plus the four bevel fills of 2242-2245. A
     box-shadow ring cannot be split into light and dark sides the way the
     corpus does, so the bevel is drawn with border-color instead. */
  background-color: var(--vgui-surface);
  border: 1px solid;
  border-color: var(--vgui-bevel-light) var(--vgui-bevel-dark)
                var(--vgui-bevel-dark) var(--vgui-bevel-light);
}

.vgui-scroll-region::-webkit-scrollbar-button {
  background-color: var(--vgui-surface);
  border: 1px solid;
  border-color: var(--vgui-bevel-light) var(--vgui-bevel-dark)
                var(--vgui-bevel-dark) var(--vgui-bevel-light);
  /* 2024-2027: the arrow, rebuilt from four half-open fills as four
     background layers, widths 1/3/5/7px at rows 6/7/8/9 from the top.
     Sizes match --vgui-scrollbar-glyph-*; positions centre on the 7px base. */
  --glyph: var(--vgui-text-muted);
  background-image:
    linear-gradient(var(--glyph), var(--glyph)),
    linear-gradient(var(--glyph), var(--glyph)),
    linear-gradient(var(--glyph), var(--glyph)),
    linear-gradient(var(--glyph), var(--glyph));
  background-repeat: no-repeat;
  background-size: 1px 1px, 3px 1px, 5px 1px, 7px 1px;
  background-position:
    center 6px,   /* x0+8, y0+6 */
    center 7px,   /* x0+7..x0+10, y0+7 */
    center 8px,   /* x0+6..x0+11, y0+8 */
    center 9px;   /* x0+5..x0+12, y0+9 */
}

/* 2030-2047: hover changes the glyph and nothing else. */
.vgui-scroll-region::-webkit-scrollbar-button:hover {
  --glyph: var(--vgui-text-strong);
}

/* 2049-2067: active inverts every bevel and leaves the glyph White. */
.vgui-scroll-region::-webkit-scrollbar-button:active {
  border-color: var(--vgui-bevel-dark) var(--vgui-bevel-light)
                var(--vgui-bevel-light) var(--vgui-bevel-dark);
}

/* 2315-2319: the disabled gutter paints nothing. Translucent, not a new
   colour, so it works over any parent surface. */
.vgui-scroll-region[data-disabled]::-webkit-scrollbar {
  background-color: transparent;
}

/* --- Forced colours: hand the scrollbar back to the OS. ---------------- */
@media (forced-colors: active) {
  .vgui-scroll-region { scrollbar-color: auto; }
  .vgui-scroll-region::-webkit-scrollbar-button { background-image: none; }
}

/* --- The custom tree (only when the native scrollbar is unavailable). -- */
.vgui-scrollbar { display: flex; flex-direction: column; }
.vgui-scrollbar__button {
  inline-size: 100%;
  block-size: var(--vgui-scrollbar-button-size);
  background-color: var(--vgui-surface);
  border: 1px solid;                            /* the bevel primitive */
  border-color: var(--vgui-bevel-light) var(--vgui-bevel-dark)
                var(--vgui-bevel-dark) var(--vgui-bevel-light);
}
.vgui-scrollbar__button:hover .vgui-scrollbar__glyph { background-color: var(--vgui-text-strong); }
.vgui-scrollbar__button:active {
  border-color: var(--vgui-bevel-dark) var(--vgui-bevel-light)
                var(--vgui-bevel-light) var(--vgui-bevel-dark);
}
.vgui-scrollbar__glyph {
  display: block;
  inline-size: var(--vgui-scrollbar-glyph-width);
  block-size: var(--vgui-scrollbar-glyph-height);
  margin-inline: auto;
  background-color: var(--vgui-text-muted);
  /* An actual triangle, not a sprite: the corpus draws four stacked
     rectangles, which is what a staircase clip-path reproduces. */
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}
.vgui-scrollbar__gutter { flex: 1; background-color: var(--vgui-surface-light); }
.vgui-scrollbar__thumb  { background-color: var(--vgui-surface);
  border: 1px solid;
  border-color: var(--vgui-bevel-light) var(--vgui-bevel-dark)
                var(--vgui-bevel-dark) var(--vgui-bevel-light); }
```

Three decisions carry this recipe.

**The native path is the default and the custom path is opt-in.** The corpus
describes a scrollbar VGUI drew itself, but a browser scrollbar is a user-agent
control with its own accessibility contract, its own keyboard behaviour and its
own touch behaviour. `scrollbar-color` takes exactly two colours — thumb then track
— which maps onto `GreenBG` and `LightGreenBG` with no loss, so the *colour*
fidelity of the original is achievable for free and is what most panes should use.
`scrollbar-width` accepts `auto | thin | none` in Firefox only; a 19px custom width
is therefore a WebKit-only affordance, which is why `--vgui-scrollbar-width` is
applied to `::-webkit-scrollbar` and not to `scrollbar-width` (a 19px value there
would be invalid and drop the whole declaration).

**The glyph is rebuilt from gradients rather than shipped as a sprite.** The corpus
arrow is four rectangles of width 1, 3, 5 and 7 at four consecutive rows, i.e. a
7×4 staircase with a flat top — not an isoceles triangle. Four 1px-tall gradient
layers reproduce it exactly and cost no asset, which matters because this
repository has no image pipeline at all (see `## Assets`). The `clip-path` in the
custom tree is the same shape expressed as geometry; if exactness matters more than
the sprite-less constraint, `clip-path` on a 7×4 box is pixel-identical to the
fills, whereas a triangle *without* clipping would not be.

**`::-webkit-scrollbar-button` is the only way to style the arrows, and it is not
in any specification.** It is a WebKit/Blink extension; Firefox and Safari on iOS
ignore it, and Safari's own support has been inconsistent. The pressed bevel is
therefore a Chromium-only nicety, and the component must not require it: the
design degenerates to a plain coloured scrollbar, which is still correct. The port
made the same call and reached the same conclusion (`greensteam.css:395`–`434` is
WebKit-only throughout).

## React API

```tsx
export interface ScrollbarProps extends HTMLAttributes<HTMLDivElement> {
  /** Scrolling axis. Defaults to `"vertical"`. */
  orientation?: 'vertical' | 'horizontal'
  /** Painting strategy. `"native"` sets `scrollbar-color` and emits no
   *  extra markup; `"custom"` renders the button/gutter/thumb tree. Defaults
   *  to `"native"`. */
  variant?: 'native' | 'custom'
  /** Bar thickness. Defaults to `--vgui-scrollbar-width` (19px). Only
   *  honoured by the custom variant and by WebKit. */
  thickness?: number | string
  /** Reserve space for the bar even when the content does not overflow. */
  alwaysVisible?: boolean
  /** Paint the gutter with nothing, matching `ScrollBarSlider:disabled`
   *  (`steam.styles:2315`). The content stays scrollable. */
  disabled?: boolean
  /** Pixels of the region that must remain visible above the bar. */
  scrollPadding?: number
  /** Called with the scroll offset after every scroll frame. */
  onScrollOffsetChange?: (offset: number, max: number) => void
  /** Class applied to the scroll region, not the bar. */
  className?: string
  /** The scrollable content. */
  children?: React.ReactNode
}
```

`onScrollOffsetChange` exists because the custom variant cannot know the thumb
position without a scroll listener. Note that it is *not* an
`onScroll` passthrough: it reports the offset and the scrollable extent, so a
consumer implementing a virtualised list does not have to re-derive both. The
native variant accepts `onScroll` from `HTMLAttributes` unchanged.

`disabled` deliberately does not map to the `disabled` attribute — a scroll region
is a `div`, and `steam.styles:2315` disables the *gutter*, not scrolling. Marking
the region `aria-disabled` would be a lie; the content still scrolls.

## Accessibility

- **Use the native scrollbar.** A custom scrollbar must reproduce: wheel and
  trackpad deltas, `PageUp`/`PageDown`, `Home`/`End`, `Space`, arrow keys, middle-
  click autoscroll, keyboard focus-scroll, scroll anchoring, overscroll
  chaining/rubber-banding, touch momentum, and the OS's own size preferences.
  `scrollbar-color` gets the palette without giving any of that up, so it is the
  default here and the `"custom"` variant is documented as a last resort.
- **The arrows are 17–19px, well under the 24×24 WCAG 2.5.8 target size.** The one
  concrete button size in either source is `18px` (`greensteam.css:409`–`410`);
  the corpus's `ScrollBar.Wide "19"` (`steam.styles:343`) is the gutter, not the
  button. Widening the gutter to fix this is the wrong trade; the right fix is not
  to require the arrows, which is what choosing the native variant does.
- **The idle arrow glyph passes non-text contrast by 0.11.** `--vgui-text-muted`
  `#A0AA95` on the `#4C5844` face is **3.11:1** (computed; the 4.06:1 figure in
  `foundations.md:436` is the same colour on `--vgui-surface-dark`). Arrows are
  graphics, so 1.4.11's 3:1 applies and they pass — but they fail 4.5:1 as text,
  and there is no headroom at all for a lowered-contrast theme variant.
- **Hover is a large, perceivable change; press is not.** The hover glyph
  `#FFFFFF` on `#4C5844` is **7.54:1** (`foundations.md:429`), a 4.4× luminance
  jump from idle. The press changes *only* the bevel: `#899281` versus `#292D23`,
  which are **2.33:1** and **1.87:1** against the face (`foundations.md:444`,
  `:445`). Both are below 3:1, and the arrow is `White` in both hover and active,
  so a user with low contrast sensitivity cannot tell hovered from pressed, and a
  user who cannot see the bevel at all cannot tell pressed from idle. The original
  has no other cue — no offset, no size change, no colour change on the glyph.
  **The accessible substitute:** keep Valve's inversion (it is the house style)
  and add one perceivable difference on press, e.g. the glyph dropping by 1px, or
  the face darkening to `--vgui-surface-dark` (`#3E4637`, 1.30:1 against the
  face — still not enough on its own, which is why the 1px offset matters more
  than any further colour work).
- **The gutter is invisible against the panel.** `--vgui-surface-light` `#5A6A50`
  against `--vgui-surface` `#4C5844` is **1.30:1** (`foundations.md:476`), and the
  thumb against `--vgui-surface-dark` is the same **1.30:1** (`foundations.md:477`).
  Where the scrollbar is, how long the thumb is, and where the track ends are all
  below the 3:1 threshold for meaningful graphics. This is inherited from Valve and
  it is the strongest practical argument for `scrollbar-color` over a hand-drawn
  bar: the OS scrollbar is measured against the *window*, not against our palette,
  so it stays visible even when ours does not.
- **Focus.** No scrollbar block in the corpus has a `:focus` style; the only focus
  colour the file declares, `ScrollGlyphFocus "242 242 242"`
  (`steam.styles:74`, 6.73:1 against the face — it would pass), is referenced by
  nothing. The scroll *region* must therefore show focus itself, using
  `--vgui-focus-ring` from `foundations.md` §4. Do not treat the active bevel as a
  focus indicator: it is a mouse-only state that a keyboard user never sees.
- **Keep the buttons out of the tab order.** `tabindex="-1"` on the custom arrows
  is correct — a scrollbar with four extra tab stops is worse than one without,
  and the arrows duplicate what the arrow keys already do. The region itself gets
  `tabindex="0"` only if it has no focusable children; if it does, the browser
  scrolls it on focus already.
- **Decoration is hidden, not removed.** `aria-hidden="true"` on the custom tree
  and `pointer-events: none` on the glyph, so the glyph is not announced and does
  not swallow clicks intended for the button.
- **Under `prefers-reduced-motion`, do not animate the thumb.** Nothing here needs
  to move, but a "smooth scroll to" convenience must check the preference — that is
  the only motion this component can introduce.

## Assets

**The procedural build needs none, and that is unusual for this library.** The
corpus ships 239 `.tga` files in the top level of
`OG-Steam/OG-Steam/graphics/` (247 including the `browserbuttons/`
subdirectory), and **not one of them is a scrollbar, arrow, thumb or slider
sprite** — filtering that directory for `scroll`, `arrow`, `thumb` or `slider`
returns nothing. The arrow is drawn by four
`fill()` calls (`steam.styles:2024`–`:2027`) and the bevels by four more
(`:2018`–`:2021`), so `Scrollbar` is one of the few components that can reach full
visual fidelity with zero imported art.

The port disagrees about *how* to draw the arrow. It ships four raster glyphs at
`vgui.css/styles/greensteam/`:

| Asset | Size | Used for |
| --- | --- | --- |
| `scroll_up.png` | **9×6** | vertical decrement |
| `scroll_down.png` | **9×6** | vertical increment |
| `scroll_left.png` | **6×9** | horizontal decrement |
| `scroll_right.png` | **6×9** | horizontal increment |

All four were measured from their PNG headers here, and the sizes resolve a small
puzzle: a 9×6 sprite is *wider* than the 7×4 staircase of `steam.styles:2024`–`:2027`,
which means the port does not reproduce Valve's glyph — it redraws it as a proper
triangle with padding. `greensteam.css:395`–`434` also uses a flat 18px bar rather
than the corpus's `19` (`steam.styles:343`) and `18` again for the buttons
(`greensteam.css:409`–`410`).

**The no-asset policy applies anyway.** `F:\steam-style\steam-style-react\` has no image
assets of any kind — no `public/`, no `src/assets/` — so even if we preferred the
port's raster arrows they are not importable, and a build step plus an asset
pipeline would have to exist first. This doc therefore specifies the CSS-gradient
arrow in `## CSS recipe`: it is byte-for-byte Valve's geometry, it costs no asset,
and a consumer who holds their own licence for the artwork can point the component
at it through the documented variables without touching the API (`docs/assets.md`).

## Examples

```tsx
// Default: native scrollbar, Valve's colours, no extra markup.
<Scrollbar className="vgui-console__scroll" alwaysVisible>
  <pre className="vgui-console__log">
    {lines.map((line) => <ConsoleLine key={line.id} {...line} />)}
  </pre>
</Scrollbar>

// Custom: needed only for the pressed bevel, which WebKit alone exposes.
<Scrollbar variant="custom" thickness={19} onScrollOffsetChange={(offset, max) => track(offset / max)}>
  <AvatarGrid users={users} />
</Scrollbar>
```

## Open questions

- **18px or 19px?** `steam.styles:343` says `ScrollBar.Wide "19"`;
  `greensteam.css:398` hard-codes 18px for `::-webkit-scrollbar`. The two are one
  pixel apart and the corpus never states a *default* width, only a `Wide` metric.
  Settling it needs a screenshot of a 2007 Steam client measured in a known DPI
  context. Note that the metric's own source file was not available to this doc:
  the corpus contains exactly one `.res` file (`steamscheme.res`), the stylesheet
  itself is `steam.styles`, and the retail client's per-platform scheme file — the
  one that would define `ScrollBar.Wide` for a specific build — is not part of
  this checkout.
- **Is the button 17px or 18px?** The glyph's 7px base centred at `x0+8.5`
  (`steam.styles:2024`–`:2027`) only centres exactly in a 17px box, which suggests
  a 17px button; the port uses 18px and its 9×6 sprite is centred there. Both
  numbers appear in real artefacts, and neither source states the button size. What
  would settle it: a `steam.styles` build listing `inset` semantics, or a pixel
  measurement of the original client.
- **What does `inset` mean here?** The values `"-1 2 0 0"` (`:2013`) and
  `"-2 0 0 0"` (`:2071`) are read above as left/top/right/bottom trims, and the
  left/right buttons have no `inset` at all (`:2128`, `:2183`). Negative trims that
  *grow* a box are the kind of thing VGUI's layout engine does and a stylesheet
  cannot. A VGUI layout-engine reference would settle it; nothing in this corpus
  explains it.
- **Do the four buttons really share a size?** The corpus never says so; only the
  up and down buttons carry an `inset`, and the left/right pair carry a 4px-wide,
  7px-tall glyph (rotated 90° from the up/down pair's 7×4). If the renderer sized
  each button from its glyph, the horizontal pair would be 4px wide — invisible.
  Some evidence that all four are the same box would close this.
- **Why is `ScrollBarHandle` never used for the horizontal thumb?** The vertical
  thumb is `ScrollBarHandle` (`:2238`) and the horizontal thumb is `"SliderHoriz"`
  (`:2251`, `render` not `render_bg`; the corpus comments it as
  `//horizontal scrollbar thumb`). No `ScrollBarHandleHoriz` exists in the file,
  and no `.layout` anywhere in the corpus references a scrollbar part by name.
  Whether this was a deliberate reuse of the slider knob or an oversight —
  the unchanged `:hover`/`:active` blocks at `:2263`/`:2275` suggest the latter
  — cannot be determined from the stylesheet alone.
- **Is the corpus's `BorderBright`/`BorderDark` pair ever the right answer?** The
  scheme's `#808080`/`#282E22` (`steamscheme.res:68`, `:69`) and the community
  `#899281`/`#292D23` are both available to a `--vgui-theme-vgui1` build. The
  scrollbar is the component where the difference is most visible, since press
  state *is* the bevel. Which pair the retail 2003–2010 client actually rendered
  is unresolved across the whole corpus, not just here — see `foundations.md:385`.
