import { forwardRef, useCallback, useEffect, useRef } from 'react'
import type { CSSProperties, HTMLAttributes } from 'react'

import './Console.css'
import '../../styles/scrollbars.css'

export type ConsoleLineKind = 'text' | 'error' | 'history'

export interface ConsoleLine {
  /** Stable identity; also the React key. */
  id: string
  /** The log text, rendered verbatim including whitespace. */
  text: string
  /** Drives the colour: Text, Highlight3, or White for history. */
  kind: ConsoleLineKind
}

export interface ConsoleProps extends HTMLAttributes<HTMLDivElement> {
  /** Lines in display order, oldest first. */
  lines: ConsoleLine[]
  /** Accessible name, e.g. "Server console". */
  label: string
  /** Scroll to the newest line when it is appended. */
  follow?: boolean
  /** Maximum retained lines before the oldest are dropped. */
  maxLines?: number
  /** Text prefixed to error lines so the failure is not colour-only; set to '' to disable. */
  errorPrefix?: string
}

export const Console = forwardRef<HTMLDivElement, ConsoleProps>(function Console(
  {
    className,
    lines,
    label,
    follow = false,
    maxLines,
    errorPrefix = 'ERR: ',
    style,
    ...rest
  },
  ref,
) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref],
  )

  // `maxLines` is an addition the corpus does not describe: an unbounded log is
  // an unbounded DOM.
  const retained =
    maxLines === undefined || lines.length <= maxLines
      ? lines
      : lines.slice(lines.length - Math.max(0, maxLines))
  const newestId = retained[retained.length - 1]?.id

  useEffect(() => {
    if (!follow) return
    const node = scrollRef.current
    if (node === null) return
    node.scrollTop = node.scrollHeight
  }, [follow, newestId, retained.length])

  const classes = ['vgui-console', 'vgui-scroll-surface']
  if (errorPrefix === '') classes.push('vgui-console--no-error-prefix')
  if (className) classes.push(className)

  const inlineStyle = {
    ...style,
    '--vgui-console-error-prefix': JSON.stringify(errorPrefix),
  } as CSSProperties

  return (
    <div
      ref={setRef}
      role="log"
      aria-live="polite"
      aria-label={label}
      tabIndex={0}
      className={classes.join(' ')}
      style={inlineStyle}
      {...rest}
    >
      <ol className="vgui-console__history">
        {retained.map((line) => {
          const lineClasses = ['vgui-console__line']
          if (line.kind === 'error') lineClasses.push('vgui-console__line--error')
          if (line.kind === 'history') lineClasses.push('vgui-console__line--history')

          return (
            <li key={line.id} className={lineClasses.join(' ')}>
              {line.text}
            </li>
          )
        })}
      </ol>
    </div>
  )
})

Console.displayName = 'Console'
