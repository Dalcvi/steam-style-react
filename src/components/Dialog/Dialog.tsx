import {
  forwardRef,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { Window } from '../Window'
import type { WindowProps } from '../Window'
import './Dialog.css'
import '../../styles/scrollbars.css'

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
  /** Element to focus when the dialog opens; defaults to the first action. */
  initialFocusRef?: RefObject<HTMLElement | null>
  /** Disable the button row while an action is in flight. */
  busy?: boolean
  /** Which of the four MessageBox shapes this dialog reproduces. */
  variant?: 'alert' | 'confirm' | 'prompt' | 'destructive'
}

/** Anything a dialog may move focus to, in DOM order. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

const focusableWithin = (node: HTMLElement) =>
  Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))

/*
 * The frame's own controls sit before the body in DOM order, so a naive "first
 * focusable" would always land on the close button. The actions the user came
 * for come first, then the body, then the frame.
 */
const initialTarget = (node: HTMLElement) => {
  const preferred = [
    node.querySelector<HTMLElement>('.vgui-dialog__footer'),
    node.querySelector<HTMLElement>('.vgui-dialog__body'),
    node,
  ]

  for (const scope of preferred) {
    if (!scope) continue
    const [first] = focusableWithin(scope)
    if (first) return first
  }

  return node
}

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  {
    actions,
    busy = false,
    children,
    className,
    closable = true,
    controlsLabel,
    dismissOnOverlayClick = false,
    focused = true,
    icon,
    initialFocusRef,
    maximizable = false,
    maximized = false,
    minimizable = false,
    onDrag,
    onKeyDown,
    onOpenChange,
    open,
    resizable = false,
    title,
    tooltip,
    unclosable = false,
    variant = 'confirm',
    ...sectionProps
  },
  ref,
) {
  const titleId = useId()
  const bodyId = useId()
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const restoreRef = useRef<Element | null>(null)
  const [internalOpen, setInternalOpen] = useState(true)

  const isOpen = open ?? internalOpen

  const setDialog = useCallback(
    (node: HTMLDivElement | null) => {
      dialogRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  const requestOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }

  /*
   * A dialog that opens without moving focus leaves the keyboard user tabbing
   * around the page behind it, and one that closes without giving focus back
   * strands them at the top of the document.
   */
  useLayoutEffect(() => {
    if (!isOpen) return

    const node = dialogRef.current
    if (!node) return

    const previous = document.activeElement
    const target = initialFocusRef?.current ?? initialTarget(node)

    // `autoFocus` on a child already moved focus during commit; leave it alone.
    if (!node.contains(document.activeElement)) {
      target.focus()
      restoreRef.current = previous
    }

    return () => {
      const restore = restoreRef.current
      if (restore instanceof HTMLElement && restore.isConnected) restore.focus()
      restoreRef.current = null
    }
  }, [initialFocusRef, isOpen])

  const handleOverlayClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    // Test the click target rather than stopping propagation, so a click that
    // starts inside the dialog but ends on the scrim is not treated as a
    // dismissal of the dialog.
    if (!dismissOnOverlayClick || unclosable) return
    if (event.target !== overlayRef.current) return
    requestOpen(false)
  }

  /** Wraps `Tab` at both ends of the dialog, which is what contains focus. */
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.key !== 'Tab') return

    const node = dialogRef.current
    if (!node) return

    const focusable = focusableWithin(node)
    if (focusable.length === 0) {
      event.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement

    if (event.shiftKey) {
      if (active === first || !node.contains(active)) {
        event.preventDefault()
        last.focus()
      }
      return
    }

    if (active === last || !node.contains(active)) {
      event.preventDefault()
      first.focus()
    }
  }

  if (!isOpen) return null

  return (
    <div ref={overlayRef} className="vgui-dialog-overlay" onClick={handleOverlayClick}>
      <Window
        {...sectionProps}
        ref={setDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={children ? bodyId : undefined}
        aria-busy={busy || undefined}
        tabIndex={-1}
        className={[
          'vgui-dialog',
          `vgui-dialog--${variant}`,
          busy ? 'vgui-dialog--busy' : null,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        focused={focused}
        minimizable={minimizable}
        maximizable={maximizable}
        maximized={maximized}
        closable={closable && !unclosable}
        resizable={resizable}
        icon={icon}
        controlsLabel={controlsLabel}
        tooltip={tooltip}
        onDrag={onDrag}
        onAction={(action) => {
          if (action === 'close') requestOpen(false)
        }}
        onKeyDown={handleKeyDown}
        title={<span id={titleId}>{title}</span>}
      >
        <div className="vgui-dialog__body vgui-scroll-surface" id={bodyId}>
          {children}
        </div>
        {actions ? (
          <div className="vgui-dialog__footer" data-busy={busy ? 'true' : undefined}>
            {busy ? <span className="vgui-dialog__spinner" aria-hidden="true" /> : null}
            {actions}
          </div>
        ) : null}
      </Window>
    </div>
  )
})

Dialog.displayName = 'Dialog'
