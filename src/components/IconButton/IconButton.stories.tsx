import type { Meta, StoryObj } from '@storybook/react-vite'

import { IconButton } from './IconButton'

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    label: { control: 'text' },
    icon: { control: 'select', options: ['back', 'forward', 'home', 'reload', 'stop', 'close'] },
    size: { control: 'inline-radio', options: [15, 18, 20, 25] },
    frameless: { control: 'boolean' },
    toggled: { control: 'boolean' },
    clay: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'Reload',
    icon: 'reload',
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Frame-control size: the 20px face, the client's densest chrome. */
export const Small: Story = {
  args: { size: 15, label: 'Minimize', icon: 'minimize' },
}

/** Scrollbar and combobox size. */
export const Gutter: Story = {
  args: { size: 18, icon: 'arrow-down', label: 'Scroll down' },
}

/** Toolbar size — the only variant that clears 24×24 without a hit-area shim. */
export const Large: Story = {
  args: { size: 25, label: 'Home', icon: 'home' },
}

export const Frameless: Story = {
  args: { frameless: true, icon: 'chevron-down', label: 'Show options' },
}

export const Toggled: Story = {
  args: { toggled: true, icon: 'grid', label: 'Grid view' },
}

export const Clay: Story = {
  args: { clay: true, label: 'Close', icon: 'close', size: 25 },
}

export const Disabled: Story = {
  args: { disabled: true, label: 'Stop loading', icon: 'stop' },
}

/** Every documented size and face, plus the latched and frameless states. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <IconButton {...args} size={15} label="Minimize" icon="minimize" />
        <IconButton {...args} size={18} label="Scroll down" icon="arrow-down" />
        <IconButton {...args} size={20} label="Reload" icon="reload" />
        <IconButton {...args} size={25} label="Home" icon="home" />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <IconButton {...args} label="Grid view" icon="grid" toggled />
        <IconButton {...args} label="Show options" icon="chevron-down" frameless />
        <IconButton {...args} label="Close" icon="close" clay />
        <IconButton {...args} label="Stop loading" icon="stop" disabled />
      </div>
    </div>
  ),
}

/** A toolbar row — the nav bar's back/forward/reload cluster. */
export const ToolbarRow: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 2 }}>
      <IconButton {...args} size={25} label="Back" icon="back" />
      <IconButton {...args} size={25} label="Forward" icon="forward" />
      <IconButton {...args} size={25} label="Reload" icon="reload" />
      <IconButton {...args} size={25} label="Home" icon="home" />
      <IconButton {...args} size={25} label="Stop loading" icon="stop" toggled />
    </div>
  ),
}
