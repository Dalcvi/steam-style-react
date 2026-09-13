# Select

## Purpose

A collapsed list that opens into an overlay list of options, with a caret on the
right. In the client it is the resolution dropdown in video settings, the
microphone device picker, the "Server type" filter, and every "choose one of
seven" property in a property sheet.

## VGUI original

`ComboBox` in VGUI1 (`vgui_dll/include/VGUI_ComboBox.h`) and VGUI2
(`vgui_controls/ComboBox.cpp`). `steam.styles`:

```
ComboBox
{
    font          "Default"
    textcolor     "OffWhite"
    bgcolor       "TextEntryBG"
    border        "ComboBoxBorder"
    inset         "4 0 4 0"
    button        "ComboBoxButton"
    buttonbgcolor "ComboBoxButtonBG"
    disabledtextcolor "DisabledText1"
}
```

Three details that separate a real VGUI combobox from a styled `<select>`:

1. **The field half is a `TextEntry`.** `ComboBox` in VGUI is literally a text
   entry plus a button, not a readonly label. It is editable (`SetEditable`) and
   you can type into it. That is why the field interior is `TextEntryBG` — the
   same black — and why the frame is `TextEntry`-shaped.
2. **The button half is a real button**, with its own `ComboBoxButton` border and
   `ComboBoxButtonBG` face, separated from the field by a bevel. It is not a
   background-image caret; it is `18px` of its own control.
3. **The dropdown list is a `Menu`**, not a `<ul>`. `ComboBox` opens a `Menu`
   panel positioned under the button, which is why the arrow-key behaviour,
   the `--vgui-accent-dark` selection bar and the scrollbar all match
   [`Menu`](./Menu.md) exactly. In this library, `Select` should be built on
   `Menu` for exactly that reason.

The list geometry from the port: the option rows are `18px` tall, the selected
row is `--vgui-accent-dark` `#91863C` with white text, and the popup is exactly
the width of the field.

## Anatomy

```html
<button class="vgui-select__trigger" role="combobox"
        aria-expanded="false" aria-haspopup="listbox" aria-controls="…">
  <span class="vgui-select__value">1024 × 768</span>
  <span class="vgui-select__button" aria-hidden="true"></span>
</button>

<ul class="vgui-select__list" role="listbox" id="…">
  <li class="vgui-select__option" role="option" aria-selected="true">1024 × 768</li>
  …
</ul>
```

`role="combobox"` on the trigger with `aria-expanded` is the ARIA 1.2
"select-only combobox" pattern. It is fiddly and it is the correct pattern; the
alternative (`<select>`) is covered under *Open questions*.

## Variants

| Variant | Class | Use |
| --- | --- | --- |
| Default | — | Read-only, choose one |
| Editable | `--editable` | Type-ahead / arbitrary value; the field half becomes a real `TextInput` |
| Small | `--small` | `18px`, for dense property rows |
| Large | `--large` | `25px`, matches `Button` |
| Invalid | `--invalid` | Danger border on the field half |
| Clay | `--clay` | Property sheets |
| Multi | `--multiple` | See *Open questions* — this is a genuine design problem |

## States

| State | Field half | Button half | Popup |
| --- | --- | --- | --- |
| Closed | Inset bevel, `#000` interior, inset bevel on the button, caret `--vgui-text` | raised | hidden |
| Hover | unchanged | face → `--vgui-surface-light`? **unverified** — see *Open questions* |  |
| Open | `TextEntryBorderFocused` on the field | raised, unchanged | visible, `--vgui-surface-dark` `#3E4637`, 1px `--vgui-bevel-dark` border |
| Focus-visible (closed) | `outline: 2px solid var(--vgui-accent); outline-offset: -3px` on the trigger |  |  |
| Option hovered | — | — | row face → `--vgui-surface-light`? see [`Menu`](./Menu.md) |
| Option selected | — | — | `--vgui-accent-dark` `#91863C` fill with `#232421` text + a checkmark glyph |
| Option disabled | — | — | `--vgui-text-disabled` + shadow, `aria-disabled="true"` |
| Disabled | whole control inert | caret `--vgui-text-disabled` | cannot open |
| Empty | `--vgui-text-dim` placeholder |  |  |

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-field-bg` (`#000`) | Field and popup interiors |
| `--vgui-surface-dark` `#3E4637` | Popup background |
| `--vgui-surface` `#4C5844` | Button-half face |
| `--vgui-bevel-light` / `--vgui-bevel-dark` | Both bevels and the popup border |
| `--vgui-accent-dark` `#91863C` | Selected option |
| `#232421` | Selected option text — **not** `--vgui-text-strong`; see the a11y section |
| `--vgui-text` `#D8DED3` | Field value, option text |
| `--vgui-text-dim` `#758666` | Placeholder, caret when idle |
| `--vgui-text-disabled` / `-shadow` | Disabled |

## CSS recipe

```css
.vgui-select { position: relative; display: inline-block; }

.vgui-select__trigger {
  box-sizing: border-box;
  display: flex;
  align-items: stretch;
  width: 100%;
  min-height: 19px;
  padding: 0;
  font: inherit;
  color: var(--vgui-text);
  background-color: var(--vgui-field-bg);
  border-top: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-light);
  border-right: 1px solid var(--vgui-bevel-light);
  cursor: pointer;
}

.vgui-select__value {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0 4px;                     /* the "4 0 4 0" inset */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

/* The button half is 18px of its own raised control, not a background caret. */
.vgui-select__button {
  flex: 0 0 18px;
  align-self: stretch;
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
}

/* The caret is a MASK so it recolours with the theme. */
.vgui-select__button::before {
  content: "";
  display: block;
  width: 100%;
  height: 100%;
  background-color: var(--vgui-text);
  mask-image: var(--vgui-glyph-caret-down);  /* 7×4 triangle */
  mask-repeat: no-repeat;
  mask-position: center;
}

.vgui-select__list {
  position: absolute;
  z-index: 100;
  left: 0;
  right: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
  background-color: var(--vgui-surface-dark);
  border: 1px solid var(--vgui-bevel-dark);
  /* A drop-shadow is the only way to lift the popup off the page — VGUI
     relied on the popup simply painting over its siblings. */
  box-shadow: 2px 2px 0 rgb(0 0 0 / 0.35);
}

.vgui-select__option {
  min-height: 18px;
  display: flex;
  align-items: center;
  padding: 0 4px;
  color: var(--vgui-text);
  cursor: default;
}

.vgui-select__option[aria-selected="true"] {
  background-color: var(--vgui-accent-dark);
  /* Dark, not white: #FFFFFF on #91863C is 3.70:1, #232421 is 4.22:1. */
  color: #232421;
}
```

**The `18px` button half is the detail that makes this read as VGUI.** Replacing
it with a `background-image: url(caret.svg) 4px center no-repeat` on the trigger
produces something that looks approximately right at a glance and unmistakably
wrong next to the real thing, because the bevel that separates the field from
the button disappears.

## React API

```tsx
export interface SelectOption {
  value: string
  label: ReactNode
  disabled?: boolean
}

export interface SelectProps {
  /** Options, or `SelectOption` children. */
  options: SelectOption[]
  /** Controlled value. */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Called with the chosen value. */
  onValueChange?: (value: string) => void
  /** Shown when nothing is selected. */
  placeholder?: string
  /** Allow typing an arbitrary value instead of choosing one. */
  editable?: boolean
  /** Called as the user types in `editable` mode. */
  onInputChange?: (value: string) => void
  /** Height variant. */
  size?: 'small' | 'default' | 'large'
  /** Render the invalid border. Does not set aria-invalid. */
  invalid?: boolean
  /** Disable the whole control. */
  disabled?: boolean
  /** Accessible name when there is no visible `FieldLabel`. */
  'aria-label'?: string
  /** Id of the visible label. */
  'aria-labelledby'?: string
  /** Id of the control, for `FieldLabel htmlFor`. */
  id?: string
  /** Optional name for form submission via a hidden input. */
  name?: string
}
```

Because `Select` is not a native control, form submission needs a hidden
`<input type="hidden" name value>`. That is a real cost of the custom
implementation and should be stated in the component's own docs rather than
discovered by a user.

## Accessibility

This is the highest-risk component in the library. A custom listbox is the
classic place accessibility goes wrong.

**Required behaviours:**

- `role="combobox"` on the trigger, `aria-expanded`, `aria-haspopup="listbox"`,
  `aria-controls` pointing at the list, and `role="listbox"` on the list.
- **`Enter`, `Space` and `Alt+Down` open the list.** `Escape` closes it and
  returns focus to the trigger. `ArrowDown`/`ArrowUp` move the *active* option;
  `Enter` commits it.
- **Type-ahead must work.** Typing letters jumps to the first option starting
  with them. Every native `<select>` does this and users rely on it.
- `aria-activedescendant` on the trigger pointing at the active option, **or**
  roving `tabIndex` on the options. Pick one; `aria-activedescendant` keeps focus
  on the trigger and is easier to get right here.
- **The selected option needs a non-colour cue, and its text colour is wrong as
  transcribed.** `--vgui-accent-dark` `#91863C` with the white text the port
  uses is **3.70:1** — a fail for normal-size text. `--vgui-text` `#D8DED3` on it
  is worse at **2.70:1**. The row *shape* is also only **2.66:1** against the
  popup. The fix is the same one the theme already needs for `::selection`: use
  `color: #232421` on `#91863C`, which is **4.22:1**, and add a leading checkmark
  glyph in the selected row — which is also what later Steam builds did.
- **`--vgui-field-bg` is `#000` and the popup is `#3E4637`.** Those are different
  surfaces with different contrast results. `#D8DED3` on `#000` is **15.31:1**;
  on `#3E4637` it is **7.17:1**. Both pass, but do not assume one token's ratio
  transfers to the other.
- **Do not use a `div` as the trigger.** It must be a `<button type="button">`,
  so `Space`/`Enter` and the accessible role come for free.
- **`inert` / hiding.** When closed, the list should be unmounted or `hidden`,
  never merely `opacity: 0` — a visually hidden listbox is still tabbable and
  still announced.
- **Focus must not be lost on close.** Return focus to the trigger.
- **Portal or not.** The popup must escape ancestor `overflow: hidden`. Either
  render it in a portal positioned against the trigger's bounding rect, or accept
  that any ancestor with `overflow: hidden` will clip it. Portals break
  `aria-controls`-by-id only if the id is duplicated; keep the id on the element
  wherever it renders.

**The honest alternative.** A styled native `<select>` gets every behaviour above
for free, works on mobile (where it opens the OS picker, which is often better),
and cannot be broken by a library upgrade. It costs the `18px` button half and
the precise popup styling — you can style the closed field and `::picker(select)`
in current Safari/Chrome, but not consistently across browsers. **Recommendation:
ship the native `<select>` styled as close as the platform allows as the default,
and offer the custom listbox as an opt-in `Select` for cases where the exact
chrome matters.** This is the one component where "looks exactly like VGUI" and
"works for everyone" genuinely pull apart, and the default should favour working.

## Assets

| Valve sprite | Replacement |
| --- | --- |
| `icon_down_default` / `_hover` / `_focus` | `mask-image` caret triangle, recoloured via `currentColor`. The `_hover`/`_focus` variants collapse into hover/focus selectors. |

The caret path is the same triangle used by `IconButton`, so the glyph should
come from one shared module rather than being duplicated here.

## Examples

```tsx
<FieldLabel htmlFor="res">Resolution</FieldLabel>
<Select
  id="res"
  value={res}
  onValueChange={setRes}
  options={[
    { value: '800x600', label: '800 × 600' },
    { value: '1024x768', label: '1024 × 768' },
    { value: '1280x960', label: '1280 × 960' },
    { value: 'widescreen', label: 'Widescreen', disabled: true },
  ]}
/>

<Select placeholder="Choose a server" options={servers} />

<Select editable value={ping} onInputChange={setPing} options={[]} size="small" suffix="ms" />
```

## Open questions

- **Editable combobox is a much harder pattern** than select-only, and VGUI's
  `ComboBox` was editable by default. Whether to ship `--editable` at all in the
  first version is a real decision; the `role="combobox"` ARIA pattern for an
  editable combobox is meaningfully different (the trigger becomes an `<input>`,
  `aria-autocomplete` comes into play). Recommend deferring `--editable`.
- **`--multiple` has no VGUI precedent.** Valve's UI has no multi-select
  combobox; multi-select happens in `List`/`CheckedListBox` instead. Recommend
  **not** adding it and pointing users at [`List`](./List.md).
- Whether `ComboBoxButtonBG` is `--vgui-surface` or its own slightly different
  green is unverified; this doc assumes the standard surface.
- The `18px` button width comes from the CSS port along with the `18px`
  scrollbar; whether VGUI's `ComboBoxButton` used the same `18px` is plausible
  but not confirmed.
- `aria-activedescendant` requires every option to have an id. That is fine, but
  it means the list must be rendered (not virtualised away) while open — worth
  noting if a future version virtualises long lists.
