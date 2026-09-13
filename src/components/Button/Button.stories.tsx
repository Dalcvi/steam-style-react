import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    fullWidth: { control: 'boolean' },
    small: { control: 'boolean' },
    large: { control: 'boolean' },
    primary: { control: 'boolean' },
    danger: { control: 'boolean' },
    clay: { control: 'boolean' },
    disabled: { control: 'boolean' },
    type: { control: 'inline-radio', options: ['button', 'submit', 'reset'] },
  },
  args: {
    children: 'Join game',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Small: Story = {
  args: { small: true },
}

export const Large: Story = {
  args: { large: true },
}

export const Primary: Story = {
  args: { primary: true },
}

export const Danger: Story = {
  args: { danger: true },
}

export const Clay: Story = {
  args: { clay: true },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const FullWidth: Story = {
  args: { fullWidth: true },
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
}

/** Dialog footer — a `--clay` row of buttons with a default action. */
export const DialogFooter: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button {...args} primary autoFocus>
        OK
      </Button>
      <Button {...args}>Cancel</Button>
      <Button {...args} clay>
        Apply
      </Button>
      <Button {...args} disabled>
        Unavailable
      </Button>
    </div>
  ),
}

/** Every documented size and face side by side. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button {...args}>Default</Button>
        <Button {...args} small>
          Small
        </Button>
        <Button {...args} large>
          Large
        </Button>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button {...args} primary>
          Primary
        </Button>
        <Button {...args} danger>
          Remove
        </Button>
        <Button {...args} clay>
          Clay
        </Button>
        <Button {...args} disabled>
          Disabled
        </Button>
      </div>
    </div>
  ),
}
