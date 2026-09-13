import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { MenuBar } from './MenuBar'
import type { MenuBarItemSpec } from './MenuBar'

const noop = () => undefined

const items: MenuBarItemSpec[] = [
  {
    id: 'file',
    label: 'File',
    accessKey: 'f',
    items: [
      { id: 'new', label: 'New Game…', onSelect: noop },
      { id: 'open', label: 'Open…', onSelect: noop },
      { id: 'save', label: 'Save', onSelect: noop },
      { id: 'sep', label: '', type: 'separator' },
      { id: 'quit', label: 'Quit', onSelect: noop },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    accessKey: 'e',
    items: [
      { id: 'undo', label: 'Undo', onSelect: noop },
      { id: 'redo', label: 'Redo', disabled: true },
      { id: 'sep', label: '', type: 'separator' },
      { id: 'prefs', label: 'Preferences', onSelect: noop },
    ],
  },
  {
    id: 'view',
    label: 'View',
    accessKey: 'v',
    items: [
      { id: 'favourites', label: 'Favourites', checked: true, onSelect: noop },
      { id: 'history', label: 'History', checked: false, onSelect: noop },
      { id: 'sep', label: '', type: 'separator' },
      { id: 'fullscreen', label: 'Fullscreen', onSelect: noop },
    ],
  },
  { id: 'help', label: 'Help', accessKey: 'h', items: [{ id: 'about', label: 'About', onSelect: noop }] },
]

const meta = {
  title: 'Components/MenuBar',
  component: MenuBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A strip of top-level words, one `role="menubar"` with roving tabindex and a ' +
          'single tab stop. Arrow Left/Right moves between words, Down opens, Escape closes.\n\n' +
          '**Documented departure.** The VGUI original rests at `TitleDimText` (`#889180`), ' +
          'which is 2.31:1 on a GreenBG panel and fails WCAG 1.4.3 — it is only legible ' +
          'because VGUI dims an *entire* unfocused frame. A browser window can hold many ' +
          'panes, so this component rests at `--vgui-text-strong` and drops a rung of the ' +
          'ladder: white (idle/hover) → maize `--vgui-heading` (open). The open state also ' +
          'keeps the CSS port\'s `--vgui-surface-light` fill, which `steam.styles` itself ' +
          'does not draw.',
      },
    },
  },
  argTypes: {
    items: { control: false },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    onOpenChange: { control: false },
  },
  args: {
    items,
    orientation: 'horizontal',
  },
} satisfies Meta<typeof MenuBar>

export default meta
type Story = StoryObj<typeof meta>

/** Words really open here: the bar owns its open item and reports every change. */
export const Default: Story = {
  render: (args) => {
    const [openId, setOpenId] = useState<string | undefined>(undefined)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <MenuBar {...args} onOpenChange={setOpenId} />
        <p style={{ margin: 0, fontSize: 12 }}>
          open: <code>{openId ?? 'none'}</code>
        </p>
      </div>
    )
  },
}

/** `orientation="vertical"` lays the strip out as a column; Arrow Up/Down moves
 *  between words and Arrow Right opens the menu. */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
}

/** A disabled word renders `--vgui-text-disabled` with the VGUI text shadow, is
 *  not a tab stop and cannot be opened. */
export const DisabledWord: Story = {
  args: {
    items: [
      ...items.slice(0, 3),
      { id: 'tools', label: 'Tools', items: [{ id: 'hammer', label: 'Hammer', onSelect: noop }], disabled: true },
      items[3],
    ],
  },
}

/** `accessKey` is announced and rendered as the native attribute; `Alt`+letter
 *  is best-effort because it collides with the browser's own menus. */
export const AccessKeys: Story = {}

/** Normal, open and disabled words side by side. Hover and open are live states
 *  — click a word, or slide the pointer across the strip while one is open
 *  (VGUI's "menu switching", reproduced for pointer users). */
export const States: Story = {
  args: {
    items: [
      { id: 'normal', label: 'Normal', items: [{ id: 'a', label: 'Item', onSelect: noop }] },
      { id: 'another', label: 'Another', items: [{ id: 'b', label: 'Item', onSelect: noop }] },
      { id: 'disabled', label: 'Disabled', items: [{ id: 'c', label: 'Item', onSelect: noop }], disabled: true },
    ],
  },
}
