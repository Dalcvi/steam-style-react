import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Tabs } from './Tabs'
import type { TabSpec } from './Tabs'

const settingsTabs: TabSpec[] = [
  { id: 'video', label: 'Video', content: 'Resolution, brightness and anti-aliasing.' },
  { id: 'audio', label: 'Audio', content: 'Speaker configuration and voice.' },
  { id: 'keyboard', label: 'Keyboard', content: 'Key bindings and mouse sensitivity.' },
  { id: 'multiplayer', label: 'Multiplayer', content: 'Rate, server filter, sprays.' },
  { id: 'advanced', label: 'Advanced', content: 'Developer options.', disabled: true },
]

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    tabs: { control: false },
    value: { control: 'text' },
    defaultValue: { control: 'text' },
    onValueChange: { control: false },
    activateOnFocus: { control: 'boolean' },
    variant: { control: 'inline-radio', options: ['clay', 'green'] },
  },
  args: {
    tabs: settingsTabs,
    defaultValue: 'video',
    variant: 'clay',
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** `--green` — the same strip over a `GreenBG` page instead of `LightClayBG`. */
export const Green: Story = {
  args: { variant: 'green' },
}

/** `--closable` — each tab carries a `TabCloseButton`; Delete closes the focused tab. */
export const Closable: Story = {
  args: {
    tabs: settingsTabs.map((tab) => ({
      ...tab,
      closable: true,
      onClose: () => undefined,
    })),
  },
}

/** A disabled tab keeps its bevel and stays unselectable. */
export const DisabledTab: Story = {
  args: { defaultValue: 'keyboard' },
}

/** `activateOnFocus={false}` — arrowing moves focus, Enter/Space commits the page. */
export const ManualActivation: Story = {
  args: { activateOnFocus: false },
}

/** `lazy` panel content is not rendered until the tab is first selected. */
export const LazyPanels: Story = {
  args: {
    tabs: settingsTabs.map((tab) => ({ ...tab, lazy: true, content: `${tab.label} page (mounted on first visit)` })),
  },
}

/** Controlled: `value` + `onValueChange`, owned by the page that hosts the sheet. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('audio')
    return <Tabs {...args} value={value} onValueChange={setValue} />
  },
}

/** The strip in both surfaces side by side. */
export const Surfaces: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Tabs {...args} variant="clay" />
      <Tabs {...args} variant="green" />
    </div>
  ),
}
