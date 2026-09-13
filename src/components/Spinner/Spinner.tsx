import { forwardRef } from 'react'
import type { CSSProperties, HTMLAttributes } from 'react'

import './Spinner.css'

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Native size in pixels. 20 is the corpus value. */
  size?: number
  /** Fill the container and paint a black plate. The screenshot-loading case. */
  block?: boolean
  /** Draw the at-rest frame instead of animating. */
  paused?: boolean
  /** Accessible name announced to assistive tech. Defaults to "Loading". */
  label?: string
  /** Repeat the label as visible text beside the spinner. */
  showLabel?: boolean
  /** Sprite-sheet URL. When omitted the spinner is drawn procedurally. */
  frames?: string
  /** Rotation duration in milliseconds. Defaults to 1200. */
  durationMs?: number
}

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  {
    className,
    size,
    block = false,
    paused = false,
    label = 'Loading',
    showLabel = false,
    frames,
    durationMs,
    style,
    children,
    ...rest
  },
  ref,
) {
  const classes = ['vgui-spinner']
  if (block) classes.push('vgui-spinner--block')
  if (paused) classes.push('vgui-spinner--paused')
  if (frames !== undefined) classes.push('vgui-spinner--sprite')
  if (showLabel) classes.push('vgui-spinner--inline-label')
  if (className) classes.push(className)

  /*
   * `size` and `durationMs` are written as inline custom properties rather than
   * dimensions so that the component-local tokens stay overridable from CSS —
   * `--block` raises the size to 32px and would otherwise be clobbered.
   */
  const inlineStyle = { ...style } as CSSProperties & Record<string, string>
  if (size !== undefined) inlineStyle['--vgui-spinner-size'] = `${size}px`
  if (durationMs !== undefined) inlineStyle['--vgui-spinner-duration'] = `${durationMs}ms`
  if (frames !== undefined) inlineStyle['--vgui-spinner-sheet'] = `url("${frames}")`

  return (
    <span
      ref={ref}
      role="progressbar"
      aria-label={label}
      className={classes.join(' ')}
      style={inlineStyle}
      {...rest}
    >
      <span className="vgui-spinner__frame" aria-hidden="true" />
      {showLabel && <span className="vgui-spinner__label">{children ?? label}</span>}
    </span>
  )
})

Spinner.displayName = 'Spinner'
