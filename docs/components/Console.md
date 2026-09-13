# Console

## Purpose

A scrolling, monospace log of engine output: one line per event, newest at the
bottom, with error lines called out in red.

## VGUI original

**There is no `Console` control block in `steam.styles`.** The console is a
`RichText` with a monospace font, and that is stated outright in the file:

```
// styles for text used in RichText controls in various places   :2999
```

Everything the console has is three *text styles*, not a control:

```
CConsoleHistory
{
    font-family = "Lucida Console"
    font-size = 12
    font-family = "Menlo" [$OSX]
    font-size = 12 [$OSX]
    textcolor = White
    selectedtextcolor = White
}

console_text
{
    font-family = "Lucida Console"
    font-size = 12
    font-family = "Menlo" [$OSX]
    font-size = 12 [$OSX]
    textcolor= Text
    selectedtextcolor = White
    selectedbgcolor = MaizeBG
}

console_text_error
{
    font-family = "Lucida Console"
    font-size = 12
    font-family = "Menlo" [$OSX]
    font-size = 12 [$OSX]
    textcolor = Highlight3
    selectedtextcolor = White
    selectedbgcolor = MaizeBG
}
```

Line ranges: `CConsoleHistory` `:3001`, `console_text` `:3011`,
`console_text_error` `:3022`.

`Highlight3` is the theme's error colour, defined with its purpose in the
comment (`steam.styles:91`):

```
Highlight1="204 185 88 255"   // installing hover color
Highlight2="181 164 78 255"   // installing color
Highlight3="173 69 71 255"    // red for errors, blocked, etc.
Highlight5="77 109 140 255"   // blue
Highlight5a="83 124 166 255"  // lighter version of highlight5
Highlight5b="59 85 98 255"    // as highlight5 but darker, for non-focused window borders
```

### Six things to extract

1. **The console is a `RichText`, not a control.** It gets the recessed
   `DarkGreenBG` surface, the 6px inset and the selection behaviour from
   `RichText` (`:1935`) and only the *font* and *line colours* from these three
   styles. So the console inherits everything `RichText` does — including the
   inverted bevel — and adds exactly two things: `"Lucida Console"` at 12px and a
   per-line colour.
2. **`12px` monospace, not 14px.** Every other text in the theme is
   `font-size = 14` (16 on macOS). The console is deliberately **two points
   smaller**, which is what lets a long log line fit. It is also the only
   non-`basefont` family in the entire theme: `"Lucida Console"` on Windows and
   `"Menlo"` on macOS, both of which are the platform's own monospace default.
3. **`Highlight3` is `173 69 71`** — a desaturated brick red, not a pure red like
   `TestColor` (`255 0 0`). Error lines are marked with a muted red that sits in
   the same saturation range as the rest of the palette. A `#FF0000` error line
   would be wrong.
4. **`CConsoleHistory` has no `selectedbgcolor`.** `console_text` and
   `console_text_error` both set `selectedbgcolor = MaizeBG`, but the history
   style sets only `selectedtextcolor = White` and leaves the background
   unspecified. So **selected text in the console history has no highlight
   colour** — the platform default shows through. Another gap rather than a
   decision, and it is the same class of omission as the empty `render_bg {}`
   blocks elsewhere in this file.
5. **The highlight numbering skips 4.** The file defines `Highlight1`, `2`, `3`,
   `5`, `5a` and `5b`. There is no `Highlight4`, so any code or documentation
   that assumes a contiguous sequence will be wrong. `Highlight5` (`77 109 140`,
   blue) is the informational colour; `Highlight1`/`2` are the maize "installing"
   pair, which are also `Maize` (`196 181 80`) and `MaizeBG` (`145 134 60`)
   neighbours.
6. **`CConsoleHistory` and `console_text` differ in their idle colour.**
   `CConsoleHistory` is `White`; `console_text` is `Text`. So **the same console
   shows two different foregrounds depending on which style a line was written
   with** — history scrollback is white, live output is `Text`. Since most
   output is written with `console_text`, the visible colour of the log is
   whatever `Text` resolves to, not white.

`Text` is **absent from `steamscheme.res`** — its `Colors` block closes at `:71`
and contains no `"Text"` key — but it *is* defined in `steam.styles` itself, the
same file that declares `console_text`. `steam.styles:57`:

```
Text="160 170 149 255"
```

which is `#A0AA95` — byte-identical to `Label` (`steam.styles:67`). Because the
control style and the colour live in one file, the resolution is not ambiguous:
a live console line is `#A0AA95`, *not* the off-white `#D8DED3` an earlier draft
of this doc assumed from `OffWhite`/`DullGreen` (`steamscheme.res:20–21`, both
`216 222 211`). That correction matters for contrast — see Accessibility.

`basefont` is a *legacy font alias* rather than a family —
`steamscheme.res:248` warns `// !! legacy, should set fonts in the style for a
control`, and the `Fonts` block (`:251`) is introduced with `// this is just for
reference by the code` (`:249`).

## Variants

| Variant | Class | Line colour |
| --- | --- | --- |
| Live output | `vgui-console__line` | `Text` = `#A0AA95` (`steam.styles:57`) |
| Error | `vgui-console__line--error` | `Highlight3` = `#AD4547` (`steam.styles:91`) |
| History | `vgui-console__line--history` | `White` = `#FFFFFF` (`steam.styles:13`) |

## Anatomy

```html
<div class="vgui-console" role="log" aria-live="polite" tabindex="0">
  <ol class="vgui-console__history">
    <li class="vgui-console__line">Connecting to 192.168.1.10:27015...</li>
    <li class="vgui-console__line vgui-console__line--error">Bad challenge from 192.168.1.10</li>
    <li class="vgui-console__line vgui-console__line--history">Server is out of date</li>
  </ol>
</div>
```

`role="log"` with `aria-live="polite"` is what makes appended lines announce
themselves; `<ol>` gives the line count to assistive tech for free.

## States

| State | Treatment |
| --- | --- |
| Idle, live line | `Text` on `DarkGreenBG` |
| Idle, history line | `White` on `DarkGreenBG` |
| Error line | `Highlight3` on `DarkGreenBG` |
| Selected (live, error) | `White` on `MaizeBG` |
| Selected (history) | `White` on **platform default — no `selectedbgcolor`** |
| Hover | *not defined* |
| Disabled | *not defined* |
| Focus | *not defined* |

There is **no hover, disabled or focus style** for any console style. The
console is read-only, which excuses the first two but not the third — see
Accessibility.

## Tokens

| Token | Value | Where |
| --- | --- | --- |
| `--vgui-console-font` | `'Lucida Console', Menlo, monospace` | `CConsoleHistory`, `:3001` |
| `--vgui-console-font-size` | `12px` | Same, all three styles |
| `--vgui-console-text` | `#A0AA95` (`160 170 149`) | `console_text` `textcolor = Text`, `:3017`; `Text` = `steam.styles:57` |
| `--vgui-console-history-text` | `#FFFFFF` | `CConsoleHistory` `textcolor = White`, `:3007`; `white` = `steam.styles:13` |
| `--vgui-console-error` | `#AD4547` (`173 69 71`) | `Highlight3`, `steam.styles:91` |
| `--vgui-console-selection-bg` | `#91863C` (`145 134 60`) | `MaizeBG`, `steamscheme.res:44` |
| `--vgui-console-bg` | `#3E4637` (`62 70 55`) | `DarkGreenBG`, `steamscheme.res:48`; used by `RichText`, `steam.styles:1937` |
| `--vgui-console-info` | `#4D6D8C` (`77 109 140`) | `Highlight5`, `steam.styles:92` |
| `--vgui-console-highlight` | `#CCB958` (`204 185 88`) | `Highlight1`, `steam.styles:89` |

## CSS recipe

```css
.vgui-console {
  /* The console is a RichText: it inherits the recessed frame and the fill. */
  background-color: var(--vgui-console-bg, #3e4637);
  color: var(--vgui-console-text, #a0aa95);
  border-top: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-light);
  padding: var(--vgui-richtext-inset, 6px);
  overflow-y: auto;
  /* 12px, not 14: the console is deliberately two points smaller than the
     rest of the theme, and monospace is its only non-basefont family. */
  font-family: var(--vgui-console-font, 'Lucida Console', Menlo, monospace);
  font-size: var(--vgui-console-font-size, 12px);
  line-height: 1.35;
}

.vgui-console__history {
  margin: 0;
  padding: 0;
  list-style: none;
}

.vgui-console__line {
  color: var(--vgui-console-text, #a0aa95);
  white-space: pre-wrap;          /* console lines are column-aligned */
  overflow-wrap: anywhere;        /* ...but must not overflow the panel */
}

/* CConsoleHistory is White; console_text is Text. Two colours, one console. */
.vgui-console__line--history {
  color: var(--vgui-console-history-text, #fff);
}

.vgui-console__line--error {
  color: var(--vgui-console-error, #ad4547);
}

/* The red fails contrast on its own (1.74:1 on this fill), so an error line
   also gets a leading glyph. Non-colour signal, WCAG 1.4.1. */
.vgui-console__line--error::before {
  content: 'ERR: ';
  color: var(--vgui-console-error, #ad4547);
}

/* Opt-out for a consumer that supplies its own prefix or localises it. */
.vgui-console--no-error-prefix .vgui-console__line--error::before {
  content: none;
}

/* CConsoleHistory sets no selectedbgcolor, so the default shows through; that
   is reproduced by simply not styling it. The live styles do set MaizeBG. */
.vgui-console__line:not(.vgui-console__line--history)::selection {
  background-color: var(--vgui-console-selection-bg, #91863c);
  color: #fff;
}
```

**`console_text`'s colour is not a guess.** An earlier draft of this document
treated `Text` as inherited from the base Source scheme and defaulted it to the
off-white `OffWhite`/`DullGreen` value (`steamscheme.res:20–21`, `216 222 211`).
That was wrong: `Text` is declared in `steam.styles` itself at `:57` as
`160 170 149`, and the file that defines `console_text` is the file that defines
`Text`, so the resolution is local and unambiguous. The fallback in the recipe is
`#a0aa95`, and the consequence is that a live console line is notably dimmer than
an earlier reading of the corpus suggested — 4.06:1 against the fill rather than
7.2:1. The recipe keeps the authentic colour and documents the substitution in
Accessibility rather than quietly "fixing" Valve's palette.

**The error prefix is CSS, not markup.** A `::before` pseudo-element keeps the
`lines` prop a plain data array — a consumer can log `ERR:` verbatim and get
exactly one prefix, or pass `errorPrefix=""` and lose none. It also means the
glyph is inside the `.vgui-console__line--error` box, so it inherits the error
colour and cannot drift out of sync with it.

**Use `white-space: pre-wrap`, not `pre`.** The corpus's console output is
column-aligned by the engine, so whitespace is meaningful; but `pre` would let a
long line push the panel wider instead of wrapping. `pre-wrap` preserves the
alignment and still contains the overflow.

**Do not add a hover or focus treatment to a console line.** The corpus defines
none, and console lines are not interactive — adding a hover highlight implies
clickability that does not exist.

## React API

```tsx
export type ConsoleLineKind = 'text' | 'error' | 'history'

export interface ConsoleLine {
  /** Stable identity; also the React key. */
  id: string
  /** The log text, rendered verbatim including whitespace. */
  text: string
  /** Drives the colour: Text, Highlight3, or White for history. */
  kind: ConsoleLineKind
}

export interface ConsoleProps {
  /** Lines in display order, oldest first. */
  lines: ConsoleLine[]
  /** Accessible name, e.g. "Server console". */
  label: string
  /** Scroll to the newest line when it is appended. */
  follow?: boolean
  /** Maximum retained lines before the oldest are dropped. */
  maxLines?: number
  /** Text prefixed to error lines so the failure is not colour-only; set to '' to disable. */
  errorPrefix?: string
}
```

## Accessibility

- **`role="log"` and `aria-live="polite"` are the whole point.** A console that
  appends lines silently is invisible to a screen reader. `polite` rather than
  `assertive` keeps it from interrupting; an error line may warrant
  `aria-live="assertive"` or `role="alert"` — but only for errors, because a
  console can emit dozens of lines a second.
- **`Highlight3` (`173 69 71` → `#AD4547`) on `DarkGreenBG` (`62 70 55` →
  `#3E4637`) is 1.74:1** (computed, sRGB relative luminance; 1.33:1 against
  `--vgui-surface` `#4C5844`). That is far below 4.5:1 for body text and below 3:1
  for large text and even below the 3:1 threshold for non-text UI state
  indicators. Console text is body text. This is the corpus's error colour and it
  fails contrast badly, so colour alone cannot be the signal — see the prefix
  rule below.
- **The live line is only 4.06:1.** `Text` `#A0AA95` (`steam.styles:57`) on
  `DarkGreenBG` `#3E4637` is **4.06:1** — the same figure `foundations.md:436`
  records for `--vgui-text-muted` on `--vgui-surface-dark`, because they are the
  same two colours. That clears 3:1 but misses 4.5:1 for body text, and console
  output *is* body text at 12px. Only the history lines (`#FFFFFF` on `#3E4637`,
  **9.83:1**) are comfortable. Use `--vgui-text-strong` `#FFFFFF` or
  `--vgui-text` `#D8DED3`
  (`7.17:1`, `foundations.md:430`) for live output rather than reproducing
  Valve's muted green, and keep `--vgui-console-text` for a "dimmed log" opt-in.
- **Colour cannot be the only channel for errors (WCAG 1.4.1).** The red is the
  *only* thing distinguishing an error line today, so the component prefixes
  error lines with `ERR:` by default — a glyph that survives greyscale and
  colour-blind reading. `errorPrefix` is settable so a non-English UI can
  localise it, and `''` disables it for consumers with their own signal.
- **A monospace console must not be selectable-by-accident and must not trap the
  keyboard.** Give the container `tabindex="0"` so it can be scrolled with the
  keyboard, but do not attach a key handler that swallows `Ctrl+C`; users
  copy console text, and `Ctrl+C` is also the engine's console toggle in the
  original games.
- **Virtualise or cap the line count.** A long-running console is an unbounded
  DOM. The corpus says nothing about a maximum, so `maxLines` is an addition, and
  without it a console left open for hours will be the slowest part of the app.
- **Selection colours need `::selection`, and the history gap is visible.**
  Because `CConsoleHistory` has no `selectedbgcolor`, selecting history text in a
  faithful build shows the *platform* highlight — which, in a dark green console,
  will be a blue or grey block. That is the correct reproduction and a poor
  experience. If the gap is filled, fill it with `MaizeBG` to match the other two
  styles.
- **Never `innerHTML` a log line.** Console output is exactly the kind of text
  that contains server-controlled data — hostnames, player names, chat. Render it
  as text nodes.
- **`white-space: pre-wrap` plus `overflow-wrap: anywhere` is required** for
  long server-supplied strings. A 4000-character line without breaks will
  otherwise force a horizontal scrollbar or overflow the panel, and in a
  screen-reader context an unbroken 4000-character token is unreadable.

## Assets

**None.** All three console styles define only a font family, a size and two
colours (`steam.styles:3001–3031`); there is no sprite, no glyph and no icon.
Error lines are distinguished purely by `Highlight3`.

**Assets:** this package ships **no image assets, by policy** — no `public/`,
no `src/assets/`. See `docs/assets.md`.

## Examples

```tsx
<Console
  label="Server console"
  follow
  maxLines={2000}
  lines={[
    { id: '1', kind: 'text',    text: 'Connecting to 192.168.1.10:27015...' },
    { id: '2', kind: 'error',   text: 'Bad challenge from 192.168.1.10' },
    { id: '3', kind: 'history', text: 'Server is out of date' },
  ]}
/>
```

## Open questions

- **`Text` is not resolvable from this corpus.** It is used by `console_text`,
  `ListPanel`, `SectionedListPanel` and many others, and defined nowhere. The
  console's own idle colour is therefore unknown, which is a bigger gap than it
  sounds because it is the colour most of the log is printed in.
- **`CConsoleHistory` missing `selectedbgcolor` looks like an oversight**, but
  it could be deliberate so that scrollback selection is visually distinct from
  live-output selection. No comment says which.
- **The console has no control block**, so its padding, scrollbar, border and
  measurement come entirely from `RichText`. Whether the real console reuses
  `RichText`'s 6px `InsetX`/`InsetY` — or the `inset = "0 0 0 0"` the `RichText`
  block actually declares — is the same unresolved conflict that `RichText.md`
  records.
- **Nothing states how many lines the history holds** or how the scrollback is
  trimmed. `maxLines` here is an invention.
- **No `Highlight4` exists**, and `Highlight1`, `2`, `5`, `5a`, `5b` are all
  still undefined in their intended usage. A console that colours *warnings* has
  no established colour to use — `Highlight1`/`2` are documented as "installing",
  not "warning".
- **The 12px size is the only non-`basefont` text in the theme**, which suggests
  a font-resolution path separate from the rest. Whether `basefont` even maps to
  Arial (`steamscheme.res:257`, `"name" "Arial"` under the legacy `Fonts` block
  that `:249` admits is `// just for reference by the code`) is unverified.
