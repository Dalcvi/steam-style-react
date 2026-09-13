import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  Ref,
} from 'react'

import './Menu.css'

/** One row in a {@link Menu}. Separators and labels are entries in the same array. */
export interface MenuItemSpec {
  /** Stable identity and React key. */
  id: string
  /** Visible label. */
  label: string
  /** Invoked on activation. Omit to render a non-interactive row. */
  onSelect?: () => void
  /** Renders as a disabled row. */
  disabled?: boolean
  /** Renders as `menuitemcheckbox` with a tick in the gutter. */
  checked?: boolean
  /** Renders an arrow and opens a nested Menu. */
  items?: MenuItemSpec[]
  /** Renders a group label instead of an action row. */
  type?: 'item' | 'label' | 'separator'
}

/** Props of {@link Menu}. */
export interface MenuProps extends HTMLAttributes<HTMLDivElement> {
  /** Rows, in order. Separators and labels are entries in the same array. */
  items: MenuItemSpec[]
  /** id of the element the menu is anchored to; becomes `aria-labelledby`. */
  labelledBy?: string
  /** Called when the menu should close. */
  onClose?: () => void
  /** Keyboard behaviour. Defaults to `'auto'`: reaches for a MenuBar ancestor. */
  orientation?: 'auto' | 'vertical'
}

/** Props of {@link MenuItem}. */
export interface MenuItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'> {
  /** Visible row text. */
  label: ReactNode
  /** Renders as `menuitemcheckbox` and puts a tick in the gutter. */
  checked?: boolean
  /** Renders the right-aligned arrow and `aria-haspopup="menu"`. */
  hasSubmenu?: boolean
  /** Invoked on activation, before the menu closes. */
  onSelect?: () => void
}

/** One row of a menu. Always a real `<button>` so activation, `disabled` and the focus ring come for free. */
export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(function MenuItem(
  { label, checked, hasSubmenu, onSelect, onClick, className, disabled, ...rest },
  ref,
) {
  const checkable = checked !== undefined

  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      role={checkable ? 'menuitemcheckbox' : 'menuitem'}
      aria-checked={checkable ? checked : undefined}
      aria-haspopup={hasSubmenu ? 'menu' : undefined}
      aria-expanded={hasSubmenu ? rest['aria-expanded'] : undefined}
      disabled={disabled}
      tabIndex={rest.tabIndex ?? -1}
      className={[
        'vgui-menu__item',
        hasSubmenu ? 'vgui-menu__item--has-submenu' : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || disabled) return
        onSelect?.()
      }}
    >
      <span className="vgui-menu__gutter" aria-hidden={checkable ? true : undefined}>
        {checkable && checked ? '✓' : null}
      </span>
      <span className="vgui-menu__text">{label}</span>
      {hasSubmenu ? <span className="vgui-menu__arrow" aria-hidden="true" /> : null}
    </button>
  )
})

MenuItem.displayName = 'MenuItem'

/** How long the pointer may leave a submenu parent before the submenu closes. */
const SUBMENU_CLOSE_DELAY = 150

/** How long a typeahead buffer survives between keystrokes. */
const TYPEAHEAD_TIMEOUT = 500

const isAction = (spec: MenuItemSpec | undefined): spec is MenuItemSpec =>
  spec !== undefined && (spec.type ?? 'item') === 'item'

const isFocusable = (spec: MenuItemSpec) => isAction(spec) && !spec.disabled

interface MenuLevelProps extends HTMLAttributes<HTMLDivElement> {
  items: MenuItemSpec[]
  labelledBy?: string
  onClose?: () => void
  orientation?: 'auto' | 'vertical'
  isSubmenu?: boolean
  forwardedRef?: Ref<HTMLDivElement>
}

function MenuLevel({
  items,
  labelledBy,
  onClose,
  orientation = 'auto',
  isSubmenu = false,
  forwardedRef,
  ...rest
}: MenuLevelProps) {
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typeahead = useRef({ text: '', at: 0 })
  const baseId = useId()

  const focusable = items
    .map((spec, index) => ({ spec, index }))
    .filter(({ spec }) => isFocusable(spec))

  const [activeIndex, setActiveIndex] = useState(() => focusable[0]?.index ?? -1)
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null)

  // A menu is a composite widget: opening it moves focus into it.
  const firstIndex = focusable[0]?.index ?? -1
  useEffect(() => {
    if (firstIndex !== -1) itemRefs.current[firstIndex]?.focus()
  }, [firstIndex])

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    },
    [],
  )

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const focusItem = (index: number) => {
    setActiveIndex(index)
    itemRefs.current[index]?.focus()
  }

  const move = (delta: number) => {
    if (focusable.length === 0) return
    const position = focusable.findIndex(({ index }) => index === activeIndex)
    const next =
      position === -1
        ? delta > 0
          ? 0
          : focusable.length - 1
        : (position + delta + focusable.length) % focusable.length
    focusItem(focusable[next].index)
  }

  const jump = (position: number) => {
    const target = focusable[position]
    if (target) focusItem(target.index)
  }

  const typeaheadMove = (key: string) => {
    const now = Date.now()
    const state = typeahead.current
    state.text = now - state.at > TYPEAHEAD_TIMEOUT ? key.toLowerCase() : state.text + key.toLowerCase()
    state.at = now

    const position = focusable.findIndex(({ index }) => index === activeIndex)
    const ordered = [...focusable.slice(position + 1), ...focusable.slice(0, position + 1)]
    let match = ordered.find(({ spec }) => spec.label.toLowerCase().startsWith(state.text))

    if (!match && state.text.length > 1) {
      state.text = key.toLowerCase()
      match = ordered.find(({ spec }) => spec.label.toLowerCase().startsWith(state.text))
    }

    if (match) focusItem(match.index)
  }

  const closeSubmenu = (index: number) => {
    cancelClose()
    setOpenSubmenuId(null)
    itemRefs.current[index]?.focus()
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const { key } = event

    if (key === 'Tab') {
      // Tab closes the menu without trapping focus.
      onClose?.()
      return
    }

    if (key === 'Enter' || key === ' ') {
      // The row is a real <button>, so activation is native. Claim the event
      // first so an ancestor menu bar does not also act on it.
      event.stopPropagation()
      return
    }

    switch (key) {
      case 'ArrowDown':
        move(1)
        break
      case 'ArrowUp':
        move(-1)
        break
      case 'Home':
        jump(0)
        break
      case 'End':
        jump(focusable.length - 1)
        break
      case 'Escape':
        onClose?.()
        break
      case 'ArrowRight': {
        const spec = items[activeIndex]
        if (spec?.items?.length) {
          setOpenSubmenuId(spec.id)
          break
        }
        // No submenu here: a MenuBar ancestor claims Right.
        return
      }
      case 'ArrowLeft': {
        if (isSubmenu) {
          onClose?.()
          break
        }
        // `orientation="auto"` hands Left/Right to the MenuBar ancestor.
        return
      }
      default:
        if (key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return
        typeaheadMove(key)
    }

    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div
      {...rest}
      ref={forwardedRef}
      role="menu"
      aria-labelledby={labelledBy}
      aria-orientation="vertical"
      className={['vgui-menu', isSubmenu ? 'vgui-menu--submenu' : null, rest.className]
        .filter(Boolean)
        .join(' ')}
      onKeyDown={onKeyDown}
      data-orientation={orientation}
    >
      {items.map((spec, index) => {
        const type = spec.type ?? 'item'

        if (type === 'separator') {
          return <div key={spec.id} className="vgui-menu__separator" role="separator" />
        }

        if (type === 'label') {
          return (
            <div key={spec.id} className="vgui-menu__label" role="presentation">
              {spec.label}
            </div>
          )
        }

        const submenuItems = spec.items ?? []
        const hasSubmenu = submenuItems.length > 0
        const rowId = `${baseId}-item-${spec.id}`

        const row = (
          <MenuItem
            key={hasSubmenu ? undefined : spec.id}
            id={rowId}
            ref={(node) => {
              itemRefs.current[index] = node
            }}
            label={spec.label}
            checked={spec.checked}
            hasSubmenu={hasSubmenu}
            aria-expanded={hasSubmenu ? openSubmenuId === spec.id : undefined}
            aria-controls={hasSubmenu ? `${baseId}-submenu-${spec.id}` : undefined}
            disabled={spec.disabled || (!hasSubmenu && !spec.onSelect)}
            tabIndex={activeIndex === index ? 0 : -1}
            onClick={
              hasSubmenu
                ? () => {
                    cancelClose()
                    setOpenSubmenuId(spec.id)
                  }
                : undefined
            }
            onSelect={() => {
              if (hasSubmenu) return
              spec.onSelect?.()
              onClose?.()
            }}
          />
        )

        if (!hasSubmenu) return row

        return (
          <div
            key={spec.id}
            className="vgui-menu__row"
            onMouseEnter={() => {
              cancelClose()
              setOpenSubmenuId(spec.id)
            }}
            onMouseLeave={() => {
              cancelClose()
              closeTimer.current = setTimeout(() => setOpenSubmenuId(null), SUBMENU_CLOSE_DELAY)
            }}
          >
            {row}
            {openSubmenuId === spec.id ? (
              <MenuLevel
                id={`${baseId}-submenu-${spec.id}`}
                items={submenuItems}
                labelledBy={rowId}
                isSubmenu
                orientation={orientation}
                onClose={() => closeSubmenu(index)}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

/** The dropdown panel: a flat-outlined list of {@link MenuItem} rows. */
export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(
  { items, labelledBy, onClose, orientation = 'auto', ...rest },
  ref,
) {
  return (
    <MenuLevel
      {...rest}
      items={items}
      labelledBy={labelledBy}
      onClose={onClose}
      orientation={orientation}
      forwardedRef={ref}
    />
  )
})

Menu.displayName = 'Menu'
