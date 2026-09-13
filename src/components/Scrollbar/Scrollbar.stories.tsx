import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'

import { Scrollbar } from './Scrollbar'

const log = Array.from({ length: 40 }, (_, index) => `L ${String(index + 1).padStart(3, '0')}  Building shaders…`)

/** The story is padded so the bar's own recess is visible against the frame. */
const framed: Decorator = (Story) => (
  <div style={{ padding: 8 }}>
    <Story />
  </div>
)

const meta = {
  title: 'Components/Scrollbar',
  component: Scrollbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    variant: { control: 'inline-radio', options: ['native', 'custom'] },
    thickness: { control: 'text' },
    alwaysVisible: { control: 'boolean' },
    disabled: { control: 'boolean' },
    scrollPadding: { control: 'number' },
  },
  args: {
    children: (
      <pre style={{ margin: 0 }}>{log.join('\n')}</pre>
    ),
    style: { height: 160, width: 260 },
    'aria-label': 'Server log',
  },
  decorators: [framed],
} satisfies Meta<typeof Scrollbar>

export default meta
type Story = StoryObj<typeof meta>

export const Native: Story = {}

/** The pressed bevel is WebKit-only, so this path is the last resort. */
export const Custom: Story = {
  args: { variant: 'custom' },
}

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
    children: <div style={{ width: 900, whiteSpace: 'nowrap' }}>Screenshot 1 · Screenshot 2 · Screenshot 3 · Screenshot 4</div>,
  },
}

export const AlwaysVisible: Story = {
  args: {
    alwaysVisible: true,
    children: 'Short enough not to overflow, but the gutter is still reserved.',
  },
}

export const Disabled: Story = {
  args: { variant: 'custom', disabled: true },
}

/** The 19px bar against the 12px override, side by side. */
export const Thickness: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16 }}>
      <Scrollbar {...args} variant="custom" />
      <Scrollbar {...args} variant="custom" thickness={12} />
    </div>
  ),
}
