import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { MenuItem } from '../Menu/Menu'

import { NavBar } from './NavBar'
import type { NavBarItem } from './NavBar'

const noop = () => undefined

const items: NavBarItem[] = [
  {
    id: 'store',
    label: 'Store',
    menu: (
      <>
        <MenuItem label="Browse" onSelect={noop} />
        <MenuItem label="Wishlist" onSelect={noop} />
        <MenuItem label="Recommendations" onSelect={noop} />
      </>
    ),
  },
  { id: 'library', label: 'Library' },
  {
    id: 'community',
    label: 'Community',
    menu: (
      <>
        <MenuItem label="Discussions" onSelect={noop} />
        <MenuItem label="Workshop" onSelect={noop} />
        <MenuItem label="Screenshots" onSelect={noop} />
      </>
    ),
  },
  { id: 'account', label: 'My account', disabled: true },
]

const meta = {
  title: 'Components/NavBar',
  component: NavBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The client\'s application-level navigation: a `<nav>` landmark holding ' +
          '21px/700 uppercase labels, each optionally opening a dropdown menu.\n\n' +
          '**Documented departures.** The active item is *dimmer* than the inactive ' +
          'ones (`Text` `#A0AA95` against `White`), which reads as "the surface you ' +
          'are already standing on" — it also carries `aria-current="page"` and a 1px ' +
          'underline so the state survives without colour. The corpus\'s ' +
          '`SuperNavMenuItem:selected {}` is an empty block, so an open menu had no ' +
          'visible active row at all: hover, focus and selection are promoted to one ' +
          'maize highlight, and maize takes dark text because the inherited white is ' +
          'only 3.70:1.\n\n' +
          'The strip paints nothing (`bgcolor = none`), so it is meant to sit on a frame ' +
          'or panel — the dropdowns are absolutely positioned and will be clipped by a ' +
          'narrow container.',
      },
    },
  },
  argTypes: {
    items: { control: false },
    onItemClick: { control: false },
    label: { control: 'text' },
    dividers: { control: 'boolean' },
  },
  args: {
    items,
    label: 'Main',
    dividers: false,
  },
} satisfies Meta<typeof NavBar>

export default meta
type Story = StoryObj<typeof meta>

/** Dropdowns genuinely open here — Arrow Down opens, Escape closes. */
export const Default: Story = {}

/** A caption reports every activation, including plain items with no menu. */
export const Interactive: Story = {
  render: (args) => {
    const [clicked, setClicked] = useState<string | null>(null)

    return (
      <div style={{ padding: 16 }}>
        <NavBar {...args} onItemClick={setClicked} />
        <p style={{ fontFamily: 'sans-serif', fontSize: 12 }}>
          last activated: <code>{clicked ?? 'none'}</code>
        </p>
      </div>
    )
  },
}

/** Items with an `href` render a real `<a>` and navigate; the rest are buttons. */
export const Links: Story = {
  args: {
    items: [
      { id: 'store', label: 'Store', href: '#store' },
      { id: 'library', label: 'Library', href: '#library', active: true },
      { id: 'community', label: 'Community', href: '#community' },
      { id: 'support', label: 'Support', href: '#support', disabled: true },
    ],
  },
}

/** The active item is the dimmed one. Do not invert this. */
export const ActiveItem: Story = {
  args: {
    items: items.map((item) => ({ ...item, active: item.id === 'community' })),
  },
}

/** A disabled label is not a tab stop and cannot be activated. */
export const DisabledItem: Story = {
  args: {
    items: [...items.slice(0, 3), { id: 'account', label: 'My account', disabled: true }],
  },
}

/** `dividers` renders the 1px `SuperNavMenuDivider` between items. It is
 *  decorative — 1.07:1 in the original — so it is `aria-hidden`. */
export const Dividers: Story = { args: { dividers: true } }

/** Inactive, active, disabled and open, side by side. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      <NavBar {...args} items={[{ ...items[0], active: false }]} />
      <NavBar {...args} items={[{ ...items[1], active: true }]} />
      <NavBar {...args} items={[{ id: 'account', label: 'My account', disabled: true }]} />
    </div>
  ),
}
