import type { Meta, StoryObj } from '@storybook/react-vite'

import { Console } from './Console'
import type { ConsoleLine } from './Console'

const live: ConsoleLine[] = [
  { id: '1', kind: 'text', text: 'Connecting to 192.168.1.10:27015...' },
  { id: '2', kind: 'text', text: 'Connected to 192.168.1.10:27015' },
  { id: '3', kind: 'history', text: 'Server is out of date' },
]

const withErrors: ConsoleLine[] = [
  { id: '1', kind: 'text', text: 'Connecting to 192.168.1.10:27015...' },
  { id: '2', kind: 'error', text: 'Bad challenge from 192.168.1.10' },
  { id: '3', kind: 'error', text: 'Connection to 192.168.1.10:27015 failed after 4 retries' },
]

const populated: ConsoleLine[] = [
  { id: '1', kind: 'history', text: 'Console initialized. Games/Project1/steam' },
  { id: '2', kind: 'history', text: 'Loading cached network config: 192.168.1.10:27015' },
  { id: '3', kind: 'text', text: 'Connecting to 192.168.1.10:27015...' },
  { id: '4', kind: 'text', text: 'Connected to 192.168.1.10:27015' },
  { id: '5', kind: 'text', text: 'Counter-Strike: Source  ' },
  { id: '6', kind: 'error', text: 'Bad challenge from 192.168.1.10' },
  { id: '7', kind: 'text', text: 'Sending UDP connect to public IP 93.184.216.34:27015' },
  { id: '8', kind: 'text', text: 'Server using "sv_pure" mode 1' },
]

const meta = {
  title: 'Components/Console',
  component: Console,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    lines: {
      description: 'Lines in display order, oldest first.',
      control: { type: 'object' },
    },
    label: {
      description: 'Accessible name, e.g. "Server console".',
      control: { type: 'text' },
    },
    follow: {
      description: 'Scroll to the newest line when it is appended.',
      control: { type: 'boolean' },
    },
    maxLines: {
      description: 'Maximum retained lines before the oldest are dropped.',
      control: { type: 'number' },
    },
    errorPrefix: {
      description: "Text prefixed to error lines so the failure is not colour-only; set to '' to disable.",
      control: { type: 'text' },
    },
  },
  args: {
    label: 'Server console',
    lines: populated,
    follow: true,
    maxLines: 2000,
    errorPrefix: 'ERR: ',
  },
} satisfies Meta<typeof Console>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The `Text` line colour — `#A0AA95` on `DarkGreenBG`. */
export const LiveOutput: Story = {
  args: { lines: live },
}

/** `Highlight3` plus an `ERR: ` prefix, because the colour alone fails contrast. */
export const WithErrors: Story = {
  args: { lines: withErrors },
}

/** `CConsoleHistory` is `White`; `console_text` is `Text`. */
export const Scrollback: Story = {
  args: {
    lines: [
      { id: '1', kind: 'history', text: 'Server is out of date' },
      { id: '2', kind: 'history', text: 'Loaded 1427 nav areas' },
    ],
  },
}

/** `errorPrefix=""` is the opt-out for consumers that supply their own cue. */
export const NoErrorPrefix: Story = {
  args: { errorPrefix: '', lines: withErrors },
}

/** Every documented state: live, scrollback and error, plus the retained cap. */
export const States: Story = {
  args: { lines: populated, follow: false, maxLines: 4 },
}
