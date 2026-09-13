import { forwardRef, useEffect, useState } from 'react'
import type { CSSProperties, HTMLAttributes, KeyboardEvent, ReactNode } from 'react'

import './Notification.css'

type NotificationVariant = 'info' | 'success' | 'warning' | 'error'

// `title` is narrowed to `ReactNode` here, so the inherited `title: string` has
// to be dropped first — the same trade `Window` makes.
export interface NotificationProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Bold headline. Optional — a message alone is fine. */
  title?: ReactNode
  /** Body text. */
  children?: ReactNode
  /** Semantic variant; changes the icon colour and the live-region politeness. */
  variant?: NotificationVariant
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

const GLYPHS: Record<NotificationVariant, ReactNode> = {
  info: (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" />
      <rect x="7.25" y="7" width="1.5" height="5" fill="currentColor" />
      <rect x="7.25" y="4" width="1.5" height="1.5" fill="currentColor" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M2.5 8.5 6 12l7.5-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M8 1.5 15 14.5H1Z" fill="none" stroke="currentColor" strokeLinejoin="round" />
      <rect x="7.25" y="6" width="1.5" height="4.5" fill="currentColor" />
      <rect x="7.25" y="11.5" width="1.5" height="1.5" fill="currentColor" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M3 3 13 13M13 3 3 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
}

export const Notification = forwardRef<HTMLDivElement, NotificationProps>(function Notification(
  {
    className,
    title,
    children,
    variant = 'info',
    icon,
    corner = 'bottom-right',
    dismissable = false,
    onDismiss,
    duration,
    index = 0,
    style,
    onKeyDown,
    onFocus,
    onBlur,
    onPointerEnter,
    onPointerLeave,
    ...rest
  },
  ref,
) {
  const [paused, setPaused] = useState(false)

  // An error that vanishes on a timer fails WCAG 2.2.1 for precisely the
  // message that most needs to be read, so `error` never auto-dismisses.
  const timeout = variant === 'error' ? 0 : duration ?? 0

  useEffect(() => {
    if (timeout <= 0 || paused || !onDismiss) return
    const timer = setTimeout(onDismiss, timeout)
    return () => clearTimeout(timer)
  }, [timeout, paused, onDismiss])

  const classes = [
    'vgui-notification',
    `vgui-notification--${variant}`,
    `vgui-notification--corner-${corner}`,
    'vgui-notification--entering',
  ]
  if (className) classes.push(className)

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.key === 'Escape' && onDismiss) onDismiss()
  }

  // `index` is published rather than applied: the queue and the stacking are the
  // consumer's policy, and the component cannot guess a neighbour's height.
  const mergedStyle = { ...style, '--vgui-notification-index': index } as CSSProperties

  return (
    <div
      ref={ref}
      // The politeness is semantic: an error interrupts, everything else waits
      // its turn.
      role={variant === 'error' ? 'alert' : 'status'}
      className={classes.join(' ')}
      style={mergedStyle}
      onKeyDown={handleKeyDown}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        setPaused(true)
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        setPaused(false)
      }}
      onFocus={(event) => {
        onFocus?.(event)
        setPaused(true)
      }}
      onBlur={(event) => {
        onBlur?.(event)
        setPaused(false)
      }}
      {...rest}
    >
      <span className="vgui-notification__icon" aria-hidden="true">
        {icon ?? GLYPHS[variant]}
      </span>
      <div className="vgui-notification__content">
        {title != null ? <span className="vgui-notification__title">{title}</span> : null}
        <span className="vgui-notification__message">
          {/* Colour alone may never be the error indicator (WCAG 1.4.1), so the
              message leads with a word. A `title` already carries that word, so
              the prefix is only added when there is no title to do it. */}
          {variant === 'error' && title == null ? (
            <strong className="vgui-notification__prefix">Error: </strong>
          ) : null}
          {children}
        </span>
      </div>
      {dismissable ? (
        <button
          type="button"
          className="vgui-notification__dismiss"
          aria-label="Dismiss notification"
          onClick={onDismiss}
        >
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
    </div>
  )
})

Notification.displayName = 'Notification'
