import { forwardRef, useCallback, useEffect, useRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

import './Checkbox.css'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** The label. Rendered as part of the clickable area. */
  label?: ReactNode
  /** Render the indeterminate third state. */
  indeterminate?: boolean
  /** Put the box after the label instead of before. */
  labelPosition?: 'start' | 'end'
}

/**
 * A 15×15 box with an *inset* bevel — a hole in the panel, not a raised button.
 *
 * The real `<input type="checkbox">` stays in the DOM, focusable and hidden by
 * `clip-path`, so `Space`, form participation and the platform's "mixed"
 * announcement all keep working (docs/components/Checkbox.md, "Accessibility").
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, indeterminate = false, labelPosition = 'start', ...rest },
  ref,
) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  // `indeterminate` is a DOM property with no attribute, so it can only be
  // written imperatively — and it never touches `checked` (the doc's React API).
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate
  }, [indeterminate])

  if (import.meta.env.DEV && label == null) {
    console.warn(
      'Checkbox: no `label` means the 15×15 box is the whole hit area and the control has no accessible name.',
    )
  }

  const classes = ['vgui-checkbox']
  if (labelPosition === 'end') classes.push('vgui-checkbox--label-end')
  if (className) classes.push(className)

  const box = <span className="vgui-checkbox__box" aria-hidden="true" />

  return (
    <label className={classes.join(' ')}>
      <input ref={setInputRef} type="checkbox" className="vgui-checkbox__input" {...rest} />
      {labelPosition === 'end' ? null : box}
      {label == null ? null : <span className="vgui-checkbox__label">{label}</span>}
      {labelPosition === 'end' ? box : null}
    </label>
  )
})

Checkbox.displayName = 'Checkbox'
