import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Select } from './Select'
import type { SelectOption } from './Select'

const resolutions: SelectOption[] = [
  { value: '800x600', label: '800 × 600' },
  { value: '1024x768', label: '1024 × 768' },
  { value: '1280x960', label: '1280 × 960' },
  { value: '1600x1200', label: '1600 × 1200' },
  { value: 'widescreen', label: 'Widescreen', disabled: true },
]

const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    options: { control: 'object' },
    value: { control: 'text' },
    defaultValue: { control: 'text' },
    onValueChange: { control: false },
    placeholder: { control: 'text' },
    editable: { control: 'boolean' },
    onInputChange: { control: false },
    size: { control: 'inline-radio', options: ['small', 'default', 'large'] },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    id: { control: 'text' },
    name: { control: 'text' },
    'aria-label': { control: 'text' },
    'aria-labelledby': { control: 'text' },
  },
  args: {
    options: resolutions,
    defaultValue: '1024x768',
    'aria-label': 'Resolution',
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Placeholder: Story = {
  args: { defaultValue: undefined, placeholder: 'Choose a resolution' },
}

export const Small: Story = {
  args: { size: 'small' },
}

export const Large: Story = {
  args: { size: 'large' },
}

export const Invalid: Story = {
  args: { invalid: true },
}

export const Clay: Story = {
  args: { className: 'vgui-select--clay' },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('800x600')
    return <Select {...args} value={value} onValueChange={setValue} />
  },
}

export const Editable: Story = {
  args: { options: resolutions, defaultValue: '' },
  render: (args) => {
    const [ping, setPing] = useState('')
    return <Select {...args} editable value={ping} onInputChange={setPing} onValueChange={setPing} />
  },
}

export const EditableFreeText: Story = {
  args: { options: [], defaultValue: '', placeholder: '36', 'aria-label': 'Server port' },
  render: (args) => {
    const [port, setPort] = useState('')
    return <Select {...args} editable value={port} onInputChange={setPort} />
  },
}

export const FormSubmission: Story = {
  args: { name: 'resolution' },
}

/** A visible `<label>`, which is how `FieldLabel htmlFor` names the control. */
export const Labelled: Story = {
  args: { 'aria-label': undefined, id: 'resolution' },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor="resolution">Resolution</label>
      <Select {...args} id="resolution" />
    </div>
  ),
}

/** Every documented variant and state side by side. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 240 }}>
      <Select {...args} />
      <Select {...args} size="small" />
      <Select {...args} size="large" />
      <Select {...args} defaultValue={undefined} placeholder="Choose a resolution" />
      <Select {...args} invalid />
      <Select {...args} className="vgui-select--clay" />
      <Select {...args} disabled />
    </div>
  ),
}

/** Non-Latin labels, which the fixed 19px field must not clip. */
export const Localisation: Story = {
  args: {
    options: [
      { value: 'en', label: 'English' },
      { value: 'fr', label: 'Français' },
      { value: 'de', label: 'Deutsch' },
      { value: 'ru', label: 'Русский' },
      { value: 'zh', label: '简体中文' },
    ],
    defaultValue: 'de',
    'aria-label': 'Language',
    id: 'language',
  },
}
