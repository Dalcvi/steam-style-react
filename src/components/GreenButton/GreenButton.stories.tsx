import type { Meta, StoryObj } from '@storybook/react-vite'

import { GreenButton } from './GreenButton'

const meta = {
  title: 'Components/GreenButton',
  component: GreenButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    fullWidth: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'Button',
  },
} satisfies Meta<typeof GreenButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const FullWidth: Story = {
  args: {
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
}

export const Row: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <GreenButton {...args} />
      <GreenButton {...args}>Cancel</GreenButton>
      <GreenButton {...args} disabled>
        Disabled
      </GreenButton>
    </div>
  ),
}
