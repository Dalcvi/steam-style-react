import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScrollArea } from './ScrollArea'

const servers = [
  'Counter-Strike: Source',
  'Day of Defeat: Source',
  'Half-Life 2: Deathmatch',
  'Team Fortress 2',
  'Portal',
  'Garrys Mod',
  'Source SDK Base',
  'Left 4 Dead 2',
  'Alien Swarm',
  'Dota 2 Test',
  'SteamVR',
  'Spacewar',
]

const Lines = ({ count = 12 }: { count?: number }) => (
  <div style={{ padding: 8 }}>
    {Array.from({ length: count }, (_, index) => (
      <div key={index}>{servers[index % servers.length]}</div>
    ))}
  </div>
)

const meta = {
  title: 'Components/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    inset: { control: 'boolean' },
    axis: { control: 'inline-radio', options: ['vertical', 'horizontal', 'both'] },
    customScrollbar: { control: 'boolean' },
    maxHeight: { control: 'text' },
    shadows: { control: 'boolean' },
    focusable: { control: 'boolean' },
    onScrollPositionChange: { control: false },
    children: { control: false },
  },
  args: {
    inset: false,
    axis: 'vertical',
    customScrollbar: false,
    shadows: true,
    children: <Lines />,
  },
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 260, height: 200 }}>
        <Story />
      </div>
    ),
  ],
}

export const Inset: Story = {
  decorators: Default.decorators,
  args: { inset: true },
}

export const Horizontal: Story = {
  decorators: Default.decorators,
  args: {
    axis: 'horizontal',
    children: (
      <div style={{ display: 'flex', gap: 8, padding: 8 }}>
        {servers.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
    ),
  },
}

export const Both: Story = {
  decorators: Default.decorators,
  args: { axis: 'both', inset: true },
}

export const CustomScrollbar: Story = {
  decorators: Default.decorators,
  args: { customScrollbar: true, inset: true },
}

export const NoShadows: Story = {
  decorators: Default.decorators,
  args: { shadows: false },
}

export const FillParent: Story = {
  decorators: Default.decorators,
  args: { maxHeight: 120 },
}

export const States: Story = {
  decorators: Default.decorators,
  render: (args) => (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ width: 120, height: 160 }}>
        <ScrollArea {...args} aria-label="Default" />
      </div>
      <div style={{ width: 120, height: 160 }}>
        <ScrollArea {...args} inset aria-label="Inset" />
      </div>
      <div style={{ width: 120, height: 160 }}>
        <ScrollArea {...args} inset customScrollbar aria-label="Custom" />
      </div>
    </div>
  ),
}
