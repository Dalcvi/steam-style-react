import { cloneElement, forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'

import './Tooltip.css'

export interface TooltipProps {
  /** Tooltip contents — usually a string, but accepts nodes. */
  content: ReactNode
  /** Optional bold first line above the body. */
  headline?: ReactNode
  /** The element the tooltip describes. Must be focusable. */
  children: ReactElement
  /** Where to prefer to render; flips automatically when it would overflow. */
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** Milliseconds before showing on pointer hover. 0 disables the delay. */
  delay?: number
  /** Render the compact variant. */
  compact?: boolean
  /** Controlled visibility. */
  open?: boolean
  /** Called when the tooltip wants to open or close. */
  onOpenChange?: (open: boolean) => void
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  {
    content,
    headline,
    children,
    placement = 'top',
    delay = 600,
    compact = false,
    open,
    onOpenChange,
  },
  ref,
) {
  const tooltipId = useId()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  // Escape dismissal is sticky: the tooltip must not come back until the
  // pointer leaves and re-enters, or focus moves away and back (WCAG 1.4.13).
  const [dismissed, setDismissed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isControlled = open !== undefined
  const visible = isControlled ? open : uncontrolledOpen && !dismissed

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const requestOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )

  useEffect(() => clearTimer, [clearTimer])

  const childProps = children.props as Record<string, unknown>
  const existingDescribedBy = childProps['aria-describedby']
  // `aria-describedby` appends to the accessible name rather than replacing it,
  // which is exactly what a description is. An `aria-label` here would erase the
  // trigger's real name, so it is never used.
  const describedBy = [existingDescribedBy, visible ? tooltipId : null]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ')

  const handleFocus = (event: unknown) => {
    if (typeof childProps.onFocus === 'function') (childProps.onFocus as (e: unknown) => void)(event)
    // Keyboard focus is already an expression of intent, so it is never delayed.
    clearTimer()
    setDismissed(false)
    requestOpen(true)
  }

  const handleBlur = (event: unknown) => {
    if (typeof childProps.onBlur === 'function') (childProps.onBlur as (e: unknown) => void)(event)
    clearTimer()
    setDismissed(false)
    requestOpen(false)
  }

  const handlePointerEnter = (event: unknown) => {
    if (typeof childProps.onPointerEnter === 'function') {
      (childProps.onPointerEnter as (e: unknown) => void)(event)
    }
    setDismissed(false)
    if (delay <= 0) {
      requestOpen(true)
      return
    }
    clearTimer()
    timer.current = setTimeout(() => {
      timer.current = null
      requestOpen(true)
    }, delay)
  }

  const handlePointerLeave = (event: unknown) => {
    if (typeof childProps.onPointerLeave === 'function') {
      (childProps.onPointerLeave as (e: unknown) => void)(event)
    }
    clearTimer()
    setDismissed(false)
    requestOpen(false)
  }

  const handleKeyDown = (event: { key?: string }) => {
    if (typeof childProps.onKeyDown === 'function') {
      (childProps.onKeyDown as (e: unknown) => void)(event)
    }
    if (event.key === 'Escape' && visible) {
      clearTimer()
      setDismissed(true)
      requestOpen(false)
    }
  }

  const trigger = cloneElement(children, {
    'aria-describedby': describedBy.length > 0 ? describedBy : undefined,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
    onKeyDown: handleKeyDown,
  } as Record<string, unknown>)

  const classes = ['vgui-tooltip', `vgui-tooltip--placement-${placement}`]
  if (compact) classes.push('vgui-tooltip--compact')

  return (
    <>
      {trigger}
      {visible ? (
        <div ref={ref} id={tooltipId} role="tooltip" className={classes.join(' ')}>
          {headline != null ? <span className="vgui-tooltip__headline">{headline}</span> : null}
          <span className="vgui-tooltip__body">{content}</span>
        </div>
      ) : null}
    </>
  )
})

Tooltip.displayName = 'Tooltip'
