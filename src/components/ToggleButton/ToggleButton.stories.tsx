import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { ToggleButton } from './ToggleButton'

const meta = {
  title: 'Components/ToggleButton',
  component: ToggleButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    pressed: { control: 'boolean', description: 'Controlled pressed state. Omit for uncontrolled.' },
    defaultPressed: { control: 'boolean', description: 'Initial pressed state when uncontrolled.' },
    onPressedChange: { control: false, description: 'Called with the next pressed state.' },
    icon: { control: 'text', description: 'Optional leading glyph: a built-in glyph name or a node.' },
    iconOnly: { control: 'boolean', description: 'Square variant, glyph only. Requires `label`.' },
    label: { control: 'text', description: 'Accessible name. Required when `iconOnly`.' },
    small: { control: 'boolean', description: 'Compact variant for toolbars.' },
    clay: { control: 'boolean', description: 'Grey property-sheet face.' },
    children: { control: 'text', description: 'The visible label.' },
    disabled: { control: 'boolean', description: 'Disable the button.' }
  },
  args: {
    defaultPressed: false,
    small: false,
    clay: false,
    iconOnly: false,
    children: 'Show details'
  }
} satisfies Meta<typeof ToggleButton>

export default meta
type Story = StoryObj<typeof meta>

/** Off. Raised bevel, `#4C5844` face. */
export const Default: Story = {}

/** Latched on: the bevel inverts and the face darkens to `DarkGreenBG`. */
export const Pressed: Story = {
  args: { defaultPressed: true }
}

/** Uncontrolled — the component keeps the state. */
export const Uncontrolled: Story = {
  args: { defaultPressed: false }
}

/** Controlled — the parent keeps the state. */
export const Controlled: Story = {
  render: (args) => {
    const [pressed, setPressed] = useState(false)
    return (
      <ToggleButton {...args} pressed={pressed} onPressedChange={setPressed}>
        Show details
      </ToggleButton>
    )
  }
}

export const WithIcon: Story = {
  args: { icon: 'list', children: 'Show details' }
}

/** Square glyph-only variant. `label` carries the accessible name. */
export const IconOnly: Story = {
  args: { icon: 'pin', iconOnly: true, label: 'Pin panel' }
}

export const Small: Story = {
  args: { small: true, children: 'Details' }
}

export const Clay: Story = {
  args: { clay: true, children: 'Advanced' }
}

export const Disabled: Story = {
  args: { disabled: true, children: 'Details' }
}

/** Normal, pressed, disabled and icon-only together. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <ToggleButton defaultPressed={false}>Off</ToggleButton>
      <ToggleButton defaultPressed>On</ToggleButton>
      <ToggleButton disabled>Disabled</ToggleButton>
      <ToggleButton icon="grid" iconOnly label="Grid view" defaultPressed />
    </div>
  )
}

/**
 * The view switcher: adjacent toggles sharing their inner edges, wrapped in a
 * named `role="group"` so "Grid, pressed, 2 of 3" has a scope.
 */
export const SegmentedGroup: Story = {
  render: () => {
    const [view, setView] = useState('list')
    return (
      <div className="vgui-toggle-group" role="group" aria-label="View style">
        {[
          { value: 'list', icon: 'list' as const, text: 'List' },
          { value: 'grid', icon: 'grid' as const, text: 'Grid' },
          { value: 'detail', icon: 'detail' as const, text: 'Details' }
        ].map((option) => (
          <ToggleButton
            key={option.value}
            icon={option.icon}
            pressed={view === option.value}
            onPressedChange={(pressed) => setView(pressed ? option.value : view)}
          >
            {option.text}
          </ToggleButton>
        ))}
      </div>
    )
  }
}

/** Mixed with a plain `Button`, which is dimensionally identical. */
export const InToolbar: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <ToggleButton icon="reload" iconOnly label="Auto-refresh" defaultPressed />
      <ToggleButton icon="list" iconOnly label="List view" />
      <ToggleButton icon="grid" iconOnly label="Grid view" />
      <ToggleButton small>Refresh</ToggleButton>
    </div>
  )
}
