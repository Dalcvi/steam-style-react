import type { Meta, StoryObj } from '@storybook/react-vite'

import { StatusLabel } from '../StatusLabel'

import { StatusBar } from './StatusBar'

const meta = {
  title: 'Components/StatusBar',
  component: StatusBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    message: { control: 'text' },
    value: { control: { type: 'number', min: 0, max: 100 } },
    busy: { control: 'boolean' },
    href: { control: 'text' },
    align: { control: 'inline-radio', options: ['center', 'left'] },
    showValue: { control: 'boolean' },
    error: { control: 'boolean' },
    compact: { control: 'boolean' },
    children: { control: false },
  },
  args: {
    message: 'Downloading Team Fortress 2',
    value: 47,
    showValue: true,
    href: 'steam://open/downloads',
  },
} satisfies Meta<typeof StatusBar>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The reference bar from `uistatuspanel.layout:27`/`:32`: a 28px centred strip
 * with a clickable message and a 300×3 slim progress bar.
 */
export const Default: Story = {}

/** Indeterminate work — a throbber, not a bar with an unknown end. */
export const Busy: Story = {
  args: {
    message: 'Scanning for servers',
    value: undefined,
    showValue: false,
    busy: true,
  },
}

/** `HideOnCompletion`: the bar goes, the message stays. */
export const MessageOnly: Story = {
  args: {
    message: 'Download complete',
    value: undefined,
    showValue: false,
  },
}

/** `--left`, for a strip whose right-hand side carries other fields. */
export const LeftAligned: Story = {
  args: {
    align: 'left',
  },
}

/** `--compact`: 20px, for a dense tool window. */
export const Compact: Story = {
  args: {
    compact: true,
  },
}

/** The `--fields` extension: a row of arbitrary status fields. */
export const Fields: Story = {
  args: {
    message: undefined,
    value: undefined,
    showValue: false,
  },
  render: () => (
    <StatusBar>
      <StatusLabel>Ln 42, Col 7</StatusLabel>
      <StatusLabel>UTF-8</StatusLabel>
      <StatusLabel withDot>Connected</StatusLabel>
    </StatusBar>
  ),
}

/** Idle: neither a message nor a bar. The doc says do not render this. */
export const Idle: Story = {
  args: {
    message: undefined,
    value: undefined,
    showValue: false,
  },
}

/** Every documented state together, stacked as the strip would shift. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <StatusBar message="Downloading Team Fortress 2" value={47} showValue href="steam://open/downloads" />
      <StatusBar message="Scanning for servers" busy />
      <StatusBar message="Download paused" value={47} showValue />
      <StatusBar message="Download complete" href="steam://open/downloads" />
      <StatusBar message="Connection failed" error showValue />
      <StatusBar message="Downloading Team Fortress 2" value={47} showValue align="left" />
      <StatusBar message="Downloading Team Fortress 2" value={47} compact />
      <StatusBar>
        <StatusLabel>Ln 42, Col 7</StatusLabel>
        <StatusLabel>UTF-8</StatusLabel>
        <StatusLabel withDot>Connected</StatusLabel>
      </StatusBar>
    </div>
  ),
}
