import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Table } from './Table'
import type { TableColumn, TableProps } from './Table'

interface Row {
  id: string
  name: string
  players: number
}

const rows: Row[] = [
  { id: 'alpha', name: 'Alpha', players: 3 },
  { id: 'bravo', name: 'Bravo', players: 1 },
  { id: 'charlie', name: 'Charlie', players: 12 },
  { id: 'delta', name: 'Delta', players: 7 },
]

const columns: TableColumn<Row>[] = [
  { id: 'name', header: 'Name', cell: (row) => row.name, sortable: true },
  { id: 'players', header: 'Players', cell: (row) => row.players, align: 'end', width: 80 },
]

const rowIds = (row: Row) => row.id

function renderTable(overrides: Partial<TableProps<Row>> & { 'data-testid'?: string } = {}) {
  return render(<Table columns={columns} rows={rows} rowId={rowIds} {...overrides} />)
}

function body() {
  return screen.getByRole('rowgroup')
}

function dataRows() {
  return within(body())
    .getAllByRole('row')
    .filter((row) => !row.classList.contains('vgui-table__row--empty'))
}

/** `row` takes its name from the author, not from its cells, so rows are found
 * by their text rather than with a `getByRole` name query. */
function dataRow(name: string) {
  const row = dataRows().find((candidate) => candidate.textContent?.startsWith(name))
  if (!row) throw new Error(`No row whose text starts with ${name}`)
  return row
}

describe('Table', () => {
  it('renders a grid with the column and row counts', () => {
    renderTable()
    const grid = screen.getByRole('grid')

    expect(grid).toHaveAttribute('aria-colcount', '2')
    expect(grid).toHaveAttribute('aria-rowcount', '4')
  })

  it('names the grid from aria-label', () => {
    renderTable({ 'aria-label': 'Servers' })
    expect(screen.getByRole('grid', { name: 'Servers' })).toBeInTheDocument()
  })

  it('renders one columnheader per column with aria-colindex', () => {
    renderTable()
    const headers = screen.getAllByRole('columnheader')

    expect(headers).toHaveLength(2)
    expect(headers[0]).toHaveAttribute('aria-colindex', '1')
    expect(headers[1]).toHaveAttribute('aria-colindex', '2')
    expect(headers[0]).toHaveTextContent('Name')
  })

  it('renders cells with a column index and rows with a row index', () => {
    renderTable()
    const gridRows = dataRows()

    expect(gridRows).toHaveLength(4)
    gridRows.forEach((row, index) => {
      expect(row).toHaveAttribute('aria-rowindex', String(index + 1))
    })

    const firstCells = within(gridRows[0]).getAllByRole('gridcell')
    expect(firstCells[0]).toHaveAttribute('aria-colindex', '1')
    expect(firstCells[1]).toHaveAttribute('aria-colindex', '2')
    expect(firstCells[0]).toHaveTextContent('Alpha')
    expect(firstCells[1]).toHaveTextContent('3')
  })

  it('forwards alignment to the cells', () => {
    renderTable()
    const cells = within(dataRows()[0]).getAllByRole('gridcell')
    expect(cells[1]).toHaveAttribute('data-align', 'end')
  })

  it('keeps a single tab stop on the rows', () => {
    renderTable()
    const gridRows = dataRows()

    expect(gridRows[0]).toHaveAttribute('tabindex', '0')
    expect(gridRows[1]).toHaveAttribute('tabindex', '-1')
    expect(gridRows[3]).toHaveAttribute('tabindex', '-1')
  })

  it('prefers the selected row as the tab stop', () => {
    renderTable({ defaultSelected: 'charlie' })
    expect(dataRow('Charlie')).toHaveAttribute('tabindex', '0')
  })

  it('renders no row count when there are no rows', () => {
    renderTable({ rows: [] })
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '0')
  })

  it('marks the grid busy while a refresh is in flight', () => {
    renderTable({ busy: true })
    expect(screen.getByRole('grid')).toHaveAttribute('aria-busy', 'true')
  })

  it('announces the empty state and keeps the headers', () => {
    renderTable({ rows: [], emptyMessage: 'No servers.' })

    expect(screen.getAllByRole('columnheader')).toHaveLength(2)
    const message = screen.getByText('No servers.')
    expect(message).toHaveAttribute('aria-live', 'polite')
    expect(message).toHaveAttribute('aria-colspan', '2')
  })

  it('selects a row on click', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(dataRow('Bravo'))

    expect(dataRow('Bravo')).toHaveAttribute('aria-selected', 'true')
    expect(dataRow('Alpha')).toHaveAttribute('aria-selected', 'false')
  })

  it('moves the selection to the clicked row and reports it', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    renderTable({ onSelectedChange })

    await user.click(dataRow('Bravo'))
    await user.click(dataRow('Delta'))

    expect(onSelectedChange).toHaveBeenLastCalledWith('delta')
    expect(dataRow('Bravo')).toHaveAttribute('aria-selected', 'false')
    expect(dataRow('Delta')).toHaveAttribute('aria-selected', 'true')
  })

  it('honours a controlled selection', () => {
    renderTable({ selected: 'charlie' })
    expect(dataRow('Charlie')).toHaveAttribute('aria-selected', 'true')
  })

  it('is not multi-selectable unless multi is set', () => {
    const { unmount } = renderTable()
    expect(screen.getByRole('grid')).not.toHaveAttribute('aria-multiselectable')
    unmount()

    renderTable({ multi: true })
    expect(screen.getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true')
  })

  it('toggles a row with Ctrl+click when multi is set', async () => {
    const user = userEvent.setup()
    renderTable({ multi: true, defaultSelected: ['alpha'] })

    // Modifiers have to be held: this user-event version derives ctrlKey (and
    // shiftKey) from its own keyboard state, so a `{ctrlKey: true}` init object
    // would be overwritten with `false` on the way to the click event.
    await user.keyboard('{Control>}')
    await user.click(dataRow('Charlie'))
    await user.keyboard('{/Control}')

    expect(dataRow('Alpha')).toHaveAttribute('aria-selected', 'true')
    expect(dataRow('Charlie')).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Control>}')
    await user.click(dataRow('Alpha'))
    await user.keyboard('{/Control}')
    expect(dataRow('Alpha')).toHaveAttribute('aria-selected', 'false')
  })

  it('reports an array of ids when multi is set', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    renderTable({ multi: true, onSelectedChange })

    await user.click(dataRow('Alpha'))
    await user.keyboard('{Control>}')
    await user.click(dataRow('Bravo'))
    await user.keyboard('{/Control}')

    expect(onSelectedChange).toHaveBeenLastCalledWith(['alpha', 'bravo'])
  })

  it('selects a range with Shift+click', async () => {
    const user = userEvent.setup()
    renderTable({ multi: true })

    await user.click(dataRow('Bravo'))
    await user.keyboard('{Shift>}')
    await user.click(dataRow('Delta'))
    await user.keyboard('{/Shift}')

    expect(dataRow('Alpha')).toHaveAttribute('aria-selected', 'false')
    expect(dataRow('Bravo')).toHaveAttribute('aria-selected', 'true')
    expect(dataRow('Charlie')).toHaveAttribute('aria-selected', 'true')
    expect(dataRow('Delta')).toHaveAttribute('aria-selected', 'true')
  })

  it('keeps the range anchor across a sequence of Shift+clicks', async () => {
    const user = userEvent.setup()
    renderTable({ multi: true })

    await user.click(dataRow('Bravo'))
    await user.keyboard('{Shift>}')
    await user.click(dataRow('Delta'))
    await user.click(dataRow('Charlie'))
    await user.keyboard('{/Shift}')

    expect(dataRow('Bravo')).toHaveAttribute('aria-selected', 'true')
    expect(dataRow('Charlie')).toHaveAttribute('aria-selected', 'true')
    expect(dataRow('Delta')).toHaveAttribute('aria-selected', 'false')
  })

  it('collapses a range back to one row with a plain click', async () => {
    const user = userEvent.setup()
    renderTable({ multi: true })

    await user.click(dataRow('Alpha'))
    await user.keyboard('{Shift>}')
    await user.click(dataRow('Delta'))
    await user.keyboard('{/Shift}')
    await user.click(dataRow('Charlie'))

    expect(dataRow('Alpha')).toHaveAttribute('aria-selected', 'false')
    expect(dataRow('Charlie')).toHaveAttribute('aria-selected', 'true')
    expect(dataRow('Delta')).toHaveAttribute('aria-selected', 'false')
  })

  it('moves the active row with the arrow keys', async () => {
    renderTable({ defaultSelected: 'alpha' })
    const first = dataRow('Alpha')

    first.focus()
    fireKeyDown(first, 'ArrowDown')
    expect(document.activeElement).toBe(dataRow('Bravo'))
    expect(dataRow('Bravo')).toHaveAttribute('tabindex', '0')

    fireKeyDown(dataRow('Bravo'), 'ArrowUp')
    expect(document.activeElement).toBe(first)
  })

  it('jumps to the ends with Home and End', () => {
    renderTable({ defaultSelected: 'alpha' })
    const first = dataRow('Alpha')

    first.focus()
    fireKeyDown(first, 'End')
    expect(document.activeElement).toBe(dataRow('Delta'))

    fireKeyDown(dataRow('Delta'), 'Home')
    expect(document.activeElement).toBe(first)
  })

  it('does not wrap past either end', () => {
    renderTable({ rows: [{ id: 'only', name: 'Only', players: 0 }] })
    const only = dataRow('Only')

    only.focus()
    fireKeyDown(only, 'ArrowDown')
    expect(document.activeElement).toBe(only)
  })

  it('hands focus back to the sortable headers from the first row', () => {
    renderTable({ defaultSelected: 'alpha' })
    const first = dataRow('Alpha')

    first.focus()
    fireKeyDown(first, 'ArrowUp')

    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Name/ }))
  })

  it('selects the active row with Enter and Space', () => {
    renderTable({ defaultSelected: 'alpha' })
    const first = dataRow('Alpha')

    first.focus()
    fireKeyDown(first, 'ArrowDown')
    fireKeyDown(dataRow('Bravo'), 'Enter')
    expect(dataRow('Bravo')).toHaveAttribute('aria-selected', 'true')

    // jsdom never moves focus on its own, and the grid acts on the active row —
    // so the row is activated with a key the grid itself handles.
    fireKeyDown(dataRow('Bravo'), 'End')
    fireKeyDown(dataRow('Delta'), ' ')
    expect(dataRow('Delta')).toHaveAttribute('aria-selected', 'true')
    expect(dataRow('Bravo')).toHaveAttribute('aria-selected', 'false')
  })

  it('toggles the active row with Enter when multi is set', () => {
    renderTable({ multi: true, defaultSelected: 'alpha' })
    const first = dataRow('Alpha')

    first.focus()
    fireKeyDown(first, 'Enter')
    expect(dataRow('Alpha')).toHaveAttribute('aria-selected', 'false')
  })

  it('moves the active row with typeahead', () => {
    renderTable({ defaultSelected: 'alpha' })
    const first = dataRow('Alpha')

    first.focus()
    fireKeyDown(first, 'c')

    expect(document.activeElement).toBe(dataRow('Charlie'))
  })

  it('renders a sortable header as a button that carries the header text', () => {
    renderTable()
    expect(screen.getByRole('button', { name: /Name/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Players/ })).not.toBeInTheDocument()
  })

  it('sorts ascending on activation and flips to descending', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    renderTable({ onSortChange })

    await user.click(screen.getByRole('button', { name: /Name/ }))
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: 'name', direction: 'asc' })

    await user.click(screen.getByRole('button', { name: /Name/ }))
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: 'name', direction: 'desc' })
  })

  it('sorts with Enter and Space on the header button', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    renderTable({ onSortChange })
    const header = screen.getByRole('button', { name: /Name/ })

    header.focus()
    await user.keyboard('{Enter}')
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: 'name', direction: 'asc' })

    await user.keyboard(' ')
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: 'name', direction: 'desc' })
  })

  it('reorders the rows for a controlled ascending sort', () => {
    renderTable({ sort: { columnId: 'name', direction: 'asc' } })
    expect(dataRows().map((row) => row.textContent)).toEqual([
      'Alpha3',
      'Bravo1',
      'Charlie12',
      'Delta7',
    ])
  })

  it('reverses the rows for a descending sort', () => {
    renderTable({ sort: { columnId: 'name', direction: 'desc' } })
    expect(dataRows().map((row) => row.textContent)).toEqual([
      'Delta7',
      'Charlie12',
      'Bravo1',
      'Alpha3',
    ])
  })

  it('sorts by the values a cell renders, not the DOM order', () => {
    renderTable({ sort: { columnId: 'players', direction: 'asc' } })
    // Numeric, not lexicographic: 12 would sort before 3 as text.
    expect(dataRows().map((row) => row.textContent)).toEqual([
      'Bravo1',
      'Alpha3',
      'Delta7',
      'Charlie12',
    ])
  })

  it('leaves unorderable markup cells in their original order', () => {
    const markup: TableColumn<Row>[] = [
      { id: 'badge', header: 'Badge', cell: (row) => <span data-testid={`badge-${row.id}`}>*</span> },
    ]
    render(<Table columns={markup} rows={rows} rowId={rowIds} sort={{ columnId: 'badge', direction: 'desc' }} />)

    const order = within(body())
      .getAllByTestId(/^badge-/)
      .map((node) => node.getAttribute('data-testid'))
    expect(order).toEqual(['badge-alpha', 'badge-bravo', 'badge-charlie', 'badge-delta'])
  })

  it('puts aria-sort on the sorted header only', () => {
    renderTable({ sort: { columnId: 'name', direction: 'desc' } })
    const headers = screen.getAllByRole('columnheader')

    expect(headers[0]).toHaveAttribute('aria-sort', 'descending')
    expect(headers[1]).not.toHaveAttribute('aria-sort')
  })

  it('roves between the sortable headers with the arrow keys', async () => {
    const user = userEvent.setup()
    const sortable: TableColumn<Row>[] = [
      { id: 'name', header: 'Name', cell: (row) => row.name, sortable: true },
      { id: 'players', header: 'Players', cell: (row) => row.players, sortable: true },
    ]
    render(<Table columns={sortable} rows={rows} rowId={rowIds} />)

    const name = screen.getByRole('button', { name: /Name/ })
    const players = screen.getByRole('button', { name: /Players/ })

    expect(name).toHaveAttribute('tabindex', '0')
    expect(players).toHaveAttribute('tabindex', '-1')

    name.focus()
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(players)
    expect(players).toHaveAttribute('tabindex', '0')

    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(name)

    await user.keyboard('{End}')
    expect(document.activeElement).toBe(players)

    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(name)
  })

  it('drops from the header strip into the first row', async () => {
    const user = userEvent.setup()
    renderTable()
    const header = screen.getByRole('button', { name: /Name/ })

    header.focus()
    await user.keyboard('{ArrowDown}')

    expect(document.activeElement).toBe(dataRow('Alpha'))
  })

  it('rotates the sort indicator glyph without hiding it from sighted users', () => {
    renderTable({ sort: { columnId: 'name', direction: 'asc' } })
    const indicator = document.querySelector('.vgui-table__sort-indicator')

    expect(indicator).toHaveAttribute('data-direction', 'asc')
    expect(indicator).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders a header glyph with a text alternative', () => {
    const glyphColumns: TableColumn<Row>[] = [
      {
        id: 'secure',
        header: 'VAC',
        cell: () => <span role="img" aria-label="VAC secured" />,
        headerIcon: <span data-testid="icon" />,
      },
    ]
    render(<Table columns={glyphColumns} rows={rows} rowId={rowIds} />)

    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('columnheader')).toHaveTextContent('VAC')
    expect(screen.getAllByRole('img', { name: 'VAC secured' })).toHaveLength(4)
  })

  it('adds the modifier classes for the header variants', () => {
    const { container } = renderTable({ headerUppercase: true, stickyHeader: true })
    const grid = container.querySelector('.vgui-table')

    expect(grid).toHaveClass('vgui-table--header-uppercase')
    expect(grid).toHaveClass('vgui-table--sticky')
    expect(container.querySelector('.vgui-table__dragger')).toBeNull()
  })

  it('renders a focusable separator per column when resizable', () => {
    renderTable({
      resizable: true,
      columns: [
        { ...columns[0], defaultWidth: 200 },
        { id: 'players', header: 'Players', cell: (row) => row.players },
      ],
    })
    const draggers = screen.getAllByRole('separator')

    expect(draggers).toHaveLength(2)
    draggers.forEach((dragger) => {
      expect(dragger).toHaveAttribute('aria-orientation', 'vertical')
      expect(dragger).toHaveAttribute('tabindex', '0')
    })
    expect(draggers[0]).toHaveAttribute('aria-label', 'Resize Name column')
    expect(draggers[0]).toHaveAttribute('aria-valuenow', '200')
    // The second column has neither a width nor a defaultWidth, and jsdom
    // measures nothing: the dragger still has to report a number.
    expect(draggers[1]).toHaveAttribute('aria-valuenow', '120')
  })

  it('resizes a column with the arrow keys and reports the width', () => {
    const onColumnResize = vi.fn()
    renderTable({
      resizable: true,
      onColumnResize,
      columns: [{ ...columns[0], defaultWidth: 200 }, columns[1]],
    })
    const dragger = screen.getAllByRole('separator')[0]

    dragger.focus()
    fireKeyDown(dragger, 'ArrowRight')

    expect(dragger).toHaveAttribute('aria-valuenow', '208')
    expect(onColumnResize).toHaveBeenLastCalledWith('name', 208)

    fireKeyDown(dragger, 'ArrowLeft')
    expect(dragger).toHaveAttribute('aria-valuenow', '200')
    expect(onColumnResize).toHaveBeenLastCalledWith('name', 200)
  })

  it('clamps a resize at the minimum target size', () => {
    const onColumnResize = vi.fn()
    renderTable({
      resizable: true,
      onColumnResize,
      columns: [{ ...columns[0], defaultWidth: 26 }, columns[1]],
    })
    const dragger = screen.getAllByRole('separator')[0]

    dragger.focus()
    fireKeyDown(dragger, 'ArrowLeft')
    expect(dragger).toHaveAttribute('aria-valuenow', '24')

    fireKeyDown(dragger, 'ArrowLeft')
    expect(dragger).toHaveAttribute('aria-valuenow', '24')
  })

  it('ignores a drag gesture that reports no coordinates', async () => {
    const user = userEvent.setup()
    const onColumnResize = vi.fn()
    renderTable({
      resizable: true,
      onColumnResize,
      columns: [{ ...columns[0], defaultWidth: 200 }, columns[1]],
    })
    const dragger = screen.getAllByRole('separator')[0]

    await user.pointer({ keys: '[MouseLeft>]', target: dragger })
    await user.pointer({ keys: '[/MouseLeft]' })

    // jsdom reports clientX/clientY as 0 for every event, so the gesture must be
    // a no-op rather than a resize to NaN.
    expect(dragger).toHaveAttribute('aria-valuenow', '200')
    expect(onColumnResize).toHaveBeenCalledWith('name', 200)
  })

  it('applies the grid class name and forwards extra attributes', () => {
    const { container } = renderTable({ className: 'custom', 'data-testid': 'grid' })
    const grid = container.querySelector('.vgui-table')

    expect(grid).toHaveClass('custom')
    expect(grid).toHaveAttribute('data-testid', 'grid')
    expect(grid).toHaveAttribute('role', 'grid')
  })

  it('has no accessibility violations', async () => {
    const { container } = renderTable()
    await expect(a11yViolations(container)).resolves.toEqual([])
  })

  it('has no accessibility violations when sortable, resizable and multi-select', async () => {
    const { container } = render(
      <Table
        columns={[{ ...columns[0], defaultWidth: 160 }, { ...columns[1], sortable: true }]}
        rows={rows}
        rowId={rowIds}
        multi
        resizable
        headerUppercase
        sort={{ columnId: 'name', direction: 'asc' }}
        selected={['alpha', 'bravo']}
        aria-label="Servers"
      />,
    )
    await expect(a11yViolations(container)).resolves.toEqual([])
  })

  it('has no accessibility violations when empty', async () => {
    const { container } = renderTable({ rows: [], emptyMessage: 'No servers match your filters.' })
    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})

function fireKeyDown(element: Element, key: string) {
  // `fireEvent` flushes the resulting state update inside `act`, and unlike
  // `user-event` it does not move focus before the key lands — the tests are
  // asserting exactly *which* element the component moves focus to.
  fireEvent.keyDown(element, { key })
}
