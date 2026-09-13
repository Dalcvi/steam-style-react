import { forwardRef, useState } from 'react'
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

import { glyphMask } from '../IconButton/IconButton'
import './ToggleButton.css'

export interface ToggleButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> {
  /** Controlled pressed state. Omit for uncontrolled. */
  pressed?: boolean
  /** Initial pressed state when uncontrolled. */
  defaultPressed?: boolean
  /** Called with the next pressed state. */
  onPressedChange?: (pressed: boolean) => void
  /** Optional leading glyph: a built-in glyph name or an inline SVG node. */
  icon?: ReactNode | string
  /** Square variant, glyph only. Requires `label`. */
  iconOnly?: boolean
  /** Accessible name. Required when `iconOnly` — a glyph is not a name. */
  label?: string
  /** Compact variant for toolbars. */
  small?: boolean
  /** Grey property-sheet face. */
  clay?: boolean
}

/**
 * The VGUI class that stays down. `aria-pressed` is the single source of truth
 * for both the stylesheet and assistive tech, so the state cannot diverge
 * (docs/components/ToggleButton.md, "CSS recipe").
 */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(function ToggleButton(
  {
    className,
    type = 'button',
    pressed,
    defaultPressed = false,
    onPressedChange,
    icon,
    iconOnly = false,
    label,
    small = false,
    clay = false,
    onClick,
    children,
    ...rest
  },
  ref,
) {
  const isControlled = pressed !== undefined
  const [uncontrolled, setUncontrolled] = useState(defaultPressed)
  const isPressed = isControlled ? pressed : uncontrolled

  if (import.meta.env.DEV) {
    if (iconOnly && !label && !rest['aria-label']) {
      console.warn(
        'ToggleButton: `iconOnly` needs a `label` (or `aria-label`) — a glyph alone is not an accessible name.',
      )
    }
    if (isControlled && defaultPressed) {
      console.warn(
        'ToggleButton: `defaultPressed` is ignored because `pressed` makes the button controlled.',
      )
    }
  }

  const handleClick: NonNullable<ToggleButtonProps['onClick']> = (event) => {
    onClick?.(event)
    if (event.defaultPrevented) return

    const next = !isPressed
    if (!isControlled) setUncontrolled(next)
    onPressedChange?.(next)
  }

  const classes = ['vgui-toggle-button']
  if (iconOnly) classes.push('vgui-toggle-button--icon-only')
  if (small) classes.push('vgui-toggle-button--small')
  if (clay) classes.push('vgui-toggle-button--clay')
  if (className) classes.push(className)

  const mask = typeof icon === 'string' ? glyphMask(icon) : null
  const iconStyle = mask ? ({ '--vgui-toggle-button-icon': `url("${mask}")` } as CSSProperties) : undefined

  return (
    <button
      ref={ref}
      type={type}
      className={classes.join(' ')}
      aria-pressed={isPressed}
      aria-label={label}
      onClick={handleClick}
      {...rest}
    >
      {icon ? (
        <span
          className={mask ? 'vgui-toggle-button__icon' : 'vgui-toggle-button__icon vgui-toggle-button__icon--node'}
          style={iconStyle}
          aria-hidden="true"
        >
          {mask ? null : icon}
        </span>
      ) : null}
      {iconOnly ? null : <span className="vgui-toggle-button__label">{children}</span>}
    </button>
  )
})

ToggleButton.displayName = 'ToggleButton'
