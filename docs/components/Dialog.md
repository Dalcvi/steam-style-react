# Dialog

## Purpose

A modal window that interrupts to ask a question or report an outcome. It is a
`Window` plus three things: a dimming overlay, a fixed button row pinned to the
bottom, and focus containment. In the client it appears for "Disconnect from
server?", "Delete this screenshot?", the uninstall confirmation, and every
`MessageBox`.

## VGUI original

Two overlapping controls:

- **`MessageBox`** — VGUI1 (`vgui_dll/include/VGUI_MessageBox.h`) and VGUI2
  (`vgui_controls/MessageBox.cpp`). A `Frame` with a prompt, an optional
  details area, and a button row.
- **`PropertyDialog`** — the settings-shaped dialog. `steamscheme.res`
  `LayoutTemplates` pins its buttons at **`92 × 24`**, which is the authoritative
  metric for the button row in this component.

The surface, titlebar and frame buttons are inherited from `Frame`, so `Dialog`
should be implemented as a thin wrapper around `Window` rather than a
reimplementation.

## Anatomy

```
.vgui-dialog-overlay                  ← fixed, full viewport, dims the page
└── .vgui-dialog                      ← role="dialog" aria-modal="true"
    ├── .vgui-dialog__titlebar        ← shared with Window
    ├── .vgui-dialog__body            ← prompt / details
    └── .vgui-dialog__footer          ← fixed button row, right-aligned
        ├── .vgui-dialog__button--secondary
        └── .vgui-dialog__button--primary
```

## Variants

| Variant | Class | Use |
| --- | --- | --- |
| Alert | `--alert` | One button: OK |
| Confirm | `--confirm` | Two buttons: Cancel (secondary) / OK (primary) |
| Prompt | `--prompt` | Confirm plus a `TextInput` in the body |
| Destructive | `--destructive` | Primary button styled as the danger action |
| Unclosable | *(no `closable`)* | No close button and `Escape` does nothing |

## States

| State | Treatment |
| --- | --- |
| Opening | No animation in VGUI. Under reduced-motion: none at all. |
| Open | Focus moves into the dialog, trapped there |
| Busy | Buttons disabled, primary shows a `Spinner`; `aria-busy="true"` on the dialog |
| Closing | Focus returns to the element that opened it |
| Error | Body gains a `--invalid` message; the dialog stays open |

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-surface` `#4C5844` | Dialog background (via `Window`) |
| `--vgui-bevel-light` / `--vgui-bevel-dark` | Dialog bevel |
| Overlay | `rgb(0 0 0 / 0.5)` — see the note below |
| `--vgui-text` `#D8DED3` | Prompt body |
| `--vgui-danger` `#E2251A` | Destructive primary button accent |
| `92 × 24` | Footer button size, from `LayoutTemplates` |

## CSS recipe

```css
.vgui-dialog-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background-color: rgb(0 0 0 / 0.5);
  z-index: 900;
}

.vgui-dialog {
  min-width: 320px;
  max-width: min(90vw, 640px);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.vgui-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.vgui-dialog__footer {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--vgui-bevel-dark);
  box-shadow: inset 0 1px 0 var(--vgui-bevel-light);   /* the Divider groove */
}

/* Button metrics straight from LayoutTemplates. */
.vgui-dialog__footer .vgui-button {
  min-width: 92px;
  min-height: 24px;
}
```

**A note on the overlay.** VGUI had no overlay concept — a `Frame` was simply
placed above its parent, and the client never dimmed the background. The
`rgb(0 0 0 / 0.5)` scrim is a modern necessity (it communicates "this is modal"
and is what makes focus trapping comprehensible), but it is **an invention**, and
it should be documented as such rather than presented as period-accurate.

## React API

```tsx
export interface DialogProps extends Omit<WindowProps, 'title' | 'onAction'> {
  /** Dialog title, shown in the shared title bar. */
  title: ReactNode
  /** Whether the dialog is rendered. Uncontrolled by default. */
  open?: boolean
  /** Called when the user dismisses via the close button, Escape or the scrim. */
  onOpenChange?: (open: boolean) => void
  /** Prompt or content. */
  children?: ReactNode
  /** Footer actions. Rendered right-aligned in the order given. */
  actions?: ReactNode
  /** Hide the close button and ignore Escape. */
  unclosable?: boolean
  /** Clicking the scrim dismisses. Off by default — accidental data loss. */
  dismissOnOverlayClick?: boolean
  /** Element to focus when the dialog opens; defaults to the first focusable. */
  initialFocusRef?: RefObject<HTMLElement>
  /** Disable the button row while an action is in flight. */
  busy?: boolean
}
```

`dismissOnOverlayClick` defaults to **`false`**. VGUI had no scrim to click, and
a click-outside dismissal on a confirmation dialog is a data-loss footgun.

## Accessibility

This is the most demanding component for accessibility in the whole library.
Every item below is required.

- `role="dialog"` and `aria-modal="true"` on the dialog element, with
  `aria-labelledby` pointing at the titlebar's `id` and, when a prompt exists,
  `aria-describedby` pointing at it. Use `useId()` for both.
- **Focus must move in on open** — to the first focusable element, or to
  `initialFocusRef` if given. A dialog that opens without moving focus leaves the
  keyboard user still tabbing around the page behind it.
- **Focus must be trapped.** Wrap `Tab` at both ends. This is why the native
  `<dialog>` element with `showModal()` is the better implementation: the browser
  does the trapping, the `inert`-ing of the background, and the top-layer
  stacking for free, and `::backdrop` replaces the scrim `div`.
- **Focus must return** to the previously focused element on close. Capture
  `document.activeElement` before opening.
- `Escape` closes unless `unclosable`. The close button must have a real
  accessible name.
- **Do not use `display: none` to hide while animating out** — it removes the
  dialog from the tree mid-transition and strands focus. Unmount after the
  animation ends, or skip animation entirely (which is what VGUI did).
- The scrim must not be focusable and must not be the click target for
  `dismissOnOverlayClick` in a way that swallows clicks on the dialog itself —
  test the click target rather than relying on `stopPropagation`.
- `aria-busy="true"` while `busy`, and the primary button must announce its
  pending state.
- **Never put the scrim above the dialog in the top layer**; if using
  `<dialog>`, `::backdrop` handles this automatically.
- Colour: the scrim at 50% black over a `#3E4637` page is sufficient contrast
  separation. The dialog's own text contrast comes from `Window`.

## Assets

None beyond `Window`'s three frame glyphs. Valve's `MessageBox` used no sprites
of its own.

## Examples

```tsx
// Confirmation
<Dialog
  title="Disconnect"
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  actions={
    <>
      <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
      <Button onClick={disconnect} autoFocus>Disconnect</Button>
    </>
  }
>
  Disconnect from server?
</Dialog>

// Destructive confirmation with a pending state
<Dialog
  title="Delete screenshot"
  variant="destructive"
  busy={deleting}
  actions={
    <>
      <Button onClick={cancel} disabled={deleting}>Cancel</Button>
      <Button onClick={confirm} disabled={deleting}>
        {deleting ? 'Deleting…' : 'Delete'}
      </Button>
    </>
  }
>
  This cannot be undone.
</Dialog>
```

## Open questions

- **Should this wrap `<dialog>`?** `showModal()` gives focus trapping, background
  inertness and top-layer stacking for free, and it is supported in every
  current browser. The cost is that styling `::backdrop` and controlling the
  enter/exit timing is slightly more awkward than a `div`. The recommendation
  here is **yes, use `<dialog>`** — the accessibility wins outweigh the styling
  friction.
- Valve's dialogs had no scrim, so the 50% black overlay is an invention. If a
  strict reproduction is wanted, the dialog should be centred with no overlay at
  all, which is much worse for accessibility.
- The `92 × 24` button metric is from `LayoutTemplates` for `PropertyDialog`
  specifically; whether `MessageBox` shares it is not confirmed.
