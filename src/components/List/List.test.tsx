import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { List } from './List'
import type { ListRow, ListSection } from './List'

const rows: ListRow[] = [
  { id: 'alpha', content: 'Alpha' },
  { id: 'bravo', content: 'Bravo', disabled: true },
  { id: 'charlie', content: 'Charlie' },
]

const sections: ListSection[] = [
  { id: 'fav', title: 'Favourites', rows: [{ id: 'a', content: 'Favourite server' }] },
  {
    id: 'net',
    title: 'Internet',
    rows: [
      { id: 'b', content: 'Some server' },
      { id: 'c', content: 'Another server', disabled: true },
    ],
  },
]

function rowsOf(): HTMLElement[] {
  return screen.getAllByRole('option')
}

describe('List', () => {
  it('renders a named listbox with one option per row', () => {
    render(<List items={rows} aria-label="Servers" />)

    expect(screen.getByRole('listbox', { name: 'Servers' })).toBeInTheDocument()
    expect(rowsOf().map((row) => row.textContent)).toEqual(['Alpha', 'Bravo', 'Charlie'])
  })

  it('falls back to a generic name so the listbox is never unnamed', () => {
    render(<List items={rows} />)

    expect(screen.getByRole('listbox', { name: 'List' })).toBeInTheDocument()
  })

  it('is a recessed well by default and a raised slab with `raised`', () => {
    const { rerender, container } = render(<List items={rows} aria-label="Servers" />)

    expect(container.firstElementChild).toHaveClass('vgui-list', 'vgui-list--recessed')
    expect(container.querySelector('.vgui-list__interior')).toBeInTheDocument()

    rerender(<List items={rows} aria-label="Servers" raised />)
    expect(container.firstElementChild).toHaveClass('vgui-list--raised')
    expect(container.firstElementChild).not.toHaveClass('vgui-list--recessed')
  })

  it('applies the row pitch through a custom property', () => {
    const { container } = render(<List items={rows} aria-label="Servers" rowHeight={25} />)

    const frame = container.firstElementChild as HTMLElement
    expect(frame.style.getPropertyValue('--vgui-list-row-height')).toBe('25px')
  })

  it('marks disabled rows with aria-disabled instead of removing them', () => {
    render(<List items={rows} aria-label="Servers" />)

    const disabled = rowsOf()[1]
    expect(disabled).toHaveAttribute('aria-disabled', 'true')
    expect(disabled).toHaveClass('vgui-list__row--disabled')
  })

  it('keeps exactly one row in the tab order and moves the active row with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<List items={rows} aria-label="Servers" />)

    const [alpha] = rowsOf()
    expect(rowsOf().filter((row) => row.tabIndex === 0)).toHaveLength(1)

    alpha.focus()
    await user.keyboard('{ArrowDown}')

    expect(rowsOf()[1]).toHaveFocus()
    expect(rowsOf()[1]).toHaveAttribute('tabindex', '0')
    expect(alpha).toHaveAttribute('tabindex', '-1')
  })

  it('walks onto disabled rows so their existence is discoverable', async () => {
    const user = userEvent.setup()
    render(<List items={rows} aria-label="Servers" />)

    rowsOf()[0].focus()
    await user.keyboard('{ArrowDown}')

    expect(rowsOf()[1]).toHaveAttribute('aria-disabled', 'true')
    expect(rowsOf()[1]).toHaveFocus()
  })

  it('jumps to the first and last row with Home and End', async () => {
    const user = userEvent.setup()
    render(<List items={rows} aria-label="Servers" />)

    rowsOf()[0].focus()
    await user.keyboard('{End}')
    expect(rowsOf()[2]).toHaveFocus()

    await user.keyboard('{Home}')
    expect(rowsOf()[0]).toHaveFocus()
  })

  it('does not wrap past the ends of the list', async () => {
    const user = userEvent.setup()
    render(<List items={rows} aria-label="Servers" />)

    rowsOf()[0].focus()
    await user.keyboard('{ArrowUp}')
    expect(rowsOf()[0]).toHaveFocus()
  })

  it('selects a row with Enter and reports it through onSelectedChange', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    render(<List items={rows} aria-label="Servers" onSelectedChange={onSelectedChange} />)

    rowsOf()[0].focus()
    await user.keyboard('{Enter}')

    expect(rowsOf()[0]).toHaveAttribute('aria-selected', 'true')
    expect(onSelectedChange).toHaveBeenCalledWith('alpha')
  })

  it('selects a row with Space', async () => {
    const user = userEvent.setup()
    render(<List items={rows} aria-label="Servers" />)

    rowsOf()[0].focus()
    await user.keyboard(' ')

    expect(rowsOf()[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('selects a row on click and never toggles the selection off in single mode', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    render(<List items={rows} aria-label="Servers" onSelectedChange={onSelectedChange} />)

    await user.click(rowsOf()[2])
    expect(rowsOf()[2]).toHaveAttribute('aria-selected', 'true')

    await user.click(rowsOf()[2])
    expect(rowsOf()[2]).toHaveAttribute('aria-selected', 'true')
    expect(onSelectedChange).toHaveBeenLastCalledWith('charlie')
  })

  it('replaces the selection when a different row is clicked', async () => {
    const user = userEvent.setup()
    render(<List items={rows} aria-label="Servers" />)

    await user.click(rowsOf()[0])
    await user.click(rowsOf()[2])

    expect(rowsOf()[0]).toHaveAttribute('aria-selected', 'false')
    expect(rowsOf()[2]).toHaveAttribute('aria-selected', 'true')
  })

  it('does nothing when a disabled row is activated', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    render(<List items={rows} aria-label="Servers" onSelectedChange={onSelectedChange} />)

    await user.click(rowsOf()[1])
    expect(rowsOf()[1]).toHaveAttribute('aria-selected', 'false')

    rowsOf()[1].focus()
    await user.keyboard('{Enter}')
    expect(onSelectedChange).not.toHaveBeenCalled()
  })

  it('honours an uncontrolled defaultSelected', () => {
    render(<List items={rows} aria-label="Servers" defaultSelected="charlie" />)

    expect(rowsOf()[2]).toHaveAttribute('aria-selected', 'true')
    expect(rowsOf()[0]).toHaveAttribute('aria-selected', 'false')
  })

  it('honours a controlled selection and still reports changes', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    render(
      <List items={rows} aria-label="Servers" selected="charlie" onSelectedChange={onSelectedChange} />,
    )

    expect(rowsOf()[2]).toHaveAttribute('aria-selected', 'true')

    await user.click(rowsOf()[0])
    expect(onSelectedChange).toHaveBeenCalledWith('alpha')
    expect(rowsOf()[2]).toHaveAttribute('aria-selected', 'true')
    expect(rowsOf()[0]).toHaveAttribute('aria-selected', 'false')
  })

  it('reflects a controlled selection that the parent updates', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [value, setValue] = useState('alpha')
      return <List items={rows} aria-label="Servers" selected={value} onSelectedChange={(id) => setValue(id as string)} />
    }

    render(<Harness />)
    await user.click(rowsOf()[2])

    expect(rowsOf()[2]).toHaveAttribute('aria-selected', 'true')
    expect(rowsOf()[0]).toHaveAttribute('aria-selected', 'false')
  })

  it('announces the selection change in a live region', async () => {
    const user = userEvent.setup()
    render(<List items={rows} aria-label="Servers" />)

    await user.click(rowsOf()[2])

    expect(screen.getByRole('status')).toHaveTextContent('Charlie, selected, 3 of 3')
  })

  it('enables multi-selection with aria-multiselectable and toggles rows with Enter', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    render(<List items={rows} aria-label="Servers" multi onSelectedChange={onSelectedChange} />)

    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true')

    rowsOf()[0].focus()
    await user.keyboard('{Enter}')
    expect(onSelectedChange).toHaveBeenLastCalledWith(['alpha'])

    rowsOf()[2].focus()
    await user.keyboard('{Enter}')
    expect(onSelectedChange).toHaveBeenLastCalledWith(['alpha', 'charlie'])

    await user.keyboard('{Enter}')
    expect(onSelectedChange).toHaveBeenLastCalledWith(['alpha'])
    expect(rowsOf()[2]).toHaveAttribute('aria-selected', 'false')
  })

  it('toggles with Ctrl+click and replaces the selection with a plain click', async () => {
    const user = userEvent.setup()
    render(<List items={rows} aria-label="Servers" multi />)

    await user.click(rowsOf()[0])
    await user.keyboard('{Control>}')
    await user.click(rowsOf()[2])
    await user.keyboard('{/Control}')
    expect(rowsOf()[0]).toHaveAttribute('aria-selected', 'true')
    expect(rowsOf()[2]).toHaveAttribute('aria-selected', 'true')

    await user.click(rowsOf()[2])
    expect(rowsOf()[0]).toHaveAttribute('aria-selected', 'false')
  })

  it('selects a range with Shift+click', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    render(<List items={rows} aria-label="Servers" multi onSelectedChange={onSelectedChange} />)

    await user.click(rowsOf()[0])
    await user.keyboard('{Shift>}')
    await user.click(rowsOf()[2])
    await user.keyboard('{/Shift}')

    expect(onSelectedChange).toHaveBeenLastCalledWith(['alpha', 'bravo', 'charlie'])
  })

  it('jumps to a row by typing its first letter', async () => {
    const user = userEvent.setup()
    render(<List items={rows} aria-label="Servers" />)

    rowsOf()[0].focus()
    await user.keyboard('c')

    expect(rowsOf()[2]).toHaveFocus()
  })

  it('renders rows in the given order', () => {
    const numbered: ListRow[] = [
      { id: '1', content: 'One' },
      { id: '2', content: 'Two' },
    ]
    render(<List items={numbered} aria-label="Numbers" />)

    expect(rowsOf().map((row) => row.textContent)).toEqual(['One', 'Two'])
  })

  it('renders the empty message and drops the listbox', () => {
    const { container } = render(
      <List items={[]} aria-label="Servers" emptyMessage="No servers match your filters." />,
    )

    const frame = container.firstElementChild as HTMLElement
    expect(frame).toHaveClass('vgui-list--empty')
    expect(screen.getByRole('status')).toHaveTextContent('No servers match your filters.')
    // An empty listbox is itself invalid, so the widget is not rendered at all.
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('renders sections with collapsers that are expanded by default', () => {
    render(<List items={sections} grouped aria-label="Servers" />)

    expect(screen.getAllByRole('listbox')).toHaveLength(2)
    expect(screen.getByRole('listbox', { name: 'Favourites' })).toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: 'Internet' })).toBeInTheDocument()

    const collapsers = screen.getAllByRole('button')
    expect(collapsers).toHaveLength(2)
    expect(collapsers[0]).toHaveAttribute('aria-expanded', 'true')
    expect(collapsers[0]).toHaveAccessibleName('Collapse Favourites')
    expect(rowsOf()).toHaveLength(3)
  })

  it('collapses a section, hiding its rows and flipping aria-expanded', async () => {
    const user = userEvent.setup()
    const { container } = render(<List items={sections} grouped aria-label="Servers" />)

    await user.click(screen.getByRole('button', { name: 'Collapse Favourites' }))

    const collapsed = screen.getByRole('button', { name: 'Expand Favourites' })
    expect(collapsed).toHaveAttribute('aria-expanded', 'false')

    const hiddenRows = document.getElementById(collapsed.getAttribute('aria-controls') as string)
    expect(hiddenRows).toHaveAttribute('hidden')
    expect(hiddenRows).not.toBeVisible()
    expect(container.querySelectorAll('.vgui-list__rows')).toHaveLength(2)
    expect(rowsOf()).toHaveLength(2)

    await user.click(collapsed)
    expect(screen.getByRole('listbox', { name: 'Favourites' })).toBeVisible()
    expect(rowsOf()).toHaveLength(3)
  })

  it('points each collapser at the rows it controls', () => {
    render(<List items={sections} grouped aria-label="Servers" />)

    const collapser = screen.getByRole('button', { name: 'Collapse Internet' })
    const controlled = document.getElementById(collapser.getAttribute('aria-controls') as string)

    expect(controlled).toBe(screen.getByRole('listbox', { name: 'Internet' }))
  })

  it('skips the rows of a collapsed section when arrowing', async () => {
    const user = userEvent.setup()
    render(<List items={sections} grouped aria-label="Servers" />)

    await user.click(screen.getByRole('button', { name: 'Collapse Favourites' }))

    // The active row was inside the collapsed section, so the tab stop falls
    // back to the first row of the section that is still open.
    const [first] = rowsOf()
    expect(first).toHaveTextContent('Some server')
    expect(first).toHaveAttribute('tabindex', '0')

    first.focus()
    await user.keyboard('{ArrowDown}')
    expect(rowsOf()[1]).toHaveFocus()
  })

  it('titles a section in the maize heading colour', () => {
    render(<List items={sections} grouped aria-label="Servers" />)

    const titles = document.querySelectorAll('.vgui-list__section-title')
    expect(titles).toHaveLength(2)
    expect(titles[1]).toHaveTextContent('Internet')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <List items={rows} aria-label="Servers" multi defaultSelected={['alpha']} />,
    )
    await expect(a11yViolations(container)).resolves.toEqual([])
  })

  it('has no accessibility violations when grouped and collapsed', async () => {
    const { container } = render(<List items={sections} grouped raised aria-label="Servers" />)
    await expect(a11yViolations(container)).resolves.toEqual([])
  })

  it('has no accessibility violations when empty', async () => {
    const { container } = render(
      <List items={[]} aria-label="Servers" emptyMessage="No servers match your filters." />,
    )
    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
