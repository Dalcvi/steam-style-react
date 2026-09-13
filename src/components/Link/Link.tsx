import { forwardRef } from 'react'
import type { HTMLAttributes, MouseEvent, ReactNode, Ref } from 'react'

import './Link.css'

export interface LinkProps extends HTMLAttributes<HTMLElement> {
  /** Destination. Omit to render a button-styled action instead. */
  href?: string
  /** Low-emphasis `URLLabel` colour instead of the default. */
  quiet?: boolean
  /** Renders as an action button with no underline (`TextButton`). */
  asButton?: boolean
  /** Adds target="_blank" and the external glyph. */
  external?: boolean
  /** Not reachable or clickable. */
  disabled?: boolean
  /** Rendered content. */
  children: ReactNode
  /** Called when the link or text button is activated. */
  onClick?: (event: MouseEvent<HTMLElement>) => void
}

/**
 * Inline text that navigates (`URLLabel`), or the same look as a low-emphasis
 * action (`TextButton`). A link is always underlined and a text button never
 * is — that decoration, not the colour, is what separates "navigates" from
 * "acts". See `docs/components/Link.md`.
 */
export const Link = forwardRef<HTMLElement, LinkProps>(function Link(
  {
    className,
    href,
    quiet = false,
    asButton = false,
    external = false,
    disabled = false,
    children,
    onClick,
    ...rest
  },
  ref,
) {
  // `TextButton` has no destination by definition, so omitting `href` renders
  // the action form even when `asButton` is not passed explicitly.
  const isButton = asButton || href === undefined
  const showExternal = external && !isButton

  const classes = ['vgui-link']
  if (quiet) classes.push('vgui-link--quiet')
  if (isButton) classes.push('vgui-link--button')
  if (showExternal) classes.push('vgui-link--external')
  if (disabled) classes.push('vgui-link--disabled')
  if (className) classes.push(className)

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (disabled) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  if (isButton) {
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        className={classes.join(' ')}
        disabled={disabled}
        onClick={handleClick}
        {...rest}
      >
        {children}
      </button>
    )
  }

  return (
    <a
      ref={ref as Ref<HTMLAnchorElement>}
      className={classes.join(' ')}
      href={href}
      // A disabled anchor stays visible but leaves the tab order and the click
      // path; `pointer-events` alone would keep it reachable by keyboard.
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : rest.tabIndex}
      target={showExternal ? '_blank' : undefined}
      rel={showExternal ? 'noreferrer noopener' : undefined}
      onClick={handleClick}
      {...rest}
    >
      {children}
      {showExternal ? (
        <>
          <span className="vgui-link__external" aria-hidden="true">
            ↗
          </span>
          <span className="vgui-visually-hidden">(opens in a new tab)</span>
        </>
      ) : null}
    </a>
  )
})

Link.displayName = 'Link'
