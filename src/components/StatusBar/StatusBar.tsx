import { forwardRef, useId } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'

import { Spinner } from '../Spinner'
import { StatusLabel } from '../StatusLabel'

import './StatusBar.css'

export interface StatusBarProps extends HTMLAttributes<HTMLDivElement> {
  /** The status message. Rendered through StatusLabel (uppercase by default). */
  message?: ReactNode
  /** Progress 0–100. Omit to hide the bar entirely. */
  value?: number
  /** Render the progress region as indeterminate instead of a bar. */
  busy?: boolean
  /** Turn the message into a link, as every corpus status string is. */
  href?: string
  /** Left-align instead of centring the message and bar. */
  align?: 'center' | 'left'
  /** Show the numeric percentage beside the bar. */
  showValue?: boolean
  /** Actionable failure state. Pairs with a details affordance. */
  error?: boolean
  /** Compact 20px strip. */
  compact?: boolean
}

export const StatusBar = forwardRef<HTMLDivElement, StatusBarProps>(function StatusBar(
  {
    className,
    message,
    value,
    busy = false,
    href,
    align = 'center',
    showValue = false,
    error = false,
    compact = false,
    children,
    ...rest
  },
  ref,
) {
  const messageId = useId()
  const hasChildren = children !== undefined && children !== null
  const hasMessage = message !== undefined && message !== null
  const hasBar = !busy && value !== undefined
  const percent = Math.min(100, Math.max(0, value ?? 0))

  const classes = ['vgui-status-bar']
  if (hasMessage && !busy && value === undefined) classes.push('vgui-status-bar--message-only')
  if (align === 'left') classes.push('vgui-status-bar--left')
  if (compact) classes.push('vgui-status-bar--compact')
  if (hasChildren) classes.push('vgui-status-bar--fields')
  if (error) classes.push('vgui-status-bar--error')
  if (className) classes.push(className)

  return (
    <div ref={ref} role="contentinfo" className={classes.join(' ')} {...rest}>
      {hasMessage && (
        <StatusLabel
          className="vgui-status-bar__message"
          id={messageId}
          href={href}
          live="polite"
        >
          {message}
        </StatusLabel>
      )}

      {children}

      {busy && <Spinner />}

      {hasBar && (
        <div
          className="vgui-status-bar__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-labelledby={hasMessage ? messageId : undefined}
          aria-label={hasMessage ? undefined : 'Progress'}
        >
          <div style={{ width: `${percent}%` }} />
        </div>
      )}

      {hasBar && showValue && (
        <span className="vgui-status-bar__value">{percent}%</span>
      )}
    </div>
  )
})

StatusBar.displayName = 'StatusBar'
