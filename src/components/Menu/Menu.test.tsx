import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Menu } from './Menu'
import type { MenuItemSpec } from './Menu'

const buildItems = (overrides: Partial<Record<string, Partial<MenuItemSpec>>> = {}) => {
  const base: MenuItemSpec[] = [
    { id: 'cut', label: 'Cut', onSelect: () => undefined },
    { id: 'copy', label: 'Copy', disabled: true },
    { id: 'paste', label: 'Paste', onSelect: () => undefined },
    { id: 'sep', label: '', type: 'separator' },
    { id: 'delete', label: 'Delete', onSelect: () => undefined },
  ]

  return base.map((item) => ({ ...item, ...(overrides[item.id] ?? {}) }))
}

const item = (name: string) => screen.getByRole('menuitem', { name })
const checkbox = (name: string) => screen.getByRole('menuitemcheckbox', { name })

describe('Menu', () => {
  it('renders a menu scoped to vgui-menu and threads className and ref', () => {
    const ref = createRef<HTMLDivElement>()

    render(<Menu ref={ref} aria-label="Edit" className="extra" items={buildItems()} />)

    const menu = screen.getByRole('menu', { name: 'Edit' })

    expect(menu).toHaveClass('vgui-menu', 'extra')
    expect(ref.current).toBe(menu)
  })

  it('names the menu from labelledBy', () => {
    render(
      <>
        <span id="trigger">Edit</span>
        <Menu labelledBy="trigger" items={buildItems()} />
      </>,
    )

    expect(screen.getByRole('menu', { name: 'Edit' })).toHaveAttribute('aria-labelledby', 'trigger')
  })

  it('maps item specs to the documented roles', () => {
    render(
      <Menu
        aria-label="Edit"
        items={[
          { id: 'cut', label: 'Cut', onSelect: () => undefined },
          { id: 'labels', label: 'Labels', type: 'label' },
          { id: 'sep', label: '', type: 'separator' },
          { id: 'grid', label: 'Show Grid', checked: true, onSelect: () => undefined },
        ]}
      />,
    )

    expect(screen.getAllByRole('menuitem')).toHaveLength(1)
    expect(screen.getByRole('separator')).toHaveClass('vgui-menu__separator')
    expect(screen.getByText('Labels')).toHaveClass('vgui-menu__label')
    expect(checkbox('Show Grid')).toHaveAttribute('aria-checked', 'true')
  })

  it('exposes the checked state of a checkable row', () => {
    render(
      <Menu
        aria-label="View"
        items={[{ id: 'grid', label: 'Show Grid', checked: false, onSelect: () => undefined }]}
      />,
    )

    expect(checkbox('Show Grid')).toHaveAttribute('aria-checked', 'false')
  })

  it('focuses the first enabled row on mount and keeps one tab stop', () => {
    render(<Menu aria-label="Edit" items={buildItems()} />)

    const rows = screen.getAllByRole('menuitem')

    expect(item('Cut')).toHaveFocus()
    expect(rows.filter((row) => row.getAttribute('tabindex') === '0')).toHaveLength(1)
    expect(item('Cut')).toHaveAttribute('tabindex', '0')
  })

  it('walks rows with Arrow Down/Up, wrapping and skipping separators and disabled rows', async () => {
    const user = userEvent.setup()

    render(<Menu aria-label="Edit" items={buildItems()} />)

    await user.keyboard('{ArrowDown}')
    expect(item('Paste')).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(item('Delete')).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(item('Cut')).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(item('Delete')).toHaveFocus()
  })

  it('jumps to the first and last row with Home and End', async () => {
    const user = userEvent.setup()

    render(<Menu aria-label="Edit" items={buildItems()} />)

    await user.keyboard('{End}')
    expect(item('Delete')).toHaveFocus()

    await user.keyboard('{Home}')
    expect(item('Cut')).toHaveFocus()
  })

  it('moves focus by typeahead and wraps around', async () => {
    const user = userEvent.setup()

    render(<Menu aria-label="Edit" items={buildItems()} />)

    await user.keyboard('p')
    expect(item('Paste')).toHaveFocus()

    await user.keyboard('d')
    expect(item('Delete')).toHaveFocus()

    await user.keyboard('c')
    expect(item('Cut')).toHaveFocus()
  })

  it('closes on Escape without selecting', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSelect = vi.fn()

    render(<Menu aria-label="Edit" items={buildItems({ cut: { onSelect } })} onClose={onClose} />)

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('closes on Tab without trapping focus', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<Menu aria-label="Edit" items={buildItems()} onClose={onClose} />)

    await user.tab()

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(item('Cut')).not.toHaveFocus()
  })

  it('selects a row on click and then closes', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onClose = vi.fn()

    render(<Menu aria-label="Edit" items={buildItems({ paste: { onSelect } })} onClose={onClose} />)

    await user.click(item('Paste'))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('selects a row with Enter and Space', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onClose = vi.fn()

    render(<Menu aria-label="Edit" items={buildItems({ cut: { onSelect } })} onClose={onClose} />)

    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledTimes(1)

    await user.keyboard(' ')
    expect(onSelect).toHaveBeenCalledTimes(2)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('renders a disabled row as a disabled, unactivatable menuitem', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<Menu aria-label="Edit" items={buildItems({ copy: { onSelect } })} />)

    expect(item('Copy')).toBeDisabled()

    await user.click(item('Copy'))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('opens a submenu with Arrow Right and returns focus with Arrow Left', async () => {
    const user = userEvent.setup()

    render(
      <Menu
        aria-label="File"
        items={[
          { id: 'new', label: 'New', onSelect: () => undefined },
          {
            id: 'export',
            label: 'Export',
            items: [
              { id: 'mesh', label: 'Mesh', onSelect: () => undefined },
              { id: 'map', label: 'Map', onSelect: () => undefined },
            ],
          },
        ]}
      />,
    )

    const parent = item('Export')

    expect(parent).toHaveAttribute('aria-haspopup', 'menu')
    expect(parent).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getAllByRole('menu')).toHaveLength(1)

    await user.keyboard('{ArrowDown}')
    expect(parent).toHaveFocus()

    await user.keyboard('{ArrowRight}')

    const submenu = screen.getAllByRole('menu')[1]

    expect(screen.getAllByRole('menu')).toHaveLength(2)
    expect(parent).toHaveAttribute('aria-expanded', 'true')
    expect(parent).toHaveAttribute('aria-controls', submenu.id)
    expect(submenu).toHaveAttribute('aria-labelledby', parent.id)
    expect(item('Mesh')).toHaveFocus()

    await user.keyboard('{ArrowLeft}')

    expect(screen.getAllByRole('menu')).toHaveLength(1)
    expect(parent).toHaveAttribute('aria-expanded', 'false')
    expect(parent).toHaveFocus()
  })

  it('lets Arrow Left bubble when nothing is nested, so a menu bar can claim it', async () => {
    const user = userEvent.setup()
    const onBarKeyDown = vi.fn()

    render(
      <div onKeyDown={onBarKeyDown}>
        <Menu aria-label="Edit" items={buildItems()} orientation="auto" />
      </div>,
    )

    await user.keyboard('{ArrowLeft}')

    expect(onBarKeyDown).toHaveBeenCalledTimes(1)
    expect(onBarKeyDown.mock.calls[0][0].key).toBe('ArrowLeft')
  })

  it('records the orientation it was given', () => {
    render(<Menu aria-label="Edit" items={buildItems()} orientation="vertical" />)

    expect(screen.getByRole('menu')).toHaveAttribute('data-orientation', 'vertical')
  })

  it('survives an empty item list', async () => {
    const user = userEvent.setup()

    render(<Menu aria-label="Edit" items={[]} />)

    await user.keyboard('{ArrowDown}{Esc}{Home}')

    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Menu
        aria-label="Edit"
        onClose={() => undefined}
        items={[
          { id: 'cut', label: 'Cut', onSelect: () => undefined },
          { id: 'copy', label: 'Copy', disabled: true },
          { id: 'grid', label: 'Show Grid', checked: true, onSelect: () => undefined },
          { id: 'sep', label: '', type: 'separator' },
          { id: 'export', label: 'Export', items: [{ id: 'mesh', label: 'Mesh', onSelect: () => undefined }] },
        ]}
      />,
    )

    expect(screen.getByRole('menu')).toBeInTheDocument()
    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
