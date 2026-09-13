import { forwardRef } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'

import './GreenPanel.css'

export interface GreenPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Uppercase VGUI title bar text. Omit it to render a panel without one. */
  heading?: ReactNode
  /** Darken the body to the VGUI "inset" look, e.g. for read-only content. */
  inset?: boolean
  /** Round the corners and drop the beveled border. */
  rounded?: boolean
}

export const GreenPanel = forwardRef<HTMLDivElement, GreenPanelProps>(function GreenPanel(
  { className, heading, inset = false, rounded = false, children, ...rest },
  ref,
) {
  const classes = ['greensteam-panel']
  if (inset) classes.push('greensteam-panel--inset')
  if (rounded) classes.push('greensteam-panel--rounded')
  if (className) classes.push(className)

  return (
    <div ref={ref} className={classes.join(' ')} {...rest}>
      {heading != null && <div className="greensteam-panel__titlebar">{heading}</div>}
      {children}
    </div>
  )
})

GreenPanel.displayName = 'GreenPanel'
