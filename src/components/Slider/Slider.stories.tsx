import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Slider } from './Slider'

const meta = {
  title: 'Components/Slider',
  component: Slider,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    value: { control: 'number' },
    onValueChange: { control: false },
    onValueCommit: { control: false },
    formatValue: { control: false },
    ticks: { control: 'boolean' },
    showValue: { control: 'boolean' },
    small: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 50,
    'aria-label': 'Master volume',
  },
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
}

export const WithTicks: Story = {
  args: { ticks: true },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
}

export const WithValue: Story = {
  args: { showValue: true, formatValue: (v: number) => `${v}%` },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
}

export const Small: Story = {
  args: { small: true },
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
}

export const Disabled: Story = {
  args: { disabled: true, ticks: true },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
}

/** The two callbacks mirror the native `input`/`change` pair. */
export const Volume: Story = {
  render: (args) => {
    const [volume, setVolume] = useState(50)
    const [committed, setCommitted] = useState(50)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 320 }}>
        <Slider
          {...args}
          value={volume}
          onValueChange={setVolume}
          onValueCommit={setCommitted}
          formatValue={(v) => `${v}%`}
          ticks
          showValue
        />
        <span>Saved volume: {committed}%</span>
      </div>
    )
  },
}

/** Every documented variant side by side. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
      <Slider {...args} />
      <Slider {...args} ticks />
      <Slider {...args} showValue formatValue={(v) => `${v}%`} />
      <Slider {...args} small />
      <Slider {...args} ticks disabled />
      <Slider
        {...args}
        min={0.1}
        max={20}
        step={0.1}
        defaultValue={6}
        showValue
        formatValue={(v) => `${v.toFixed(1)} times`}
      />
    </div>
  ),
}
