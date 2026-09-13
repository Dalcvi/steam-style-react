import type { Meta, StoryObj } from '@storybook/react-vite'

import { List, type ListRow, type ListSection } from './List'

const rows: ListRow[] = [
  { id: 'dust2', content: 'de_dust2' },
  { id: 'inferno', content: 'de_inferno' },
  { id: 'nuke', content: 'de_nuke', disabled: true },
  { id: 'train', content: 'de_train' },
  { id: 'mirage', content: 'de_mirage' },
]

const servers: ListSection[] = [
  {
    id: 'favourites',
    title: 'Favourites',
    rows: [
      { id: 'friend-1', content: 'Some server' },
      { id: 'friend-2', content: 'Another server' },
    ],
  },
  {
    id: 'internet',
    title: 'Internet',
    rows: [
      { id: 'net-1', content: "Bob Loblaw's LAN Party" },
      { id: 'net-2', content: 'Dust2 24/7 · no snipers' },
    ],
  },
  {
    id: 'history',
    title: 'History',
    rows: [{ id: 'hist-1', content: "Frank's House of Pain" }],
  },
]

const meta = {
  title: 'Components/List',
  component: List,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    items: { control: false },
    grouped: { control: 'boolean' },
    raised: { control: 'boolean' },
    multi: { control: 'boolean' },
    rowHeight: { control: 'number' },
    emptyMessage: { control: 'text' },
    selected: { control: false },
    defaultSelected: { control: false },
    onSelectedChange: { control: false },
  },
  args: {
    items: rows,
    'aria-label': 'Maps',
    style: { width: 220, height: 140 },
  },
} satisfies Meta<typeof List>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** `CGamesListPanel` — the raised variant used for the server browser columns. */
export const Raised: Story = {
  args: { raised: true, defaultSelected: 'inferno' },
}

export const MultiSelect: Story = {
  args: { multi: true, defaultSelected: ['dust2', 'train'], style: { width: 220, height: 170 } },
}

export const Grouped: Story = {
  args: {
    items: servers,
    grouped: true,
    style: { width: 240, height: 260 },
  },
}

export const Empty: Story = {
  args: {
    items: [],
    emptyMessage: 'No servers found.',
    style: { width: 220, height: 90 },
  },
}

/** The pitch is a runtime value because `PerPixelScrolling` is set. */
export const RowPitch: Story = {
  args: { rowHeight: 25, style: { width: 220, height: 170 } },
}
