import { Fragment, forwardRef, useEffect, useId, useRef, useState } from 'react'
import type { HTMLAttributes, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'

import './NavBar.css'

/** One top-level item in a {@link NavBar}. */
export interface NavBarItem {
  /** Stable identity; also the React key. */
  id: string
  /** Label text, rendered uppercase by CSS. */
  label: string
  /** Renders the dimmed active state. */
  active?: boolean
  /** Dropdown content; omit for a plain link with no menu. */
  menu?: ReactNode
  /** Href when the item navigates rather than opening a menu. */
  href?: string
  /** Renders disabled and unclickable. */
  disabled?: boolean
}

/** Props of {@link NavBar}. */
export interface NavBarProps extends HTMLAttributes<HTMLElement> {
  /** Items in display order. */
  items: NavBarItem[]
  /** Called with the item's id when it is activated. */
  onItemClick?: (id: string) => void
  /** Accessible name for the nav landmark. */
  label?: string
  /** Renders a 1px SuperNavMenuDivider between items. */
  dividers?: boolean
}

/** Everything a dropdown row can be. The dropdown is filled with arbitrary
 *  nodes, so its keyboard model works off this role set rather than props. */
const ROW_SELECTOR = '[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]'

/** The client's primary application navigation: a strip of large uppercase
 *  labels, each optionally opening a flat-outlined dropdown menu.
 *
 *  Three documented departures from the VGUI original, all accessibility fixes:
 *  the active item carries `aria-current` and an underline as well as its
 *  (dimmer) colour; the dropdown's empty `:selected {}` block is replaced by the
 *  maize highlight; and maize surfaces take dark text instead of the inherited
 *  white, which is only 3.70:1.
 */
export const NavBar = forwardRef<HTMLElement, NavBarProps>(function NavBar(
  { items, onItemClick, label = 'Main', dividers = false, className, ...rest },
  ref,
) {
  const baseId = useId()
  const triggers = useRef<Record<string, HTMLElement | null>>({})
  const panels = useRef<Record<string, HTMLDivElement | null>>({})
  /** Row to focus once a freshly opened dropdown has mounted; -1 means last. */
  const focusOnOpen = useRef(0)

  const [openId, setOpenId] = useState<string | null>(null)

  const triggerId = (id: string) => `${baseId}-navbar-trigger-${id}`
  const panelId = (id: string) => `${baseId}-navbar-menu-${id}`

  const rows = (id: string) => {
    const panel = panels.current[id]
    if (!panel) return []
    return Array.from(panel.querySelectorAll<HTMLElement>(ROW_SELECTOR)).filter(
      (row) => !row.hasAttribute('disabled') && row.getAttribute('aria-disabled') !== 'true',
    )
  }

  const focusRow = (id: string, position: number) => {
    const list = rows(id)
    if (list.length === 0) return

    const row = list[position < 0 ? list.length - 1 : position % list.length]
    // `menu` is arbitrary markup, so a plain element may need the attribute.
    if (!row.hasAttribute('tabindex')) row.setAttribute('tabindex', '-1')
    row.focus()
  }

  const openMenu = (id: string, position = 0) => {
    focusOnOpen.current = position
    setOpenId(id)
    onItemClick?.(id)
  }

  const closeMenu = (id: string, restoreFocus: boolean) => {
    setOpenId(null)
    if (restoreFocus) triggers.current[id]?.focus()
  }

  useEffect(() => {
    if (openId === null) return
    focusRow(openId, focusOnOpen.current)
  }, [openId])

  const enabled = items.filter((item) => !item.disabled)

  const moveTopLevel = (fromId: string, delta: number) => {
    if (enabled.length === 0) return

    const position = enabled.findIndex((item) => item.id === fromId)
    const next = enabled[(position + delta + enabled.length) % enabled.length]
    if (!next) return

    // Menu switching: with a dropdown open, arrowing to a sibling opens its own.
    if (openId !== null && next.menu !== undefined) {
      openMenu(next.id)
      return
    }

    setOpenId(null)
    triggers.current[next.id]?.focus()
  }

  const onListKeyDown = (event: ReactKeyboardEvent<HTMLUListElement>) => {
    const { key } = event
    const focused = document.activeElement as HTMLElement | null
    const owner = items.find((item) => {
      const trigger = triggers.current[item.id]
      const panel = panels.current[item.id]
      return (
        (trigger !== null && trigger !== undefined && trigger.contains(focused)) ||
        (panel !== null && panel !== undefined && panel.contains(focused))
      )
    })

    if (!owner) return

    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      moveTopLevel(owner.id, key === 'ArrowLeft' ? -1 : 1)
    } else if ((key === 'ArrowDown' || key === 'ArrowUp') && owner.menu !== undefined) {
      const position = key === 'ArrowDown' ? 0 : -1
      if (openId === owner.id) focusRow(owner.id, position)
      else openMenu(owner.id, position)
    } else {
      // Enter, Space and Tab belong to the focused control.
      return
    }

    event.preventDefault()
  }

  const onPanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>, item: NavBarItem) => {
    const { key } = event

    if (key === 'Tab') {
      // Tab closes the dropdown without trapping focus.
      setOpenId(null)
      return
    }

    const list = rows(item.id)
    if (list.length === 0) return

    const position = list.indexOf(document.activeElement as HTMLElement)

    switch (key) {
      case 'ArrowDown':
        focusRow(item.id, position + 1)
        break
      case 'ArrowUp':
        focusRow(item.id, position - 1)
        break
      case 'Home':
        focusRow(item.id, 0)
        break
      case 'End':
        focusRow(item.id, -1)
        break
      case 'Escape':
        // Escape hands focus back to the button that opened the dropdown.
        closeMenu(item.id, true)
        break
      default:
        // Arrow Left/Right are the strip's, and bubbles up to it.
        return
    }

    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <nav
      {...rest}
      ref={ref}
      aria-label={label}
      className={[
        'vgui-navbar',
        // The spec names the root `.vgui-navbar`; the library's kebab-case
        // convention would make it `.vgui-nav-bar`. Both are applied.
        'vgui-nav-bar',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ul className="vgui-navbar__list vgui-nav-bar__list" onKeyDown={onListKeyDown}>
        {items.map((item, index) => {
          const isOpen = openId === item.id
          const active = item.active === true

          return (
            <Fragment key={item.id}>
              {dividers && index > 0 ? (
                <li className="vgui-navbar__divider vgui-nav-bar__divider" aria-hidden="true" />
              ) : null}
              <li
                className={[
                  'vgui-navbar__item',
                  'vgui-nav-bar__item',
                  active ? 'vgui-navbar__item--active vgui-nav-bar__item--active' : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {item.href !== undefined && item.menu === undefined ? (
                  <a
                    id={triggerId(item.id)}
                    ref={(node) => {
                      triggers.current[item.id] = node
                    }}
                    className="vgui-navbar__button vgui-nav-bar__button"
                    href={item.disabled ? undefined : item.href}
                    aria-current={active ? 'page' : undefined}
                    aria-disabled={item.disabled ? true : undefined}
                    tabIndex={item.disabled ? -1 : undefined}
                    onClick={(event) => {
                      if (item.disabled) {
                        event.preventDefault()
                        return
                      }
                      onItemClick?.(item.id)
                    }}
                  >
                    {item.label}
                  </a>
                ) : (
                  <button
                    id={triggerId(item.id)}
                    ref={(node) => {
                      triggers.current[item.id] = node
                    }}
                    type="button"
                    className="vgui-navbar__button vgui-nav-bar__button"
                    aria-current={active ? 'page' : undefined}
                    aria-haspopup={item.menu !== undefined ? 'menu' : undefined}
                    aria-expanded={item.menu !== undefined ? isOpen : undefined}
                    aria-controls={item.menu !== undefined ? panelId(item.id) : undefined}
                    disabled={item.disabled}
                    onClick={() => {
                      if (item.menu === undefined) {
                        onItemClick?.(item.id)
                        return
                      }
                      if (isOpen) closeMenu(item.id, false)
                      else openMenu(item.id)
                    }}
                    onMouseEnter={() => {
                      // Menu switching: a dropdown already open follows the pointer.
                      if (openId !== null && !isOpen && item.menu !== undefined) openMenu(item.id)
                    }}
                  >
                    {item.label}
                  </button>
                )}
                {isOpen && item.menu !== undefined ? (
                  <div
                    id={panelId(item.id)}
                    ref={(node) => {
                      panels.current[item.id] = node
                    }}
                    role="menu"
                    aria-labelledby={triggerId(item.id)}
                    aria-orientation="vertical"
                    className="vgui-navbar__dropdown vgui-nav-bar__dropdown vgui-menu"
                    onKeyDown={(event) => onPanelKeyDown(event, item)}
                  >
                    {item.menu}
                  </div>
                ) : null}
              </li>
            </Fragment>
          )
        })}
      </ul>
    </nav>
  )
})

NavBar.displayName = 'NavBar'
