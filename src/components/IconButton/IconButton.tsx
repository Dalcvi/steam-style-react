import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

import './IconButton.css'

/*
 * Glyphs are inline SVG data URIs used as `mask-image`, never as
 * `background-image` (docs/components/IconButton.md, "CSS recipe"). A `data:`
 * URI cannot read a CSS custom property, so a painted image would need one URI
 * per colour — six variants × four states per glyph. A *mask* keeps one URI and
 * takes its colour from `background-color: currentColor`, which means the glyph
 * recolours for hover/active/disabled and for every theme variant for free.
 *
 * The mask payload is opaque black (`%23000`, percent-encoded so no literal hex
 * value appears in the source): `mask-mode: match-source` reads the image's
 * alpha, so the fill colour is irrelevant — only the silhouette matters.
 */
const svg = (body: string) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E${body}%3C/svg%3E`

/**
 * The built-in glyphs, keyed by the name accepted by `IconButton`'s `icon`
 * prop. Geometry is drawn on a 12×12 grid and centred, rather than transcribed
 * from Valve's sprites — `icon_down_*` is 9×6 while `icon_left_*`/`icon_right_*`
 * are 13×13, so one primitive per direction is the only consistent option
 * (docs/components/IconButton.md, "Assets").
 */
export const glyphs = {
  back: svg(`%3Cpath d='M8 2 4 6l4 4' fill='none' stroke='%23000' stroke-width='2'/%3E`),
  forward: svg(`%3Cpath d='M4 2l4 4-4 4' fill='none' stroke='%23000' stroke-width='2'/%3E`),
  home: svg(`%3Cpath d='M6 1 11 5.5V11H7.5V7.5h-3V11H1V5.5z' fill='%23000'/%3E`),
  reload: svg(
    `%3Cpath d='M9.6 6A3.6 3.6 0 1 1 7.9 3' fill='none' stroke='%23000' stroke-width='1.8'/%3E%3Cpath d='M8.1 1.1 8.6 4.1 5.6 3.4z' fill='%23000'/%3E`,
  ),
  stop: svg(`%3Crect x='2' y='2' width='8' height='8' fill='%23000'/%3E`),
  detail: svg(`%3Cpath d='M4 2.5 9.5 6 4 9.5z' fill='%23000'/%3E`),
  close: svg(`%3Cpath d='M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5' stroke='%23000' stroke-width='1.8'/%3E`),
  minimize: svg(`%3Crect x='2' y='9' width='8' height='2' fill='%23000'/%3E`),
  maximize: svg(
    `%3Crect x='2.5' y='2.5' width='7' height='7' fill='none' stroke='%23000' stroke-width='1.6'/%3E`,
  ),
  restore: svg(
    `%3Crect x='2' y='4.5' width='5.5' height='5.5' fill='none' stroke='%23000' stroke-width='1.4'/%3E%3Cpath d='M4.5 4.5V2h5.5v5.5H7.5' fill='none' stroke='%23000' stroke-width='1.4'/%3E`,
  ),
  'chevron-down': svg(
    `%3Cpath d='M2.5 4.5 6 8.5l3.5-4' fill='none' stroke='%23000' stroke-width='2'/%3E`,
  ),
  'chevron-up': svg(
    `%3Cpath d='M2.5 7.5 6 3.5l3.5 4' fill='none' stroke='%23000' stroke-width='2'/%3E`,
  ),
  // One centred triangle serves all four directions — see the note above.
  'arrow-down': svg(`%3Cpath d='M6 9.5 1.5 4h9z' fill='%23000'/%3E`),
  'arrow-up': svg(`%3Cpath d='M6 2.5 1.5 8h9z' fill='%23000'/%3E`),
  'arrow-left': svg(`%3Cpath d='M2.5 6 8 1.5v9z' fill='%23000'/%3E`),
  'arrow-right': svg(`%3Cpath d='M9.5 6 4 1.5v9z' fill='%23000'/%3E`),
  grid: svg(
    `%3Cpath d='M2 2h3.5v3.5H2zM6.5 2H10v3.5H6.5zM2 6.5h3.5V10H2zM6.5 6.5H10V10H6.5z' fill='%23000'/%3E`,
  ),
  list: svg(
    `%3Cpath d='M2 3h8v1.5H2zM2 5.25h8v1.5H2zM2 7.5h8V9H2z' fill='%23000'/%3E`,
  ),
  pin: svg(
    `%3Cpath d='M7.2 1.2 10.8 4.8 8.6 6.4 6.7 9.8 4.2 7.3 1.6 8.4l4.6-4.6z' fill='%23000'/%3E`,
  ),
  question: svg(
    `%3Ccircle cx='6' cy='6' r='5' fill='none' stroke='%23000' stroke-width='1.4'/%3E%3Cpath d='M4.4 4.7a1.6 1.6 0 1 1 2.3 1.5c-.5.3-.8.7-.8 1.2' fill='none' stroke='%23000' stroke-width='1.3'/%3E%3Ccircle cx='6' cy='9.2' r='.9' fill='%23000'/%3E`,
  ),
} as const

/** The names accepted by `IconButton`'s `icon` prop. */
export type GlyphName = keyof typeof glyphs

/** Resolves the built-in glyph data URI for a name, or `null` for a node. */
export function glyphMask(icon: ReactNode | GlyphName): string | null {
  return typeof icon === 'string' && icon in glyphs ? glyphs[icon as GlyphName] : null
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name. Required — a glyph alone is not a name. */
  label: string
  /** The glyph: an inline SVG node, or the name of one of the built-in glyphs. */
  icon: ReactNode | GlyphName
  /** Edge length in pixels. Defaults to 20. */
  size?: 15 | 18 | 20 | 25
  /** Render without a bevel until hovered. */
  frameless?: boolean
  /** Latched on: an inverted bevel that persists. */
  toggled?: boolean
  /** Render the grey property-sheet face. */
  clay?: boolean
}

/**
 * A square, glyph-only button. The tick target of a 20×20 face is under WCAG
 * 2.5.8's 24×24, so every variant grows an invisible centred hit area rather
 * than relying on the painted box (docs/foundations.md §10, rule 6).
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    className,
    type = 'button',
    label,
    icon,
    size = 20,
    frameless = false,
    toggled = false,
    clay = false,
    style,
    ...rest
  },
  ref,
) {
  const classes = ['vgui-icon-button']
  if (size === 15) classes.push('vgui-icon-button--small')
  if (size === 18) classes.push('vgui-icon-button--gutter')
  if (size === 25) classes.push('vgui-icon-button--large')
  if (frameless) classes.push('vgui-icon-button--frameless')
  if (toggled) classes.push('vgui-icon-button--toggled')
  if (clay) classes.push('vgui-icon-button--clay')
  if (className) classes.push(className)

  const mask = glyphMask(icon)

  // The URI travels as a custom property so the stylesheet stays free of
  // inline images and a caller's own `style` still merges.
  const mergedStyle = mask
    ? ({ ...style, '--vgui-icon-button-glyph': `url("${mask}")` } as CSSProperties)
    : style

  return (
    <button
      ref={ref}
      type={type}
      className={classes.join(' ')}
      aria-label={label}
      aria-pressed={toggled || undefined}
      style={mergedStyle}
      {...rest}
    >
      <span
        className={mask ? 'vgui-icon-button__glyph' : 'vgui-icon-button__glyph vgui-icon-button__glyph--node'}
        aria-hidden="true"
      >
        {mask ? null : icon}
      </span>
    </button>
  )
})

IconButton.displayName = 'IconButton'
