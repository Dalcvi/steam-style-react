import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

import './GreenButton.css'

export interface GreenButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Stretch the button across the full width of its container. */
  fullWidth?: boolean
}

export const GreenButton = forwardRef<HTMLButtonElement, GreenButtonProps>(function GreenButton(
  { className, type = 'button', fullWidth = false, ...rest },
  ref,
) {
  const classes = ['greensteam-button']
  if (fullWidth) classes.push('greensteam-button--full-width')
  if (className) classes.push(className)

  return <button ref={ref} type={type} className={classes.join(' ')} {...rest} />
})

GreenButton.displayName = 'GreenButton'
