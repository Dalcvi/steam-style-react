# Textarea

## Purpose

A multi-line text field. It is a rarer control in the original client than you
would expect — Valve's UI is overwhelmingly set-and-forget dialogs, not document
editing — but it does appear: the "Add to Steam" profile description, the
custom-ban-reason field, and the console (which is its own component, see
[`Console`](./Console.md)).

## VGUI original

`TextEntry` with `SetMultiline(true)`. There is **no** separate `TextArea` class
in VGUI1 or VGUI2. `steam.styles` defines `TextEntry` once and the multiline flag
changes only how text wraps and how the scrollbar attaches:

```
TextEntry
{
    font              "Default"
    textcolor         "OffWhite"
    bgcolor           "TextEntryBG"
    border            "TextEntryBorder"
    inset             "4 0 4 0"
    selectionbgcolor  "TextEntrySelectionBG"
    selectiontextcolor "TextEntrySelectionText"
}
```

Everything about the chrome — the black interior, the **inset** bevel, the 1px
caret, the selected-text pairing — is identical to
[`TextInput`](./TextInput.md). The differences are all behavioural:

| | `TextInput` | `Textarea` |
| --- | --- | --- |
| Scrollbar | none | inherits `TextEntry`'s vertical scrollbar when it overflows |
| `Enter` | submits a form | inserts a newline |
| `Tab` | moves focus out | **VGUI's multiline entry did not accept Tab** either; see below |
| Height | fixed `19px` | author-controlled, `rows` |
| Resize | n/a | see below |

## Anatomy

```html
<span class="vgui-textarea">
  <textarea class="vgui-textarea__field" rows="4"></textarea>
</span>
```

The wrapper exists for the same reason as `TextInput`'s: so a character counter
or an adornment can be positioned without touching the textarea's own background.

## Variants

| Variant | Class | Use |
| --- | --- | --- |
| Default | — | `rows` controls height, `min-height` enforced |
| Fixed height | `--fixed` | `resize: none`, height set by `rows` only |
| Auto-grow | `--auto-grow` | Grows to fit content up to a `max-height` |
| Code / console | `--mono` | `--vgui-font-mono`, for console output and config snippets |
| Clay | `--clay` | Property-sheet chrome |

## States

Identical to `TextInput`, with one addition:

| State | Notes |
| --- | --- |
| Normal | Inset bevel, `#000` interior, `--vgui-text` text |
| Focus | see the a11y note — **do not** suppress the ring |
| Overflow | The VGUI vertical scrollbar appears (see [`Scrollbar`](./Scrollbar.md)) |
| `resize` handle | **New.** VGUI had no resize grip on text entries. |
| Invalid | `--vgui-danger` on the top/left borders |
| Disabled | `--vgui-text-disabled` + shadow; the whole element is inert |
| Read-only | `--vgui-text-muted`; still selectable and still focusable |

## Tokens

Same set as [`TextInput`](./TextInput.md), plus `--vgui-font-mono` for the
`--mono` variant. See that file's token table; do not duplicate the hex values
here.

## CSS recipe

```css
.vgui-textarea {
  display: block;
  position: relative;
}

.vgui-textarea__field {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-height: 60px;                   /* ~3 rows; never rely on rows alone */
  padding: 2px 4px;                   /* the "4 0 4 0" inset, +2px vertical */
  font: inherit;
  line-height: 1.25;
  color: var(--vgui-text);
  background-color: var(--vgui-field-bg);
  border-top: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-light);
  border-right: 1px solid var(--vgui-bevel-light);
  border-radius: 0;
  resize: vertical;                   /* VGUI had no handle; vertical only */
  overflow: auto;
}

.vgui-textarea__field::selection {
  background-color: var(--vgui-accent-darker);
  color: #232421;
}

.vgui-textarea__field:focus-visible {
  outline: 2px solid var(--vgui-accent);   /* NOT dotted black: see below */
  outline-offset: -3px;
}

.vgui-textarea--fixed .vgui-textarea__field { resize: none; }

.vgui-textarea--mono .vgui-textarea__field {
  font-family: var(--vgui-font-mono);
  font-size: 12px;
}

/* Auto-grow needs JS. This is the shape of it. */
.vgui-textarea--auto-grow .vgui-textarea__field {
  resize: none;
  overflow: hidden;
  height: auto;
  max-height: 240px;
  overflow-y: auto;
}
```

The `--auto-grow` variant needs the classic `scrollHeight` mirror: on every
`input`, set `height = 'auto'` then `height = scrollHeight + 'px'`, clamped to
`max-height`. Do it in a `useLayoutEffect` so no frame is rendered at the wrong
height. There is no CSS-only auto-growing textarea.

## React API

```tsx
export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> {
  /** Visible rows. Sets `rows`; `min-height` still applies. */
  rows?: number
  /** Grow to fit content instead of scrolling, up to `maxHeight`. */
  autoGrow?: boolean
  /** Cap for `autoGrow`, in pixels. Defaults to 240. */
  maxHeight?: number
  /** Prevent the user from resizing the field. */
  resize?: 'none' | 'vertical'
  /** Monospaced text, for console and config content. */
  mono?: boolean
  /** Show a live character count using `maxLength`. */
  showCount?: boolean
  /** Render the invalid border. Does not set aria-invalid. */
  invalid?: boolean
}
```

`showCount` renders `<span class="vgui-textarea__count" aria-hidden="true">` and
relies on the input's own `maxLength` + `aria-describedby` for the announcement —
a count that updates on every keystroke as a live region is hostile to screen
readers. Announce at thresholds, not continuously.

## Accessibility

- **Never suppress the focus ring on a textarea.** A textarea can be taller than
  the viewport; a user who tabs into an off-screen one needs the browser's
  scroll-into-view, and a suppressed ring makes the landing point invisible. Also
  the dotted-black ring would be drawn over `#000` interior where it is literally
  invisible — this is the component where the focus-ring problem is worst.
- **Label it.** A textarea has no placeholder-as-label excuse at all: it is
  always multi-line and always has content worth describing. `FieldLabel` +
  `htmlFor`.
- **`Tab` behaviour.** VGUI's multiline entry did not capture Tab, so `Tab` moved
  focus out. Modern editors sometimes want Tab to insert `\t` (a code editor) —
  that is a serious keyboard trap and must be escapable (`Escape` then `Tab`,
  per WCAG 2.1.2). The default here is **Tab moves focus out**, matching both
  VGUI and WCAG.
- **Do not hijack `Enter`.** In a chat-style textarea, `Enter` sends and
  `Shift+Enter` newlines. That convention is fine *for chat* but it must never be
  the default of a generic `Textarea`, because it breaks the ability to type a
  multi-paragraph value. Expose it only via an explicit prop or a separate
  chat-input component.
- **`resize: vertical` rather than `both`.** A horizontally resizable textarea
  inside a fixed-width panel causes horizontal scrolling of the whole page, which
  is a WCAG 1.4.10 (reflow) violation. Vertical-only is the safe default;
  `resize: none` should be opt-in, not the default, because resizing is a genuine
  accessibility aid.
- **Minimum height, not `rows` alone.** `rows="1"` on a 200%-zoom browser gives a
  sliver. `min-height: 60px` keeps at least three lines of the smallest usable
  text.
- **`spellcheck` and `autocapitalize`** should be settable and should default to
  the browser's behaviour. Do not force `spellcheck="false"` globally — this is
  exactly the kind of thing that makes a UI feel hostile.
- **Scrollbar fidelity.** When the textarea overflows, the VGUI scrollbar styling
  does not apply in Firefox (see [`Scrollbar`](./Scrollbar.md)). A textarea is the
  most common place a user meets the scrollbar, so this is where the limitation
  is most visible. It is a cosmetic difference only; the native scrollbar is
  functional.
- Contrast is inherited and good: `#D8DED3` on `#000` = **15.31:1**.

## Assets

None. No sprite was involved in VGUI's text entry, multiline or not.

## Examples

```tsx
<FieldLabel htmlFor="reason">Ban reason</FieldLabel>
<Textarea id="reason" rows={3} maxLength={256} showCount placeholder="Optional" />

<Textarea autoGrow defaultValue="Line one&#10;Line two" />

<Textarea mono readOnly value={configText} />

<Textarea resize="none" invalid aria-invalid="true" aria-describedby="err" />
<span id="err">Description is too long.</span>
```

## Open questions

- **`resize: vertical` is an invention.** VGUI text entries were not resizable at
  all; there is no handle sprite in `OG-Steam/graphics/`. Keeping the browser
  default is a usability win but it is a visible deviation — a real resize grip
  in the VGUI bevel style does not exist and would have to be designed.
- Whether Valve's multiline `TextEntry` ever actually showed a scrollbar, or
  whether it just clipped, is unverified from the sources read. The CSS port
  styles `textarea` as a plain element with no scrollbar treatment.
- `--auto-grow`'s `max-height: 240px` is arbitrary. A more VGUI-consistent rule
  would be "grow to the panel edge", which requires measurement of the container
  and is worth deferring.
- Whether `showCount` should live on `Textarea` at all, or on `FieldLabel`,
  is unresolved. Putting it on the field keeps the `maxLength` in one place.
