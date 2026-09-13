import type { Meta, StoryObj } from '@storybook/react-vite'

import { Divider } from './Divider'

const meta = {
  title: 'Components/Divider',
  component: Divider,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    inset: { control: 'boolean' },
    vertical: { control: 'boolean' },
    spaced: { control: 'boolean' },
  },
  args: {
    inset: false,
    vertical: false,
    spaced: false,
  },
} satisfies Meta<typeof Divider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
}

export const Inset: Story = {
  args: { inset: true },
  decorators: Default.decorators,
}

export const Spaced: Story = {
  args: { spaced: true },
  decorators: Default.decorators,
}

export const Vertical: Story = {
  args: { vertical: true },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', alignItems: 'stretch', height: 40 }}>
        <Story />
      </div>
    ),
  ],
}

export const Row: Story = {
  render: () => (
    <div style={{ width: 280 }}>
      <Divider />
      <div style={{ height: 12 }} />
      <Divider inset />
      <Divider spaced />
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, height: 32 }}>
        <span>Back</span>
        <Divider vertical />
        <span>Reload</span>
        <Divider vertical inset />
        <span>Stop</span>
      </div>
    </div>
  ),
}
