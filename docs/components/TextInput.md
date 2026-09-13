# TextInput

## Purpose

A single-line text field with an inset bevel, black interior and a 1px caret. In
the client it is everywhere: the server browser's filter box, the "Add server by
IP" field, the friends search, the login username, every property-sheet string
value.

## VGUI original

`TextEntry` in VGUI1 (`vgui_dll/include/VGUI_TextEntry.h`) and VGUI2
(`vgui_controls/TextEntry.cpp`). `steam.styles`:

```
TextEntry
{
    font            "Default"
    textcolor       "OffWhite"
    bgcolor         "TextEntryBG"
    border          "TextEntryBorder"
    inset           "4 0 4 0"
    disabledtextcolor  "DisabledText1"
    selectionbgcolor   "TextEntrySelectionBG"
    selectiontextcolor "TextEntrySelectionText"
}

TextEntry:Focus
{
    border          "TextEntryBorderFocused"
}
```

The `inset "4 0 4 0"` is **left 4px, right 4px** — the smallest inset in the
theme and the one that makes the field feel tight. A 15px-tall VGUI text entry
has only ~7px of usable text width per side, which is why Valve's fields look
cramped and why padding them out to 6px as a modern default changes the character
of the UI.

The port's geometry:

```css
input[type="text"] {
    -webkit-appearance: none;
    appearance: none;
    background-color: black;
    color: #d8ded3;
    border: 1px solid #000;
    border-top-color: #292d23;
    border-left-color: #292d23;
    padding: 0 4px;
    height: 19px;
}
```

Note: **`background-color: black`**. The field is not `--vgui-surface` with a
dark border — it is genuinely black inside (`TextEntryBG`). That single choice is
what makes the VGUI form feel like a terminal rather than a modern UI, and it must
not be softened to a dark green.

## Anatomy

```html
<span class="vgui-text-input">
  <input class="vgui-text-input__field" type="text" />
</span>
```

The wrapper exists so an adornment glyph (the search magnifier, a clear "×", a
units suffix) can be positioned without the input needing a background image.
When no adornment is present the wrapper collapses and the input is the only
visible element.

## Variants

| Variant | Class | Use |
| --- | --- | --- |
| Default | — | `19px` tall, `4px` inset |
| Large | `--large` | `25px` tall, matches `Button` height, used in login/dialog forms |
| Multiline | — | Not here; see [`Textarea`](./Textarea.md) |
| With icon | `--with-icon` | Search fields |
| With suffix | `--with-suffix` | Units — "ms", "px", "KB/s" |
| Clay | `--clay` | Property sheets (the field itself stays black; only the surrounding chrome changes) |

## States

| State | Border | Interior | Text |
| --- | --- | --- | --- |
| Normal | `--vgui-bevel-dark` top/left, `--vgui-bevel-light` bottom/right — inset | `#000` | `--vgui-text` `#D8DED3` |
| Hover | unchanged | unchanged | unchanged |
| Focus | `outline: 1px dotted #000; outline-offset: -3px` **plus** the border, per `TextEntryBorderFocused` | `#000` | `--vgui-text` |
| Placeholder | unchanged | unchanged | `--vgui-text-dim` `#758666` |
| Read-only | unchanged | `#000` | `--vgui-text-muted` `#A0AA95`; still selectable |
| Disabled | unchanged | `#000` | `--vgui-text-disabled` `#75806F` + shadow |
| Invalid | `--vgui-danger` top/left (replacing the bevel) | `#000` | unchanged |
| Selection | unchanged | `#96892D` | `#232421` (see below) |

**There is no hover state.** `steam.styles` defines no `TextEntry:MouseOver`.

**The selection colours matter.** `TextEntrySelectionBG` is the same
`#96892D` used for `::selection` globally, and the foreground must be dark.
Measured: `#FFFFFF` on `#96892D` is **3.55:1**, and the theme's own body colour
`#D8DED3` on `#96892D` — which is what actually happens today, because
`theme.css` sets `::selection { background-color: … }` with no `color` — is
**2.59:1**. Both fail. `#232421` on `#96892D` is **4.39:1** and is the pairing
`foundations.md` §10 specifies.

## Tokens

| Token | Where |
| --- | --- |
| `#000` | Interior. **Hardcoded** — there is no `--vgui-text-entry-bg` yet, and one should be added. |
| `--vgui-bevel-dark` `#292D23` | Inset top/left |
| `--vgui-bevel-light` `#899281` | Inset bottom/right |
| `--vgui-text` `#D8DED3` | Value text |
| `--vgui-text-dim` `#758666` | Placeholder |
| `--vgui-text-muted` `#A0AA95` | Read-only text |
| `--vgui-text-disabled` / `-shadow` | Disabled text |
| `--vgui-accent-darker` `#96892D` | Selection background |
| `--vgui-danger` `#E2251A` | Invalid border |

> **Missing token.** The black interior has no name in the current palette. Add
> `--vgui-field-bg: #000` to `theme.css` so the `clay`, `black` and `warm`
> variants can override it — the `black` theme in particular will need a
> non-black field background or the field will be invisible against it. This is
> the one place where the palette as transcribed from `greensteam.css` is
> incomplete.

## CSS recipe

```css
.vgui-text-input {
  display: inline-flex;
  align-items: center;
  position: relative;
}

.vgui-text-input__field {
  box-sizing: border-box;
  width: 100%;
  min-height: 19px;
  padding: 0 4px;                     /* the "4 0 4 0" inset */
  font: inherit;
  color: var(--vgui-text);
  background-color: var(--vgui-field-bg);
  border-top: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-light);
  border-right: 1px solid var(--vgui-bevel-light);
  border-radius: 0;                   /* must be explicit: UA styles vary */
}

.vgui-text-input__field::placeholder {
  color: var(--vgui-text-dim);
  opacity: 1;                         /* Firefox defaults to 0.54 */
}

.vgui-text-input__field:focus-visible {
  outline: 1px dotted var(--vgui-focus-ring);
  outline-offset: -3px;
}

.vgui-text-input__field::selection {
  background-color: var(--vgui-accent-darker);
  color: #232421;                     /* 4.39:1; white is only 3.55:1 */
}

.vgui-text-input__field:disabled {
  color: var(--vgui-text-disabled);
  text-shadow: 1px 1px 0 var(--vgui-text-disabled-shadow);
  cursor: not-allowed;
}

/* The caret is the one place a 1px animation is idiomatic. */
.vgui-text-input__field { caret-color: var(--vgui-text); }

.vgui-text-input--large .vgui-text-input__field { min-height: 25px; }

.vgui-text-input__adornment {
  position: absolute;
  display: flex;
  align-items: center;
  color: var(--vgui-text-dim);
  pointer-events: none;
}
.vgui-text-input__adornment--start { left: 4px; }
.vgui-text-input__adornment--end   { right: 4px; }
.vgui-text-input--with-icon .vgui-text-input__field  { padding-left: 20px; }
.vgui-text-input--with-suffix .vgui-text-input__field { padding-right: 28px; }
```

**Do not use `appearance: none` without a reason.** The port does, because it
needs to defeat the UA's rounded native field. Keep it — but the consequence is
that `border-radius: 0` must be set explicitly, or Safari will round the corners
of the bevel and the illusion breaks.

`caret-color` is not in the original and there is no VGUI precedent for it. The
default caret colour follows `color`, which is already `--vgui-text`, so
declaring it is belt-and-braces rather than a design decision.

## React API

```tsx
export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Field height variant. */
  size?: 'default' | 'large'
  /** Glyph shown inside the field's leading edge. */
  icon?: ReactNode | string
  /** Text shown inside the field's trailing edge, e.g. a unit. */
  suffix?: ReactNode
  /** Render the invalid border. Does not set aria-invalid. */
  invalid?: boolean
  /** Grey property-sheet chrome. */
  clay?: boolean
}
```

`invalid` deliberately does **not** set `aria-invalid`. Coupling them would make
it impossible to render a red-bordered field without also telling assistive tech
the value is wrong, and the two are genuinely different things (a required field
that is untouched is not invalid yet). Consumers set `aria-invalid` explicitly.

## Accessibility

- **Always pair with a label.** A placeholder is not a label — it disappears on
  input, it is announced inconsistently, and it fails WCAG 3.3.2. Use
  `FieldLabel` + `htmlFor`, or `aria-label` at minimum.
- **`--vgui-text` `#D8DED3` on `#000` is 15.31:1** — the best contrast ratio in
  the entire theme, and a direct benefit of the black interior. Do not "soften"
  the field to `--vgui-surface`: that drops the value text to **5.49:1** and,
  worse, drops the placeholder to **1.92:1**, which is the number that makes the
  dim token unusable off a black field.
- **The placeholder `#758666` on `#000` is 5.36:1** — fine. Note that against a
  green surface it would be 1.92:1, so the placeholder colour makes sense *only*
  because the field is black. This is why the placeholder token cannot be reused
  on a non-black field.
- **The dotted black focus ring fails at 1.15:1 against any green** — but inside
  the field the ring is drawn over `#000`, where `#000` on `#000` is
  *invisible*, not merely low-contrast. The port's `outline-offset: -3px` puts it
  just inside the border, over the black interior. Ship
  `outline: 2px solid var(--vgui-accent)` instead; `#C4B550` on `#000` is
  **10.07:1**.
- **`autocomplete` matters.** This theme is used for login and search forms;
  `autocomplete="username"` / `"current-password"` / `"off"` as appropriate, and
  never block paste on a password field (WCAG 1.3.5 / 3.3.8).
- **`type` must be right.** `type="email"`, `type="search"`, `type="tel"` give
  mobile keyboard layouts and, for `search`, a native clear button. Do not use
  `type="text"` with a pattern for everything.
- **Read-only vs disabled.** A disabled field is not submitted and is skipped by
  the keyboard; a read-only field is. `TextEntry` in VGUI had both. Most
  "look but don't edit" cases want `readOnly`.
- **Target height.** `19px` is under the 24×24 minimum. The `--large` variant
  clears it; the default does not. Realistically a text field's target is its
  width, and the 24px rule is aimed at targets with small width *and* height, but
  the default should still be at least 24px tall in any form where it is the
  primary control. Flagging it rather than silently violating it.
- **Never announce on every keystroke.** Live validation must debounce and use
  `aria-describedby` with a polite live region; a field that re-announces on each
  character is unusable with a screen reader.
- **Zoom.** `min-height` rather than `height`, so 200% text zoom grows the field
  instead of clipping the descenders of the value.

## Assets

None. The field is border + background. VGUI's `TextEntryBorder` is a `Border`
resource; the focused variant is a second `Border`, not a sprite.

The `sliderticks` / `icon_*` sprites do not apply here, but the search-magnifier
adornment would need a `mask-image` glyph from the `IconButton` asset set.

## Examples

```tsx
<FieldLabel htmlFor="server-ip">Server address</FieldLabel>
<TextInput id="server-ip" placeholder="203.0.113.4:27015" autoComplete="off" />

<TextInput icon="search" placeholder="Filter servers" type="search" />

<TextInput suffix="ms" defaultValue="60" inputMode="numeric" size="large" />

<TextInput invalid aria-invalid="true" aria-describedby="port-error" defaultValue="99999" />
<span id="port-error">Port must be between 1 and 65535.</span>

<TextInput readOnly value="F:\Steam\steamapps" />
```

## Open questions

- **The field background token does not exist.** `#000` is hardcoded in the port
  and there is no `--vgui-field-bg`. Under the `black` theme variant this is a
  real bug, not just an inconsistency. Adding the token is a prerequisite for
  shipping this component.
- `TextEntryBorderFocused` may be a *replacement* border (like
  `ButtonBorderFocused`) rather than an additional outline. If so, the focused
  field border should be `BorderBright`-coloured rather than dotted, and the
  dashed/dotted distinction in this doc set would need revisiting for all form
  controls at once.
- Whether VGUI's text entry supported a placeholder at all is unverified. Many
  retro recreations omit placeholders for fidelity, which then forces every field
  to have a visible label — arguably the better outcome.
- The `19px` default height is from the port. `steamscheme.res` was not checked
  for a `TextEntry` `LayoutTemplate`, and the two may disagree.
