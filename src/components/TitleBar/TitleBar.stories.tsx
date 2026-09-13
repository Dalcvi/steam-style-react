import type { Meta, StoryObj } from '@storybook/react-vite'

import { TitleBar } from './TitleBar'

const meta = {
  title: 'Components/TitleBar',
  component: TitleBar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    children: { control: 'text' },
    icon: { control: false },
    actions: { control: false },
    clay: { control: 'boolean' },
    subdued: { control: 'boolean' },
    level: { control: 'select', options: [1, 2, 3, 4, 5, 6] },
    actionsLabel: { control: 'text' },
  },
  args: {
    children: 'Player list',
  },
} satisfies Meta<typeof TitleBar>

export default meta
type Story = StoryObj<typeof meta>

const glyph = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <circle cx="8" cy="8" r="6" fill="currentColor" />
  </svg>
)

const controls = (
  <>
    <button type="button" aria-label="Minimize">
      _
    </button>
    <button type="button" aria-label="Close">
      x
    </button>
  </>
)

export const Default: Story = {}

export const Clay: Story = {
  args: {
    children: 'Properties',
    clay: true,
  },
}

export const Subdued: Story = {
  args: {
    children: 'Player list (inactive)',
    subdued: true,
  },
}

export const WithIcon: Story = {
  args: {
    children: 'Friends',
    icon: glyph,
  },
}

export const WithActions: Story = {
  args: {
    actions: controls,
    actionsLabel: 'Window controls',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
}

export const Heading: Story = {
  args: {
    children: 'Server browser',
    level: 2,
  },
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 320 }}>
      <TitleBar icon={glyph} actions={controls} actionsLabel="Window controls">
        Player list
      </TitleBar>
      <TitleBar clay>Properties</TitleBar>
      <TitleBar subdued>Player list (inactive)</TitleBar>
    </div>
  ),
}
