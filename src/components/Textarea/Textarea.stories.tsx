import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Textarea } from './Textarea'

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    rows: { control: { type: 'number', min: 1, max: 20 } },
    autoGrow: { control: 'boolean' },
    maxHeight: { control: { type: 'number', min: 60, max: 600 } },
    resize: { control: 'inline-radio', options: ['none', 'vertical'] },
    mono: { control: 'boolean' },
    showCount: { control: 'boolean' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    maxLength: { control: 'number' },
    placeholder: { control: 'text' },
  },
  args: {
    'aria-label': 'Ban reason',
    rows: 4,
    placeholder: 'Optional',
    style: { width: 320 },
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** `rows` sets the height and the user can still drag it vertically. */
export const FixedHeight: Story = {
  args: { resize: 'none' },
}

/** Grows to fit content, clamped at `maxHeight`. */
export const AutoGrow: Story = {
  args: { autoGrow: true, rows: 1 },
}

/** Console output and config snippets. */
export const Mono: Story = {
  args: {
    mono: true,
    rows: 8,
    readOnly: true,
    defaultValue: 'sv_cheats 1\nmp_timelimit 30\nhostname "Green Steam"',
  },
}

/** The count is `aria-hidden`; the announcement comes from `maxLength`. */
export const WithCount: Story = {
  args: { showCount: true, maxLength: 256, rows: 3 },
}

export const Invalid: Story = {
  args: { invalid: true, 'aria-invalid': 'true', defaultValue: 'x'.repeat(20) },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Locked by the server administrator.' },
}

export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: 'Team Fortress 2\nCounter-Strike 1.6' },
}

export const Controlled: Story = {
  args: { maxLength: 40, showCount: true },
  render: (args) => {
    const [value, setValue] = useState('')
    return (
      <Textarea
        {...args}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Type a profile description"
      />
    )
  },
}

/** Normal, invalid, disabled and read-only together. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
      <Textarea {...args} defaultValue="Normal" />
      <Textarea {...args} invalid defaultValue="Invalid" />
      <Textarea {...args} disabled defaultValue="Disabled" />
      <Textarea {...args} readOnly defaultValue="Read-only" />
    </div>
  ),
}
