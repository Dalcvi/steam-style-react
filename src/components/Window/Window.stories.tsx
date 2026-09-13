import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Button } from '../Button'
import { Window } from './Window'
import type { WindowProps } from './Window'

const meta = {
  title: 'Components/Window',
  component: Window,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    title: { control: 'text' },
    icon: { control: false },
    minimizable: { control: 'boolean' },
    maximizable: { control: 'boolean' },
    closable: { control: 'boolean' },
    resizable: { control: 'boolean' },
    focused: { control: 'boolean' },
    maximized: { control: 'boolean' },
    tooltip: { control: 'text' },
    controlsLabel: { control: 'text' },
    onAction: { control: false },
    onDrag: { control: false },
  },
  args: {
    title: 'Servers',
    onAction: () => undefined,
    children: (
      <div>
        <p>Refresh this list to see the latest servers.</p>
      </div>
    ),
  },
} satisfies Meta<typeof Window>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The layout above follows the CSS port: an 18px caption strip carrying 20px
 * controls, so the buttons overhang by a pixel each side and are centred on the
 * text rather than within a tall Valve-sized strip.
 */
export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 360, height: 200 }}>
        <Story />
      </div>
    ),
  ],
}

/** `focused` swaps the caption border to `--vgui-bevel-light-strong` and lights the glyphs. */
export const Focused: Story = {
  args: { focused: true },
  decorators: Default.decorators,
}

/** `maximized` drops the grip and swaps the middle glyph for the restore one. */
export const Maximized: Story = {
  args: { maximized: true },
  decorators: [
    (Story) => (
      <div style={{ width: 480, height: 240 }}>
        <Story />
      </div>
    ),
  ],
}

/** Only the controls the app passes are rendered. */
export const CloseOnly: Story = {
  args: { minimizable: false, maximizable: false },
  decorators: Default.decorators,
}

/** A fixed window has no grip, so it announces no resize control at all. */
export const NotResizable: Story = {
  args: { resizable: false },
  decorators: Default.decorators,
}

/** A 16px application glyph sits before the caption. */
export const WithIcon: Story = {
  args: {
    icon: (
      <span
        aria-hidden="true"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          backgroundColor: 'var(--vgui-clay-glyph)',
        }}
      />
    ),
  },
  decorators: Default.decorators,
}

/** `tooltip` re-exposes the native `title` attribute while the caption owns `title`. */
export const WithTooltip: Story = {
  args: { tooltip: 'Steam server browser' },
  decorators: Default.decorators,
}

/** Focused, unfocused and maximized, side by side. */
export const States: Story = {
  args: { onAction: () => undefined },
  render: (args: WindowProps) => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ width: 280, height: 180 }}>
        <Window {...args} title="Library" />
      </div>
      <div style={{ width: 280, height: 180 }}>
        <Window {...args} title="Library" focused />
      </div>
      <div style={{ width: 280, height: 180 }}>
        <Window {...args} title="Store" maximized />
      </div>
    </div>
  ),
}

/** A live window: drag the caption or the grip, or nudge it with the arrow keys. */
export const Draggable: Story = {
  render: (args) => {
    const [offset, setOffset] = useState({ x: 0, y: 0 })

    return (
      <div style={{ position: 'relative', width: 420, height: 300 }}>
        <div
          style={{
            position: 'absolute',
            left: offset.x,
            top: offset.y,
          }}
        >
          <Window
            {...args}
            title="Draggable"
            focused
            onDrag={(deltaX, deltaY) =>
              setOffset((current) => ({
                x: current.x + deltaX,
                y: current.y + deltaY,
              }))
            }
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <Button>OK</Button>
              <Button onClick={() => setOffset({ x: 0, y: 0 })}>Reset</Button>
            </div>
          </Window>
        </div>
      </div>
    )
  },
}
