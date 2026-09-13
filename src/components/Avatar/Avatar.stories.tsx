import type { Meta, StoryObj } from '@storybook/react-vite'

import { Avatar } from './Avatar'

/**
 * No avatar artwork ships with this library (`docs/assets.md`), so the "loaded"
 * stories use an inline data-URI stand-in for a user-uploaded picture.
 */
const picture = `data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='darkolivegreen'/></svg>",
)}`

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    src: {
      description: 'Image URL. Omit to render the placeholder.',
      control: { type: 'text' },
    },
    alt: {
      description: 'Alt text — the person\'s name. Pass "" when a name is already adjacent.',
      control: { type: 'text' },
    },
    size: {
      description: 'Size presets. `sm` is 24px (account chrome), `md` 42px (notifications).',
      control: { type: 'inline-radio' },
      options: ['sm', 'md', 'lg'],
    },
    name: {
      description: 'Derive initials from a name and show them when there is no image.',
      control: { type: 'text' },
    },
    status: {
      description: 'Presence indicator drawn as a 2px frame edge.',
      control: { type: 'inline-radio' },
      options: ['online', 'away', 'busy', 'offline'],
    },
    ignored: {
      description: 'Tint the frame for an ignored friend.',
      control: { type: 'boolean' },
    },
    bare: {
      description: 'Drop the beveled frame; draw the picture alone.',
      control: { type: 'boolean' },
    },
    round: {
      description: 'Round the corners. Not period-accurate; offered for completeness only.',
      control: { type: 'boolean' },
    },
  },
  args: {
    src: picture,
    alt: 'dalcvi',
    size: 'md',
    ignored: false,
    bare: false,
    round: false,
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** `sm` is the account-button size, `md` the notification size, `lg` an extension. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Avatar {...args} size="sm" alt="" />
      <Avatar {...args} size="md" alt="" />
      <Avatar {...args} size="lg" alt="" />
    </div>
  ),
}

/** No image: the initials are drawn in white over the placeholder box. */
export const Placeholder: Story = {
  args: { src: undefined, name: 'dave coder', alt: '' },
}

/** A failed load is the placeholder, never a broken-image icon. */
export const LoadError: Story = {
  args: { src: '/avatars/does-not-exist.png', name: 'dale', alt: '' },
}

/** Presence as a 2px frame edge. Decorative: never the only signal. */
export const Status: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Avatar {...args} status="online" alt="" />
      <Avatar {...args} status="away" alt="" />
      <Avatar {...args} status="busy" alt="" />
      <Avatar {...args} status="offline" alt="" />
    </div>
  ),
}

/** `Friends.IgnoredColor` tints the frame, not the picture. */
export const Ignored: Story = {
  args: { ignored: true, status: 'offline', alt: '' },
}

/** Picture alone, no chrome. */
export const Bare: Story = {
  args: { bare: true, alt: '' },
}

/** Round corners: an extension, and a post-2010 idiom next to this theme. */
export const Round: Story = {
  args: { round: true, size: 'lg', alt: '' },
}

/** Every documented state: both sizes, loaded, placeholder, error, status, ignored. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Avatar {...args} size="sm" alt="" />
      <Avatar {...args} size="md" alt="" />
      <Avatar {...args} size="lg" alt="" />
      <Avatar {...args} src={undefined} name="dave coder" status="online" alt="" />
      <Avatar {...args} src="/avatars/does-not-exist.png" name="dale" status="offline" alt="" />
      <Avatar {...args} ignored status="away" alt="" />
      <Avatar {...args} bare alt="" />
      <Avatar {...args} round alt="" />
    </div>
  ),
}
