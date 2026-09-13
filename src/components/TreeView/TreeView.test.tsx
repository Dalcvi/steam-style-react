import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { TreeView } from './TreeView'
import type { TreeNode } from './TreeView'

const nodes: TreeNode[] = [
  {
    id: 'internet',
    label: 'Internet',
    defaultExpanded: true,
    children: [
      { id: 'server-a', label: 'Server Alpha' },
      { id: 'server-b', label: 'Server Bravo' },
    ],
  },
  {
    id: 'lan',
    label: 'LAN',
    children: [{ id: 'lan-1', label: 'LAN Party' }],
  },
  { id: 'history', label: 'History', disabled: true },
]

const deep: TreeNode[] = [
  {
    id: 'a',
    label: 'A',
    defaultExpanded: true,
    children: [
      {
        id: 'a1',
        label: 'A1',
        defaultExpanded: true,
        children: [{ id: 'a1x', label: 'A1X' }],
      },
    ],
  },
]

function items(): HTMLElement[] {
  return screen.getAllByRole('treeitem')
}

function item(name: string): HTMLElement {
  return screen.getByRole('treeitem', { name })
}

function glyphOf(name: string): HTMLElement {
  const glyph = item(name).querySelector('.vgui-tree__image')
  if (glyph === null) throw new Error(`no glyph on ${name}`)
  return glyph as HTMLElement
}

describe('TreeView', () => {
  it('renders a named tree with one treeitem per visible node', () => {
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    // `LAN Party` is inside a collapsed parent, so it is not rendered at all.
    expect(screen.getByRole('tree', { name: 'Servers' })).toBeInTheDocument()
    expect(items().map((node) => node.textContent)).toEqual([
      'Internet',
      'Server Alpha',
      'Server Bravo',
      'LAN',
      'History',
    ])
  })

  it('falls back to a generic name so the tree is never unnamed', () => {
    render(<TreeView nodes={nodes} />)

    expect(screen.getByRole('tree', { name: 'Tree' })).toBeInTheDocument()
  })

  it('lets `label` name the tree', () => {
    render(<TreeView nodes={nodes} label="Server browser" />)

    expect(screen.getByRole('tree', { name: 'Server browser' })).toBeInTheDocument()
  })

  it('puts role="tree" on the sub-panel, not on each node', () => {
    const { container } = render(<TreeView nodes={nodes} aria-label="Servers" />)

    const subpanel = container.querySelector('.vgui-tree__subpanel')
    expect(subpanel).toHaveAttribute('role', 'tree')
    expect(subpanel).toHaveClass('vgui-tree__subpanel')
    for (const node of items()) {
      expect(node).toHaveAttribute('role', 'treeitem')
    }
  })

  it('is the plain variant by default and the recessed sidebar with `variant`', () => {
    const { rerender, container } = render(<TreeView nodes={nodes} aria-label="Servers" />)

    expect(container.firstElementChild).toHaveClass('vgui-tree', 'vgui-tree--default')
    expect(container.firstElementChild).not.toHaveClass('vgui-tree--sidebar')

    rerender(<TreeView nodes={nodes} aria-label="Servers" variant="sidebar" />)
    expect(container.firstElementChild).toHaveClass('vgui-tree--sidebar')
    expect(container.firstElementChild).not.toHaveClass('vgui-tree--default')
  })

  it('applies the indent step through a custom property', () => {
    const { container } = render(<TreeView nodes={nodes} aria-label="Servers" indentSize={24} />)

    const frame = container.firstElementChild as HTMLElement
    expect(frame.style.getPropertyValue('--vgui-tree-indent')).toBe('24px')
  })

  it('defaults the indent step to 16px without a custom property of its own', () => {
    const { container } = render(<TreeView nodes={nodes} aria-label="Servers" />)

    const frame = container.firstElementChild as HTMLElement
    expect(frame.style.getPropertyValue('--vgui-tree-indent')).toBe('16px')
  })

  it('marks every node with its level and indents through a per-node property', () => {
    render(<TreeView nodes={deep} aria-label="Hierarchy" />)

    expect(items()[0]).toHaveAttribute('aria-level', '1')
    expect(items()[1]).toHaveAttribute('aria-level', '2')
    expect(items()[2]).toHaveAttribute('aria-level', '3')

    expect(items()[0].style.getPropertyValue('--vgui-tree-level')).toBe('0')
    expect(items()[1].style.getPropertyValue('--vgui-tree-level')).toBe('1')
    expect(items()[2].style.getPropertyValue('--vgui-tree-level')).toBe('2')
  })

  it('wraps each expanded node\'s children in a group', () => {
    const { container } = render(<TreeView nodes={deep} aria-label="Hierarchy" />)

    expect(container.querySelectorAll('[role="group"]')).toHaveLength(2)
    expect(container.querySelector('.vgui-tree__group')).toBeInTheDocument()
  })

  it('only puts aria-expanded on nodes that have children', () => {
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    expect(item('Internet')).toHaveAttribute('aria-expanded', 'true')
    expect(item('LAN')).toHaveAttribute('aria-expanded', 'false')
    expect(item('Server Alpha')).not.toHaveAttribute('aria-expanded')
    expect(item('History')).not.toHaveAttribute('aria-expanded')
  })

  it('hides the disclosure glyph from assistive technology', () => {
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    // `aria-hidden` because the row already carries `aria-expanded`; carrying
    // both an accessible name and `aria-expanded` is the lie the doc warns of.
    expect(glyphOf('Internet')).toHaveAttribute('aria-hidden', 'true')
    expect(glyphOf('Internet')).toHaveClass('vgui-tree__image--expanded')
    expect(glyphOf('LAN')).toHaveClass('vgui-tree__image--collapsed')
    expect(glyphOf('Server Alpha')).toHaveClass('vgui-tree__image--leaf')
  })

  it('keeps the full label reachable because the text is truncated', () => {
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    expect(item('Internet')).toHaveAttribute('title', 'Internet')
    expect(item('Internet').querySelector('.vgui-tree__text')).toHaveTextContent('Internet')
  })

  it('keeps exactly one node in the tab order', () => {
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    expect(items().filter((node) => node.tabIndex === 0)).toHaveLength(1)
    expect(items()[0]).toHaveAttribute('tabindex', '0')
  })

  it('moves the active node with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    items()[0].focus()
    await user.keyboard('{ArrowDown}')

    expect(items()[1]).toHaveFocus()
    expect(items()[1]).toHaveAttribute('tabindex', '0')
    expect(items()[0]).toHaveAttribute('tabindex', '-1')

    await user.keyboard('{ArrowUp}')
    expect(items()[0]).toHaveFocus()
  })

  it('walks onto disabled nodes so their existence is discoverable', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    items()[3].focus()
    await user.keyboard('{ArrowDown}')

    expect(items()[4]).toHaveFocus()
    expect(items()[4]).toHaveAttribute('aria-disabled', 'true')
  })

  it('does not wrap past the ends', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    items()[0].focus()
    await user.keyboard('{ArrowUp}')
    expect(items()[0]).toHaveFocus()

    await user.keyboard('{End}')
    await user.keyboard('{ArrowDown}')
    expect(items()[4]).toHaveFocus()
  })

  it('jumps to the first and last visible node with Home and End', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    items()[0].focus()
    await user.keyboard('{End}')
    expect(items()[4]).toHaveFocus()

    await user.keyboard('{Home}')
    expect(items()[0]).toHaveFocus()
  })

  it('expands a collapsed node with ArrowRight', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    item('LAN').focus()
    await user.keyboard('{ArrowRight}')

    expect(item('LAN')).toHaveAttribute('aria-expanded', 'true')
    expect(item('LAN')).toHaveFocus()
    expect(screen.getByRole('treeitem', { name: 'LAN Party' })).toBeInTheDocument()
  })

  it('hands focus to the first child with ArrowRight on an expanded node', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    item('Internet').focus()
    await user.keyboard('{ArrowRight}')

    expect(item('Server Alpha')).toHaveFocus()
    expect(item('Internet')).toHaveAttribute('aria-expanded', 'true')
  })

  it('does nothing with ArrowRight on a leaf', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    item('Server Alpha').focus()
    await user.keyboard('{ArrowRight}')

    expect(item('Server Alpha')).toHaveFocus()
    expect(items()).toHaveLength(5)
  })

  it('collapses an expanded node with ArrowLeft and keeps focus on it', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    item('Internet').focus()
    await user.keyboard('{ArrowLeft}')

    expect(item('Internet')).toHaveAttribute('aria-expanded', 'false')
    expect(item('Internet')).toHaveFocus()
    expect(screen.queryByRole('treeitem', { name: 'Server Alpha' })).not.toBeInTheDocument()
  })

  it('steps out to the parent with ArrowLeft on a collapsed node', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    item('Server Alpha').focus()
    await user.keyboard('{ArrowLeft}')

    expect(item('Internet')).toHaveFocus()
  })

  it('selects a node with Enter and reports it through onSelectedChange', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    render(<TreeView nodes={nodes} aria-label="Servers" onSelectedChange={onSelectedChange} />)

    item('Server Alpha').focus()
    await user.keyboard('{Enter}')

    expect(item('Server Alpha')).toHaveAttribute('aria-selected', 'true')
    expect(onSelectedChange).toHaveBeenCalledWith('server-a')
  })

  it('selects a node with Space', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    item('Server Bravo').focus()
    await user.keyboard(' ')

    expect(item('Server Bravo')).toHaveAttribute('aria-selected', 'true')
  })

  it('does nothing when a disabled node is activated', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    render(<TreeView nodes={nodes} aria-label="Servers" onSelectedChange={onSelectedChange} />)

    await user.click(item('History'))
    expect(item('History')).toHaveAttribute('aria-selected', 'false')

    item('History').focus()
    await user.keyboard('{Enter}')
    expect(onSelectedChange).not.toHaveBeenCalled()
  })

  it('selects a node on click and moves the tab stop with the pointer', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    await user.click(item('Server Bravo'))

    expect(item('Server Bravo')).toHaveAttribute('aria-selected', 'true')
    expect(item('Server Bravo')).toHaveAttribute('tabindex', '0')
    expect(item('Internet')).toHaveAttribute('aria-selected', 'false')
  })

  it('does not select a node when its disclosure glyph is clicked', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    render(<TreeView nodes={nodes} aria-label="Servers" onSelectedChange={onSelectedChange} />)

    await user.click(glyphOf('LAN'))

    expect(item('LAN')).toHaveAttribute('aria-expanded', 'true')
    expect(onSelectedChange).not.toHaveBeenCalled()
  })

  it('expands on a row click when expandOnRowClick is set', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" expandOnRowClick />)

    await user.click(item('LAN'))

    expect(item('LAN')).toHaveAttribute('aria-expanded', 'true')
    expect(item('LAN')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('treeitem', { name: 'LAN Party' })).toBeInTheDocument()
  })

  it('leaves the tree closed on a row click by default', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    await user.click(item('LAN'))

    expect(item('LAN')).toHaveAttribute('aria-expanded', 'false')
    expect(item('LAN')).toHaveAttribute('aria-selected', 'true')
  })

  it('honours an uncontrolled defaultSelected', () => {
    render(<TreeView nodes={nodes} aria-label="Servers" defaultSelected="server-b" />)

    expect(item('Server Bravo')).toHaveAttribute('aria-selected', 'true')
    expect(item('Internet')).toHaveAttribute('aria-selected', 'false')
  })

  it('honours a controlled selection that the parent updates', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [value, setValue] = useState('server-a')
      return (
        <TreeView
          nodes={nodes}
          aria-label="Servers"
          selected={value}
          onSelectedChange={(id) => setValue(id as string)}
        />
      )
    }

    render(<Harness />)
    await user.click(item('Server Bravo'))

    expect(item('Server Bravo')).toHaveAttribute('aria-selected', 'true')
    expect(item('Server Alpha')).toHaveAttribute('aria-selected', 'false')
  })

  it('announces the selection change in a live region', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    await user.click(item('Server Bravo'))

    expect(screen.getByRole('status')).toHaveTextContent(
      'Server Bravo, selected, level 2, 3 of 5',
    )
  })

  it('enables multi-selection with aria-multiselectable and toggles nodes with Enter', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    render(<TreeView nodes={nodes} aria-label="Servers" multi onSelectedChange={onSelectedChange} />)

    expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true')
    expect(screen.getByRole('tree').parentElement).toHaveClass('vgui-tree--multi')

    item('Server Alpha').focus()
    await user.keyboard('{Enter}')
    expect(onSelectedChange).toHaveBeenLastCalledWith(['server-a'])

    item('Server Bravo').focus()
    await user.keyboard('{Enter}')
    expect(onSelectedChange).toHaveBeenLastCalledWith(['server-a', 'server-b'])

    await user.keyboard('{Enter}')
    expect(item('Server Bravo')).toHaveAttribute('aria-selected', 'false')
    expect(onSelectedChange).toHaveBeenLastCalledWith(['server-a'])
  })

  it('toggles with Ctrl+click and replaces the selection with a plain click', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" multi />)

    await user.click(item('Server Alpha'))
    await user.keyboard('{Control>}')
    await user.click(item('Server Bravo'))
    await user.keyboard('{/Control}')
    expect(item('Server Alpha')).toHaveAttribute('aria-selected', 'true')
    expect(item('Server Bravo')).toHaveAttribute('aria-selected', 'true')

    await user.click(item('Server Bravo'))
    expect(item('Server Alpha')).toHaveAttribute('aria-selected', 'false')
  })

  it('selects a range with Shift+click', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    render(<TreeView nodes={nodes} aria-label="Servers" multi onSelectedChange={onSelectedChange} />)

    await user.click(item('Internet'))
    await user.keyboard('{Shift>}')
    await user.click(item('LAN'))
    await user.keyboard('{/Shift}')

    expect(onSelectedChange).toHaveBeenLastCalledWith(['internet', 'server-a', 'server-b', 'lan'])
  })

  it('jumps to a node by typing its first letter', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    items()[0].focus()
    await user.keyboard('l')

    expect(item('LAN')).toHaveFocus()
  })

  it('skips disabled nodes when matching a typeahead', async () => {
    const user = userEvent.setup()
    render(<TreeView nodes={nodes} aria-label="Servers" />)

    // `History` is the only node starting with H, but it is disabled: the arrow
    // keys still walk onto it, while the typeahead passes over it.
    items()[0].focus()
    await user.keyboard('h')

    expect(items()[0]).toHaveFocus()
    expect(item('History')).toHaveAttribute('aria-disabled', 'true')
  })

  it('renders the empty message, announces it and drops the tree', () => {
    const { container } = render(
      <TreeView nodes={[]} aria-label="Servers" emptyMessage="No servers match your filters." />,
    )

    const frame = container.firstElementChild as HTMLElement
    expect(frame).toHaveClass('vgui-tree', 'vgui-tree--empty')
    expect(screen.getByRole('status')).toHaveTextContent('No servers match your filters.')
    // An empty tree is itself an `aria-required-children` violation, so the
    // widget is not rendered at all.
    expect(screen.queryByRole('tree')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('treeitem')).toHaveLength(0)
  })

  it('forwards a ref to the frame and passes extra attributes through', () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<TreeView nodes={nodes} aria-label="Servers" ref={ref} data-testid="tree" />)

    expect(ref.current).toBe(screen.getByTestId('tree'))
    expect(screen.getByTestId('tree')).toHaveClass('vgui-tree')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<TreeView nodes={nodes} aria-label="Servers" />)

    await expect(a11yViolations(container)).resolves.toEqual([])
  })

  it('has no accessibility violations when multi-selecting a deeply nested tree', async () => {
    const { container } = render(
      <TreeView nodes={deep} label="Options" multi defaultSelected={['a1x']} />,
    )
    await expect(a11yViolations(container)).resolves.toEqual([])
  })

  it('has no accessibility violations when collapsed and when empty', async () => {
    const { container } = render(<TreeView nodes={nodes} variant="sidebar" aria-label="Servers" />)
    await expect(a11yViolations(container)).resolves.toEqual([])

    const empty = render(<TreeView nodes={[]} aria-label="Servers" emptyMessage="Nothing here." />)
    await expect(a11yViolations(empty.container)).resolves.toEqual([])
  })
})
