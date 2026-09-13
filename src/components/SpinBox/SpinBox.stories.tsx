import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { SpinBox } from './SpinBox'

const meta = {
  title: 'Components/SpinBox',
  component: SpinBox,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    value: { control: 'number' },
    onValueChange: { control: false },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    decimal: { control: 'boolean' },
    wrap: { control: 'boolean' },
    noSteppers: { control: 'boolean' },
    horizontal: { control: 'boolean' },
    small: { control: 'boolean' },
    valueText: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    min: 1,
    max: 100,
    step: 1,
    'aria-label': 'Max players',
  },
} satisfies Meta<typeof SpinBox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { defaultValue: 16 },
}

export const Decimal: Story = {
  args: {
    defaultValue: 6,
    min: 0.1,
    max: 20,
    step: 0.5,
    decimal: true,
    valueText: '6 degrees',
    'aria-label': 'Field of view',
  },
}

export const Horizontal: Story = {
  args: { defaultValue: 4, horizontal: true },
}

export const Compact: Story = {
  args: { defaultValue: 128, min: 1, max: 999, small: true, 'aria-label': 'Tickrate' },
}

export const NoSteppers: Story = {
  args: { defaultValue: 128, min: 1, max: 999, noSteppers: true, small: true },
}

export const Wrap: Story = {
  args: { defaultValue: 100, wrap: true },
}

export const Disabled: Story = {
  args: { defaultValue: 16, disabled: true },
}

/** At a bound the relevant stepper disables, which is how the range is taught. */
export const AtLimit: Story = {
  args: { defaultValue: 1 },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <SpinBox {...args} value={1} aria-label="At min" />
      <SpinBox {...args} value={100} aria-label="At max" />
    </div>
  ),
}

/** `onValueChange` fires on commit only, never per keystroke. */
export const Controlled: Story = {
  render: (args) => {
    const [players, setPlayers] = useState(16)
    const [commits, setCommits] = useState(0)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <SpinBox
          {...args}
          value={players}
          onValueChange={(next) => {
            setPlayers(next)
            setCommits((n) => n + 1)
          }}
        />
        <span>
          {players} players · {commits} commits
        </span>
      </div>
    )
  },
}

/** Every documented variant side by side. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
      <SpinBox {...args} defaultValue={16} />
      <SpinBox {...args} defaultValue={6} step={0.5} decimal min={0.1} max={20} aria-label="Decimal" />
      <SpinBox {...args} defaultValue={4} horizontal aria-label="Horizontal" />
      <SpinBox {...args} defaultValue={128} min={1} max={999} small aria-label="Compact" />
      <SpinBox {...args} defaultValue={128} min={1} max={999} noSteppers small aria-label="No steppers" />
      <SpinBox {...args} defaultValue={16} disabled aria-label="Disabled" />
    </div>
  ),
}
