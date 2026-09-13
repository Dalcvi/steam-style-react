import { forwardRef, useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { InputEvent, TextareaHTMLAttributes } from 'react'

import './Textarea.css'
import '../../styles/scrollbars.css'

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> {
  /** Visible rows. Sets `rows`; the 60px `min-height` still applies. */
  rows?: number
  /** Grow to fit content instead of scrolling, up to `maxHeight`. */
  autoGrow?: boolean
  /** Cap for `autoGrow`, in pixels. Defaults to 240. */
  maxHeight?: number
  /** Prevent the user from resizing the field. Defaults to `vertical`. */
  resize?: 'none' | 'vertical'
  /** Monospaced text, for console and config content. */
  mono?: boolean
  /** Show a live character count, expressed against `maxLength` when given. */
  showCount?: boolean
  /** Render the invalid border. Does not set aria-invalid. */
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    className,
    rows,
    autoGrow = false,
    maxHeight = 240,
    resize = 'vertical',
    mono = false,
    showCount = false,
    invalid = false,
    value,
    defaultValue,
    maxLength,
    onInput,
    style,
    ...rest
  },
  ref,
) {
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const [uncontrolledLength, setUncontrolledLength] = useState(
    () => String(defaultValue ?? '').length,
  )

  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      fieldRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref],
  )

  const resizeToContent = useCallback(() => {
    const field = fieldRef.current
    if (!field) return
    // Mirror `scrollHeight`: it is only meaningful once the box is unconstrained.
    field.style.height = 'auto'
    field.style.height = `${Math.min(field.scrollHeight, maxHeight)}px`
  }, [maxHeight])

  // Runs after every render so a controlled value resizes the box too. An
  // uncontrolled field does not re-render, hence the `onInput` hook below.
  useLayoutEffect(() => {
    if (autoGrow) resizeToContent()
  })

  const classes = ['vgui-textarea']
  if (resize === 'none') classes.push('vgui-textarea--fixed')
  if (autoGrow) classes.push('vgui-textarea--auto-grow')
  if (mono) classes.push('vgui-textarea--mono')
  if (invalid) classes.push('vgui-textarea--invalid')
  if (className) classes.push(className)

  const length = value !== undefined ? String(value).length : uncontrolledLength

  const handleInput = (event: InputEvent<HTMLTextAreaElement>) => {
    if (value === undefined) setUncontrolledLength(event.currentTarget.value.length)
    if (autoGrow) resizeToContent()
    onInput?.(event)
  }

  return (
    <span className={classes.join(' ')}>
      <textarea
        ref={setRefs}
        className="vgui-textarea__field vgui-scroll-surface"
        rows={rows}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        style={autoGrow ? { ...style, maxHeight } : style}
        onInput={handleInput}
        {...rest}
      />
      {showCount ? (
        <span className="vgui-textarea__count" aria-hidden="true">
          {maxLength != null ? `${length} / ${maxLength}` : length}
        </span>
      ) : null}
    </span>
  )
})

Textarea.displayName = 'Textarea'
