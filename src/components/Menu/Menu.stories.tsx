import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Menu } from './Menu'
import type { MenuItemSpec } from './Menu'

const noop = () => undefined

/** A nested `items` array renders an arrow and `aria-haspopup="menu"`. */
const exportItem: MenuItemSpec = {
  id: 'export',
  label: 'Export',
  items: [
    { id: 'export-mesh', label: 'Mesh (.smd)', onSelect: noop },
    { id: 'export-vtf', label: 'Texture (.vtf)', onSelect: noop },
    { id: 'export-vmf', label: 'Map (.vmf)', onSelect: noop },
  ],
}

/** The File menu from the VGUI edit list — actions, a separator and a submenu. */
const fileMenu: MenuItemSpec[] = [
  { id: 'new', label: 'New Game…', onSelect: noop },
  { id: 'open', label: 'Open…', onSelect: noop },
  { id: 'save', label: 'Save', onSelect: noop },
  { id: 'save-as', label: 'Save As…', onSelect: noop },
  { id: 'sep-1', label: '', type: 'separator' },
  exportItem,
  { id: 'sep-2', label: '', type: 'separator' },
  { id: 'exit', label: 'Exit', onSelect: noop },
]

const viewMenu: MenuItemSpec[] = [
  { id: 'labels', label: 'View > Labels', onSelect: noop },
  { id: 'toolbar', label: 'View > Toolbar', checked: true, onSelect: noop },
  { id: 'status', label: 'View > Status Bar', onSelect: noop },
  { id: 'sep', label: '', type: 'separator' },
  { id: 'grid', label: 'View > Grid', checked: false, onSelect: noop },
]

const meta = {
  title: 'Components/Menu',
  component: Menu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    items: { control: false },
    labelledBy: { control: 'text' },
    onClose: { control: false },
    orientation: { control: 'inline-radio', options: ['auto', 'vertical'] },
  },
  args: {
    items: fileMenu,
    orientation: 'auto',
  },
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

/** The whole documented surface: actions, a separator, a nested submenu and a
 *  checked row, in one `role="menu"` panel. */
export const Default: Story = {}

/** `Checked` maps to `role="menuitemcheckbox"` plus `aria-checked`. */
export const Checkable: Story = {
  args: { items: viewMenu },
}

/** `Separator` renders a hairline that stops short of the right edge and takes
 *  no part in keyboard navigation. */
export const Separators: Story = {
  args: {
    items: [
      { id: 'a', label: 'Undo', onSelect: noop },
      { id: 's1', label: '', type: 'separator' },
      { id: 'b', label: 'Redo', onSelect: noop },
    ],
  },
}

/** A nested `items` array renders an arrow and `aria-haspopup="menu"`; Right
 *  opens it, Left closes it and returns focus to the parent row. */
export const Submenu: Story = {
  args: {
    items: [
      { id: 'rename', label: 'Rename', onSelect: noop },
      exportItem,
      { id: 'properties', label: 'Properties', onSelect: noop },
    ],
  },
}

/** `disabled` maps to the native attribute, keeps the row focusable-free and
 *  makes it unactivatable, with the VGUI shadowed text treatment. */
export const DisabledItem: Story = {
  args: {
    items: [
      { id: 'paste', label: 'Paste', onSelect: noop },
      { id: 'paste-special', label: 'Paste Special', disabled: true },
      { id: 'delete', label: 'Delete', onSelect: noop },
    ],
  },
}

/** A menu anchored by `labelledBy` rather than `aria-label`. */
export const LabelledByTrigger: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <button
          id="menu-trigger"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          Options
        </button>
        {open ? (
          <Menu {...args} items={fileMenu} labelledBy="menu-trigger" onClose={() => setOpen(false)} />
        ) : null}
      </div>
    )
  },
}

/** `orientation="vertical"` keeps Arrow Left/Right out of the menu, so they
 *  stay available to an ancestor (a `MenuBar`, for example). */
export const Orientation: Story = {
  args: { orientation: 'vertical' },
}

/** Every row state side by side: normal, checkable, unchecked, disabled. */
export const States: Story = {
  args: {
    items: [
      { id: 'normal', label: 'Normal row', onSelect: noop },
      { id: 'checked', label: 'Checked row', checked: true, onSelect: noop },
      { id: 'unchecked', label: 'Unchecked row', checked: false, onSelect: noop },
      { id: 'sep', label: '', type: 'separator' },
      { id: 'disabled', label: 'Disabled row', disabled: true, onSelect: noop },
    ],
  },
}
