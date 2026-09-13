import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../Button'
import { Panel } from './Panel'

const meta = {
  title: 'Components/Panel',
  component: Panel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    heading: { control: 'text' },
    inset: { control: 'boolean' },
    rounded: { control: 'boolean' },
    headingLevel: { control: 'inline-radio', options: [1, 2, 3, 4, 5, 6] },
  },
  args: {
    heading: 'Server settings',
    children: 'Body content goes here.',
  },
} satisfies Meta<typeof Panel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Inset: Story = {
  args: { inset: true },
}

export const Rounded: Story = {
  args: { rounded: true },
}

export const WithoutHeading: Story = {
  args: { heading: undefined },
}

export const WithHeadingLevel: Story = {
  args: { headingLevel: 2 },
}

export const Nested: Story = {
  render: (args) => (
    <div style={{ width: 420 }}>
      <Panel {...args} heading="Server browser" headingLevel={2}>
        <Panel inset rounded heading="Filters">
          <p style={{ margin: '0 0 8px' }}>Anticheat: required</p>
          <Button>Apply</Button>
        </Panel>
      </Panel>
    </div>
  ),
}

export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <Panel {...args} heading="Raised">
        Raised bevel
      </Panel>
      <Panel {...args} heading="Inset" inset>
        Inverted bevel
      </Panel>
      <Panel {...args} rounded>
        Rounded, no bevel
      </Panel>
    </div>
  ),
}
