import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, InputHTMLAttributes } from 'react'

import './Slider.css'

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Inclusive minimum. Defaults to 0. */
  min?: number
  /** Inclusive maximum. Defaults to 100. */
  max?: number
  /** Step increment. Defaults to 1. */
  step?: number
  /** Controlled value. Omit to let the slider keep its own. */
  value?: number
  /** Called continuously while dragging. */
  onValueChange?: (value: number) => void
  /** Called once when the drag ends — use this for expensive work. */
  onValueCommit?: (value: number) => void
  /** Draw the sliderticks groove marks. */
  ticks?: boolean
  /** Show the current value in a readout after the slider. */
  showValue?: boolean
  /** How to format `showValue`. Also feeds `aria-valuetext`. */
  formatValue?: (value: number) => string
  /** Small variant for dense property rows. */
  small?: boolean
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    className,
    min = 0,
    max = 100,
    step = 1,
    value,
    onValueChange,
    onValueCommit,
    ticks = false,
    showValue = false,
    formatValue,
    small = false,
    defaultValue,
    onChange,
    ...rest
  },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    defaultValue !== undefined ? Number(defaultValue) : (min + max) / 2,
  )
  const currentValue = value !== undefined ? value : uncontrolledValue

  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref],
  )

  // Stays current without re-subscribing the native listener on every render.
  const commitRef = useRef(onValueCommit)
  useEffect(() => {
    commitRef.current = onValueCommit
  })

  /*
   * React's `onChange` on a range input *is* the native `input` event, so the
   * commit half is read straight off the native `change` event instead.
   */
  useEffect(() => {
    const input = inputRef.current
    if (!input) return undefined
    const handleNativeChange = () => {
      const commit = commitRef.current
      if (commit) commit(Number(input.value))
    }
    input.addEventListener('change', handleNativeChange)
    return () => input.removeEventListener('change', handleNativeChange)
  }, [])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.currentTarget.value)
    if (value === undefined) setUncontrolledValue(next)
    onValueChange?.(next)
    onChange?.(event)
  }

  const rootClasses = ['vgui-slider']
  if (small) rootClasses.push('vgui-slider--small')
  if (showValue) rootClasses.push('vgui-slider--with-value')
  if (className) rootClasses.push(className)

  const inputClasses = ['vgui-slider__input']
  if (ticks) inputClasses.push('vgui-slider__input--ticks')

  const readout = formatValue ? formatValue(currentValue) : String(currentValue)

  return (
    <span className={rootClasses.join(' ')}>
      <input
        ref={setRefs}
        className={inputClasses.join(' ')}
        /* Explicit so the painted `attr()` labels match what is announced. */
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={formatValue ? readout : undefined}
        {...rest}
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
      />
      {showValue ? (
        <span className="vgui-slider__value" aria-hidden="true">
          {readout}
        </span>
      ) : null}
    </span>
  )
})

Slider.displayName = 'Slider'
