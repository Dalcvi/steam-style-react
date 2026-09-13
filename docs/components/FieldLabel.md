# FieldLabel

The ordinary text label — the caption next to a `TextInput`, the name of a
checkbox, the row of explanatory text under a heading. It is the most-used
control in the corpus and the least interesting: no bevel, no face, no sprite,
no interaction. Its only notable behaviour is the classic Valve *sunken*
disabled treatment.

## Purpose

`FieldLabel` provides the text half of every control pairing. It is deliberately
separate from `StatusLabel` even though they share a stylesheet block, because
they behave differently: a `FieldLabel` is static and associated with an
interactive control; a `StatusLabel` is uppercase, transient, and often a link.

Use `FieldLabel` for:

- A `<label>` before or after a `TextInput`, `Select`, `Slider` or `Checkbox`.
- Explaining text that is not a heading and not a status.
- The "no items found" message inside an empty `List`.

Do **not** use it for section headings — that is `GroupBox`'s legend or a
`Panel`'s heading — or for status readouts (`StatusLabel`).

## VGUI original

`Label`, defined in `steam.styles`:

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\styles\steam.styles:1147
```

| Property | Value | Line |
| --- | --- | --- |
| `font-family` | `basefont` | `steam.styles:1149` |
| `font-size` | `14` (`16 [$OSX]`) | `steam.styles:1150-1151` |
| `textcolor` | `Label` | `steam.styles:1152` |
| `selectedtextcolor` | `Text` | `steam.styles:1153` |

That is the entire block — **four declarations**. There is:

- no `inset`,
- no `render` / `render_bg` program,
- no `image`,
- **no `disabled` state**,
- no `hover` state.

A `Label` is bare text on whatever surface is behind it. It is one of only two
controls in the corpus to declare a `selectedtextcolor` without declaring
`textcolor` variants (the other is `ListPanel`, `steam.styles:1156`).

### It is everywhere

`"ControlName" "Label"` appears **21 times** across the three `.layout` files
under `resource/layout/`:

| File | Occurrences |
| --- | --- |
| `resource/layout/uinavigatorpanel.layout` | 16 (`:67`, `:74`, `:81`, `:87`, `:93`, `:99`, `:107`, `:115`, `:123`, `:131`, `:139`, `:147`, `:155`, `:163`, `:175`, `:182`) |
| `resource/layout/accountbutton.layout` | 3 (`:14`, `:23`, `:32`) |
| `resource/layout/steamrootdialog.layout` | 2 (`:7`, `:100`) |

A further **23 `.res` files declare the same class name — 67 occurrences
altogether**, 20 files under `OG-Steam\friends\` and 3 under `OG-Steam\servers\`
(`FriendOnlineNotification.res` at `:54`, `:73`, `:104`, `DialogServerBrowser.res`
at `:33`, `InternetGamesPage_Filters.res` at `:134`, `:289`, `:307`, `:325`,
`:343`, `ChatInviteNotification.res` at `:54`, `:73`, `:92`, `:122`, and so on) —
the count above is deliberately scoped to `resource/layout/` so it can be
re-verified in one command. Note that the extra `.res` files live *beside* the
game binaries (`OG-Steam\friends\`, `OG-Steam\servers\`), not under
`resource\`: `resource\` holds exactly one `.res` file, `steamscheme.res`.

`accountbutton.layout:14` is representative — a `Label` used as a static
caption beside an avatar and a dropdown.

### The sunken disabled treatment

`Label` itself declares no disabled state, but the *scheme* provides the two
colours and a comment that spells out the intent:

```ini
"DisabledText1"  "117 128 111 255"  // disabled text
"DisabledText2"  "40 46 34 255"     // overlay color for disabled text (to give that inset look
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\steamscheme.res:50-51
```

Note the comment is truncated mid-parenthesis in the original file. The values
are `#75806F` and `#282E22`, and they are exposed in this library as
`--vgui-text-disabled` and `--vgui-text-disabled-shadow` (`foundations.md:77-78`).

The mechanism is: **draw the label once in `DisabledText2` offset `+1px +1px`,
then draw it again in `DisabledText1` on top.** The dark copy peeks out at the
bottom-right and makes the text look pressed into the surface. `Button` uses the
identical trick (`Button.md`, "The disabled text is the classic sunken trick"),
which is why this is documented as a theme-wide convention rather than a
`FieldLabel` quirk. In CSS it is one declaration:

```css
text-shadow: 1px 1px 0 var(--vgui-text-disabled-shadow);
```

Do **not** implement it as two stacked elements or an `::after` clone — a
`text-shadow` is exactly equivalent here and cannot drift out of alignment.

### Two tokens are not in this corpus

| Declared | `steamscheme.res` | Consequence |
| --- | --- | --- |
| `textcolor = Label` | **not defined** in the `Colors` block (`steamscheme.res:10-71`) | `foundations.md:75` assumes `#A0AA95` |
| `selectedtextcolor = Text` | **not defined** | unchanged from the base Source scheme |

Both resolve from the base Source-engine scheme that Steam's scheme extends. The
`Label` colour is the same open question raised in `StatusLabel.md` and
`Tooltip.md`; `--vgui-text-muted` carries the assumption. `selectedtextcolor`
only applies when text is dragged-and-selected, which is rare on a caption but
does happen on an explanatory paragraph inside a `Dialog`.

## Variants

| Variant | What changes | Source |
| --- | --- | --- |
| *(default)* | `<span>`, `--vgui-text` `#D8DED3`, 14px | `steam.styles:1147`, contrast-corrected — see *Accessibility* |
| `--html-for` | Renders `<label for>`; clicking focuses the control | *(library)* |
| `--strong` | `--vgui-text-strong`, for a caption that must lead | *(library)* |
| `--muted` | `--vgui-text-muted` `#A0AA95` (the classic `Label` grey), for captions on a darker surface | *(library)* |
| `--heading` | `--vgui-heading` `#C4B550`, for a label acting as a section title | *(library)* |
| `--required` | Appends a `*` in `--vgui-danger` | *(library)*, a11y-gated — see below |
| `--disabled` | Sunken `DisabledText1` over `DisabledText2` | `steamscheme.res:50-51` |

## Anatomy

```tsx
<label class="vgui-field-label" for="server-name">Server name</label>
```

One element, one text node. Structurally identical to `StatusLabel`, and that is
the point — the difference is entirely in the tokens and the association.

When a `FieldLabel` captions a control, it renders a `<label>` with `htmlFor`
pointing at the control. When it is a standalone sentence, it renders a `<span>`.

## States

| State | Change | Source |
| --- | --- | --- |
| Normal | `--vgui-text` `#D8DED3` — differs from the corpus `Label` grey, see *Accessibility* | `steam.styles:1152` |
| Hover | **Nothing.** A label is not interactive | `steam.styles:1147` — no `:hover` |
| Focus-visible | Only when it is a `<label>` that received focus in a form context | *(library)* |
| Selected | `selectedtextcolor = Text` applies to text selection | `steam.styles:1153` |
| Disabled | `--vgui-text-disabled` + `1px 1px 0` shadow in `--vgui-text-disabled-shadow` | `steamscheme.res:50-51` |
| Error | `--vgui-danger` — **not in the corpus**, see below | *(library)* |

**Labels have no hover state and must not gain one.** Adding a hover colour to a
caption is the fastest way to make a VGUI layout look like a modern web page:
everything starts to look clickable. If a caption needs to signal affinity with
a control, dim the *control*, not the label.

### Error state is an addition

The corpus has no error colour for labels. Valve's validation UI put the failure
message in a `MessageBox`, not inline. The `--error` variant is therefore a
deliberate extension for form validation, and it must carry a non-colour cue
(the message text itself) because `--vgui-danger` `#E2251A` on
`--vgui-surface` `#4C5844` is **2.11:1** against `--vgui-surface-dark`
(`foundations.md` §10) — visually loud, but not a legibility problem since the
point is to be noticed, not to be read as body copy at length.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-text` `#D8DED3` | Default text — **not** the `Label` grey, see *Accessibility* |
| `--vgui-text-strong` `#FFFFFF` | `--strong` |
| `--vgui-text-muted` `#A0AA95` | `--muted` (the `Label` token, for darker surfaces) |
| `--vgui-heading` `#C4B550` | `--heading` |
| `--vgui-danger` `#E2251A` | `--required` asterisk, `--error` |
| `--vgui-text-disabled` `#75806F` | Disabled text (`DisabledText1`) |
| `--vgui-text-disabled-shadow` `#282E22` | Disabled shadow (`DisabledText2`) |
| `--vgui-accent` `#C4B550` | Focus ring when focusable |
| `--vgui-font` | Font family |
| `--vgui-font-size` `14px` | Font size |

All shared tokens referenced **without** `var()` fallbacks (`foundations.md` §4).
This component declares no local tokens.

### The `Label` family is seven greys for five jobs — pick one

`steam.styles` declares the whole family in two clusters, in **two different
syntaxes** — `Name="R G B A"` at `:66`–`:70` and the quoted `"Name" "R G B A"`
form used everywhere else in the file at `:200`–`:207`:

| Token | Value | Line | Hex | Applied by |
| --- | --- | --- | --- | --- |
| `NavLabel` | `158 153 149 255` | `steam.styles:66` | `#9E9995` | `uinavigatorpanel.layout:257`, local `NavLabel` style at `:446` |
| `Label` | `160 170 149 255` | `steam.styles:67` | `#A0AA95` | `Label` `:1152`, `StatusLabel` `:2386`, `URLLabel` `:2684`, `TextEntry:empty` `:2449` |
| `Label2` | `115 111 108 255` | `steam.styles:68` | `#736F6C` | `ugcdownloadpanel.layout:17`, `:22`, `:24`, `:27`, `:34`, `:91`, local block `:87`; `steamrootdialog.layout:295`; `twofactorcodechallenge.layout:9` |
| `LabelDisabled` | `138 135 132 255` | `steam.styles:69` | `#8A8784` | `accountbutton.layout:137`, `steamrootdialog.layout:388`, `ugcdownloadpanel.layout:297`, `uinavigatorpanel.layout:272`, `:327` |
| `LabelFocus` | `199 196 194 255` | `steam.styles:70` | `#C7C4C2` | `musicplayerpanel.layout:123`, `uinavigatorpanel.layout:390`, `:764` |
| `DimBaseText` | `160 170 149 255` | `steam.styles:201` | `#A0AA95` | **nothing** — only the declaration |
| `LabelDimText` | `160 170 149 255` | `steam.styles:202` | `#A0AA95` | **nothing** — only the declaration |

**This is a real collision, and it is not the one it first appears to be.** None
of these seven is referenced as a colour by number in `steam.styles` itself;
they are consumed as `textcolor = <name>` inside **layout-local `styles`
blocks** — `ugcdownloadpanel.layout:87`, `uinavigatorpanel.layout:446`,
`musicplayerpanel.layout:123`. So five of the seven are live, in five different
screens, which means the family was maintained deliberately rather than
copy-pasted. The genuine redundancy is narrower and sharper:

- **`DimBaseText` (`:201`) and `LabelDimText` (`:202`) are the same three bytes as
  `Label` (`:67`)** — `160 170 149 255`, three of them. The file even comments
  `:202` "used for info text" and `:201` "dim base text": a *dim* colour that is
  byte-identical to the normal one, declared twice, and applied by nothing. These
  two are dead duplicates and should collapse into `--vgui-text-muted`. If "info
  text" ever needs to be dimmer, the corpus already has a genuinely different
  value, `DimListText` `#758666` (`steam.styles:207`, exposed as
  `--vgui-text-dim`).
- **`LabelDisabled` (`:69`) versus `DisabledText1` (`steamscheme.res:50`) is a
  two-token collision for one job** — `#8A8784` versus `#75806F`. The live
  disabled mechanism is `DisabledText1` **over** `DisabledText2`, which is what
  `Button` and `TextEntry:disabled` (`:2430`) use, and what this doc's sunken
  treatment is built from. `LabelDisabled` is used in four layout-local styles
  and has no shadow partner, so it is the weaker of the two; treat it as
  superseded by `--vgui-text-disabled`.

**`FieldLabel` therefore uses two tokens — `--vgui-text` `#D8DED3` for the
default caption and `--vgui-text-muted` `#A0AA95` (`steam.styles:67`, the `Label`
token)** — and maps the remaining roles onto tokens the library already has,
rather than minting five more greys:

1. `Label` is the value the engine actually resolves for the `Label` control
   (`:1152`), so it is the faithful transcription. It ships as the `--muted`
   variant rather than the default, because 3.11:1 on a green panel fails
   WCAG 1.4.3 — see *Accessibility*.
2. `Label2` (secondary text in the downloads panel) and `NavLabel` (navigation)
   are *roles*, not colours; in this library they are the same caption token used
   at a smaller size, and the original values survive as `pixelPerfect` theme
   variants. Keeping them as tokens would put three tokens with the same job in
   the public API for no gain.
3. `LabelDisabled` is superseded by `DisabledText1`/`DisabledText2`
   (`steamscheme.res:50-51`), the only disabled treatment the corpus actually
   implements.
4. `LabelFocus` `#C7C4C2` is the one worth keeping available: it is the only
   focus-tinted label colour in the corpus, and it is the right value for a
   hovered inline link (`RichText.md` uses it as the quieter alternative to
   `--vgui-text-hover`). It is not a `FieldLabel` token, because a label is not
   focusable.

Dropping the four also costs nothing visually, and this is measurable: as caption
text on a `--vgui-surface` `#4C5844` panel, `Label2` `#736F6C` is **1.51:1**,
`LabelDisabled` `#8A8784` is **2.11:1** and `NavLabel` `#9E9995` is **2.67:1**
(computed; all three are well below the 4.5:1 that WCAG 1.4.3 asks for).
`LabelFocus` `#C7C4C2` is fine at **5.67:1** on `--vgui-surface-dark`. `Label`
`#A0AA95` at 3.11:1 is the *best* of the greys — which is why it is the one real
caption token, and also why the Accessibility section below sends `GreenBG`
captions to `--vgui-text` `#D8DED3` instead.

## CSS recipe

```css
.vgui-field-label {
  display: inline-block;
  font: inherit;
  font-size: var(--vgui-font-size, 14px);
  font-weight: inherit;
  line-height: 1.25;                    /* labels sit in tight form rows */
  color: var(--vgui-text);
  text-transform: none;                 /* NEVER uppercase — that is StatusLabel */
  letter-spacing: 0;
  max-inline-size: 100%;
  overflow-wrap: anywhere;              /* long translations must wrap, not clip */
}

/* The sunken disabled look, exactly as steamscheme.res:50-51 intends it. */
.vgui-field-label:disabled,
.vgui-field-label[data-disabled='true'] {
  color: var(--vgui-text-disabled);
  text-shadow: 1px 1px 0 var(--vgui-text-disabled-shadow);
}

.vgui-field-label--strong  { color: var(--vgui-text-strong); }
.vgui-field-label--muted   { color: var(--vgui-text-muted); }
.vgui-field-label--heading { color: var(--vgui-heading); }
.vgui-field-label--error   { color: var(--vgui-danger); }

.vgui-field-label--required::after {
  content: '*';
  margin-inline-start: 0.25em;
  color: var(--vgui-danger);
}

/* A 1px dotted ring, matching the house focus treatment (TextInput, Link, Tabs,
   Checkbox, Radio all use var(--vgui-focus-ring)), but only on the label variant
   that is genuinely focusable. */
label.vgui-field-label:focus-visible {
  outline: 1px dotted var(--vgui-focus-ring, #292d23);
  outline-offset: 2px;
}
```

**`overflow-wrap: anywhere` is not cosmetic.** Form labels are the most
translated strings in an application. German `Benutzername` is fine; a
`Serverbeschreibung` in a 120px column is not, and the default `nowrap`-ish
behaviour of a flex form row will clip it. The corpus never had to care because
it was English-only and bitmap-fonted.

**No `text-shadow` on `--error`.** The sunken shadow is reserved for the
disabled state; putting it under a red label makes the text look blurry rather
than inset.

**The focus ring is `dotted`, not `dashed`.** The CSS port's literal rule is
`outline: 1px dashed #292d23` (`greensteam.css`), which is where the value
`--vgui-focus-ring` (`#292D23`, `BorderDark`) comes from — but the five
components that already document a focus treatment in this library (`TextInput`,
`Link`, `Tabs`, `Checkbox`, `Radio`) all render it **dotted**, and a caption that
dashed while its field dotted would look like two different libraries. The
colour is identical either way; only the dash pattern is a house decision.

## React API

```tsx
export interface FieldLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Text or inline content of the label. */
  children?: React.ReactNode
  /** Render a <span> instead of a <label>, for standalone explanatory text. */
  asText?: boolean
  /** Emphasis: strong white text rather than the muted default. */
  strong?: boolean
  /** De-emphasis for empty states and secondary explanations. */
  muted?: boolean
  /** Use the maize heading colour, for a label acting as a section title. */
  heading?: boolean
  /** Actionable/validation failure state. Pair with a message; never colour alone. */
  error?: boolean
  /** Append a danger-coloured asterisk. Adds `aria-required` semantics. */
  required?: boolean
  /** Apply the sunken DisabledText1/DisabledText2 treatment. */
  disabled?: boolean
}
```

Notes:

- The sunken treatment is opt-in via `disabled`, **not** driven by the `:disabled`
  pseudo-class, because a `<label>` cannot be natively disabled. The `data-disabled`
  attribute is what the CSS keys on; `aria-disabled="true"` is set alongside it.
- `htmlFor` is passed through untouched. When the label is used to caption a
  control, always set it — clicking the caption must focus the control, and that
  is free with a real `<label for>`.
- `forwardRef<HTMLLabelElement>`; `className` merged **last**.
- `displayName` set explicitly.

## Accessibility

- **Always use a real `<label for>` when captioning a control.** Placeholder text
  is not a label — it disappears on input and is inconsistently exposed. This is
  the single most important rule in this doc.
- **Never signal required-ness with colour alone.** The `*` must be accompanied
  by `aria-required` on the control, or the asterisk is invisible to a screen
  reader. Better: `required` on the input *and* the asterisk, and put the legend
  ("* required") once per form.
- **Do not uppercase.** `text-transform: uppercase` on a caption is a straight
  readability loss with no compensating benefit here. `StatusLabel` earns its
  uppercase by being short machine text; a field label does not.
- **Disabled labels are the accessibility trap.** `--vgui-text-disabled`
  `#75806F` on `--vgui-surface` `#4C5844` is **1.82:1** (`foundations.md` §10)
  — it fails WCAG 1.4.3 badly, and it is *designed* to. The colour is a visual
  echo of a state that is already exposed programmatically (`disabled` on the
  associated control). Never use the disabled look to convey a *different*
  meaning, and never leave a disabled label as the only indication that
  something is unavailable — the control itself must carry `disabled` or
  `aria-disabled`.
- **The classic default caption fails AA on a `GreenBG` panel, so the default was
  changed.** `--vgui-text-muted` `#A0AA95` on `--vgui-surface` `#4C5844` is
  **3.11:1** — below the 4.5:1 that WCAG 1.4.3 asks for normal text, and only
  just over the 3:1 that applies to large text and UI boundaries.
  `foundations.md` §10 lists the same token on `--vgui-surface-dark` `#3E4637`
  (**4.06:1**, AA-large only) but does not list the `GreenBG` pairing at all, so
  it is measured here. **This section is normative: the default is `--vgui-text`
  `#D8DED3`** (**5.49:1**, AA), and the `Label` grey is reserved for the
  `--muted` variant on `DarkGreenBG` interiors, where it reaches 4.06:1. An
  earlier draft of this doc made `--vgui-text-muted` the default, which
  contradicted this section; the *Variants*, *States* and *Tokens* tables have
  been corrected to match.
- **`--vgui-text-dim` is not exposed.** `#758666` on `--vgui-surface` is
  **1.92:1** (`foundations.md` §10) — too low even for a de-emphasised caption,
  so `FieldLabel` has no variant for it. Use it only for genuinely decorative or
  redundant text elsewhere.
- **Error text needs the message, not just the colour.** `error` sets the colour;
  the actual explanation belongs in adjacent text associated via
  `aria-describedby`.

## Assets

None. `steam.styles:1147` declares no `image` and no `render_bg`. A label is one
text node — the entire visual identity is the colour and the size, plus the
two-colour shadow trick for the disabled state.

**Assets:** this repository ships **no image assets, by policy** — there is no
`public/` and no `src/assets/`, and none is planned: a glyph is drawn with CSS or
an inline `data:` URI instead (see `docs/assets.md`). `FieldLabel` is unaffected,
which is precisely why a label was a good first component to finish.

## Examples

```tsx
{/* The canonical pairing. Always set htmlFor. */}
<FieldLabel htmlFor="server-name">Server name</FieldLabel>
<TextInput id="server-name" />

{/* Standalone explanatory copy. */}
<FieldLabel asText muted>
  No servers matched your filters.
</FieldLabel>

{/* A required caption, with the legend supplied once by the form. */}
<FieldLabel htmlFor="rcon" required>RCON password</FieldLabel>

{/* Disabled: sunken text over the interactive-disabled control. */}
<FieldLabel disabled htmlFor="beta">Beta participation</FieldLabel>
<Select id="beta" disabled options={channels} />
```

## Open questions

- **The `Label` and `Text` colour tokens are not in `steamscheme.res`.** The
  palette at `:10-71` defines neither `Label` nor `Text`, yet `steam.styles:1152-1153`
  references both. They come from the parent Source scheme. `foundations.md:75`
  assumes `#A0AA95` for `Label`. Locating a base `SourceScheme.res` would close
  this for `FieldLabel`, `StatusLabel`, `Tooltip` and `List` at once — it is the
  single highest-value missing artefact in this corpus.
- **Is the sunken disabled treatment actually wired to `Label`?** The two colours
  and their explanatory comment exist (`steamscheme.res:50-51`), and `Button`
  demonstrably uses them, but no `Label` block declares a disabled state and no
  layout exercises a disabled `Label`. The treatment is documented here as
  theme-wide; it is possible Valve only ever applied it to buttons and
  `TextEntry`. If so, the `--disabled` variant is an invention rather than a
  transcription.
- **`selectedtextcolor = Text` is unused in practice.** No layout selects label
  text, and no `Label` is editable. It is worth deciding whether to expose a
  `--selected` variant at all, or to drop the declaration and note it as dead.
- **Error colour.** `--vgui-danger` `#E2251A` is a community value, not a corpus
  one (`foundations.md` §8 notes the scheme's own `Highlight3` is `#AD4547`). If
  inline validation ships, decide between the two deliberately.
