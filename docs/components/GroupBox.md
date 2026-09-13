# GroupBox

## Purpose

A labelled border drawn around a set of related form controls — the VGUI
equivalent of a `<fieldset>` + `<legend>`. Used throughout the settings dialogs
and the CS 1.6 options screens to separate "Audio" from "Video" from
"Multiplayer" without nesting full panels.

Use it *inside* a `Panel` or `Window`, never as a replacement for one. A
`GroupBox` has no background of its own, so the parent's surface shows through.

## VGUI original

> **There is no `GroupBox` control in the public VGUI SDK.** This is stated
> explicitly because it is a common assumption. Searching
> `source-sdk-2013:src/public/vgui_controls/` returns no `GroupBox` header, and
> VGUI1's `vgui_dll/include/` has no equivalent.

The look is *composed* in Valve's own layouts: a `Frame`-styled `EditablePanel`
with an empty titlebar sits behind a set of sibling controls, or a `Panel` with
a `SectionedListPanel`-style section header is used. The engraved rule that
precedes a section comes from the `Divider` control (two fills —
`BorderDark` on the top row, `BorderBright` on the bottom), which is the same
two-tone trick used for the border here.

The HTML `<fieldset>`/`<legend>` element already behaves exactly like the
composed VGUI construct, which is why this component is specified as a styled
`<fieldset>` rather than a `div` with ARIA.

## Anatomy

```
.vgui-groupbox                 ← <fieldset> with the bevel
├── .vgui-groupbox__legend     ← <legend>; uppercase, sits on the border
└── children                   ← controls
```

A single primitive, no sub-elements required.

## Variants

| Variant | Class | Use |
| --- | --- | --- |
| Default | — | Raised bevel around the contents |
| Inset | `--inset` | Inverted bevel — used when the group sits on a lighter surface |
| Legend on top | `--legend-top` | Legend on the top border rather than the top-left corner |
| Plain rule | `--ruled` | No border at all; just the two-tone `Divider` under the legend |

## States

| State | Treatment |
| --- | --- |
| Default | Raised bevel, `--vgui-text-strong` legend |
| Disabled | `disabled` on the `<fieldset>` → all descendants disabled by the browser. The legend drops to `--vgui-text-disabled` with `--vgui-text-disabled-shadow` at `1px 1px`. |
| Focus-within | No ring on the group itself |
| Invalid | Optional `--invalid` → border becomes `--vgui-danger` (see the contrast caveat) |

`<fieldset disabled>` disabling its entire subtree is a real browser behaviour
and is the correct way to disable a group. Do not reimplement it with
`pointer-events: none`, which leaves the controls keyboard-reachable.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-bevel-light` `#899281` | Raised top/left |
| `--vgui-bevel-dark` `#292D23` | Raised bottom/right |
| `--vgui-text-strong` `#FFFFFF` | Legend text |
| `--vgui-text-disabled` `#75806F` | Disabled legend |
| `--vgui-text-disabled-shadow` `#282E22` | Disabled legend offset shadow |
| `--vgui-danger` `#E2251A` | Invalid border (only used alongside an icon or message) |

## CSS recipe

```css
.vgui-groupbox {
  box-sizing: border-box;
  margin: 0 0 16px;
  padding: 12px;
  min-inline-size: 0;         /* fieldsets default to min-content; this kills it */
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
}

.vgui-groupbox--inset {
  border-top-color: var(--vgui-bevel-dark);
  border-left-color: var(--vgui-bevel-dark);
  border-bottom-color: var(--vgui-bevel-light);
  border-right-color: var(--vgui-bevel-light);
}

/* Legend: the theme's uppercase chrome treatment. */
.vgui-groupbox__legend {
  padding: 0 6px;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 12px;
  font-weight: bold;
  color: var(--vgui-text-strong);
}

.vgui-groupbox:disabled .vgui-groupbox__legend {
  color: var(--vgui-text-disabled);
  text-shadow: 1px 1px 0 var(--vgui-text-disabled-shadow);
}

/* Ruled variant: no box, just the engraved divider under the caption. */
.vgui-groupbox--ruled {
  border: none;
  padding: 0;
}
.vgui-groupbox--ruled .vgui-groupbox__legend {
  display: block;
  width: 100%;
  padding: 0 0 6px;
  border-bottom: 1px solid var(--vgui-bevel-dark);
  box-shadow: 0 1px 0 var(--vgui-bevel-light);
}
```

`min-inline-size: 0` is essential and non-obvious: a `<fieldset>`'s default
`min-inline-size: min-content` makes it refuse to shrink inside a flex or grid
parent, which silently breaks every responsive layout it is dropped into.

The `--ruled` variant's `border-bottom` + `box-shadow` pair is the `Divider`
recipe — dark row on top, light row beneath — reproduced locally so the legend
can share it.

## React API

```tsx
export interface GroupBoxProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  /** Uppercase caption drawn on the border. */
  legend: ReactNode
  /** Invert the bevel, for a group sitting on a lighter surface. */
  inset?: boolean
  /** Drop the box; render only the engraved rule under the caption. */
  ruled?: boolean
  /** Hide the legend visually while keeping it for assistive technology. */
  hideLegend?: boolean
}
```

`legend` is required. A `GroupBox` with no caption is just a `Panel` with
different padding — reject it at the type level rather than rendering an
unnamed group, which would leave a `<fieldset>` with no accessible name.

## Accessibility

- Use a real `<fieldset>` + `<legend>`. The browser binds them: the legend
  becomes the group's accessible name and is announced when entering the group.
  A `div` + `role="group"` + `aria-labelledby` is the fallback, not the default.
- **Never render a `<fieldset>` without a `<legend>`.** An unnamed group is
  announced as "group" with no context, which is worse than no grouping at all.
- `hideLegend` must hide *visually only* — clip-path or the standard
  visually-hidden technique. `display: none` on a legend removes the accessible
  name entirely.
- The `<fieldset disabled>` behaviour is the whole point of using the element.
  It disables descendants, which is exactly what the VGUI "greyed out section"
  means.
- **Invalid border contrast:** `--vgui-danger` `#E2251A` on `--vgui-surface`
  `#4C5844` is **2.11:1** and on `--vgui-surface-dark` it is **2.11:1** — both
  fail 3:1 for a UI boundary and 4.5:1 for text. An invalid group must also show
  a text message or an icon; colour alone may never be the only indicator
  (WCAG 1.4.1).
- Do not put `role="group"` on the `fieldset` — the element already maps to the
  `group` role and the explicit role interferes with the legend name computation
  in some screen readers.

## Assets

None. The border is a plain 1px bevel; the ruled variant is two 1px lines. Both
are exact CSS equivalents of Valve's `render_bg` fills.

## Examples

```tsx
<Panel heading="Options">
  <GroupBox legend="Audio">
    <FieldLabel htmlFor="volume">Volume</FieldLabel>
    <Slider id="volume" min={0} max={100} />
  </GroupBox>

  <GroupBox legend="Video" inset>
    <Checkbox label="Enable HDR" />
  </GroupBox>

  <GroupBox legend="Advanced" ruled>
    <Checkbox label="Show developer console" />
  </GroupBox>
</Panel>
```

## Open questions

- Valve never shipped a named `GroupBox`, so there is no authoritative metric for
  the padding. `12px` is chosen to match the `Panel`'s `10px` plus the border,
  and is a design decision, not a transcription.
- The legend's position — straddling the top border versus sitting inside the
  corner — varies between the settings dialog and the options screens in Valve's
  own layouts. `--legend-top` covers both; which one is "canonical" is not
  established.
