import { forwardRef } from 'react'
import type { HTMLAttributes, ReactNode, Ref } from 'react'

import './StatusLabel.css'

export interface StatusLabelProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The status string. Rendered uppercase by default. */
  children?: ReactNode
  /** Render as an anchor. When set, hover brightens the text to white. */
  href?: string
  /** Add a leading 6px dot in the current text colour. */
  withDot?: boolean
  /** Drop the uppercase transform and use strong text. Use for long strings. */
  strong?: boolean
  /** Prepend a visually hidden word, e.g. "Status:", for screen readers. */
  accessiblePrefix?: string
  /** Renders a polite live region so changes are announced. */
  live?: 'off' | 'polite' | 'assertive'
  /** Dim the text with `--vgui-text-dim` only — no shadow — and expose `aria-disabled`. */
  disabled?: boolean
}

export const StatusLabel = forwardRef<HTMLElement, StatusLabelProps>(
  function StatusLabel(
    {
      className,
      children,
      href,
      withDot = false,
      strong = false,
      accessiblePrefix,
      live = 'off',
      disabled = false,
      ...rest
    },
    ref,
  ) {
    const classes = ['vgui-status-label']
    if (href !== undefined) classes.push('vgui-status-label--link')
    if (withDot) classes.push('vgui-status-label--with-dot')
    if (strong) classes.push('vgui-status-label--strong')
    if (className) classes.push(className)

    const ariaLive = live === 'off' ? undefined : live
    const disabledAttrs = {
      'aria-disabled': disabled || undefined,
      'data-disabled': disabled ? ('true' as const) : undefined,
    }
    const content = (
      <>
        {accessiblePrefix !== undefined && (
          <span className="vgui-status-label__prefix">{accessiblePrefix}</span>
        )}
        {children}
      </>
    )

    if (href !== undefined) {
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          className={classes.join(' ')}
          aria-live={ariaLive}
          {...disabledAttrs}
          {...rest}
        >
          {content}
        </a>
      )
    }

    return (
      <span
        ref={ref as Ref<HTMLSpanElement>}
        className={classes.join(' ')}
        aria-live={ariaLive}
        {...disabledAttrs}
        {...rest}
      >
        {content}
      </span>
    )
  },
)

StatusLabel.displayName = 'StatusLabel'
