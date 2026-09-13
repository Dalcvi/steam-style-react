import type { Meta, StoryObj } from '@storybook/react-vite'

import { LevelMeter } from './LevelMeter'

const meta = {
  title: 'Components/LevelMeter',
  component: LevelMeter,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    level: {
      description: 'Current level, 0…segments. Values are clamped.',
      control: { type: 'number' },
    },
    segments: {
      description: 'Number of segments. 4 matches the sprite family; other values are an extension.',
      control: { type: 'number' },
    },
    direction: {
      description: 'Descending rather than ascending segment heights.',
      control: { type: 'inline-radio' },
      options: ['up', 'down'],
    },
    inline: {
      description: 'Compact 12px segments, for table cells.',
      control: { type: 'boolean' },
    },
    animating: {
      description: 'Pulse the lit segments while the level is being measured.',
      control: { type: 'boolean' },
    },
    disabled: {
      description: 'Render and apply a disabled treatment.',
      control: { type: 'boolean' },
    },
    valueText: {
      description: 'Text announced to assistive tech, e.g. "Good". Strongly recommended.',
      control: { type: 'text' },
    },
  },
  args: {
    level: 3,
    segments: 4,
    direction: 'up',
    inline: false,
    animating: false,
    disabled: false,
    valueText: 'Good',
  },
} satisfies Meta<typeof LevelMeter>

export default meta
type Story = StoryObj<typeof meta>

/** `rampUp_1..4`: later segments are taller. */
export const Default: Story = {}

/** `rampDown_1..4` — the direction with corpus evidence for its appearance. */
export const Down: Story = {
  args: { direction: 'down', level: 2, valueText: 'Fair' },
}

/** 12px segments, for a server-list row. */
export const Inline: Story = {
  args: { inline: true, valueText: 'Good — 42ms' },
}

/** Past four frames the artwork stops backing the count; the step is derived. */
export const Segments: Story = {
  args: { segments: 6, level: 4, valueText: 'Excellent' },
}

/** Meaningful motion for a voice-activity meter; CSS-only, reduced-motion aware. */
export const Animating: Story = {
  args: { animating: true, direction: 'down', level: 3, valueText: 'Speaking' },
}

/** Level 0 is a real reading, never an indeterminate state. */
export const LevelZero: Story = {
  args: { level: 0, valueText: 'Silent' },
}

/** Every documented reading: 0 through 4, with the meaning spelled out. */
export const Levels: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { level: 0, valueText: 'Silent' },
        { level: 1, valueText: 'Poor — 180ms' },
        { level: 2, valueText: 'Fair — 120ms' },
        { level: 3, valueText: 'Good — 60ms' },
        { level: 4, valueText: 'Excellent — 20ms' },
      ].map((reading) => (
        <LevelMeter key={reading.level} {...args} {...reading} />
      ))}
    </div>
  ),
}

/** Every documented state: each level, both directions, inline, disabled, animating. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <LevelMeter {...args} level={0} valueText="Level 0 — all segments unlit" />
      <LevelMeter {...args} level={1} valueText="Level 1 — ping-low" />
      <LevelMeter {...args} level={2} valueText="Level 2 — ping-medium" />
      <LevelMeter {...args} level={3} valueText="Level 3 — heading, not ping-high" />
      <LevelMeter {...args} level={4} valueText="Level 4 — full" />
      <LevelMeter {...args} level={3} direction="down" valueText="Descending ramp" />
      <LevelMeter {...args} level={2} inline valueText="Inline, 12px" />
      <LevelMeter {...args} level={3} disabled valueText="Disabled" />
      <LevelMeter {...args} level={3} animating valueText="Animating" />
    </div>
  ),
}
