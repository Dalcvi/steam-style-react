import { forwardRef } from 'react'
import type { CSSProperties, HTMLAttributes } from 'react'

import './ProgressBar.css'

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  /** 0–100. Omit to render the indeterminate variant. */
  value?: number
  /** Upper bound when `value` is absolute rather than a percentage. Defaults to 100. */
  max?: number
  /** Show a label under the bar. */
  showValue?: boolean
  /** Format the label. Defaults to "NN%". */
  formatValue?: (value: number, max: number) => string
  /** Accessible name. Required when there is no visible label. */
  label?: string
  /** Compact variant, for inline use. */
  small?: boolean
  /** Render the error frame. */
  error?: boolean
  /** Continuous variant: no discrete value, advances on its own. */
  continuous?: boolean
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(function ProgressBar(
  {
    className,
    value,
    max = 100,
    showValue = false,
    formatValue,
    label,
    small = false,
    error = false,
    continuous = false,
    ...rest
  },
  ref,
) {
  const ratio = value === undefined || max <= 0 ? 0 : value / max
  const percent = Math.min(100, Math.max(0, ratio * 100))
  const text = value === undefined ? null : formatValue ? formatValue(value, max) : `${Math.round(percent)}%`
  const hasText = text !== null

  const classes = ['vgui-progress']
  if (small) classes.push('vgui-progress--small')
  if (error) classes.push('vgui-progress--error')
  if (value === undefined) classes.push('vgui-progress--indeterminate')
  if (continuous) classes.push('vgui-progress--continuous')
  if (showValue && hasText) classes.push('vgui-progress--with-text')
  if (className) classes.push(className)

  return (
    <div
      ref={ref}
      className={classes.join(' ')}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      /* Omitted entirely when unknown: `0` would announce "0%", not "busy". */
      aria-valuenow={value === undefined ? undefined : value}
      aria-valuetext={formatValue && hasText ? text : undefined}
      {...rest}
    >
      <div className="vgui-progress__trough">
        <div
          className="vgui-progress__fill"
          style={{ '--vgui-progress': `${percent}%` } as CSSProperties}
        />
      </div>
      {showValue && text !== null ? <span className="vgui-progress__text">{text}</span> : null}
    </div>
  )
})

ProgressBar.displayName = 'ProgressBar'
