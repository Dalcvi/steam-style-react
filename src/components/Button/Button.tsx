import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

import './Button.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Stretch the button across the full width of its container. */
  fullWidth?: boolean
  /** Compact variant for dense chrome: 18px tall, 12px text. */
  small?: boolean
  /** Taller variant for dialog footers: 30px tall, 16px text. */
  large?: boolean
  /** Emphasis hook for a dialog's default action. Never a background fill. */
  primary?: boolean
  /** Draw a danger outline around the button. */
  danger?: boolean
  /** Render the grey property-sheet face instead of the green one. */
  clay?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    type = 'button',
    fullWidth = false,
    small = false,
    large = false,
    primary = false,
    danger = false,
    clay = false,
    children,
    ...rest
  },
  ref,
) {
  const classes = ['vgui-button']
  if (fullWidth) classes.push('vgui-button--full-width')
  if (small) classes.push('vgui-button--small')
  if (large) classes.push('vgui-button--large')
  if (primary) classes.push('vgui-button--primary')
  if (danger) classes.push('vgui-button--danger')
  if (clay) classes.push('vgui-button--clay')
  if (className) classes.push(className)

  return (
    <button ref={ref} type={type} className={classes.join(' ')} {...rest}>
      <span className="vgui-button__label">{children}</span>
    </button>
  )
})

Button.displayName = 'Button'
