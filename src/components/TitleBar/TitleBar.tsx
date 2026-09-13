import { createElement, forwardRef } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'

import './TitleBar.css'

const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

export interface TitleBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Caption text. Rendered uppercase regardless of the casing you pass. */
  children?: ReactNode
  /** Optional 16px leading glyph. */
  icon?: ReactNode
  /** Trailing controls, e.g. Window's minimize/maximize/close cluster. */
  actions?: ReactNode
  /** Render the grey property-sheet chrome instead of the green. */
  clay?: boolean
  /** Dim the caption; for a window that does not have focus. */
  subdued?: boolean
  /** Heading level for the caption, so it appears in the document outline. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** Accessible name for the trailing control group. */
  actionsLabel?: string
}

export const TitleBar = forwardRef<HTMLDivElement, TitleBarProps>(function TitleBar(
  {
    className,
    children,
    icon,
    actions,
    clay = false,
    subdued = false,
    level,
    actionsLabel,
    ...rest
  },
  ref,
) {
  const classes = ['vgui-titlebar']
  if (clay) classes.push('vgui-titlebar--clay')
  if (subdued) classes.push('vgui-titlebar--subdued')
  if (className) classes.push(className)

  // `level` is the only thing that makes the caption part of the outline. The
  // casing and the tracking are presentation, so the string itself is never
  // transformed — screen readers and copy/paste both keep the original.
  const text = createElement(
    level ? HEADING_TAGS[level - 1] : 'span',
    { className: 'vgui-titlebar__text' },
    children,
  )

  return (
    <div ref={ref} className={classes.join(' ')} {...rest}>
      {icon != null ? (
        <span className="vgui-titlebar__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {text}
      {actions != null ? (
        <div className="vgui-titlebar__actions" role="group" aria-label={actionsLabel}>
          {actions}
        </div>
      ) : null}
    </div>
  )
})

TitleBar.displayName = 'TitleBar'
