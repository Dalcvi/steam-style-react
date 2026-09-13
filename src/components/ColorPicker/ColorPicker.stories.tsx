import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { ColorPicker } from './ColorPicker'

const statusPalette = [
  { name: 'Success', value: '#1AE225' },
  { name: 'Warning', value: '#C4B550' },
  { name: 'Danger', value: '#E2251A' },
  { name: 'OffWhite', value: '#D8DED3' },
  { name: 'GreenBG', value: '#4C5844' },
  { name: 'DarkGreenBG', value: '#3E4637' },
  { name: 'MaizeBG', value: '#91863C' },
  { name: 'Link', value: '#AAAAAA' },
]

const meta = {
  title: 'Components/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    value: { control: 'text' },
    onValueChange: { control: false },
    palette: { control: false },
    hex: { control: 'boolean' },
    continuous: { control: 'boolean' },
    alpha: { control: 'boolean' },
    columns: { control: { type: 'number', min: 1, max: 36 } },
    swatchOnly: { control: 'boolean' },
    inline: { control: 'boolean' },
    disabled: { control: 'boolean' },
    className: { control: 'text' },
    style: { control: false },
  },
  args: {
    'aria-label': 'Team colour',
  },
} satisfies Meta<typeof ColorPicker>

export default meta
type Story = StoryObj<typeof meta>

/** Uncontrolled: the trigger shows the swatch, the hex label and the arrow. */
export const Default: Story = {}

/** `colorlist` in a property sheet: a bare swatch with no hex label. */
export const SwatchOnly: Story = {
  args: { swatchOnly: true },
}

/** The palette is a scheme resource, so the names are the corpus names. */
export const RestrictedPalette: Story = {
  args: { palette: statusPalette, columns: 4, 'aria-label': 'Status colour' },
}

/** `columns` is the grid width; the default 12 fits 36 colours in three rows. */
export const Columns: Story = {
  args: { columns: 6 },
}

/** The hex field edits the value directly; an invalid draft sets `aria-invalid`. */
export const Hex: Story = {
  args: { hex: true },
}

/** Alpha is a fourth channel — `#RRGGBBAA`, as the corpus writes it. */
export const Alpha: Story = {
  args: { alpha: true },
}

/** The hue strip and SV square. Not period-accurate, and off by default. */
export const Continuous: Story = {
  render: (args) => {
    const [value, setValue] = useState('#4C5844')
    return (
      <div style={{ display: 'flex', gap: 24 }}>
        <ColorPicker {...args} value={value} onValueChange={setValue} continuous hex />
        <output>{value}</output>
      </div>
    )
  },
}

/** No trigger and no panel: the grid is always visible. */
export const Inline: Story = {
  render: (args) => {
    const [value, setValue] = useState('#5A6A50')
    return <ColorPicker {...args} value={value} onValueChange={setValue} inline hex />
  },
}

/** A fully controlled picker; `onValueChange` only fires on commit. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('#91863C')
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <ColorPicker {...args} value={value} onValueChange={setValue} />
        <span>Selected {value}</span>
      </div>
    )
  },
}

/** The whole control is inert, panel included. */
export const Disabled: Story = {
  args: { disabled: true, alpha: true, hex: true },
}

/** A disabled grid with no trigger, for a read-only sheet. */
export const DisabledInline: Story = {
  args: { disabled: true, inline: true, swatchOnly: true },
}

/** Default, swatch-only, disabled and a restricted palette together. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <ColorPicker {...args} aria-label="Default" />
      <ColorPicker {...args} swatchOnly aria-label="Swatch only" />
      <ColorPicker {...args} disabled aria-label="Disabled" />
      <ColorPicker {...args} palette={statusPalette} columns={4} aria-label="Status colour" />
    </div>
  ),
}
