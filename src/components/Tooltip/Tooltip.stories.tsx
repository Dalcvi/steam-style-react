import type { Meta, StoryObj } from '@storybook/react-vite'

import { Tooltip } from './Tooltip'

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    content: { control: 'text' },
    headline: { control: 'text' },
    children: { control: false },
    placement: { control: 'select', options: ['top', 'bottom', 'left', 'right'] },
    delay: { control: 'number' },
    compact: { control: 'boolean' },
    open: { control: 'boolean' },
    onOpenChange: { control: false },
  },
  args: {
    content: 'Reload the current page',
    placement: 'bottom',
    delay: 600,
    children: <button type="button">Reload</button>,
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithHeadline: Story = {
  args: {
    headline: 'Achievements locked',
    content: 'Launch the game once to unlock your achievement list.',
    children: (
      <button type="button" aria-label="Achievements help">
        ?
      </button>
    ),
  },
}

export const Compact: Story = {
  args: {
    content: 'Opens in the in-game browser',
    compact: true,
  },
}

export const WithKeyboardHint: Story = {
  args: {
    content: (
      <>
        Press <kbd className="vgui-tooltip__key">Shift</kbd> to run
      </>
    ),
  },
}

export const Placement: Story = {
  args: {
    placement: 'right',
  },
}

export const Controlled: Story = {
  args: {
    open: true,
    content: 'Held open by the open prop',
  },
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32 }}>
      <Tooltip content="Reload the current page">
        <button type="button">Reload</button>
      </Tooltip>
      <Tooltip compact content="Opens in the in-game browser">
        <button type="button">Browse</button>
      </Tooltip>
      <Tooltip
        open
        placement="bottom"
        headline="Achievements locked"
        content="Launch the game once to unlock your achievement list."
      >
        <button type="button">Achievements</button>
      </Tooltip>
    </div>
  ),
}
