# Link

## Purpose

Inline text that navigates. Also the styling basis for a low-emphasis inline
button — VGUI calls these `URLLabel` and `TextButton`, and they are the same look
with different affordances.

## VGUI original

`URLLabel` / `URLLabelSimple` — a `Label` that opens a URL — and `TextButton`.
Four blocks, three of which are byte-identical:

```
URLLabel
{
    font-family = basefont
    font-size = 14
    font-size = 16 [$OSX]
    font-weight = 400
    textcolor = Label
    bgcolor = none
    font-style = underlined          // <-- always underlined
}
    URLLabel:Hover { textcolor = White }

URLLabelSimple { /* identical, including font-style = underlined */ }
```

```
TextButton
{
    font-family = basefont
    font-size = 14
    font-size = 16 [$OSX]
    textcolor = LinkText
    bgcolor = none
}
```

`RichText` carries the same convention for links inside a paragraph:
`textcolor = White`, `font-style = underlined`.

### Four things to extract

1. **The underline is permanent and it is the whole affordance.** There is no
   state in which a VGUI link is not underlined. Colour alone never distinguishes
   a link; the underline always does.
2. **Hover changes colour only, never decoration.** `:Hover { textcolor = White }`
   — the underline is already there, so the only thing hover can do is brighten.
   **This is the exact inverse of the CSS port**, whose `a:hover` *adds* the
   underline to a link that had none. The README's current "Underlined-on-hover"
   line describes the port, not the game, and should be corrected.
3. **`Label` and `LinkText` are the same colour** (`#A0AA95` vs `#A0AA95`, a
   1-unit rounding difference — `159 169 149` vs `160 170 149`). So a link's
   *resting* colour is identical to ordinary secondary label text: only the
   underline separates them. Do not "make links a different colour" — that is a
   web habit, and here it is wrong.
4. **No visited state exists.** VGUI had no `:visited` selector. Do **not** add
   one; a purple visited link is the single most period-breaking mistake
   available, and modern browsers will apply their own unless explicitly
   overridden. The reset must set `:visited` to the resting colour.

## Variants

| Variant | Class | Resting | Hover |
| --- | --- | --- | --- |
| Link | `vgui-link` | `--vgui-text` | `#FFFFFF`, underline permanent |
| Quiet link | `vgui-link--quiet` | `#A0AA95` (`URLLabel`) | `#FFFFFF` |
| Inline text button | `vgui-link--button` | `#A0AA95` (`TextButton`), no underline | `#FFFFFF` |
| External | `--external` | as above + trailing glyph | as above |
| Disabled | `--disabled` | `#75806F` | unchanged |

The distinction that matters is **link vs text button**: a link navigates and is
underlined; a text button performs an action and is not. `TextButton` in
`steam.styles` is deliberately not underlined even though it shares the colour,
which is Valve using decoration to encode "this is an action" — worth preserving.

## Anatomy

```html
<!-- navigates: always underlined -->
<a class="vgui-link" href="/servers">Server list</a>

<!-- acts: no underline, same colour -->
<button class="vgui-link vgui-link--button" type="button">Refresh</button>

<!-- leaves the app -->
<a class="vgui-link vgui-link--external" href="https://…" target="_blank" rel="noreferrer noopener">
  Steam Support<span class="vgui-link__external" aria-hidden="true">↗</span>
</a>
```

## States

| State | Colour | Underline |
| --- | --- | --- |
| Resting | `#D8DED3` (`Text`) | always |
| Hover | `#FFFFFF` (`White`) | always |
| Active/pressed | `#FFFFFF` | always |
| Focus-visible | `#FFFFFF` | always + 1px dotted offset ring |
| Visited | **same as resting** — overridden | always |
| Disabled | `#75806F` | always |

## Tokens

| Token | Value | Where |
| --- | --- | --- |
| `--vgui-text` | `#D8DED3` | Recommended resting colour |
| `--vgui-link-quiet` | `#A0AA95` | The literal `Label`/`LinkText` value |
| `--vgui-text-strong` | `#FFFFFF` | Hover |
| `--vgui-text-disabled` | `#75806F` | Disabled |
| `--vgui-text-disabled-shadow` | `#282E22` | Disabled text shadow |
| `--vgui-focus-ring` | `#292D23` | Dotted ring |

> **Why the literal `#A0AA95` is not the default.** Measured against the two
> surfaces it actually sits on, `#A0AA95` gives **4.06:1** on `--vgui-surface`
> `#3E4637` and only **3.12:1** on `--vgui-surface-2` `#4C5844`. Both fail the
> 4.5:1 required for 14px body text, and the second fails badly. `--vgui-text`
> `#D8DED3` gives **7.16:1** and **5.50:1** — passing on both. Since Valve's own
> `:Hover` already uses `White`, brightening the resting colour to `Text` keeps
> the *hover relationship* (brighter on hover) intact and stays inside the
> palette. `#A0AA95` is retained as `--vgui-link-quiet` for links that are
> genuinely decorative and never the only route to content. This is
> `foundations.md §10` Baseline rule 1 applied to text rather than to maize.

## CSS recipe

```css
.vgui-link {
  color: var(--vgui-text, #d8ded3);
  text-decoration: underline;
  text-underline-offset: 1px;
  cursor: pointer;
}

.vgui-link:hover,
.vgui-link:active {
  color: var(--vgui-text-strong, #fff);
}

/* VGUI has no visited state; a browser default would break the period look. */
.vgui-link:visited {
  color: var(--vgui-text, #d8ded3);
}

.vgui-link:focus-visible {
  outline: 1px dotted var(--vgui-focus-ring, #292d23);
  outline-offset: 2px;
}

.vgui-link--quiet {
  color: var(--vgui-link-quiet, #a0aa95);
}

.vgui-link--button {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-decoration: none;            /* TextButton is deliberately not underlined */
}

.vgui-link--button:hover {
  color: var(--vgui-text-strong, #fff);
  text-decoration: none;            /* do not add it on hover either */
}

.vgui-link--disabled,
.vgui-link[aria-disabled='true'] {
  color: var(--vgui-text-disabled, #75806f);
  text-shadow: 1px 1px 0 var(--vgui-text-disabled-shadow, #282e22);
  pointer-events: none;
}
```

**`text-decoration: underline` and not `border-bottom: 1px solid`.** A border
sits at the bottom of the *box*, which for an inline element with a
`line-height` greater than 1 detaches from the baseline; the underline also
survives wrapping correctly and is what a browser's `:visited` and
forced-colors modes expect. The port's `text-decoration: none` + `a:hover
{ text-decoration: underline }` is the one that must not be carried over.

## React API

```tsx
export interface LinkProps {
  /** Destination. Omit to render a button-styled action instead. */
  href?: string
  /** Low-emphasis `URLLabel` colour instead of the default. */
  quiet?: boolean
  /** Renders as an action button with no underline (`TextButton`). */
  asButton?: boolean
  /** Adds target="_blank" and the external glyph. */
  external?: boolean
  /** Not reachable or clickable. */
  disabled?: boolean
  /** Rendered content. */
  children: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
}
```

## Accessibility

- **Underline always, at every state.** WCAG 1.4.1 (Use of Color) requires that
  colour alone not identify a link in body text. The VGUI convention satisfies
  this by construction; the CSS port does **not**, because an un-highlighted
  `#AAAAAA` link among `#D8DED3` body text is identified by colour only. Fixing
  this is why the default above is underlined.
- **Visited must be neutralised.** Beyond period accuracy, a browser's default
  `:visited` is purple `#551A8B`, which fails contrast on every surface here.
  Override it.
- **`--quiet` is the risky variant, and it may only be used decoratively.** At
  4.06:1 it already fails; use it when the link is *redundant* (an adjacent
  identical link, a "read more" after a summary, a link repeated in a footer).
  Never for the only route to a page.
- **A text button must be a `<button>`, not `<a role="button">`.** It has no
  `href`, so keyboard users reach it by Tab and activate with Enter/Space — which
  only a button does. `role="button"` on an anchor without `href` is not
  focusable at all.
- **Do not remove focus outlines to match the period.** VGUI's `:focus` on
  `TextButton` is unspecified, which tempts an implementation to ship nothing.
  Ship a 1px dotted ring at `outline-offset: 2px` — the dotted ring is already
  the house pattern (see `Button`).
- **External links need `rel="noreferrer noopener"`** and should say so in the
  accessible name, e.g. `<span class="vgui-visually-hidden">(opens in a new tab)</span>`,
  rather than relying on the glyph.
- **`pointer-events: none` on a disabled link is not enough** — the element stays
  in the tab order. Pair it with `tabindex="-1"` and `aria-disabled="true"`, or
  render a `<span>`. A `<span>` is the cleaner answer for a permanently dead
  link; `aria-disabled` is for one that may come back.
- **Inline links inside a `RichText`-style paragraph inherit that paragraph's
  colour rules.** `RichText`'s url colour is `White` at rest, i.e. already the
  hover colour outside. Use `--vgui-text` for consistency unless reproducing a
  rich-text block exactly; do not let both appear in the same paragraph.

## Assets

**None — and this is the one component where the asset gap does not matter.**
`URLLabel`, `URLLabelSimple`, `TextButton` and `RichText`'s url all draw with
`font-style = underlined` and `textcolor`, referencing no `.tga`. The only
optional art is the external-link glyph in the `--external` variant, which is
**not** in the corpus: `vgui.css/styles/greensteam/` ships 16 images and none of
them is an external-link arrow (full inventory in `docs/assets.md`). Either draw
one to the house grid or omit it and rely on the hidden text.

## Examples

```tsx
<p className="vgui-text">
  Found <Link href="/servers?f=notfull">142 servers</Link>. See the{' '}
  <Link href="https://developer.valvesoftware.com/wiki/VGUI" external>VGUI docs</Link>{' '}
  for the design language.
</p>

<Link asButton onClick={refresh}>Refresh list</Link>
```

## Open questions

- **`TextButton` and `URLLabel` may be the same control with different flags.**
  Both are 14px, 400 weight, `bgcolor = none`, `#A0AA95`, white on hover; the
  only difference is `font-style`. In VGUI1 `TextButton` was `Label` + button
  behaviour. The three-variant API above is a guess at the right public shape;
  it may collapse to one component with `underline` and `href`.
- **`LinkText` vs `Label` are 1 unit apart** (`160 170 149` vs `159 169 149`) and
  may be the same colour with a transcription slip. Treat them as one token.
- **`TextButton:focus` is undefined**, so there is no period-correct focus ring
  to copy. The dotted ring is inherited from `Button` by convention, not evidence.
- **`RichText` link hover is `White` on `White`** — the block declares
  `textcolor = White` at rest *and* `:hover { textcolor = White }`, so rich-text
  links have **no hover feedback at all**, only the underline. Whether that is
  deliberate or a stylesheet mistake is unknown. If it is reproduced, the links
  pass contrast (21:1) but give no feedback; prefer brightening from
  `--vgui-text` so that hover says something.
