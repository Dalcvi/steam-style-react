import type { Meta, StoryObj } from '@storybook/react-vite'

import { Notification } from './Notification'

const meta = {
  title: 'Components/Notification',
  component: Notification,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    title: { control: 'text' },
    children: { control: 'text' },
    variant: { control: 'select', options: ['info', 'success', 'warning', 'error'] },
    icon: { control: false },
    corner: {
      control: 'select',
      options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    },
    dismissable: { control: 'boolean' },
    onDismiss: { control: false },
    duration: { control: 'number' },
    index: { control: 'number' },
  },
  args: {
    title: 'Gordon Freeman is now online',
    children: 'Playing Half-Life 2',
    variant: 'info',
    corner: 'bottom-right',
    dismissable: true,
  },
} satisfies Meta<typeof Notification>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Gordon Freeman is now online',
    children: 'Playing Half-Life 2',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Download complete',
    children: 'Half-Life 2: Episode Two is ready to play.',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Low disk space',
    children: 'Only 1.2 GB of free space remains.',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Error',
    children: 'Could not connect to the server.',
    // Errors never auto-dismiss, whatever the duration says.
    duration: 0,
  },
}

export const MessageOnly: Story = {
  args: {
    title: undefined,
    children: 'Achievement unlocked: Lambda Locator.',
    duration: 5000,
  },
}

export const Corners: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Notification corner="top-left" title="Top left" index={0}>
        Anchored to the top-left corner.
      </Notification>
      <Notification corner="top-right" title="Top right" index={1}>
        Anchored to the top-right corner.
      </Notification>
      <Notification corner="bottom-left" title="Bottom left" index={2}>
        Anchored to the bottom-left corner.
      </Notification>
      <Notification corner="bottom-right" title="Bottom right" index={3}>
        Anchored to the bottom-right corner.
      </Notification>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Notification variant="info" title="Gordon Freeman is now online" dismissable>
        Playing Half-Life 2
      </Notification>
      <Notification variant="success" title="Download complete">
        Half-Life 2: Episode Two is ready to play.
      </Notification>
      <Notification variant="warning" title="Low disk space">
        Only 1.2 GB of free space remains.
      </Notification>
      <Notification variant="error" title="Error" dismissable duration={5000}>
        Could not connect to the server.
      </Notification>
      <Notification variant="error" dismissable duration={5000}>
        Could not connect to the server.
      </Notification>
    </div>
  ),
}
