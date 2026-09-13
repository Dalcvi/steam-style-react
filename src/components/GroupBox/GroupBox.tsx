import { forwardRef } from 'react'
import type { FieldsetHTMLAttributes, ReactNode } from 'react'

import './GroupBox.css'

export interface GroupBoxProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  /** Uppercase caption drawn on the border. */
  legend: ReactNode
  /** Invert the bevel, for a group sitting on a lighter surface. */
  inset?: boolean
  /** Drop the box; render only the engraved rule under the caption. */
  ruled?: boolean
  /** Hide the legend visually while keeping it for assistive technology. */
  hideLegend?: boolean
}

export const GroupBox = forwardRef<HTMLFieldSetElement, GroupBoxProps>(function GroupBox(
  { className, legend, inset = false, ruled = false, hideLegend = false, children, ...rest },
  ref,
) {
  const classes = ['vgui-groupbox']
  if (inset) classes.push('vgui-groupbox--inset')
  if (ruled) classes.push('vgui-groupbox--ruled')
  if (hideLegend) classes.push('vgui-groupbox--legend-hidden')
  if (className) classes.push(className)

  // No `role="group"`: the element already maps to the group role, and an
  // explicit role interferes with the legend-derived accessible name.
  return (
    <fieldset ref={ref} className={classes.join(' ')} {...rest}>
      <legend className="vgui-groupbox__legend">{legend}</legend>
      {children}
    </fieldset>
  )
})

GroupBox.displayName = 'GroupBox'
