import type { Meta, StoryObj } from '@storybook/react-vite'

import { Spinner } from './Spinner'

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: { control: { type: 'number', min: 16, max: 64 } },
    block: { control: 'boolean' },
    paused: { control: 'boolean' },
    label: { control: 'text' },
    showLabel: { control: 'boolean' },
    frames: { control: 'text' },
    durationMs: { control: 'number' },
    children: { control: 'text' },
  },
  args: {},
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

/** The canonical case: a 20×20 throbber at the end of a URL field. */
export const Default: Story = {}

/** The at-rest frame — a queued download that has not started. */
export const Paused: Story = {
  args: {
    paused: true,
    label: 'Queued',
  },
}

/** A visible label, which is what a reduced-motion user needs. */
export const ShowLabel: Story = {
  args: {
    showLabel: true,
    children: 'Loading server list…',
  },
}

/** A black plate covering the region it blocks. */
export const Block: Story = {
  args: {
    block: true,
    label: 'Capturing screenshot',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, height: 200 }}>
        <Story />
      </div>
    ),
  ],
}

/** A consumer's own frame set, stepped the same way. */
export const SpriteSheet: Story = {
  args: {
    frames: '/assets/minithrobber.png',
  },
}

/** A larger throbber, for placement in a dialog. */
export const Large: Story = {
  args: {
    size: 32,
    durationMs: 900,
  },
}

/** Every documented variant and state together. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <Spinner {...args} />
      <Spinner {...args} paused label="Queued" />
      <Spinner {...args} showLabel>
        Loading…
      </Spinner>
      <Spinner {...args} size={32} />
      <Spinner {...args} frames="/assets/minithrobber.png" />
    </div>
  ),
}
