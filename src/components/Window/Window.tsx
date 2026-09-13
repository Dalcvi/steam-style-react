import { forwardRef, useId, useRef, useState } from 'react'
import type {
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react'

import './Window.css'

type WindowAction = 'minimize' | 'maximize' | 'restore' | 'close'

type DragZone = 'titlebar' | 'grip'

/** Arrow-key nudge, in pixels. `Shift` drops to a single pixel. */
const NUDGE = 8
const FINE_NUDGE = 1

// `title` is the caption, not the tooltip, and `onDrag` reports a pointer delta
// rather than the DOM drag event, so both DOM props are replaced rather than
// extended.
export interface WindowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onDrag'> {
  /** Uppercase text in the title bar. */
  title: ReactNode
  /** Optional 16px application glyph shown before the title. */
  icon?: ReactNode
  /** Show the minimize control. */
  minimizable?: boolean
  /** Show the maximize control. */
  maximizable?: boolean
  /** Show the close control. */
  closable?: boolean
  /** Show the bottom-right resize grip. */
  resizable?: boolean
  /** Render the focused border and glyph colours. */
  focused?: boolean
  /** Show the maximize glyph in its toggled state. */
  maximized?: boolean
  /** Fires when a control is activated; `close` also fires on Escape. */
  onAction?: (action: 'minimize' | 'maximize' | 'restore' | 'close') => void
  /** Called continuously while dragging the title bar, with the pointer delta. */
  onDrag?: (deltaX: number, deltaY: number) => void
  /** Accessible label for the control group. */
  controlsLabel?: string
  /** Native tooltip attribute — `title` is taken by the caption. */
  tooltip?: string
}

export const Window = forwardRef<HTMLDivElement, WindowProps>(function Window(
  {
    title,
    icon,
    minimizable = true,
    maximizable = true,
    closable = true,
    resizable = true,
    focused = false,
    maximized = false,
    onAction,
    onDrag,
    controlsLabel,
    tooltip,
    className,
    children,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const titleId = useId()
  const dragOrigin = useRef({ x: 0, y: 0 })
  const activeZone = useRef<DragZone | null>(null)
  const [dragging, setDragging] = useState<DragZone | null>(null)

  /*
   * A floating window is a plain named `section`; only a modal one — the dialog
   * the consumer opts into by passing `role` — may claim the dialog role, and
   * only a modal one may swallow Escape.
   */
  const isModal = rest.role === 'dialog' || rest.role === 'alertdialog'

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && closable && isModal) onAction?.('close')
    onKeyDown?.(event)
  }

  const startDrag = (zone: DragZone) => (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!onDrag || event.button !== 0) return

    activeZone.current = zone
    dragOrigin.current = { x: event.clientX, y: event.clientY }
    setDragging(zone)

    // jsdom has no pointer capture at all, so it is feature-detected rather
    // than assumed.
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeZone.current || !onDrag) return
    onDrag(event.clientX - dragOrigin.current.x, event.clientY - dragOrigin.current.y)
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeZone.current) return

    activeZone.current = null
    setDragging(null)

    const target = event.currentTarget
    if (typeof target.hasPointerCapture === 'function' && target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId)
    }
  }

  /* Pointer-only dragging fails WCAG 2.1.1, so both zones nudge from the keyboard. */
  const handleNudge = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!onDrag) return

    const step = event.shiftKey ? FINE_NUDGE : NUDGE
    let deltaX = 0
    let deltaY = 0

    switch (event.key) {
      case 'ArrowLeft':
        deltaX = -step
        break
      case 'ArrowRight':
        deltaX = step
        break
      case 'ArrowUp':
        deltaY = -step
        break
      case 'ArrowDown':
        deltaY = step
        break
      default:
        return
    }

    event.preventDefault()
    onDrag(deltaX, deltaY)
  }

  const controls: Array<{ action: WindowAction; label: string }> = []
  if (minimizable) controls.push({ action: 'minimize', label: 'Minimize' })
  if (maximizable) {
    controls.push(
      maximized
        ? { action: 'restore', label: 'Restore' }
        : { action: 'maximize', label: 'Maximize' },
    )
  }
  if (closable) controls.push({ action: 'close', label: 'Close' })

  // A grip with no `onDrag` to report to would be a lie, so it becomes
  // decorative rather than announcing itself as a control.
  const gripIsControl = resizable && !maximized && Boolean(onDrag)

  const classes = ['vgui-window']
  if (focused) classes.push('vgui-window--focused')
  if (maximized) classes.push('vgui-window--maximized')
  if (className) classes.push(className)

  return (
    <section
      ref={ref}
      aria-labelledby={titleId}
      title={tooltip}
      className={classes.join(' ')}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      <div
        className="vgui-window__titlebar"
        tabIndex={0}
        data-dragging={dragging === 'titlebar' ? 'true' : undefined}
        onPointerDown={startDrag('titlebar')}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleNudge}
      >
        {icon ? <span className="vgui-window__icon">{icon}</span> : null}
        <span className="vgui-window__title" id={titleId}>
          {title}
        </span>
        {controls.length > 0 ? (
          <div
            className="vgui-window__controls"
            role="group"
            aria-label={controlsLabel ?? 'Window controls'}
          >
            {controls.map((control) => (
              <button
                key={control.action}
                type="button"
                className={`vgui-window__control vgui-window__control--${
                  control.action === 'restore' ? 'maximize' : control.action
                }`}
                onClick={() => onAction?.(control.action)}
              >
                <span
                  className="vgui-window__glyph"
                  aria-hidden="true"
                  data-glyph={control.action}
                />
                <span className="vgui-visually-hidden">{control.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="vgui-window__body">{children}</div>
      {resizable && !maximized ? (
        <div
          className="vgui-window__grip"
          data-dragging={dragging === 'grip' ? 'true' : undefined}
          tabIndex={gripIsControl ? 0 : undefined}
          aria-label={gripIsControl ? 'Resize window' : undefined}
          aria-hidden={gripIsControl ? undefined : true}
          onPointerDown={gripIsControl ? startDrag('grip') : undefined}
          onPointerMove={gripIsControl ? handlePointerMove : undefined}
          onPointerUp={gripIsControl ? endDrag : undefined}
          onPointerCancel={gripIsControl ? endDrag : undefined}
          onKeyDown={gripIsControl ? handleNudge : undefined}
        />
      ) : null}
    </section>
  )
})

Window.displayName = 'Window'
