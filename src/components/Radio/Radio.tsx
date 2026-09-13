import { createContext, forwardRef, useCallback, useContext, useId, useMemo, useState } from 'react'
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react'

import './Radio.css'

interface RadioGroupContextValue {
  name: string
  value: string | undefined
  select: (value: string) => void
  disabled: boolean
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Value reported to the enclosing RadioGroup. */
  value: string
  /** The label. Rendered as part of the clickable area. */
  label?: ReactNode
}

export interface RadioGroupProps {
  /** Group legend, rendered as a <legend>. */
  label: ReactNode
  /** Controlled selected value. */
  value?: string
  /** Initial value for uncontrolled use. */
  defaultValue?: string
  /** Called with the newly selected value. */
  onValueChange?: (value: string) => void
  /** Shared input name; useId() is used when omitted. */
  name?: string
  /** Lay the radios out horizontally rather than stacked. */
  orientation?: 'vertical' | 'horizontal'
  /** Disable the whole group. */
  disabled?: boolean
  children: ReactNode
}

/**
 * A `fieldset`/`legend` group for `Radio`s. It is a context provider, not a DOM
 * wrapper for logic: it passes `name`, the selected value, `onChange` and
 * `disabled` down, so `Radio` stays a thin wrapper over a native input and the
 * browser's own arrow-key navigation inside the group keeps working
 * (docs/components/Radio.md, "Grouping").
 */
export function RadioGroup({
  label,
  value,
  defaultValue,
  onValueChange,
  name,
  orientation = 'vertical',
  disabled = false,
  children,
}: RadioGroupProps) {
  const generatedName = useId()
  const isControlled = value !== undefined
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const selected = isControlled ? value : uncontrolled

  const select = useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolled(next)
      onValueChange?.(next)
    },
    [isControlled, onValueChange],
  )

  const context = useMemo<RadioGroupContextValue>(
    () => ({ name: name ?? generatedName, value: selected, select, disabled }),
    [name, generatedName, selected, select, disabled],
  )

  return (
    <fieldset
      className={
        orientation === 'horizontal'
          ? 'vgui-radio-group vgui-radio-group--horizontal'
          : 'vgui-radio-group'
      }
      disabled={disabled}
    >
      <legend className="vgui-radio-group__legend">{label}</legend>
      <div className="vgui-radio-group__options">
        <RadioGroupContext.Provider value={context}>{children}</RadioGroupContext.Provider>
      </div>
    </fieldset>
  )
}

/**
 * A 15×15 circle with the same *inset* bevel as `Checkbox` — dark top/left,
 * light bottom/right — and a filled dot instead of a tick
 * (docs/components/Radio.md, "CSS recipe").
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { className, value, label, name, checked, disabled, onChange, ...rest },
  ref,
) {
  const group = useContext(RadioGroupContext)

  const classes = ['vgui-radio']
  if (className) classes.push(className)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event)
    if (!event.defaultPrevented) group?.select(value)
  }

  return (
    <label className={classes.join(' ')}>
      <input
        ref={ref}
        type="radio"
        className="vgui-radio__input"
        value={value}
        name={name ?? group?.name}
        checked={checked ?? (group ? group.value === value : undefined)}
        disabled={disabled ?? group?.disabled ?? false}
        onChange={handleChange}
        {...rest}
      />
      <span className="vgui-radio__circle" aria-hidden="true" />
      {label == null ? null : <span className="vgui-radio__label">{label}</span>}
    </label>
  )
})

Radio.displayName = 'Radio'
