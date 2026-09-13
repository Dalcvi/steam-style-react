import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Radio, RadioGroup } from './Radio'

const meta = {
  title: 'Components/Radio',
  component: Radio,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    value: { control: 'text', description: 'Value reported to the enclosing RadioGroup.' },
    label: { control: 'text', description: 'The label. Rendered as part of the clickable area.' },
    checked: { control: 'boolean', description: 'Controlled checked state.' },
    disabled: { control: 'boolean', description: 'Disable the radio.' },
    onChange: { control: false, description: 'Called when the checked state changes.' },
    name: { control: 'text', description: 'Shared input name. Normally provided by RadioGroup.' }
  },
  args: {
    value: 'windowed',
    label: 'Run in a window',
    disabled: false
  }
} satisfies Meta<typeof Radio>

export default meta
type Story = StoryObj<typeof meta>

/** Uncontrolled: the group keeps the selected value. */
export const Default: Story = {
  render: (args) => (
    <RadioGroup label="Display mode" defaultValue="windowed">
      <Radio value="fullscreen" label="Fullscreen" />
      <Radio {...args} />
      <Radio value="borderless" label="Borderless window" />
    </RadioGroup>
  )
}

/** Controlled through the parent. */
export const Controlled: Story = {
  render: () => {
    const [mode, setMode] = useState('fullscreen')
    return (
      <RadioGroup label="Display mode" value={mode} onValueChange={setMode}>
        <Radio value="fullscreen" label="Fullscreen" />
        <Radio value="windowed" label="Run in a window" />
        <Radio value="borderless" label="Borderless window" />
      </RadioGroup>
    )
  }
}

export const Horizontal: Story = {
  render: () => (
    <RadioGroup label="Microphone" orientation="horizontal" defaultValue="ptt">
      <Radio value="off" label="Disabled" />
      <Radio value="open" label="Open mic" />
      <Radio value="ptt" label="Push to talk" />
    </RadioGroup>
  )
}

export const Disabled: Story = {
  render: () => (
    <RadioGroup label="Display mode" defaultValue="windowed">
      <Radio value="fullscreen" label="Fullscreen" disabled />
      <Radio value="windowed" label="Run in a window" />
    </RadioGroup>
  )
}

/** A disabled group disables every radio inside it. */
export const DisabledGroup: Story = {
  render: () => (
    <RadioGroup label="Quality" defaultValue="high" disabled>
      <Radio value="low" label="Low" />
      <Radio value="high" label="High" />
    </RadioGroup>
  )
}

/** Selected, unselected and disabled together. */
export const States: Story = {
  render: () => (
    <RadioGroup label="Display mode" defaultValue="fullscreen">
      <Radio value="fullscreen" label="Selected" />
      <Radio value="windowed" label="Unselected" />
      <Radio value="borderless" label="Disabled" disabled />
    </RadioGroup>
  )
}
