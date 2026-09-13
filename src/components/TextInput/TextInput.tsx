import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

import './TextInput.css'

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Field height: `default` is 19px, `large` is 25px and lines up with a Button. */
  size?: 'default' | 'large'
  /** Glyph shown inside the field's leading edge. */
  icon?: ReactNode | string
  /** Text shown inside the field's trailing edge, e.g. a unit. */
  suffix?: ReactNode
  /** Draw the invalid bevel. Does not set aria-invalid. */
  invalid?: boolean
  /** Grey property-sheet chrome. */
  clay?: boolean
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className, size = 'default', icon, suffix, invalid = false, clay = false, ...rest },
  ref,
) {
  const classes = ['vgui-text-input']
  if (size === 'large') classes.push('vgui-text-input--large')
  if (icon != null) classes.push('vgui-text-input--with-icon')
  if (suffix != null) classes.push('vgui-text-input--with-suffix')
  if (invalid) classes.push('vgui-text-input--invalid')
  if (clay) classes.push('vgui-text-input--clay')
  if (className) classes.push(className)

  return (
    <span className={classes.join(' ')}>
      {icon != null ? (
        <span
          className="vgui-text-input__adornment vgui-text-input__adornment--start"
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <input ref={ref} className="vgui-text-input__field" {...rest} />
      {suffix != null ? (
        <span
          className="vgui-text-input__adornment vgui-text-input__adornment--end"
          aria-hidden="true"
        >
          {suffix}
        </span>
      ) : null}
    </span>
  )
})

TextInput.displayName = 'TextInput'
