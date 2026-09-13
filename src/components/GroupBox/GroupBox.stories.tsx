import type { Meta, StoryObj } from '@storybook/react-vite'

import { GroupBox } from './GroupBox'

const meta = {
  title: 'Components/GroupBox',
  component: GroupBox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    legend: { control: 'text' },
    inset: { control: 'boolean' },
    ruled: { control: 'boolean' },
    hideLegend: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    legend: 'Audio',
    children: (
      <>
        <label htmlFor="volume">Volume</label>
        <input id="volume" type="range" min={0} max={100} defaultValue={50} />
      </>
    ),
  },
} satisfies Meta<typeof GroupBox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
}

export const Inset: Story = {
  args: {
    legend: 'Video',
    inset: true,
    children: <label htmlFor="hdr">Enable HDR</label>,
  },
  decorators: Default.decorators,
}

export const Ruled: Story = {
  args: {
    legend: 'Advanced',
    ruled: true,
    children: <label htmlFor="console">Show developer console</label>,
  },
  decorators: Default.decorators,
}

export const HiddenLegend: Story = {
  args: {
    legend: 'Multiplayer',
    hideLegend: true,
  },
  decorators: Default.decorators,
}

export const Disabled: Story = {
  args: {
    legend: 'Audio',
    disabled: true,
  },
  decorators: Default.decorators,
}

export const LegendOnTop: Story = {
  args: {
    legend: 'Audio',
    className: 'vgui-groupbox--legend-top',
  },
  decorators: Default.decorators,
}

export const States: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <GroupBox legend="Audio">
        <label htmlFor="s-volume">Volume</label>
        <input id="s-volume" type="range" min={0} max={100} defaultValue={50} />
      </GroupBox>
      <GroupBox legend="Video" inset>
        <label htmlFor="s-hdr">Enable HDR</label>
      </GroupBox>
      <GroupBox legend="Advanced" ruled>
        <label htmlFor="s-console">Show developer console</label>
      </GroupBox>
      <GroupBox legend="Audio (disabled)" disabled>
        <label htmlFor="s-muted">Volume</label>
      </GroupBox>
    </div>
  ),
}
