import type { Meta, StoryObj } from '@storybook/react-vite'

import { Link } from './Link'

const meta = {
  title: 'Components/Link',
  component: Link,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    href: { control: 'text' },
    quiet: { control: 'boolean' },
    asButton: { control: 'boolean' },
    external: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
  args: {
    children: 'Server list',
    href: '/servers',
  },
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** `URLLabel` — the literal `Label` colour, decorative use only (4.06:1). */
export const Quiet: Story = {
  args: { quiet: true },
}

/** `TextButton` — an action, so deliberately not underlined. */
export const InlineTextButton: Story = {
  args: { asButton: true, href: undefined },
}

export const External: Story = {
  args: {
    href: 'https://developer.valvesoftware.com/wiki/VGUI',
    external: true,
    children: 'VGUI docs',
  },
}

export const Disabled: Story = {
  args: { disabled: true },
}

/** A disabled action is a real `<button disabled>`, not an anchor. */
export const DisabledButton: Story = {
  args: { asButton: true, href: undefined, disabled: true, children: 'Refresh list' },
}

/** Every documented variant, plus the inline paragraph case. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0 }}>
        Found <Link {...args}>142 servers</Link>. See the{' '}
        <Link {...args} href="https://developer.valvesoftware.com/wiki/VGUI" external>
          VGUI docs
        </Link>{' '}
        for the design language.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link {...args}>Default link</Link>
        <Link {...args} quiet>
          Quiet link
        </Link>
        <Link {...args} asButton href={undefined}>
          Text button
        </Link>
        <Link {...args} disabled>
          Disabled link
        </Link>
      </div>
    </div>
  ),
}
