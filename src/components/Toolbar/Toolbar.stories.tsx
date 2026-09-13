import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Toolbar } from './Toolbar'
import type { ToolbarItem } from './Toolbar'

const browserItems: ToolbarItem[] = [
  { id: 'back', label: 'Back', icon: 'icon_button_back', disabled: true },
  { id: 'forward', label: 'Forward', icon: 'icon_button_forward' },
  { id: 'home', label: 'Home', icon: 'icon_button_home' },
  { id: 'reload', label: 'Reload', icon: 'icon_button_reload' },
  { id: 'stop', label: 'Stop', icon: 'icon_button_stop', disabled: true },
]

const meta = {
  title: 'Components/Toolbar',
  component: Toolbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    items: { control: 'object' },
    raised: { control: 'boolean' },
    footer: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    label: 'Browser',
    items: browserItems,
  },
} satisfies Meta<typeof Toolbar>

export default meta
type Story = StoryObj<typeof meta>

/** `render_bg {}` — the browser chrome, five chromeless glyph buttons. */
export const Chromeless: Story = {}

/** `FullscreenButton` — the same glyphs with a real bevel. */
export const Raised: Story = {
  args: {
    raised: true,
    label: 'Viewer',
    items: [
      { id: 'zoom-out', label: 'Zoom out', icon: 'icon_controller_bpm' },
      { id: 'zoom-in', label: 'Zoom in', icon: 'icon_controller_bpm' },
      { id: 'mute', label: 'Mute', icon: 'icon_controller_bpm' },
    ],
  },
}

/** A sticky toggle: the pressed state is carried by `aria-pressed`, not the bevel alone. */
export const Toggle: Story = {
  args: {
    raised: true,
    label: 'Viewer',
    items: [],
  },
  render: (args) => {
    const [fullscreen, setFullscreen] = useState(false)
    const [muted, setMuted] = useState(true)

    return (
      <Toolbar
        {...args}
        items={[
          { id: 'zoom-out', label: 'Zoom out', icon: 'icon_controller_bpm' },
          { id: 'zoom-in', label: 'Zoom in', icon: 'icon_controller_bpm' },
          {
            id: 'mute',
            label: 'Mute',
            icon: 'icon_controller_bpm',
            pressed: muted,
            onClick: () => setMuted((value) => !value),
          },
          {
            id: 'fullscreen',
            label: 'Fullscreen',
            icon: 'icon_controller_bpm',
            pressed: fullscreen,
            onClick: () => setFullscreen((value) => !value),
          },
        ]}
      />
    )
  },
}

/** `DialogServerBrowser.res` — the 34px footer bar with 24px labelled controls. */
export const Footer: Story = {
  args: {
    footer: true,
    label: 'Server browser',
    items: [
      {
        id: 'add',
        label: 'Add server',
        icon: 'icon_button_home',
        text: 'Add Server',
        onClick: () => undefined,
      },
      {
        id: 'refresh-quick',
        label: 'Refresh quick',
        icon: 'icon_button_reload',
        text: 'Refresh Quick',
        onClick: () => undefined,
      },
      {
        id: 'refresh',
        label: 'Refresh',
        icon: 'icon_button_reload',
        text: 'Refresh',
        onClick: () => undefined,
      },
      {
        id: 'connect',
        label: 'Connect',
        icon: 'icon_button_forward',
        text: 'Connect',
        disabled: true,
      },
    ],
  },
}

/** Every documented variant, plus the full bare state ladder. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start' }}>
      <Toolbar {...args} />
      <Toolbar
        {...args}
        raised
        label="Bevelled"
        items={[
          { id: 'raised-idle', label: 'Idle', icon: 'icon_controller_bpm' },
          { id: 'raised-pressed', label: 'Pressed', icon: 'icon_controller_bpm', pressed: true },
          { id: 'raised-disabled', label: 'Disabled', icon: 'icon_controller_bpm', disabled: true },
        ]}
      />
      <Toolbar
        {...args}
        footer
        label="Footer"
        items={[
          { id: 'footer-add', label: 'Add server', icon: 'icon_button_home', text: 'Add Server' },
          { id: 'footer-connect', label: 'Connect', icon: 'icon_button_forward', text: 'Connect' },
        ]}
      />
    </div>
  ),
}
