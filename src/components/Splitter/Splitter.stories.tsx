import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Splitter } from './Splitter'
import type { SplitterProps } from './Splitter'

function Pane({ children }: { children: string }) {
  return (
    <div style={{ padding: 8, fontSize: 'var(--vgui-font-size-small)' }}>{children}</div>
  )
}

const meta = {
  title: 'Components/Splitter',
  component: Splitter,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    defaultSize: { control: 'text' },
    size: { control: 'text' },
    minSize: { control: 'number' },
    maxSize: { control: 'number' },
    label: { control: 'text' },
    onResize: { control: false },
    first: { control: false },
    second: { control: false },
  },
  args: {
    first: <Pane>Filters</Pane>,
    second: <Pane>Servers</Pane>,
  },
} satisfies Meta<typeof Splitter>

export default meta
type Story = StoryObj<typeof meta>

/** Panes side by side; the divider is a vertical bar dragged with `←`/`→`. */
export const Horizontal: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 480, height: 240 }}>
        <Story />
      </div>
    ),
  ],
}

/** Panes stacked; the divider is a horizontal bar dragged with `↑`/`↓`. */
export const Vertical: Story = {
  decorators: Horizontal.decorators,
  args: { orientation: 'vertical' },
}

/** `--plain` drops the grip dots and leaves the bare Valve groove. */
export const Plain: Story = {
  decorators: Horizontal.decorators,
  args: { className: 'vgui-splitter--plain' },
}

/** A percentage start that the min/max bounds then clamp. */
export const WithBounds: Story = {
  decorators: Horizontal.decorators,
  args: { defaultSize: '30%', minSize: 120, maxSize: 320 },
}

/** `aria-disabled` is the documented off switch: no focus, no drag, same bevel. */
export const Disabled: Story = {
  decorators: Horizontal.decorators,
  args: { 'aria-disabled': true },
}

/** The controlled pattern: hold the size in state and feed it back in. */
export const Controlled: Story = {
  decorators: Horizontal.decorators,
  render: ({ first, second, ...args }: SplitterProps) => {
    const [size, setSize] = useState<number | string>('40%')

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Splitter {...args} size={size} onResize={setSize} first={first} second={second} />
        <span style={{ fontSize: 'var(--vgui-font-size-small)' }}>size: {String(size)}</span>
      </div>
    )
  },
}

/** Gripped horizontal, gripped vertical, plain and disabled. */
export const States: Story = {
  decorators: Horizontal.decorators,
  render: (args) => (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ width: 320, height: 200 }}>
        <Splitter {...args} label="Resize filter pane" />
      </div>
      <div style={{ width: 320, height: 200 }}>
        <Splitter {...args} orientation="vertical" />
      </div>
      <div style={{ width: 320, height: 200 }}>
        <Splitter {...args} className="vgui-splitter--plain" />
      </div>
      <div style={{ width: 320, height: 200 }}>
        <Splitter {...args} aria-disabled />
      </div>
    </div>
  ),
}
