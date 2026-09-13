import type { Meta, StoryObj } from '@storybook/react-vite'

import { RichText, RichTextBold, RichTextEmphasis, RichTextLink } from './RichText'

const meta = {
  title: 'Components/RichText',
  component: RichText,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    children: {
      description: 'Rich text content. Never pass untrusted HTML — this renders nodes, not markup.',
      control: { type: 'text' },
    },
    interior: {
      description: 'Drops the recessed frame; use inside a List or Panel.',
      control: { type: 'boolean' },
    },
  },
  args: {
    interior: false,
  },
} satisfies Meta<typeof RichText>

export default meta
type Story = StoryObj<typeof meta>

/** `RichText`: recessed frame, `DarkGreenBG` interior, `White` text. */
export const Default: Story = {
  render: (args) => (
    <RichText {...args} style={{ maxWidth: 360 }}>
      <p className="vgui-rich-text__interior">
        The server will restart in{' '}
        <strong className="vgui-rich-text__bold">five minutes</strong>. See{' '}
        <a className="vgui-rich-text__url" href="/rules">
          the rules
        </a>{' '}
        for <em className="vgui-rich-text__emphasis">why</em>.
      </p>
    </RichText>
  ),
}

/** `RichTextInterior {}` — no frame, for a panel that draws its own. */
export const Interior: Story = {
  args: { interior: true },
  render: (args) => (
    <RichText {...args} style={{ maxWidth: 360 }}>
      <p>
        Team Fortress 2 requires a{' '}
        <strong className="vgui-rich-text__bold">DirectX 9</strong> capable GPU.
      </p>
    </RichText>
  ),
}

/** `"ListPanel RichText"` — the frame belongs to the list, not to the text. */
export const InList: Story = {
  render: (args) => (
    <RichText {...args} className="vgui-rich-text--list" style={{ maxWidth: 360 }}>
      <p className="vgui-rich-text__interior">
        Loaded 1427 nav areas. <em className="vgui-rich-text__emphasis">No islands.</em>
      </p>
    </RichText>
  ),
}

/** Standalone runs: `RichTextLink`, `RichTextBold`, `RichTextEmphasis`. */
export const InlineRuns: Story = {
  render: (args) => (
    <RichText {...args} style={{ maxWidth: 360 }}>
      <p className="vgui-rich-text__interior">
        <RichTextBold>Bold</RichTextBold>, <RichTextEmphasis>emphasis</RichTextEmphasis> and{' '}
        <RichTextLink href="/rules">a url</RichTextLink>.
      </p>
    </RichText>
  ),
}

/** Every documented state: base text, both frames and all three inline runs. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <RichText>
        <p className="vgui-rich-text__interior">
          Idle <strong className="vgui-rich-text__bold">bold</strong>{' '}
          <em className="vgui-rich-text__emphasis">emphasis</em>{' '}
          <a className="vgui-rich-text__url" href="/rules">
            url
          </a>
        </p>
      </RichText>
      <RichText interior>
        <p>
          Interior — the frame is the surrounding panel&apos;s.
        </p>
      </RichText>
      <RichText className="vgui-rich-text--list">
        <p className="vgui-rich-text__interior">In a list — no frame, no fill.</p>
      </RichText>
    </div>
  ),
}
