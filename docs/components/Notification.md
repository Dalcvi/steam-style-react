# Notification

## Purpose

A dismissable message that appears in a corner of the viewport and reports
something that happened without blocking the user — a friend coming online, a
download finishing, the outcome of an async action. Steam's own use of this is
the "so-and-so has signed in" toast in the bottom-right corner of the friends
window, and it is the same visual language as every other green surface.

`Notification` is presentational. The queue, the timers and the stacking are the
consumer's responsibility (or a separate `NotificationCenter`), because those
are application policy, not theme.

## VGUI original

`Notification` in `steam.styles` — Valve's client used it for exactly the
sign-in and achievement toasts. There are also 23 separate `.res` files under
`OG-Steam/friends/` that lay out the individual notification variants, which is
useful evidence that Valve treated each notification type as its own layout
rather than one parametrised component.

The style is:

```
Notification
{
    bgcolor  "GreenBG"
    border   <raised bevel>
}
```

Structurally it is a `Frame`-less `EditablePanel`: no titlebar, no drag, no
frame buttons — just a beveled surface with a message and sometimes a dismiss
control.

## Anatomy

```
.vgui-notification                     ← raised beveled card
├── .vgui-notification__icon           ← optional 16px status glyph
├── .vgui-notification__content
│   ├── .vgui-notification__title      ← bold headline (OffWhite)
│   └── .vgui-notification__message    ← body text
└── .vgui-notification__dismiss        ← optional close IconButton
```

## Variants

| Variant | Class | Accent |
| --- | --- | --- |
| Default | — | `--vgui-text` body |
| Info | `--info` | `--vgui-text-muted` icon |
| Success | `--success` | `--vgui-steam-green` `#7EA64B` icon |
| Warning | `--warning` | `--vgui-heading` `#C4B550` icon |
| Error | `--error` | `--vgui-danger` icon **plus** a text prefix — see §Accessibility |
| Corner | `--corner-{bottom-right,…}` | Positioning helper; does not change appearance |

## States

| State | Treatment |
| --- | --- |
| Entering | Slides 8px from the anchored corner, 120ms, **only** under `prefers-reduced-motion: no-preference` |
| Visible | Raised bevel, `--vgui-surface` body |
| Hovering | No colour change. VGUI never highlighted a panel on hover. Timer should pause. |
| Auto-dismissing | No fade in VGUI — remove immediately, or fade under the reduced-motion guard |
| Dismissed | Removed from the DOM, focus moved to a sensible neighbour |

There is no disabled state.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-surface` `#4C5844` | Card background |
| `--vgui-bevel-light` `#899281` | Raised top/left |
| `--vgui-bevel-dark` `#292D23` | Raised bottom/right |
| `--vgui-text-strong` `#FFFFFF` | Title |
| `--vgui-text` `#D8DED3` | Message body |
| `--vgui-steam-green` `#7EA64B` | Success icon |
| `--vgui-heading` `#C4B550` | Warning icon |
| `--vgui-danger` `#E2251A` | Error icon |

## CSS recipe

```css
.vgui-notification {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  box-sizing: border-box;
  min-width: 260px;
  max-width: 380px;
  padding: 8px 10px;
  background-color: var(--vgui-surface);
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
  color: var(--vgui-text);
  box-shadow: none;          /* VGUI has no drop shadows — resist adding one */
}

.vgui-notification__title {
  display: block;
  color: var(--vgui-text-strong);
  font-weight: bold;
}

.vgui-notification__message { display: block; }

.vgui-notification__dismiss { flex: 0 0 auto; }

@media (prefers-reduced-motion: no-preference) {
  .vgui-notification--entering {
    animation: vgui-notification-in 120ms ease-out;
  }
  @keyframes vgui-notification-in {
    from { transform: translateY(8px); opacity: 0; }
    to   { transform: none; opacity: 1; }
  }
}
```

`box-shadow: none` is called out because the instinct is to add a drop shadow to
make a floating card read as floating. This theme does not have drop shadows; the
bevel plus placement is what makes a notification read as on top.

## React API

```tsx
export interface NotificationProps extends HTMLAttributes<HTMLDivElement> {
  /** Bold headline. Optional — a message alone is fine. */
  title?: ReactNode
  /** Body text. */
  children?: ReactNode
  /** Semantic variant; changes the icon colour and the live-region politeness. */
  variant?: 'info' | 'success' | 'warning' | 'error'
  /** Optional leading glyph; overrides the variant's default. */
  icon?: ReactNode
  /** Which corner of the viewport to anchor to. */
  corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Show a dismiss button. */
  dismissable?: boolean
  /** Called when the dismiss button is pressed. */
  onDismiss?: () => void
  /** Milliseconds before auto-dismissal; 0 or undefined disables it. */
  duration?: number
  /** Stacking order within the corner; larger is further from the edge. */
  index?: number
}
```

`variant` drives both the icon colour *and* the aria-live politeness, which is
why it is a required-ish prop rather than a class you pass. See §Accessibility.

## Accessibility

- **This is a live region, and the politeness is semantic.**
  `variant="error"` should render `role="alert"` (assertive — interrupts).
  Everything else should render `role="status"` (polite — waits its turn). Getting
  this wrong either floods a screen reader or, worse, hides an error.
- **Never auto-dismiss an error.** A toast that disappears after 5 seconds fails
  WCAG 2.2.1 (Timing Adjustable) for the messages that most need to be read.
  Force `duration = 0` for `error`.
- **Auto-dismissal must be pausable.** Pause on hover *and* on focus, and let
  keyboard users dismiss with `Escape`. A timed toast that steals the message
  away mid-sentence is a 2.2.1 failure.
- **The dismiss button needs a real name.** Render an `.vgui-visually-hidden`
  "Dismiss notification" span or set `aria-label` — an unlabelled `×` is
  announced as "times".
- **Focus management.** Auto-appearing toasts must *not* move focus. If the
  notification is interactive (contains a link), it must be reachable by
  tabbing, which means it must be in the DOM before the user is expected to act
  on it, and it must be inserted in a stable position, not prepended to a stack
  that reorders under the cursor.
- **`role="status"` containers must exist before the message is inserted.** If
  the live region element itself is added at the same time as its content, most
  screen readers announce nothing. The container must be in the DOM up front;
  only the text changes.
- **Colour is not the only indicator.** `--vgui-danger` on the notification body
  is 2.11:1 — invisible as an accent. Every variant must ship a distinct icon
  *and* the `--error` variant must lead with a text prefix such as "Error:".
- Stacking must cap at a few notifications and collapse the rest, or the corner
  becomes an unscrollable pile that covers page controls.

## Assets

None required. Optional variant glyphs (info `i`, success tick, warning
triangle, error cross) are inline SVGs; the tick and cross are simple enough to
draw as CSS borders or `clip-path` polygons.

## Examples

```tsx
// Steam's classic friend sign-in toast
<Notification
  variant="info"
  corner="bottom-right"
  title="Gordon Freeman is now online"
  duration={5000}
  dismissable
  onDismiss={() => setToasts((t) => t.filter((x) => x.id !== id))}
/>

// An error that must not disappear
<Notification variant="error" title="Error" duration={0} dismissable>
  Could not connect to the server.
</Notification>
```

## Open questions

- **Auto-dismiss duration.** Valve's client used roughly 4–6 seconds for friend
  toasts and the value is not recorded in the style files; `5000` here is a
  convention, not a transcription.
- Valve has **23 separate notification `.res` files** for different notification
  types (achievements, friend sign-ins, downloads, invites). Whether they differ
  visually beyond the icon is not established. This component assumes they are
  one component with variants.
- The VGUI `Notification` had no documented corner property — Steam's client
  anchored to the bottom-right by convention. `corner` is an invention for
  reuse outside a Steam-shaped shell.
