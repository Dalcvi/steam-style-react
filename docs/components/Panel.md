# Panel

## Purpose

The beveled surface everything else sits on. A `Panel` is a raised, titled box:
a lit top-left edge, a shadowed bottom-right edge, a green body, and an optional
uppercase caption strip. It is the visual equivalent of an HTML `<fieldset>` with
the VGUI border attached, and it is the correct container for any grouping of
related controls.

## VGUI original

`Panel` is the base class of every VGUI control, with `EditablePanel` adding
child-management and `Frame` adding a titlebar and drag behaviour
(`nagist/vgui_dll/include/VGUI_Panel.h`). The visual treatment comes from the
`Panel` section of `steam.styles`:

```
Panel
{
    bgcolor            "GreenBG"
    border             "ButtonBorder"
    ...
}
```

`ButtonBorder` is the shared raised bevel — `BorderBright` on the top and left
rows, `BorderDark` on the bottom and right. The dark *inset* variant
(`Panel.Inset`) swaps the two.

## Anatomy

```
.vgui-panel                     ← the beveled surface; owns background + border
├── .vgui-panel__titlebar       ← optional; 18px uppercase caption
└── children                    ← arbitrary content
```

There is no `__body` element. Padding lives on `.vgui-panel` itself, so children
lay out against the bevel without an extra wrapper.

## Variants

| Variant | Class | What changes |
| --- | --- | --- |
| Default | — | `--vgui-surface` background, raised bevel, `10px` padding |
| Inset | `--inset` | `--vgui-surface-dark` background, **inverted** bevel |
| Rounded | `--rounded` | `border-radius: 10px`, border removed entirely |
| Heading | *(presence of `heading`)* | Renders `.vgui-panel__titlebar` |
| Headless | — | No `heading` → no titlebar element at all |

`inset` + `rounded` together is invalid and should warn in development. Valve
has no rounded-inset panel; the combination has no defined look.

## States

A `Panel` has almost no interaction states — it is a surface, not a control.
The only ones that matter are:

| State | Treatment |
| --- | --- |
| Default | Raised bevel |
| `--inset` | Inverted bevel, darker body |
| `--rounded` | No border, `10px` radius |
| Focus-within | **No** ring on the panel itself. Focus rings belong on the control inside it. |
| Disabled | No such state. Disable the contents, not the surface. |

Applying `:hover` to a container is a VGUI anti-pattern — Valve never highlighted
a panel on hover. Do not add one.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-surface` `#4C5844` | Body background |
| `--vgui-surface-dark` `#3E4637` | `--inset` body background |
| `--vgui-bevel-light` `#899281` | Raised `border-top` + `border-left` |
| `--vgui-bevel-dark` `#292D23` | Raised `border-bottom` + `border-right` |
| `--vgui-text-strong` `#FFFFFF` | Titlebar text |
| `--vgui-font` | Titlebar font stack |
| `--vgui-titlebar-height` `18px` | Titlebar height; see the note below |
| `--vgui-line-height` `1.25` | — |

> **Titlebar height is `18px`, everywhere.** Valve's `LayoutTemplates` give a
> `Frame` a `28px` titlebar, but the CSS port — this library's direct upstream —
> uses `18px`, and `Panel`, `Window` and `TitleBar` all share the single
> `--vgui-titlebar-height` token. The `28px` figure is recorded in
> `foundations.md` §6 and deliberately not used.

## CSS recipe

```css
.vgui-panel {
  box-sizing: border-box;
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
  padding: 10px;
  max-width: 780px;
  margin: 0 0 20px;
}

.vgui-panel--inset {
  background-color: var(--vgui-surface-dark);
  border-top-color: var(--vgui-bevel-dark);
  border-left-color: var(--vgui-bevel-dark);
  border-bottom-color: var(--vgui-bevel-light);
  border-right-color: var(--vgui-bevel-light);
}

.vgui-panel--rounded {
  border: none;
  border-radius: 10px;
}

/* The caption strip. Uppercase + 2px tracking is the theme's signature. */
.vgui-panel__titlebar {
  display: block;
  width: 100%;
  height: 18px;
  line-height: 18px;
  margin-bottom: 1em;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 12px;
  font-weight: bold;
  color: var(--vgui-text-strong);
}
```

Note that `--inset` overrides only the four `border-*-color` longhands rather
than redeclaring the whole shorthand. This keeps the border widths and style in
one place and makes the inversion auditable.

## React API

```tsx
export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Uppercase VGUI title bar text. Omit it to render a panel without one. */
  heading?: ReactNode
  /** Darken the body to the VGUI "inset" look, e.g. for read-only content. */
  inset?: boolean
  /** Round the corners and drop the beveled border. */
  rounded?: boolean
}
```

`forwardRef` to a `HTMLDivElement`, `className` merged **last** so callers can
override any variant class. `displayName` set explicitly.

## Accessibility

- **Pick the right element.** When `heading` is present the panel is a named
  region: render `<section>` with `aria-labelledby` pointing at the titlebar's
  `id`, not a bare `<div>`. When it is absent it is a generic `<div>`.
- Generate the titlebar `id` with React's `useId()` so multiple panels on one
  page never collide.
- The titlebar is **not** a heading level by default. Expose an optional
  `headingLevel?: 1 | 2 | 3 | 4 | 5 | 6` that renders the caption inside an
  `<h{level}>`; without it, screen-reader users cannot navigate between panels.
- `max-width: 780px` is a layout constraint from the CSS port, not a
  requirement. It must be overridable, otherwise a panel cannot fill a wide
  application shell.
- The bevel fails WCAG 1.4.11 (2.33:1 / 1.87:1 against the body). A panel that
  is the *only* grouping cue for its contents therefore needs a visible caption —
  never rely on the border alone to convey grouping.

## Assets

None. The panel is pure CSS — this is the one component where Valve used a
`render_bg` program rather than a sprite, so the port is exact.

## Examples

```tsx
// Simple titled surface
<Panel heading="Server Settings">
  <FieldLabel htmlFor="hostname">Hostname</FieldLabel>
  <TextInput id="hostname" defaultValue="My Server" />
</Panel>

// Read-only / recessed content
<Panel inset>
  <Console lines={logLines} />
</Panel>

// Rounded variant, used by the CSS port for callouts
<Panel rounded>Tip: press <kbd>~</kbd> to open the console.</Panel>
```

## Open questions

- `panel--rounded` removes the border entirely, so it has **no** non-text
  boundary cue at all. If it ships, it needs `outline: 1px solid
  var(--vgui-bevel-dark)` or a background shift to satisfy 1.4.11.
