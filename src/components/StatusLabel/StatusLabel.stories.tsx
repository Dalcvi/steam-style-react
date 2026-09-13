import type { Meta, StoryObj } from '@storybook/react-vite'

import { StatusLabel } from './StatusLabel'

const meta = {
  title: 'Components/StatusLabel',
  component: StatusLabel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    children: { control: 'text' },
    href: { control: 'text' },
    withDot: { control: 'boolean' },
    strong: { control: 'boolean' },
    accessiblePrefix: { control: 'text' },
    live: { control: 'inline-radio', options: ['off', 'polite', 'assertive'] },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'Downloading…',
  },
} satisfies Meta<typeof StatusLabel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** `--link` — an anchor that brightens to white on hover. */
export const Link: Story = {
  args: {
    href: 'steam://open/downloads',
    children: 'Downloading game',
  },
}

/** `--with-dot` — a 6px square marker in the current text colour. */
export const WithDot: Story = {
  args: {
    withDot: true,
    children: 'Connected',
  },
}

/** `--strong` — no uppercase transform, for strings over ~20 characters. */
export const Strong: Story = {
  args: {
    strong: true,
    children: 'Signed in as dalcvi',
  },
}

/** Opt-in live region: announced, but only for user-initiated changes. */
export const Live: Story = {
  args: {
    live: 'polite',
    children: 'Ready',
  },
}

/** A visually hidden prefix keeps a bare readout understandable. */
export const AccessiblePrefix: Story = {
  args: {
    accessiblePrefix: 'Status:',
    children: '47%',
    live: 'polite',
  },
}

/** Every documented variant and state together. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <StatusLabel {...args}>Downloading…</StatusLabel>
      <StatusLabel {...args} href="steam://open/downloads">
        Downloading game
      </StatusLabel>
      <StatusLabel {...args} withDot>
        Connected
      </StatusLabel>
      <StatusLabel {...args} strong>
        Signed in as dalcvi
      </StatusLabel>
      <StatusLabel {...args} withDot strong>
        Away — idle for 12 minutes
      </StatusLabel>
      <StatusLabel {...args} disabled>
        Idle
      </StatusLabel>
    </div>
  ),
}
