# StatusLabel

A small uppercase label used for transient status readouts — "Downloading",
"Paused", "Complete" — and for the clickable progress links in Steam's bottom
status strip. It is one of a handful of blocks in the theme that force uppercase
by default — `Slider` (`steam.styles:2373`), `MainNav` (`:1654`) and the
`gamedetails-headerlabel*` family (`:2969`–`:2996`) are the others — so it reads
as machine output rather than as prose.

## Purpose

`StatusLabel` answers "what is the application doing right now?" It is not a
form label (that is `FieldLabel`) and not a heading. It is short, it is
uppercase, it changes without warning, and it is frequently a link.

The distinguishing behaviour is the hover state: a status label brightens to pure
white on hover, which is how the original signals that the status text is also an
action (`steam://open/downloads`). It is not alone in that —
`URLLabel:Hover` (`steam.styles:2692`–`:2695`) and `URLLabelSimple:Hover`
(`:2707`) do exactly the same thing, which is the point: `StatusLabel` is applied
to a `URLLabel` in practice, and "brighten on hover" is this theme's signal for
*link*. `Button:hover` (`:434`) also goes to `White`, so the pattern is the
theme's, not this block's.

## VGUI original

`StatusLabel`, defined in `steam.styles`:

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\styles\steam.styles:2380
```

| Property | Value | Line |
| --- | --- | --- |
| `font-family` | `basefont` | `steam.styles:2382` |
| `font-size` | `14` (`16 [$OSX]`) | `steam.styles:2383-2384` |
| `font-weight` | `400` | `steam.styles:2385` |
| `textcolor` | `Label` | `steam.styles:2386` |
| `font-style` | `uppercase` | `steam.styles:2387` |

Hover:

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\styles\steam.styles:2389-2392
```

`StatusLabel:hover { textcolor = White }` — and it declares **only** the colour.
There is no face change, no bevel, no underline.

**The block has no `disabled` state, no `inset`, and no `render`/`render_bg`
program.** A status label is drawn as bare text on whatever surface it sits on.

### How it is actually used

The only *layout* that applies `StatusLabel` as a control style is
`uistatuspanel.layout`, and there it is
worn by a **`URLLabel`**, not a `Label`:

```ini
StatusDownloading { controlname=URLLabel style="StatusLabel" labelText="" URLText="steam://open/downloads" }
StatusPaused      { controlname=URLLabel style="StatusLabel" labelText="" URLText="steam://open/downloads" }
StatusComplete    { controlname=URLLabel style="StatusLabel" labelText="" URLText="steam://open/downloads" }
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\layout\uistatuspanel.layout:5-7
```

All three are anchors to the downloads page, and they are **not** stacked in one
place. `StatusDownloading` is placed on its own in `TitleRegion` and
`StatusPaused, StatusComplete` are placed together in `statusRegion`
(`uistatuspanel.layout:30` and `:31`):

```ini
place { control="StatusDownloading"        region="TitleRegion"  align="top-center" margin-top=13 }
place { control="StatusPaused, StatusComplete" region="statusRegion" align="top-center" margin-top=2 }
```

So *Paused* and *Complete* do overlap each other — only one of that pair is
visible at a time, which is what the `StatusBar` union-region trick relies on —
but *Downloading* lives in an entirely different region 13px down from the top of
a 60px band. That is not two-state toggling; it looks like "downloading" was
meant to occupy the title line and the two terminal states the strip beneath it.
Why is unresolved — see `StatusBar.md` for the full argument.
**The canonical `StatusLabel` in the wild is a link**, which is why the
hover-brightens behaviour exists at all.

### The second usage, and the sunken-field question

Searching the whole corpus for `StatusLabel` turns up one other application, and
it is the one that decides how this component should be framed.
`DialogServerBrowser.res:31-48` defines a panel also *named* `StatusLabel`, but
as a plain `Label` with a concrete box:

```ini
"StatusLabel"
{
    "ControlName"   "Label"
    "fieldName"     "StatusLabel"
    "xpos"          "11"
    "ypos"          "362"
    "wide"          "544"
    "tall"          "24"
    "dulltext"      "0"
    "zpos"          "1"
    style="status"
}
```

and the dialog's own `styles` block (`:52-56`) defines that style as:

```ini
status
{
    bgcolor="none"
    inset="8 0 0 0"
}
```

This matters because it is tempting to describe a status strip as **sunken** — a
recessed field with an inverted bevel. **The corpus does not support that.** The
only style ever applied to a status label is `bgcolor="none"` plus an `inset` of
`8 0 0 0`, i.e. a fully transparent box nudged 8px from the left. There is no
`render`, no `render_bg`, no bevel and no `BorderBright`/`BorderDark` fill
anywhere in either usage. A status label is *bare text on whatever surface is
behind it*; the recessed look in screenshots comes from the **panel** it is
placed on, not from the label. If this library wants a sunken status field it is
inventing one, and `StatusBar.md` does exactly that using the shared bevel
primitive — but the label itself must stay transparent, or the two will fight.

The same block is also the only place the corpus gives a status label a real
size: **544×24** (`:37-38`). Treat that as the "wide status strip" proportion and
the `uistatuspanel` placement as the "centred transient message" one.

### The `Label` colour token

`textcolor = Label` (`steam.styles:2386`) resolves against `Label`, declared in
`steam.styles`'s own `colors` block (`steam.styles:3`):

```
steam.styles:67          Label="160 170 149 255"
```

That is `#A0AA95`, and it is **character-identical to `Text`** (`steam.styles:57`,
`Text="160 170 149 255"`). It is also exactly the value the library already ships
as `--vgui-text-muted` (`foundations.md:75`), so — unlike most colour chains in
this theme — there is no inference here at all: Valve's own label colour and the
library's muted text are the same three bytes.

The sibling entries are worth knowing because they are *not* equal to the tokens
you would guess: `Label2="115 111 108 255"` (`steam.styles:68`),
`LabelDisabled="138 135 132 255"` (`:69`) and `LabelFocus="199 196 194 255"`
(`:70`). None of the three is the community `--vgui-text-dim` / `--vgui-text-disabled`
pair, so `Label`'s siblings are *not* a source for those tokens.

Note that the hover colour `White` resolves in the same block — `white="255 255 255 255"`
(`steam.styles:13`) — and, separately, in the client scheme
(`steamscheme.res:13`, `"White" "255 255 255 255"`). The two agree.

## Variants

| Variant | What changes | Source |
| --- | --- | --- |
| *(default)* | Uppercase, muted, static text. | `steam.styles:2380` |
| `--link` | `href` present; renders `<a>`; hover brightens to white. | `uistatuspanel.layout:5`, `steam.styles:2389` |
| `--with-dot` | Adds a 6px status dot in a `::before`. | *(composition — no corpus precedent)* |
| `--strong` | Drops the uppercase transform, uses `--vgui-text-strong`. | *(composition)* |

`--strong` exists because uppercase `Label` text at 14px is genuinely hard to
read for long strings. Any status string that can exceed roughly 20 characters
should use it. Valve's own status strings are not in this corpus — all three
labels are declared with `labelText=""` (`uistatuspanel.layout:5-7`) and are
filled from C++ at runtime — so the length guidance is a library decision.

## Anatomy

```
<span class="vgui-status-label">Downloading…</span>
```

One element, one text node. No wrapper, no icon slot, no badge.

The optional leading dot — a small filled circle before the text, used to convey
"active" vs "paused" — is the one addition worth making. It lives in a
`::before` pseudo-element so the text node stays clean for screen readers:

```css
.vgui-status-label--with-dot::before { /* … see CSS recipe … */ }
```

## States

| State | Change | Source |
| --- | --- | --- |
| Normal | `--vgui-text-muted`, uppercase | `steam.styles:2386-2387` |
| Hover | `--vgui-text-strong` (`White`) — **colour only** | `steam.styles:2389-2392` |
| Focus-visible | Inherited ring from `foundations.md` §4 | *(library policy)* |
| Active | Not declared — inherit focus treatment | *(none)* |
| Disabled | **Not declared in the corpus.** Fall back to the shared sunken disabled treatment | see below |

The corpus declares no disabled state for `StatusLabel` at all. Two options, and
the choice matters:

1. **Extend `FieldLabel`'s treatment** — `--vgui-text-disabled` `#75806F` with a
   `1px 1px 0 --vgui-text-disabled-shadow` `#282E22` shadow. Consistent with the
   rest of the theme, but it *adds* a convention the corpus does not have here.
2. **Do not render a disabled status label at all.** A status indicator that is
   disabled is not a meaningful thing; if the app is idle, the status string
   should say so. This is the recommended behaviour: `disabled` is accepted for
   API symmetry, maps to `aria-disabled`, and dims the text with
   `--vgui-text-dim` **only** — no shadow.

Because a disabled status label has no interaction, and `--vgui-text-dim` on
`--vgui-surface` is 1.92:1 (`foundations.md:440`), option 2 must pair the dimming
with a non-colour cue if the state actually matters to the user.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-text-muted` `#A0AA95` | Default text |
| `--vgui-text-strong` `#FFFFFF` | Hover text |
| `--vgui-text-dim` `#758666` | Optional disabled text |
| `--vgui-heading` `#C4B550` | Optional busy/working state |
| `--vgui-steam-green` `#7EA64B` | Optional "online"/running dot |
| `--vgui-accent` `#C4B550` | Focus ring |
| `--vgui-font` | Font family |
| `--vgui-font-size` `14px` | Font size |
| `--vgui-status-dot-size` `6px` | `--with-dot` dot diameter |

`--vgui-status-dot-size` is component-local and therefore keeps a `var()`
fallback; the shared tokens above are referenced **without** fallbacks, per
`foundations.md` §4.

No new token is introduced for the sunken field, because the corpus does not
apply one — see `## VGUI original`. The only box the corpus gives a status label
is the server-browser dialog's **544×24** strip (`DialogServerBrowser.res:37-38`),
which is a layout value for that dialog rather than a reusable metric.

## CSS recipe

```css
.vgui-status-label {
  display: inline-block;
  font: inherit;
  font-size: var(--vgui-font-size, 14px);
  font-weight: 400;                     /* matches the block, not an override */
  line-height: 1.15;
  color: var(--vgui-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;               /* see "uppercase needs tracking" below */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* The hover state is a COLOUR change only — no underline, no face, no bevel. */
.vgui-status-label--link {
  color: var(--vgui-text-muted);
  text-decoration: none;
  cursor: pointer;
}

.vgui-status-label--link:hover,
.vgui-status-label--link:focus-visible {
  color: var(--vgui-text-strong);
}

.vgui-status-label--with-dot {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.vgui-status-label--with-dot::before {
  content: '';
  flex: none;
  inline-size: var(--vgui-status-dot-size, 6px);
  block-size: var(--vgui-status-dot-size, 6px);
  background-color: currentColor;
  /* Deliberately square: the theme has no round mask, and a square reads as
     a VGUI glyph rather than a modern badge dot. */
}

.vgui-status-label--strong {
  text-transform: none;
  color: var(--vgui-text-strong);
  letter-spacing: 0;
}
```

**Why `letter-spacing: 0.02em` is added.** The corpus uppercase is achieved by a
font-style flag in VGUI, which uppercases *bitmap* glyphs that already carry
their own side bearings. Browser `text-transform: uppercase` re-cases lowercase
outlines, and uppercase letters have narrower advance widths relative to their
cap-height — so a run of `Downloading…` set in uppercase in a proportional face
appears tighter than Valve's. A hair of tracking restores the density without
changing the metrics enough to break a fixed-width placement. `0.02em` on 14px
is roughly 0.28px per character. If a pixel-perfect placement is required,
`--strong` with no transform is the honest answer.

## React API

```tsx
export interface StatusLabelProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** The status string. Rendered uppercase by default. */
  children?: React.ReactNode
  /** Render as an anchor. When set, hover brightens the text to white. */
  href?: string
  /** Add a leading 6px dot in the current text colour. */
  withDot?: boolean
  /** Drop the uppercase transform and use strong text. Use for long strings. */
  strong?: boolean
  /** Prepend a visually hidden word, e.g. "Status:", for screen readers. */
  accessiblePrefix?: string
  /** Renders a polite live region so changes are announced. */
  live?: 'off' | 'polite' | 'assertive'
}
```

Notes:

- `live` defaults to `'off'`. A status label that changes on a timer and
  announces every change is an accessibility hazard, not a feature — pass
  `live="polite"` only where the change is user-initiated and meaningful.
- `href` switches the element to `<a>`. Do **not** put an `onClick` on the
  non-link variant; if it is clickable, it is a link and should be one.
- `className` merged **last**; `forwardRef<HTMLElement>`.
- `displayName` set explicitly.

## Accessibility

- **Uppercase is a readability regression.** `text-transform: uppercase` does
  not change what a screen reader announces (the DOM text is unchanged), so this
  is a purely visual cost. It costs word-shape recognition, which is the main
  thing fast readers use. The 14px size is at the bottom of comfortable for
  uppercase text. That is why `--strong` exists and why the doc recommends it
  for anything over ~20 characters.
- **Announce the unit, not just the value.** A status label reading `DOWNLOADING`
  is fine; a bare `47` is not. Put the meaning in the text, not in an adjacent
  glyph.
- **Live regions must be opt-in.** `aria-live="polite"` on a progress readout
  that ticks every 200ms will flood a screen reader. Announce at the start and
  end of a long operation, not on every frame — or use
  `role="progressbar"` with `aria-valuenow` on the adjacent `ProgressBar`
  instead and leave the label silent.
- **The idle text is already only AA-large.** The default colour `#A0AA95` on
  `--vgui-surface` `#4C5844` is **3.11:1** — below the 4.5:1 WCAG AA threshold
  for normal text, and only just above the 3:1 large-text floor. The library's own
  table confirms the shape of the problem rather than contradicting it: `#A0AA95`
  on `--vgui-surface-dark` `#3E4637` is **4.06:1** and is already marked
  "AA-large only" (`foundations.md:436`), and the lighter surfaces a status strip
  actually sits on are worse — 2.40:1 on `--vgui-surface-light` `#5A6A50`.
  **A 14px status string in Valve's own colour does not pass AA, and that is the
  original's failure, not the port's.** Three honest responses: (a) set the
  default at 24px (or 18.66px bold) so the 3:1 large-text threshold applies — the
  corpus does not specify a size for these strings, since `uistatuspanel.layout:5-7`
  leaves the text to C++; (b) use the `--strong` variant, which is `#FFFFFF` at
  **7.54:1** (`foundations.md:429`) and drops the uppercase transform, for any
  string that carries meaning; (c) keep `#A0AA95` for purely decorative
  readouts. Do **not** change `--vgui-text-muted` itself: it is shared
  (`foundations.md:75`), and several components depend on it.
- **Colour-only hover.** The default → hover change is `#A0AA95` → `#FFFFFF` on
  `--vgui-surface` `#4C5844`: **3.11:1** → **7.54:1** (`foundations.md:429` for
  the white figure). The hover state passes AA easily; the *idle* state is the
  one that fails. Because Valve expresses hover as colour alone, the state change
  is invisible to a user who cannot perceive it — but the link variant is
  focusable and gets the standard ring, so the affordance is not lost. Do not add
  an underline on hover: the original does not have one, and the ring already
  carries it.
- **`--with-dot` is decorative.** The dot uses `currentColor` and carries no
  meaning, so it needs no accessible name. If it *does* carry meaning (online /
  offline), say it in the text or use `aria-label`.
- If the label is a link, the link text alone must be understandable out of
  context — screen-reader users navigate by link list. `DOWNLOADING` as a
  standalone link is ambiguous; prefer `DOWNLOADING GAME` or add an `aria-label`.

## Assets

None. The corpus block declares no `image` and no `render_bg`; a status label is
plain text. The `--with-dot` dot is a `::before` box, not a sprite — the theme
has no circular mask, and Valve never used one for this control.

## Examples

```tsx
{/* The canonical case: a clickable status readout in a bottom strip. */}
<StatusLabel href="steam://open/downloads">Downloading</StatusLabel>

{/* A live-updating string that must not spam a screen reader. */}
<StatusLabel live="polite">Ready</StatusLabel>

{/* Long strings drop the uppercase transform. */}
<StatusLabel strong>Signed in as dalcvi</StatusLabel>

{/* A decorative "active" marker. */}
<StatusLabel withDot>Connected</StatusLabel>
```

## Open questions

- **Two style blocks apply to the real-world control, and they disagree.** In
  `uistatuspanel.layout:5` the control name is `URLLabel` and the style applied
  is `StatusLabel`, but `URLLabel` *also* has its own block,
  `steam.styles:2682`–`2695`:

  ```
  URLLabel
  {
      textcolor = Label
      bgcolor = none
      font-family = basefont
      font-size = 14
      font-weight = 400
      font-style = underlined
  }
      URLLabel:Hover { textcolor = White }
  ```

  So the two blocks agree on colour (`Label`), size (14) and weight (400) and
  **disagree on style**: `StatusLabel` forces `uppercase`, `URLLabel` forces
  `underlined`. Which one the renderer applies — both, neither, or last-writer —
  is not stated anywhere in the corpus. A "DOWNLOADING" that is also underlined
  is a visibly different control from one that is not, and this library has to
  pick. The recommendation in the recipe is uppercase-with-no-underline, but that
  is a reading, not a citation. Evidence that would settle it: the VGUI style
  lookup order for a control with a named style.
- **The hover behaviour is doubled, which may be the whole point.** Both
  `StatusLabel:hover` (`:2389`–`:2392`) and `URLLabel:Hover` (`:2692`–`:2695`)
  do the same single thing: `textcolor = White`. Two independent blocks
  independently declaring the same hover for the same control is much stronger
  evidence than one block that the brighten-on-hover *is* the intended signal
  that a status readout is clickable.
- **What the status strings actually say is unknown.** All three controls are
  declared with `labelText=""` (`uistatuspanel.layout:5-7`); the text is set from
  C++ at runtime. Nothing in this corpus shows the real "Downloading…" strings,
  their typical length, or whether they are localisation tokens (`#…`) the way
  the overlay's URLs are (`overlaydesktop.layout:10`). Evidence that would settle
  it: a localisation dump from a retail client — `resource/steamui_*.txt` and the
  `#`-token scheme file, neither of which is present in this corpus (it contains
  two `.styles`, one `.res`, one `.menu`, nineteen `.layout` and a graphics tree,
  and no text tables at all).
- **The disabled treatment is inherited, not sourced.** The corpus has no
  disabled state for `StatusLabel`. The recommendation above (dim only, or do
  not render) is a library decision, not a Valve one.
- **`--with-dot` and `--strong` have no corpus precedent.** They are useful
  extensions; they should stay behind explicit props so the default output
  remains a literal transcription of `steam.styles:2380`.
- **The two `StatusLabel`s may be unrelated.** `steam.styles:2380`'s
  `StatusLabel` is a *style name*; `DialogServerBrowser.res:31`'s `StatusLabel`
  is a *panel name* wearing `style="status"`. Nothing in either file connects
  them, and the dialog's panel is a `Label` while the status panel's is a
  `URLLabel`, so it is possible that they are two independent uses of the same
  English word. Treating the dialog's 544×24 box as precedent for this
  component's layout is a reading, not a citation. Evidence that would settle it:
  the C++ that constructs the server browser dialog, or a screenshot where both
  are visible at once.
- **Nothing establishes a minimum width.** The 544px figure is the dialog's
  full-width strip, not a label metric. Whether a `StatusLabel` should be sized
  to its content or to a column is unstated; `nowrap` + `ellipsis` in the recipe
  is a safe default rather than an answer.
