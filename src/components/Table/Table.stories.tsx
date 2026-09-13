import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Table } from './Table'
import type { TableColumn, TableSort } from './Table'

interface Server {
  id: string
  name: string
  map: string
  players: number
  max: number
  vac: boolean
}

const servers: Server[] = [
  { id: '1', name: 'My favourite server', map: 'de_dust2', players: 12, max: 24, vac: true },
  { id: '2', name: 'LAN Party', map: 'cs_office', players: 4, max: 16, vac: false },
  { id: '3', name: 'House of Pain', map: 'de_aztec', players: 31, max: 32, vac: true },
  { id: '4', name: 'Frag Shack', map: 'de_inferno', players: 0, max: 20, vac: true },
]

const SecureGlyph = () => (
  <span className="vgui-table__icon" role="img" aria-label="VAC secured">
    &#9679;
  </span>
)

const columns: TableColumn<Server>[] = [
  { id: 'name', header: 'Servers', cell: (server) => server.name, sortable: true },
  { id: 'map', header: 'Map', cell: (server) => server.map, width: 120 },
  {
    id: 'players',
    header: 'Players',
    cell: (server) => `${server.players}/${server.max}`,
    sortValue: (server) => server.players,
    sortable: true,
    align: 'end',
    width: 96,
  },
  {
    id: 'vac',
    header: 'VAC',
    cell: (server) => (server.vac ? <SecureGlyph /> : null),
    headerIcon: <SecureGlyph />,
    width: 48,
  },
]

/** The grid is sized so a 520px column strip is not squeezed by the canvas. */
const framed: Decorator = (Story) => (
  <div style={{ width: 520 }}>
    <Story />
  </div>
)

const meta = {
  title: 'Components/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    columns,
    rows: servers,
    rowId: (server: Server) => server.id,
  },
  argTypes: {
    multi: { control: 'boolean' },
    resizable: { control: 'boolean' },
    headerUppercase: { control: 'boolean' },
    stickyHeader: { control: 'boolean' },
    busy: { control: 'boolean' },
  },
  decorators: [framed],
} satisfies Meta<typeof Table<Server>>

export default meta
type Story = StoryObj<typeof meta>

/** The default server browser grid: a column header strip over recessed rows. */
export const Default: Story = {}

/** `Csteamrootdialog ListPanelColumnheader` — the uppercase header strip. */
export const HeaderUppercase: Story = {
  args: { headerUppercase: true, resizable: true },
}

/** Ctrl and Shift extend the selection across the grid. */
export const MultiSelect: Story = {
  args: { multi: true, defaultSelected: ['2'] },
}

/** The dragger is visible and the sortable headers announce their direction. */
export const SortableResizable: Story = {
  args: { resizable: true, headerUppercase: true, sort: { columnId: 'players', direction: 'desc' } },
}

/** A refresh in flight: `aria-busy` on the grid, rows still shipped. */
export const Loading: Story = {
  args: { busy: true },
}

/** No matches — the headers stay, and the message is a live region. */
export const Empty: Story = {
  args: { rows: [], emptyMessage: 'No servers match your filters.' },
}

/** The whole API driven as a controlled grid. */
export const Controlled: Story = {
  render: () => {
    const [sort, setSort] = useState<TableSort | undefined>({ columnId: 'name', direction: 'asc' })
    const [selected, setSelected] = useState<string | string[]>(['3'])
    const [resized, setResized] = useState<Record<string, number>>({})

    return (
      <Table
        columns={columns.map((column) =>
          resized[column.id] === undefined ? column : { ...column, width: resized[column.id] },
        )}
        rows={servers}
        rowId={(server) => server.id}
        multi
        resizable
        headerUppercase
        sort={sort}
        onSortChange={setSort}
        selected={selected}
        onSelectedChange={setSelected}
        onColumnResize={(columnId, width) => setResized((all) => ({ ...all, [columnId]: width }))}
      />
    )
  },
}
