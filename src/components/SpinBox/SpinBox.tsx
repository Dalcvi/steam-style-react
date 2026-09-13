import { forwardRef, useEffect, useRef, useState } from 'react'
import type {
  ChangeEvent as ReactChangeEvent,
  FocusEvent as ReactFocusEvent,
  InputHTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'

import './SpinBox.css'

/** Hold-to-repeat: the conventional wait before the first repeat, then the rate. */
const REPEAT_DELAY = 500
const REPEAT_INTERVAL = 50

const decimalsOf = (n: number) => {
  const text = String(n)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

const round = (n: number, decimals: number) => Number(n.toFixed(decimals))

const toDisplay = (n: number | undefined) => (n === undefined || !Number.isFinite(n) ? '' : String(n))

export interface SpinBoxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** Current value. `undefined` renders the input empty. */
  value?: number
  /** Called with the new value on every accepted change. */
  onValueChange?: (value: number) => void
  /** Lower bound, inclusive. */
  min?: number
  /** Upper bound, inclusive. */
  max?: number
  /** Increment applied by the steppers and by ArrowUp/ArrowDown. */
  step?: number
  /** Allow fractional values. Switches keyboard input to a decimal keyboard. */
  decimal?: boolean
  /** Wrap past the bounds instead of disabling the stepper. Off by default. */
  wrap?: boolean
  /** Hide the stepper column. Arrow keys still work. */
  noSteppers?: boolean
  /** Lay the steppers out side by side. */
  horizontal?: boolean
  /** Compact 18px variant, for dense rows. */
  small?: boolean
  /** Text announced in place of the raw number, e.g. "16 players". */
  valueText?: string
}

export const SpinBox = forwardRef<HTMLInputElement, SpinBoxProps>(function SpinBox(
  {
    className,
    value,
    onValueChange,
    min,
    max,
    step = 1,
    decimal = false,
    wrap = false,
    noSteppers = false,
    horizontal = false,
    small = false,
    valueText,
    defaultValue,
    disabled = false,
    inputMode,
    onBlur,
    onFocus,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const seed = value !== undefined ? value : defaultValue !== undefined ? Number(defaultValue) : undefined
  const [internalValue, setInternalValue] = useState<number | undefined>(seed)
  const current = value !== undefined ? value : internalValue

  const stepDecimals = decimalsOf(step)
  /* `--decimal` keeps whatever precision the user typed, never less than the step's. */
  const shapeTyped = (n: number) => (decimal ? round(n, Math.max(stepDecimals, decimalsOf(n))) : Math.round(n))

  const [draft, setDraft] = useState(() => toDisplay(seed))
  const [seen, setSeen] = useState<number | undefined>(current)
  const focusValue = useRef<number | undefined>(current)

  /*
   * Keep the draft in step with the value when it is changed from the outside.
   * Committing sets the draft directly, so this only fires for prop changes.
   */
  if (seen !== current) {
    setSeen(current)
    setDraft(toDisplay(current))
  }

  const bound = (n: number) => {
    let next = n
    if (min !== undefined && next < min) next = min
    if (max !== undefined && next > max) next = max
    return next
  }

  const commit = (next: number) => {
    const bounded = bound(next)
    /* A controlled box shows the prop, not the draft, unless the value was accepted. */
    setDraft(toDisplay(value !== undefined && bounded !== current ? current : bounded))
    if (bounded === current) return
    if (value === undefined) setInternalValue(bounded)
    onValueChange?.(bounded)
  }

  /** Typed input is clamped and loses any trailing noise. */
  const commitDraft = () => {
    const trimmed = draft.trim()
    if (trimmed === '') {
      setDraft(toDisplay(current))
      return
    }
    const parsed = Number(decimal ? trimmed.replace(',', '.') : trimmed)
    if (!Number.isFinite(parsed)) {
      setDraft(toDisplay(current))
      return
    }
    commit(shapeTyped(parsed))
  }

  const stepTo = (delta: number) => {
    const base = current ?? (delta > 0 ? (min ?? 0) : (max ?? 0))
    let next = round(base + delta, Math.max(stepDecimals, decimalsOf(base)))
    if (wrap) {
      if (max !== undefined && next > max) next = min ?? next
      else if (min !== undefined && next < min) next = max ?? next
    }
    return bound(next)
  }

  /** Returns whether anything moved, so hold-to-repeat can stop at a bound. */
  const stepBy = (delta: number) => {
    const next = stepTo(delta)
    if (next === current) return false
    commit(next)
    return true
  }

  const stepRef = useRef(stepBy)
  useEffect(() => {
    stepRef.current = stepBy
  })

  const timer = useRef<number | undefined>(undefined)
  const repeated = useRef(false)
  const pointerHandled = useRef(false)

  const stopRepeat = () => {
    if (timer.current !== undefined) {
      window.clearTimeout(timer.current)
      timer.current = undefined
    }
  }

  useEffect(() => stopRepeat, [])

  const startRepeat = (delta: number) => {
    stopRepeat()
    repeated.current = false
    const tick = () => {
      if (!stepRef.current(delta)) {
        stopRepeat()
        return
      }
      repeated.current = true
      timer.current = window.setTimeout(tick, REPEAT_INTERVAL)
    }
    timer.current = window.setTimeout(tick, REPEAT_DELAY)
  }

  const handleStepPointerDown = (delta: number) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    pointerHandled.current = true
    if (!stepRef.current(delta)) return
    startRepeat(delta)
  }

  /* A synthetic activation (a screen reader, say) never sends a pointer event. */
  const handleStepClick = (delta: number) => () => {
    if (pointerHandled.current) {
      pointerHandled.current = false
      return
    }
    stepRef.current(delta)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown': {
        event.preventDefault()
        stepBy(event.key === 'ArrowUp' ? step : -step)
        break
      }
      case 'PageUp':
      case 'PageDown': {
        event.preventDefault()
        stepBy(event.key === 'PageUp' ? step * 10 : step * -10)
        break
      }
      case 'Home': {
        if (min === undefined) break
        event.preventDefault()
        commit(min)
        break
      }
      case 'End': {
        if (max === undefined) break
        event.preventDefault()
        commit(max)
        break
      }
      case 'Escape': {
        /* Back to whatever the control held when it was focused. */
        if (focusValue.current !== undefined) commit(focusValue.current)
        else setDraft(toDisplay(current))
        break
      }
      case 'Enter': {
        commitDraft()
        break
      }
      default:
        break
    }
  }

  /* The field is controlled by its own draft; nothing is emitted until commit. */
  const handleChange = (event: ReactChangeEvent<HTMLInputElement>) => {
    setDraft(event.currentTarget.value)
  }

  const handleFocus = (event: ReactFocusEvent<HTMLInputElement>) => {
    focusValue.current = current
    onFocus?.(event)
  }

  const handleBlur = (event: ReactFocusEvent<HTMLInputElement>) => {
    onBlur?.(event)
    commitDraft()
  }

  const atMin = min !== undefined && current !== undefined && current <= min
  const atMax = max !== undefined && current !== undefined && current >= max

  const classes = ['vgui-spin-box']
  if (horizontal) classes.push('vgui-spin-box--horizontal')
  if (small) classes.push('vgui-spin-box--small')
  if (noSteppers) classes.push('vgui-spin-box--no-steppers')
  if (className) classes.push(className)

  const steppers = (delta: 1 | -1, label: string, blocked: boolean) => (
    <button
      type="button"
      className={`vgui-spin-box__step vgui-spin-box__step--${delta === 1 ? 'up' : 'down'}`}
      aria-label={label}
      /* Deliberately out of the tab order: the arrow keys replace them. */
      tabIndex={-1}
      disabled={disabled || (!wrap && blocked)}
      onPointerDown={handleStepPointerDown(delta * step)}
      onPointerUp={stopRepeat}
      onPointerLeave={stopRepeat}
      onPointerCancel={stopRepeat}
      onClick={handleStepClick(delta * step)}
    >
      <span className="vgui-spin-box__glyph" aria-hidden="true" />
    </button>
  )

  return (
    <div className={classes.join(' ')} role="group" aria-disabled={disabled || undefined}>
      <input
        ref={ref}
        className="vgui-spin-box__input"
        type="text"
        role="spinbutton"
        aria-valuenow={current}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={valueText}
        inputMode={inputMode ?? (decimal ? 'decimal' : 'numeric')}
        disabled={disabled}
        value={draft}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...rest}
      />
      {noSteppers ? null : (
        <div className="vgui-spin-box__steppers">
          {steppers(1, 'Increase', atMax)}
          {steppers(-1, 'Decrease', atMin)}
        </div>
      )}
    </div>
  )
})

SpinBox.displayName = 'SpinBox'
