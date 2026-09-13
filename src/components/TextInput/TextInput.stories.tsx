import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { TextInput } from './TextInput'

const meta = {
  title: 'Components/TextInput',
  component: TextInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['default', 'large'] },
    icon: { control: 'text' },
    suffix: { control: 'text' },
    invalid: { control: 'boolean' },
    clay: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    placeholder: { control: 'text' },
    type: { control: 'inline-radio', options: ['text', 'search', 'email', 'password', 'tel'] },
  },
  args: {
    'aria-label': 'Server address',
    placeholder: '203.0.113.4:27015',
    autoComplete: 'off',
  },
} satisfies Meta<typeof TextInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The dialog height: 25px, so it lines up with a Button. */
export const Large: Story = {
  args: { size: 'large' },
}

/** Search fields carry a leading glyph. */
export const WithIcon: Story = {
  args: { icon: '\u2315', type: 'search', placeholder: 'Filter servers' },
}

/** Units belong inside the field, pinned to the trailing edge. */
export const WithSuffix: Story = {
  args: { suffix: 'ms', defaultValue: '60', inputMode: 'numeric' },
}

/** `invalid` draws the danger bevel but leaves `aria-invalid` to the caller. */
export const Invalid: Story = {
  args: { invalid: true, defaultValue: '99999' },
  render: (args) => (
    <div>
      <TextInput {...args} aria-describedby="port-error" />
      <span id="port-error">Port must be between 1 and 65535.</span>
    </div>
  ),
}

export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: 'F:\Steam\steamapps' },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Unavailable' },
}

export const Clay: Story = {
  args: { clay: true, defaultValue: 'hostname' },
}

/** Interactive because the field is genuinely controlled. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('')
    return (
      <TextInput
        {...args}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Type anything"
      />
    )
  },
}

/** Normal, read-only, invalid and disabled side by side. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 240 }}>
      <TextInput {...args} defaultValue="F:\Steam\steamapps" />
      <TextInput {...args} readOnly defaultValue="F:\Steam\steamapps" />
      <TextInput {...args} invalid defaultValue="99999" />
      <TextInput {...args} disabled defaultValue="F:\Steam\steamapps" />
    </div>
  ),
}
