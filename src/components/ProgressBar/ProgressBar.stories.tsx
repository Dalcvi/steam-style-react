import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { ProgressBar } from './ProgressBar'

const meta = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
    max: { control: 'number' },
    showValue: { control: 'boolean' },
    label: { control: 'text' },
    small: { control: 'boolean' },
    error: { control: 'boolean' },
    continuous: { control: 'boolean' },
  },
  args: {
    value: 45,
    label: 'Verifying game cache',
    showValue: true,
    style: { width: 360 },
  },
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

export const Determinate: Story = {}

/** No `value` → no `aria-valuenow`, so assistive tech announces "busy". */
export const Indeterminate: Story = {
  args: { value: undefined, label: 'Connecting to 203.0.113.4:27015', showValue: false },
}

/** `ContinuousProgressBar`: no discrete percentage, advancing on its own. */
export const Continuous: Story = {
  args: { value: undefined, continuous: true, label: 'Indexing content', showValue: false },
}

/** A label under the bar; `--vgui-text` on the trough is 7.17:1. */
export const WithLabel: Story = {
  args: { value: 80, label: 'Restarting Steam' },
}

/** For inline use next to text. */
export const Small: Story = {
  args: { value: 62, small: true, showValue: false, label: 'Uploading', style: { width: 180 } },
}

/** The frame carries the error; pair it with a message via `aria-describedby`. */
export const Error: Story = {
  args: { value: 80, error: true, label: 'Download failed' },
}

/** A non-percentage unit goes through `formatValue` and `aria-valuetext`. */
export const Bytes: Story = {
  args: {
    value: 4.2,
    max: 12,
    label: 'Downloading de_dust2',
    formatValue: (value: number, max: number) => `${value.toFixed(1)} of ${max} MB`,
  },
}

/** Complete: the stripe reaches the far edge with its phase intact. */
export const Complete: Story = {
  args: { value: 100, label: 'Update complete', showValue: false },
}

/** A download that actually advances, so the stripe phase is visible. */
export const Animated: Story = {
  render: (args) => {
    const [value, setValue] = useState(4)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 360 }}>
        <ProgressBar {...args} value={value} label="Downloading de_dust2" />
        <input
          aria-label="Progress"
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
        />
      </div>
    )
  },
}

/** Determinate, indeterminate, error and small together. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 360 }}>
      <ProgressBar {...args} value={72} label="Determinate" />
      <ProgressBar {...args} value={undefined} label="Indeterminate" showValue={false} />
      <ProgressBar {...args} value={80} label="Error" error />
      <ProgressBar {...args} value={30} label="Small" small />
    </div>
  ),
}
