import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { MenuBar } from './MenuBar'
import type { MenuBarItemSpec } from './MenuBar'

const items: MenuBarItemSpec[] = [
  {
    id: 'file',
    label: 'File',
    accessKey: 'f',
    items: [
      { id: 'new', label: 'New', onSelect: () => undefined },
      { id: 'open', label: 'Open', onSelect: () => undefined },
    ],
  },
  { id: 'edit', label: 'Edit', items: [{ id: 'undo', label: 'Undo', onSelect: () => undefined }] },
  {
    id: 'view',
    label: 'View',
    items: [{ id: 'favourites', label: 'Favourites', checked: true, onSelect: () => undefined }],
  },
  { id: 'tools', label: 'Tools', items: [{ id: 'hammer', label: 'Hammer' }], disabled: true },
]

const word = (name: string) => screen.getByRole('menuitem', { name })

describe('MenuBar', () => {
  it('renders a menubar with the documented scoped classes, threading className and ref', () => {
    const ref = createRef<HTMLDivElement>()

    render(<MenuBar ref={ref} items={items} className="extra" />)

    const bar = screen.getByRole('menubar')

    expect(bar).toHaveClass('vgui-menubar', 'vgui-menu-bar', 'extra')
    expect(bar).toHaveAttribute('aria-orientation', 'horizontal')
    expect(ref.current).toBe(bar)
  })

  it('is a single tab stop with a roving tabindex', () => {
    render(<MenuBar items={items} />)

    const words = screen.getAllByRole('menuitem')

    expect(words).toHaveLength(4)
    expect(words.filter((node) => node.getAttribute('tabindex') === '0')).toHaveLength(1)
    expect(word('File')).toHaveAttribute('tabindex', '0')
    expect(word('Edit')).toHaveAttribute('tabindex', '-1')
    expect(word('Tools')).toHaveAttribute('tabindex', '-1')
  })

  it('moves between words with Arrow Left/Right, wrapping and skipping disabled words', async () => {
    const user = userEvent.setup()

    render(<MenuBar items={items} />)

    word('File').focus()

    await user.keyboard('{ArrowRight}')
    expect(word('Edit')).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(word('View')).toHaveFocus()

    // Tools is disabled, so View wraps to File.
    await user.keyboard('{ArrowRight}')
    expect(word('File')).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    expect(word('View')).toHaveFocus()

    expect(word('View')).toHaveAttribute('tabindex', '0')
    expect(word('File')).toHaveAttribute('tabindex', '-1')
  })

  it('opens the menu below the focused word with Arrow Down', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(<MenuBar items={items} onOpenChange={onOpenChange} />)

    word('File').focus()
    await user.keyboard('{ArrowDown}')

    const menu = screen.getByRole('menu')

    expect(word('File')).toHaveAttribute('aria-expanded', 'true')
    expect(word('File')).toHaveAttribute('aria-haspopup', 'menu')
    expect(word('File')).toHaveAttribute('aria-controls', menu.id)
    expect(menu).toHaveAttribute('aria-labelledby', word('File').id)
    expect(screen.getByRole('menuitem', { name: 'New' })).toHaveFocus()
    expect(onOpenChange).toHaveBeenLastCalledWith('file')
  })

  it('opens with Enter and toggles with a click', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(<MenuBar items={items} onOpenChange={onOpenChange} />)

    word('Edit').focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(word('Edit'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(onOpenChange).toHaveBeenLastCalledWith(undefined)

    await user.click(word('Edit'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(onOpenChange).toHaveBeenLastCalledWith('edit')
  })

  it('closes on Escape and hands focus back to the word', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(<MenuBar items={items} onOpenChange={onOpenChange} />)

    word('File').focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'New' })).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(word('File')).toHaveAttribute('aria-expanded', 'false')
    expect(word('File')).toHaveFocus()
    expect(onOpenChange).toHaveBeenLastCalledWith(undefined)
  })

  it('closes when Tab leaves the bar without dragging focus back', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(<MenuBar items={items} onOpenChange={onOpenChange} />)

    word('File').focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.tab()

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(onOpenChange).toHaveBeenLastCalledWith(undefined)
  })

  it('switches menus with Arrow Right while one is open', async () => {
    const user = userEvent.setup()

    render(<MenuBar items={items} />)

    word('File').focus()
    await user.keyboard('{ArrowDown}')

    await user.keyboard('{ArrowRight}')

    expect(screen.getAllByRole('menu')).toHaveLength(1)
    expect(word('File')).toHaveAttribute('aria-expanded', 'false')
    expect(word('Edit')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitem', { name: 'Undo' })).toHaveFocus()
  })

  it('switches menus when the pointer slides onto a sibling', async () => {
    const user = userEvent.setup()

    render(<MenuBar items={items} />)

    await user.click(word('File'))
    expect(word('File')).toHaveAttribute('aria-expanded', 'true')

    await user.hover(word('View'))

    expect(word('File')).toHaveAttribute('aria-expanded', 'false')
    expect(word('View')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitemcheckbox', { name: 'Favourites' })).toBeInTheDocument()
  })

  it('does not open or focus a disabled word', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(<MenuBar items={items} onOpenChange={onOpenChange} />)

    expect(word('Tools')).toBeDisabled()

    await user.click(word('Tools'))

    expect(word('Tools')).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('renders the access key and orients vertically when asked', async () => {
    const user = userEvent.setup()

    render(<MenuBar items={items} orientation="vertical" />)

    const bar = screen.getByRole('menubar')

    expect(bar).toHaveAttribute('aria-orientation', 'vertical')
    expect(bar).toHaveClass('vgui-menubar--vertical')
    expect(word('File')).toHaveAttribute('accesskey', 'f')

    word('File').focus()

    // Up/Down walk the column, Right opens the menu.
    await user.keyboard('{ArrowDown}')
    expect(word('Edit')).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(word('Edit')).toHaveAttribute('aria-expanded', 'true')
  })

  it('reports the open item through onOpenChange and can open nothing at all', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(<MenuBar items={[]} onOpenChange={onOpenChange} />)

    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('menubar')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<MenuBar items={items} />)

    expect(screen.getByRole('menubar')).toBeInTheDocument()
    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
