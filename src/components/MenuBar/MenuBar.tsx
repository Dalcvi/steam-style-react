import { forwardRef, useId, useRef, useState } from 'react'
import type { HTMLAttributes, KeyboardEvent as ReactKeyboardEvent } from 'react'

import { Menu } from '../Menu/Menu'
import type { MenuItemSpec } from '../Menu/Menu'

import './MenuBar.css'

/** One top-level word in a {@link MenuBar}. */
export interface MenuBarItemSpec {
  /** Stable identity and React key. */
  id: string
  /** The visible word, e.g. "File". */
  label: string
  /** Access key, announced and bound to Alt+<key>. */
  accessKey?: string
  /** Menu contents; see Menu's MenuItemSpec[]. */
  items: MenuItemSpec[]
  /** Renders a disabled, unopenable word. */
  disabled?: boolean
}

/** Props of {@link MenuBar}. */
export interface MenuBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Top-level words, in order. */
  items: MenuBarItemSpec[]
  /** Layout direction. Menu bars are horizontal; vertical exists for side panes. */
  orientation?: 'horizontal' | 'vertical'
  /** Called with the open item's id, or undefined when everything closed. */
  onOpenChange?: (openId: string | undefined) => void
}

/** A strip of top-level words, each opening a {@link Menu} — `role="menubar"`.
 *
 *  One documented departure from the VGUI original: the resting word colour is
 *  `--vgui-text-strong` rather than `TitleDimText` (`#889180`), which is only
 *  2.31:1 on a `GreenBG` panel. The state ladder is therefore two steps,
 *  white → maize, instead of dim → white → maize.
 */
export const MenuBar = forwardRef<HTMLDivElement, MenuBarProps>(function MenuBar(
  { items, orientation = 'horizontal', onOpenChange, className, ...rest },
  ref,
) {
  const baseId = useId()
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  // Set by the capture handler, so the Tab-close path does not pull focus back.
  const isTabKey = useRef(false)

  const [openId, setOpenId] = useState<string | undefined>(undefined)
  const [activeIndex, setActiveIndex] = useState(0)

  const horizontal = orientation !== 'vertical'
  const openKey = horizontal ? 'ArrowDown' : 'ArrowRight'
  const moveKeys = horizontal ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown']

  const firstEnabled = items.findIndex((item) => !item.disabled)
  const current =
    items[activeIndex] && !items[activeIndex].disabled ? activeIndex : firstEnabled
  const openIndex = items.findIndex((item) => item.id === openId)

  const openWord = (index: number) => {
    const spec = items[index]

    if (!spec || spec.disabled) return

    setActiveIndex(index)

    // A word with no rows cannot open; moving onto it closes what was open.
    if (spec.items.length === 0) {
      setOpenId(undefined)
      onOpenChange?.(undefined)
      return
    }

    setOpenId(spec.id)
    onOpenChange?.(spec.id)
  }

  const closeMenu = (index: number) => {
    setOpenId(undefined)
    onOpenChange?.(undefined)

    // Escape and activation hand focus back to the word the menu hung off.
    // Tab must not: the user asked to leave.
    if (!isTabKey.current) itemRefs.current[index]?.focus()
  }

  const moveWord = (delta: number) => {
    const enabled = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.disabled)

    if (enabled.length === 0) return

    const position = enabled.findIndex(({ index }) => index === current)
    const next = enabled[(position === -1 ? 0 : position + delta + enabled.length) % enabled.length]

    setActiveIndex(next.index)
    itemRefs.current[next.index]?.focus()

    // Menu switching: while a menu is open, arrowing to a sibling opens its menu.
    if (openId !== undefined) openWord(next.index)
  }

  const onKeyDownCapture = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    isTabKey.current = event.key === 'Tab'
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const { key } = event
    const index = openIndex === -1 ? current : openIndex

    if (key === openKey) {
      // While a menu is open the Menu itself consumes Up/Down, so nothing here.
      if (openId === undefined) openWord(index)
      else return
    } else if (moveKeys.includes(key)) {
      moveWord(key === moveKeys[0] ? -1 : 1)
    } else if (key === 'Escape') {
      if (openId === undefined) return
      closeMenu(index)
    } else if ((key === 'Enter' || key === ' ') && openId === undefined) {
      openWord(index)
    } else {
      return
    }

    event.preventDefault()
  }

  return (
    <div
      {...rest}
      ref={ref}
      role="menubar"
      aria-orientation={orientation}
      className={[
        'vgui-menubar',
        // The spec names the root `.vgui-menubar`; the library's kebab-case
        // convention would make it `.vgui-menu-bar`. Both are applied.
        'vgui-menu-bar',
        horizontal ? null : 'vgui-menubar--vertical',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onKeyDownCapture={onKeyDownCapture}
      onKeyDown={onKeyDown}
    >
      {items.map((spec, index) => {
        const isOpen = openId === spec.id
        const wordId = `${baseId}-menubar-item-${spec.id}`
        const menuId = `${baseId}-menu-${spec.id}`

        return (
          <div key={spec.id} className="vgui-menubar__group">
            <button
              id={wordId}
              ref={(node) => {
                itemRefs.current[index] = node
              }}
              type="button"
              role="menuitem"
              className="vgui-menubar__item"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-controls={menuId}
              accessKey={spec.accessKey}
              disabled={spec.disabled}
              tabIndex={current === index ? 0 : -1}
              onFocus={() => setActiveIndex(index)}
              onClick={() => {
                if (isOpen) closeMenu(index)
                else openWord(index)
              }}
              onMouseEnter={() => {
                // "Menu switching": a menu already open follows the pointer.
                if (openId !== undefined && !isOpen) openWord(index)
              }}
            >
              {spec.label}
            </button>
            {isOpen ? (
              <Menu
                id={menuId}
                className="vgui-menubar__menu"
                items={spec.items}
                labelledBy={wordId}
                orientation={horizontal ? 'auto' : 'vertical'}
                onClose={() => closeMenu(index)}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
})

MenuBar.displayName = 'MenuBar'
