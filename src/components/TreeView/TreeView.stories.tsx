import type { Meta, StoryObj } from '@storybook/react-vite'

import { TreeView, type TreeNode } from './TreeView'

const servers: TreeNode[] = [
  {
    id: 'internet',
    label: 'Internet',
    defaultExpanded: true,
    children: [
      { id: 'server-a', label: 'My favourite server' },
      { id: 'server-b', label: 'Another server' },
      {
        id: 'dust2',
        label: 'Dust2 24/7 · no snipers',
        children: [
          { id: 'dust2-1', label: 'Bots only' },
          { id: 'dust2-2', label: 'Humans only' },
        ],
      },
    ],
  },
  {
    id: 'lan',
    label: 'LAN',
    children: [{ id: 'lan-1', label: "Bob Loblaw's LAN Party" }],
  },
  { id: 'history', label: 'History', disabled: true },
]

const meta = {
  title: 'Components/TreeView',
  component: TreeView,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    nodes: { control: false },
    variant: { control: 'inline-radio', options: ['default', 'sidebar'] },
    selected: { control: false },
    defaultSelected: { control: false },
    onSelectedChange: { control: false },
    multi: { control: 'boolean' },
    expandOnRowClick: { control: 'boolean' },
    indentSize: { control: 'number' },
    emptyMessage: { control: 'text' },
    label: { control: 'text' },
  },
  args: {
    nodes: servers,
    label: 'Servers',
    style: { width: 240, height: 180 },
  },
} satisfies Meta<typeof TreeView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** `TreeViewSubPanel` — the two-sided recess, full height. */
export const Sidebar: Story = {
  args: {
    variant: 'sidebar',
    defaultSelected: 'server-a',
    style: { width: 220, height: 200 },
  },
}

export const MultiSelect: Story = {
  args: {
    multi: true,
    defaultSelected: ['server-a', 'server-b'],
    style: { width: 240, height: 200 },
  },
}

/** The glyph is decorative, so the whole row is a single large target. */
export const ExpandOnRowClick: Story = {
  args: { expandOnRowClick: true, defaultSelected: 'server-b' },
}

/** 16px is the doc's inferred step; a denser or looser hierarchy is one prop. */
export const CustomIndent: Story = {
  args: { indentSize: 24, style: { width: 260, height: 180 } },
}

export const Empty: Story = {
  args: {
    nodes: [],
    emptyMessage: 'No servers found.',
    style: { width: 220, height: 90 },
  },
}
