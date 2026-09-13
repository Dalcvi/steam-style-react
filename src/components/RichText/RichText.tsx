import { forwardRef } from 'react'
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

import './RichText.css'

export interface RichTextProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Sanitised HTML. Never pass untrusted markup — see Accessibility. */
  children?: ReactNode
  /** Drops the recessed frame; use inside a List or Panel. */
  interior?: boolean
}

export interface RichTextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {}

export interface RichTextBoldProps extends HTMLAttributes<HTMLElement> {}

export interface RichTextEmphasisProps extends HTMLAttributes<HTMLElement> {}

export const RichText = forwardRef<HTMLDivElement, RichTextProps>(function RichText(
  { className, children, interior = false, ...rest },
  ref,
) {
  const classes = ['vgui-rich-text']
  if (interior) classes.push('vgui-rich-text--interior')
  if (className) classes.push(className)

  return (
    <div ref={ref} className={classes.join(' ')} {...rest}>
      {children}
    </div>
  )
})

RichText.displayName = 'RichText'

/**
 * `"RichText url"` — the element the style maps onto. Prefer a bare `<a>` with
 * `vgui-rich-text__url`; this exists for call sites that want a React component.
 */
export const RichTextLink = forwardRef<HTMLAnchorElement, RichTextLinkProps>(
  function RichTextLink({ className, ...rest }, ref) {
    const classes = ['vgui-rich-text__url']
    if (className) classes.push(className)

    return <a ref={ref} className={classes.join(' ')} {...rest} />
  },
)

RichTextLink.displayName = 'RichTextLink'

/** `"RichText bold"` — `<strong>`, so the emphasis survives without the font. */
export const RichTextBold = forwardRef<HTMLElement, RichTextBoldProps>(
  function RichTextBold({ className, ...rest }, ref) {
    const classes = ['vgui-rich-text__bold']
    if (className) classes.push(className)

    return <strong ref={ref} className={classes.join(' ')} {...rest} />
  },
)

RichTextBold.displayName = 'RichTextBold'

/** `"RichText emphasis"` — `<em>`, for the same reason. */
export const RichTextEmphasis = forwardRef<HTMLElement, RichTextEmphasisProps>(
  function RichTextEmphasis({ className, ...rest }, ref) {
    const classes = ['vgui-rich-text__emphasis']
    if (className) classes.push(className)

    return <em ref={ref} className={classes.join(' ')} {...rest} />
  },
)

RichTextEmphasis.displayName = 'RichTextEmphasis'
