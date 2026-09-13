import { forwardRef } from 'react'
import type { CSSProperties, HTMLAttributes } from 'react'

import './LevelMeter.css'

export interface LevelMeterProps extends HTMLAttributes<HTMLDivElement> {
  /** Current level, 0…segments. Values are clamped. */
  level?: number
  /** Number of segments. 4 matches the sprite family; other values are an extension. */
  segments?: number
  /** Descending rather than ascending segment heights. */
  direction?: 'up' | 'down'
  /** Compact 12px segments, for table cells. */
  inline?: boolean
  /** Pulse the lit segments while the level is being measured. */
  animating?: boolean
  /** Render and apply a disabled treatment. */
  disabled?: boolean
  /** Text announced to assistive tech, e.g. "Good". Strongly recommended. */
  valueText?: string
}

/** Fallback accessible name; `role="meter"` is nameless without one. */
const DEFAULT_LABEL = 'Level'

export const LevelMeter = forwardRef<HTMLDivElement, LevelMeterProps>(function LevelMeter(
  {
    className,
    level = 0,
    segments = 4,
    direction = 'up',
    inline = false,
    animating = false,
    disabled = false,
    valueText,
    ...rest
  },
  ref,
) {
  const segmentCount = Math.max(1, Math.floor(segments))
  // A four-frame sprite family has no sub-segment resolution, so the reading is
  // snapped to a step and clamped into range.
  const litLevel = Math.min(segmentCount, Math.max(0, Math.round(level)))

  const classes = ['vgui-level-meter', `vgui-level-meter--${direction}`]
  if (inline) classes.push('vgui-level-meter--inline')
  if (animating) classes.push('vgui-level-meter--animating')
  if (className) classes.push(className)

  return (
    <div
      ref={ref}
      role="meter"
      aria-label={valueText ?? DEFAULT_LABEL}
      aria-valuemin={0}
      aria-valuemax={segmentCount}
      aria-valuenow={litLevel}
      aria-valuetext={valueText}
      aria-disabled={disabled || undefined}
      data-level={litLevel}
      className={classes.join(' ')}
      {...rest}
    >
      {Array.from({ length: segmentCount }, (_, index) => {
        const segmentClasses = ['vgui-level-meter__segment']
        if (index < litLevel) segmentClasses.push('is-lit')

        // The step a segment stands at is its ordinal, so the CSS needs no
        // per-count rule set.
        const geometry = {
          '--vgui-level-meter-index': String(index + 1),
          '--vgui-level-meter-count': String(segmentCount),
        } as CSSProperties

        return <span key={index} className={segmentClasses.join(' ')} style={geometry} />
      })}
    </div>
  )
})

LevelMeter.displayName = 'LevelMeter'
