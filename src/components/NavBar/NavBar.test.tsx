import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { MenuItem } from '../Menu/Menu'
import { NavBar } from './NavBar'
import type { NavBarItem } from './NavBar'

const noop = () => undefined

const items: NavBarItem[] = [
  {
    id: 'store',
    label: 'Store',
    menu: (
      <>
        <MenuItem label="Browse" onSelect={noop} />
        <MenuItem label="Wishlist" onSelect={noop} />
        <MenuItem label="Recommendations" onSelect={noop} />
      </>
    ),
  },
  { id: 'library', label: 'Library', active: true },
  { id: 'community', label: 'Community', menu: <MenuItem label="Discussions" onSelect={noop} /> },
  { id: 'account', label: 'My account', disabled: true },
]

const trigger = (name: string) => screen.getByRole('button', { name })

describe('NavBar', () => {
  it('renders a labelled nav landmark with both scoped class names, threading className and ref', () => {
    const ref = createRef<HTMLElement>()

    render(<NavBar ref={ref} items={items} className="extra" />)

    const nav = screen.getByRole('navigation')

    expect(nav).toHaveClass('vgui-navbar', 'vgui-nav-bar', 'extra')
    expect(nav).toHaveAttribute('aria-label', 'Main')
    expect(nav.querySelector('ul')).toHaveClass('vgui-navbar__list', 'vgui-nav-bar__list')
    expect(ref.current).toBe(nav)
  })

  it('takes the landmark label from the label prop', () => {
    render(<NavBar items={items} label="Primary" />)

    expect(screen.getByRole('navigation')).toHaveAccessibleName('Primary')
  })

  it('renders a menu button for items with a dropdown and marks it up for assistive technology', () => {
    render(<NavBar items={items} />)

    const store = trigger('Store')

    expect(store).toHaveAttribute('aria-haspopup', 'menu')
    expect(store).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('renders a real link for an item with href and reports activation', async () => {
    const user = userEvent.setup()
    const onItemClick = vi.fn()

    render(
      <NavBar
        items={[
          { id: 'store', label: 'Store', href: '#store' },
          { id: 'library', label: 'Library', href: '#library', active: true },
        ]}
        onItemClick={onItemClick}
      />,
    )

    const store = screen.getByRole('link', { name: 'Store' })

    expect(store).toHaveAttribute('href', '#store')
    expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    await user.click(store)

    expect(onItemClick).toHaveBeenCalledWith('store')
  })

  it('renders a plain button for an item with neither menu nor href', async () => {
    const user = userEvent.setup()
    const onItemClick = vi.fn()

    render(<NavBar items={[{ id: 'library', label: 'Library' }]} onItemClick={onItemClick} />)

    await user.click(trigger('Library'))

    expect(onItemClick).toHaveBeenCalledWith('library')
  })

  it('marks the active item dimmer, with aria-current and an underline', () => {
    render(<NavBar items={items} />)

    const libraryItem = trigger('Library').closest('li')

    expect(libraryItem).toHaveClass('vgui-navbar__item--active', 'vgui-nav-bar__item--active')
    expect(trigger('Library')).toHaveAttribute('aria-current', 'page')
    expect(trigger('Store')).not.toHaveAttribute('aria-current')
  })

  it('opens the dropdown on click and links it to the button', async () => {
    const user = userEvent.setup()
    const onItemClick = vi.fn()

    render(<NavBar items={items} onItemClick={onItemClick} />)

    const store = trigger('Store')

    await user.click(store)

    const menu = screen.getByRole('menu')

    expect(store).toHaveAttribute('aria-expanded', 'true')
    expect(store).toHaveAttribute('aria-controls', menu.id)
    expect(menu).toHaveAttribute('aria-labelledby', store.id)
    expect(menu).toHaveClass('vgui-navbar__dropdown', 'vgui-nav-bar__dropdown', 'vgui-menu')
    expect(screen.getByRole('menuitem', { name: 'Browse' })).toHaveFocus()
    expect(onItemClick).toHaveBeenCalledWith('store')

    await user.click(store)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(store).toHaveAttribute('aria-expanded', 'false')
    expect(onItemClick).toHaveBeenCalledTimes(1)
  })

  it('opens with Arrow Down onto the first row and with Arrow Up onto the last', async () => {
    const user = userEvent.setup()

    render(<NavBar items={items} />)

    trigger('Store').focus()
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('menuitem', { name: 'Browse' })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.keyboard('{ArrowUp}')

    expect(screen.getByRole('menuitem', { name: 'Recommendations' })).toHaveFocus()
  })

  it('walks the dropdown with Arrow Up/Down, wrapping, plus Home and End', async () => {
    const user = userEvent.setup()

    render(<NavBar items={items} />)

    trigger('Store').focus()
    await user.keyboard('{ArrowDown}')

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Wishlist' })).toHaveFocus()

    await user.keyboard('{End}')
    expect(screen.getByRole('menuitem', { name: 'Recommendations' })).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Browse' })).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Recommendations' })).toHaveFocus()

    await user.keyboard('{Home}')
    expect(screen.getByRole('menuitem', { name: 'Browse' })).toHaveFocus()
  })

  it('closes on Escape and hands focus back to the button', async () => {
    const user = userEvent.setup()

    render(<NavBar items={items} />)

    trigger('Store').focus()
    await user.keyboard('{ArrowDown}')

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger('Store')).toHaveAttribute('aria-expanded', 'false')
    expect(trigger('Store')).toHaveFocus()
  })

  it('closes when Tab leaves the dropdown without trapping focus', async () => {
    const user = userEvent.setup()

    render(<NavBar items={items} />)

    trigger('Store').focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.tab()

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('moves between top-level items with Arrow Left/Right, wrapping and skipping disabled ones', async () => {
    const user = userEvent.setup()

    render(<NavBar items={items} />)

    trigger('Store').focus()

    await user.keyboard('{ArrowRight}')
    expect(trigger('Library')).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(trigger('Community')).toHaveFocus()

    // My account is disabled, so the strip wraps back to Store.
    await user.keyboard('{ArrowRight}')
    expect(trigger('Store')).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    expect(trigger('Community')).toHaveFocus()
  })

  it('switches dropdowns with Arrow Right while one is open', async () => {
    const user = userEvent.setup()

    render(<NavBar items={items} />)

    trigger('Store').focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Browse' })).toHaveFocus()

    // Library has no dropdown, so the open one closes and focus lands on it.
    await user.keyboard('{ArrowRight}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger('Library')).toHaveFocus()

    // Nothing opens from an item that has no dropdown.
    await user.keyboard('{ArrowDown}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.keyboard('{ArrowRight}')
    expect(trigger('Community')).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Discussions' })).toHaveFocus()
    expect(trigger('Community')).toHaveAttribute('aria-expanded', 'true')

    // Arrowing on from inside a dropdown wraps to the next one that has a menu.
    await user.keyboard('{ArrowRight}')

    expect(trigger('Community')).toHaveAttribute('aria-expanded', 'false')
    expect(trigger('Store')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitem', { name: 'Browse' })).toHaveFocus()
    expect(screen.getAllByRole('menu')).toHaveLength(1)

    // And back again.
    await user.keyboard('{ArrowLeft}')

    expect(trigger('Store')).toHaveAttribute('aria-expanded', 'false')
    expect(trigger('Community')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitem', { name: 'Discussions' })).toHaveFocus()
  })

  it('makes arbitrary dropdown markup take focus', async () => {
    const user = userEvent.setup()

    render(
      <NavBar
        items={[
          {
            id: 'store',
            label: 'Store',
            menu: (
              <div className="vgui-menu__item" role="menuitem">
                Browse
              </div>
            ),
          },
        ]}
      />,
    )

    trigger('Store').focus()
    await user.keyboard('{ArrowDown}')

    const browse = screen.getByRole('menuitem', { name: 'Browse' })

    expect(browse).toHaveAttribute('tabindex', '-1')
    expect(browse).toHaveFocus()
  })

  it('does not activate or focus a disabled item', async () => {
    const user = userEvent.setup()
    const onItemClick = vi.fn()

    render(<NavBar items={items} onItemClick={onItemClick} />)

    expect(trigger('My account')).toBeDisabled()

    await user.click(trigger('My account'))

    expect(onItemClick).not.toHaveBeenCalled()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('does not activate a disabled link', async () => {
    const user = userEvent.setup()
    const onItemClick = vi.fn()

    render(
      <NavBar
        items={[{ id: 'support', label: 'Support', href: '#support', disabled: true }]}
        onItemClick={onItemClick}
      />,
    )

    // A disabled link drops its href, so it is no longer in the link role.
    const support = screen.getByText('Support')

    expect(support).toHaveAttribute('aria-disabled', 'true')
    expect(support).toHaveAttribute('tabindex', '-1')

    await user.click(support)

    expect(onItemClick).not.toHaveBeenCalled()
  })

  it('renders decorative dividers between items when asked', () => {
    const { container } = render(<NavBar items={items} dividers />)

    const dividers = container.querySelectorAll('.vgui-navbar__divider')

    expect(dividers).toHaveLength(items.length - 1)
    expect(dividers[0]).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <NavBar
        items={[...items.slice(0, 3), { id: 'support', label: 'Support', href: '#support', disabled: true }]}
        dividers
      />,
    )

    expect(screen.getByRole('navigation')).toBeInTheDocument()
    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
