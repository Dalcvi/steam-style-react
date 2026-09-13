import { forwardRef, useState } from 'react'
import type { HTMLAttributes, ReactEventHandler, SyntheticEvent } from 'react'

import './Avatar.css'

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Image URL. Omit to render the placeholder. */
  src?: string
  /** Alt text — the person's name. Pass "" when a name is already adjacent. */
  alt?: string
  /** Size presets. `sm` is 24px (account chrome), `md` 42px (notifications). */
  size?: 'sm' | 'md' | 'lg'
  /** Derive initials from a name and show them when there is no image. */
  name?: string
  /** Presence indicator drawn as a 2px frame edge. */
  status?: 'online' | 'away' | 'busy' | 'offline'
  /** Tint the frame for an ignored friend. */
  ignored?: boolean
  /** Drop the beveled frame; draw the picture alone. */
  bare?: boolean
  /** Round the corners. Not period-accurate; offered for completeness only. */
  round?: boolean
}

/**
 * At most two initials, one per name part: "dave coder" → `dc`, "dalcvi" → `d`.
 * The `::after` rule uppercases them, so the case of the name is preserved here.
 */
function initialsOf(name: string | undefined): string {
  if (name === undefined) return ''

  const words = name.trim().split(/\s+/).filter((word) => word !== '')

  const first = words[0]?.charAt(0) ?? ''
  const lastWord = words.length > 1 ? words.at(-1) : undefined
  const last = lastWord?.charAt(0) ?? ''

  return `${first}${last}`
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  {
    className,
    src,
    alt = '',
    size = 'md',
    name,
    status,
    ignored = false,
    bare = false,
    round = false,
    onError,
    ...rest
  },
  ref,
) {
  const [failed, setFailed] = useState(false)
  // A missing source and a failed load are the same state: the durable
  // placeholder, never a broken-image icon.
  const placeholder = !src || failed

  const classes = ['vgui-avatar', `vgui-avatar--${size}`]
  if (placeholder) classes.push('vgui-avatar--placeholder')
  if (status) classes.push('vgui-avatar--status')
  if (ignored) classes.push('vgui-avatar--ignored')
  if (bare) classes.push('vgui-avatar--bare')
  if (round) classes.push('vgui-avatar--round')
  if (className) classes.push(className)

  const handleError: ReactEventHandler<HTMLImageElement> = (event) => {
    setFailed(true)
    onError?.(event as unknown as SyntheticEvent<HTMLSpanElement>)
  }

  return (
    <span
      ref={ref}
      className={classes.join(' ')}
      data-initials={initialsOf(name)}
      {...rest}
    >
      {src ? (
        <img
          className="vgui-avatar__image"
          src={src}
          alt={alt}
          data-failed={failed || undefined}
          onError={handleError}
        />
      ) : null}
      {status ? (
        <span
          className={`vgui-avatar__status vgui-avatar__status--${status}`}
          aria-hidden="true"
        />
      ) : null}
    </span>
  )
})

Avatar.displayName = 'Avatar'
