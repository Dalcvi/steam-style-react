import type { Meta, StoryObj } from '@storybook/react-vite'

import { GreenButton } from '../GreenButton'
import { GreenPanel } from './GreenPanel'

const meta = {
  title: 'Components/GreenPanel',
  component: GreenPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    heading: { control: 'text' },
    inset: { control: 'boolean' },
    rounded: { control: 'boolean' },
  },
  args: {
    heading: 'Panel',
    children: 'Body content goes here.',
  },
} satisfies Meta<typeof GreenPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Inset: Story = {
  args: {
    inset: true,
  },
}

export const Rounded: Story = {
  args: {
    rounded: true,
  },
}

export const WithoutHeading: Story = {
  args: {
    heading: undefined,
  },
}

export const Nested: Story = {
  render: (args) => (
    <div style={{ width: 420 }}>
      <GreenPanel {...args} heading="Server browser">
        <GreenPanel inset rounded heading="Filters">
          <p>Anticheat: required</p>
          <GreenButton>Apply</GreenButton>
        </GreenPanel>
      </GreenPanel>
    </div>
  ),
}
