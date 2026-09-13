import { forwardRef, useRef, useState } from 'react'
import type { HTMLAttributes, KeyboardEvent as ReactKeyboardEvent } from 'react'

import './Toolbar.css'

/** One glyph — or text — button on a {@link Toolbar}. */
export interface ToolbarItem {
  /** Stable identity; also the React key. */
  id: string
  /** Accessible name; required because the button is glyph-only. */
  label: string
  /** Sprite base name under the icon set, e.g. "icon_button_back". */
  icon: string
  /** Called on activation. */
  onClick?: () => void
  /** Renders the disabled sprite and blocks activation. */
  disabled?: boolean
  /** Sticky pressed state for toggles, e.g. fullscreen. */
  pressed?: boolean
  /** Renders a text label instead of a sprite. */
  text?: string
}

/** Props of {@link Toolbar}. */
export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  /** Items in display order. */
  items: ToolbarItem[]
  /** Bevelled buttons instead of the chromeless default. */
  raised?: boolean
  /** Draws the 34px footer bar with 24px controls. */
  footer?: boolean
  /** Accessible name for the toolbar landmark. */
  label?: string
}

/**
 * `icon_button_back` → `back`, `icon_controller_bpm` → `controller-bpm`.
 *
 * The class is the bridge between the `icon` data field and the sprite
 * selectors in `Toolbar.css`; the full sprite name stays on `data-icon` so the
 * markup still says which asset was asked for.
 */
function glyphClass(icon: string): string {
  return icon.replace(/^icon_(button_)?/, '').replace(/_/g, '-')
}

/**
 * A horizontal strip of compact buttons acting on the surface below it.
 *
 * The VGUI original has **no** `ToolBar` block at all: a toolbar is a plain
 * panel with buttons on it, and the buttons paint nothing (`bgcolor = none`
 * plus an empty `render_bg {}`). The strip is therefore deliberately bare —
 * every state is carried by swapping the sprite, never by a background tint.
 * See `docs/components/Toolbar.md`.
 */
export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  { items, raised = false, footer = false, label, className, onKeyDown, ...rest },
  ref,
) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])

  const firstEnabled = items.findIndex((item) => !item.disabled)
  const [activeIndex, setActiveIndex] = useState(firstEnabled === -1 ? 0 : firstEnabled)

  // Roving tabindex: the toolbar is a single tab stop (WCAG-conformant
  // `role="toolbar"`), so only the active button is reachable with Tab.
  const current =
    items[activeIndex] && !items[activeIndex].disabled ? activeIndex : firstEnabled

  const enabledIndices = () =>
    items.map((item, index) => ({ item, index })).filter(({ item }) => !item.disabled)

  const focusAt = (index: number) => {
    setActiveIndex(index)
    buttonRefs.current[index]?.focus()
  }

  const moveBy = (delta: number) => {
    const enabled = enabledIndices()

    if (enabled.length === 0) return

    const position = enabled.findIndex(({ index }) => index === current)
    const next = enabled[(position === -1 ? 0 : position + delta + enabled.length) % enabled.length]

    focusAt(next.index)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)

    if (event.defaultPrevented) return

    const enabled = enabledIndices()

    if (event.key === 'ArrowRight') {
      moveBy(1)
    } else if (event.key === 'ArrowLeft') {
      moveBy(-1)
    } else if (event.key === 'Home' && enabled.length > 0) {
      focusAt(enabled[0].index)
    } else if (event.key === 'End' && enabled.length > 0) {
      focusAt(enabled[enabled.length - 1].index)
    } else {
      return
    }

    event.preventDefault()
  }

  return (
    <div
      {...rest}
      ref={ref}
      role="toolbar"
      aria-orientation="horizontal"
      aria-label={label}
      className={[
        'vgui-toolbar',
        // `--bare` is the default and paints nothing at all; it is kept in the
        // markup so the documented selector for the chromeless variant exists.
        raised ? 'vgui-toolbar--raised' : 'vgui-toolbar--bare',
        footer ? 'vgui-toolbar--footer' : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => {
        const glyph = glyphClass(item.icon)
        const isText = item.text !== undefined

        return (
          <button
            key={item.id}
            ref={(node) => {
              buttonRefs.current[index] = node
            }}
            type="button"
            className={[
              'vgui-toolbar__button',
              isText ? 'vgui-toolbar__button--text' : null,
              !isText && glyph ? `vgui-toolbar__button--${glyph}` : null,
            ]
              .filter(Boolean)
              .join(' ')}
            data-icon={item.icon}
            // A text button is named by its own visible text, so a label that
            // differed from it would break WCAG 2.5.3 (label in name).
            aria-label={isText ? undefined : item.label}
            aria-pressed={item.pressed}
            disabled={item.disabled}
            tabIndex={current === index ? 0 : -1}
            onFocus={() => setActiveIndex(index)}
            onClick={() => item.onClick?.()}
          >
            {isText ? item.text : null}
          </button>
        )
      })}
    </div>
  )
})

Toolbar.displayName = 'Toolbar'
