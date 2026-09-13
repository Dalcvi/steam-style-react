import { createElement, forwardRef, useId } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'

import './Panel.css'

const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Uppercase VGUI title bar text. Omit it to render a panel without one. */
  heading?: ReactNode
  /** Darken the body to the VGUI "inset" look, e.g. for read-only content. */
  inset?: boolean
  /** Round the corners and drop the beveled border. */
  rounded?: boolean
  /** Render the caption inside an h{level} so screen readers can navigate between panels. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { className, heading, inset = false, rounded = false, headingLevel, children, ...rest },
  ref,
) {
  const titlebarId = useId()

  if (import.meta.env.DEV && inset && rounded) {
    console.warn(
      'Panel: `inset` and `rounded` cannot be combined — Valve has no rounded-inset panel and the combination has no defined look.',
    )
  }

  const classes = ['vgui-panel']
  if (inset) classes.push('vgui-panel--inset')
  if (rounded) classes.push('vgui-panel--rounded')
  if (className) classes.push(className)

  const hasHeading = heading != null

  const titlebar = hasHeading
    ? createElement(
        headingLevel ? HEADING_TAGS[headingLevel - 1] : 'div',
        { id: titlebarId, className: 'vgui-panel__titlebar' },
        heading,
      )
    : null

  // With a caption the panel is a named region, so it is a real <section> wired
  // to that caption. Without one it is a generic container.
  if (hasHeading) {
    return (
      <section ref={ref} className={classes.join(' ')} aria-labelledby={titlebarId} {...rest}>
        {titlebar}
        {children}
      </section>
    )
  }

  return (
    <div ref={ref} className={classes.join(' ')} {...rest}>
      {children}
    </div>
  )
})

Panel.displayName = 'Panel'
