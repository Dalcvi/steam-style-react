import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'

import './Divider.css'

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  /** Invert the two rows, for a rule sitting on a recessed surface. */
  inset?: boolean
  /** Draw a vertical rule instead of a horizontal one. */
  vertical?: boolean
  /** Add the standard 20px vertical margin. */
  spaced?: boolean
}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { className, inset = false, vertical = false, spaced = false, ...rest },
  ref,
) {
  const classes = ['vgui-divider']
  if (inset) classes.push('vgui-divider--inset')
  if (vertical) classes.push('vgui-divider--vertical')
  if (spaced) classes.push('vgui-divider--spaced')
  if (className) classes.push(className)

  return (
    <div
      ref={ref}
      role="separator"
      // ARIA's default orientation is vertical, so the horizontal case has to
      // say so out loud.
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      className={classes.join(' ')}
      {...rest}
    />
  )
})

Divider.displayName = 'Divider'
