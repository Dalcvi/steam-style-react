import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type {
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react'

import './Splitter.css'

/** Arrow-key nudge in pixels; `Shift` drops to a single pixel. */
const STEP = 10
const FINE_STEP = 1

function toPixels(value: number | string | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value.trim())
    if (match) return Number(match[1])
  }
  return null
}

function toPercent(value: number | string | undefined): number | null {
  if (typeof value !== 'string') return null
  const match = /^(-?\d+(?:\.\d+)?)%$/.exec(value.trim())
  return match ? Number(match[1]) : null
}

/** A number is a pixel count; a string is passed through, `%` included. */
function toCssSize(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value
}

function clamp(value: number, min?: number, max?: number): number {
  let next = value
  if (min !== undefined) next = Math.max(next, min)
  if (max !== undefined) next = Math.min(next, max)
  return next
}

export interface SplitterProps extends HTMLAttributes<HTMLDivElement> {
  /** Layout direction of the panes. */
  orientation?: 'horizontal' | 'vertical'
  /** Size of the first pane: a percentage, or a number of pixels. Uncontrolled. */
  defaultSize?: number | string
  /** Controlled size of the first pane. Pair with `onResize`. */
  size?: number | string
  /** Called with the new size while dragging and after keyboard nudges. */
  onResize?: (size: number | string) => void
  /** Smallest the first pane may become, in pixels. */
  minSize?: number
  /** Largest the first pane may become, in pixels. */
  maxSize?: number
  /** Accessible name; defaults to "Resize panel". */
  label?: string
  /** Content for the first pane. */
  first: ReactNode
  /** Content for the second pane. */
  second: ReactNode
}

export const Splitter = forwardRef<HTMLDivElement, SplitterProps>(function Splitter(
  {
    orientation = 'horizontal',
    defaultSize,
    size,
    onResize,
    minSize,
    maxSize,
    label = 'Resize panel',
    first,
    second,
    className,
    style,
    ...rest
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [internalSize, setInternalSize] = useState<number | string | undefined>(defaultSize)
  const [extent, setExtent] = useState(0)
  const draggingRef = useRef<{ origin: number; base: number | null } | null>(null)
  const [dragging, setDragging] = useState(false)

  const isControlled = size !== undefined
  const currentSize = isControlled ? size : internalSize
  const percent = toPercent(currentSize)
  const pixels = toPixels(currentSize)

  /*
   * `aria-disabled` is the documented way to switch the handle off, so it is
   * mirrored onto the handle (where the widget lives) instead of being passed
   * through to the container only.
   */
  const ariaDisabled = rest['aria-disabled']
  const disabled = ariaDisabled === true || ariaDisabled === 'true'

  /*
   * jsdom has no layout engine, so every measurement path has to survive a
   * zero-sized rect: `extent` stays 0 and pixel sizes simply cannot be turned
   * into proportions, which is exactly what the guards below fall back on.
   */
  useLayoutEffect(() => {
    const node = rootRef.current
    if (!node) return

    const measure = () => {
      const rect = node.getBoundingClientRect()
      setExtent(orientation === 'horizontal' ? rect.width : rect.height)
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [orientation])

  useEffect(() => {
    if (!dragging) return

    const previous = document.body.style.userSelect
    document.body.style.userSelect = 'none'
    return () => {
      document.body.style.userSelect = previous
    }
  }, [dragging])

  const measureNow = () => {
    const node = rootRef.current
    if (!node) return extent
    const rect = node.getBoundingClientRect()
    const measured = orientation === 'horizontal' ? rect.width : rect.height
    return measured > 0 ? measured : extent
  }

  /**
   * The gesture is always a pixel delta, so the current size has to become one.
   * A pixel size always can; a percentage needs a laid-out container.
   */
  const basePixels = (): number | null => {
    if (pixels !== null) return pixels
    if (currentSize === undefined) {
      const total = measureNow()
      return total > 0 ? total / 2 : null
    }
    if (percent !== null) {
      const total = measureNow()
      if (total > 0) return (percent / 100) * total
    }
    return null
  }

  const commit = (next: number) => {
    if (!isControlled) setInternalSize(next)
    onResize?.(next)
  }

  const resizeBy = (delta: number) => {
    const base = basePixels()
    if (base === null) return
    commit(clamp(base + delta, minSize, maxSize))
  }

  const axisPosition = (event: ReactPointerEvent<HTMLDivElement>) =>
    orientation === 'horizontal' ? event.clientX : event.clientY

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return

    // An unresolvable base (jsdom, or an unmeasurable percentage) leaves the
    // gesture live but makes every move a no-op, mirroring the keyboard.
    draggingRef.current = { origin: axisPosition(event), base: basePixels() }
    setDragging(true)

    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = draggingRef.current
    if (!drag || drag.base === null) return

    commit(clamp(drag.base + (axisPosition(event) - drag.origin), minSize, maxSize))
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return

    draggingRef.current = null
    setDragging(false)

    const target = event.currentTarget
    if (typeof target.hasPointerCapture === 'function' && target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId)
    }
  }

  /* Drag-only resizing is a WCAG 2.1.1 failure, so the separator is a widget. */
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (disabled) return

    const increase = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
    const decrease = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
    const step = event.shiftKey ? FINE_STEP : STEP

    let handled = true

    if (event.key === increase) resizeBy(step)
    else if (event.key === decrease) resizeBy(-step)
    else if (event.key === 'Home') {
      const base = minSize ?? 0
      if (!isControlled) setInternalSize(base)
      onResize?.(base)
    } else if (event.key === 'End') {
      const base = maxSize ?? measureNow()
      if (base > 0) {
        if (!isControlled) setInternalSize(base)
        onResize?.(base)
      }
    } else handled = false

    if (handled) event.preventDefault()
  }

  /*
   * Two scales, never mixed: a percentage size is a proportion of an unknown
   * container, so min/max are converted only when the container can be
   * measured. A pixel size reports pixels, and an undeclared size is the
   * `1fr / 1fr` default — an even half.
   */
  let valueNow: number
  let valueMin: number
  let valueMax: number
  let valueText: string

  if (percent !== null) {
    valueMin = extent > 0 && minSize !== undefined ? Math.round((minSize / extent) * 100) : 0
    valueMax = extent > 0 && maxSize !== undefined ? Math.round((maxSize / extent) * 100) : 100
    valueNow = Math.round(clamp(percent, valueMin, valueMax))
    valueText = `${valueNow} percent`
  } else if (pixels !== null) {
    valueMin = Math.round(minSize ?? 0)
    valueMax = Math.round(maxSize ?? (extent > 0 ? extent : Math.max(pixels, valueMin)))
    valueNow = Math.round(clamp(pixels, valueMin, valueMax))
    valueText = `${valueNow} pixels`
  } else {
    valueMin = 0
    valueMax = 100
    valueNow = 50
    valueText = '50 percent'
  }

  const sizeStyle =
    currentSize === undefined
      ? undefined
      : ({ '--vgui-splitter-size': toCssSize(currentSize) } as unknown as CSSProperties)

  const classes = ['vgui-splitter', `vgui-splitter--${orientation}`]
  if (className) classes.push(className)

  const setRoot = (node: HTMLDivElement | null) => {
    rootRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  return (
    <div
      ref={setRoot}
      className={classes.join(' ')}
      style={{ ...sizeStyle, ...style }}
      {...rest}
    >
      <div className="vgui-splitter__pane vgui-splitter__pane--first">{first}</div>
      <div
        className="vgui-splitter__handle"
        role="separator"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        /*
         * The separator's own orientation, per ARIA — a horizontal split has a
         * vertical bar between the panes. It is also what the arrow keys follow.
         */
        aria-orientation={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
        aria-disabled={disabled ? true : undefined}
        aria-valuenow={valueNow}
        aria-valuemin={valueMin}
        aria-valuemax={valueMax}
        aria-valuetext={valueText}
        data-dragging={dragging ? 'true' : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <span className="vgui-splitter__handle-grip" aria-hidden="true" />
      </div>
      <div className="vgui-splitter__pane vgui-splitter__pane--second">{second}</div>
    </div>
  )
})

Splitter.displayName = 'Splitter'
