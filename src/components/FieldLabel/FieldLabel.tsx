import { forwardRef } from 'react'
import type { LabelHTMLAttributes, ReactNode } from 'react'

import './FieldLabel.css'

export interface FieldLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Text or inline content of the label. */
  children?: ReactNode
  /** Render a <span> instead of a <label>, for standalone explanatory text. */
  asText?: boolean
  /** Emphasis: strong white text rather than the default caption colour. */
  strong?: boolean
  /** The classic Label grey `#A0AA95`, for captions on a darker surface. */
  muted?: boolean
  /** Use the maize heading colour, for a label acting as a section title. */
  heading?: boolean
  /** Actionable/validation failure state. Pair with a message; never colour alone. */
  error?: boolean
  /** Append a danger-coloured asterisk. Adds `aria-required` semantics. */
  required?: boolean
  /** Apply the sunken DisabledText1/DisabledText2 treatment. */
  disabled?: boolean
}

/**
 * The ordinary caption: one element, one text node, no bevel and no interaction.
 *
 * It renders a real `<label>` whenever it captions a control, so `htmlFor` gives
 * the click-to-focus behaviour for free; `asText` swaps in a `<span>` for
 * standalone explanatory text (docs/components/FieldLabel.md, "Anatomy").
 */
export const FieldLabel = forwardRef<HTMLLabelElement, FieldLabelProps>(function FieldLabel(
  {
    className,
    children,
    asText = false,
    strong = false,
    muted = false,
    heading = false,
    error = false,
    required = false,
    disabled = false,
    htmlFor,
    ...rest
  },
  ref,
) {
  const classes = ['vgui-field-label']
  if (strong) classes.push('vgui-field-label--strong')
  if (muted) classes.push('vgui-field-label--muted')
  if (heading) classes.push('vgui-field-label--heading')
  if (error) classes.push('vgui-field-label--error')
  if (required) classes.push('vgui-field-label--required')
  if (className) classes.push(className)

  // A `<label>` cannot be natively disabled, so the sunken look is opt-in and
  // keyed on `data-disabled`, with the semantics exposed alongside it. The
  // requirement itself stays on the control: `aria-required` on a `<label>` is
  // not permitted for the generic role.
  const isDisabled = disabled || undefined

  if (asText) {
    return (
      <span
        className={classes.join(' ')}
        data-disabled={disabled ? 'true' : undefined}
        aria-disabled={isDisabled}
        {...rest}
      >
        {children}
      </span>
    )
  }

  return (
    <label
      ref={ref}
      htmlFor={htmlFor}
      className={classes.join(' ')}
      data-disabled={disabled ? 'true' : undefined}
      aria-disabled={isDisabled}
      {...rest}
    >
      {children}
    </label>
  )
})

FieldLabel.displayName = 'FieldLabel'
