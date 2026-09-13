import type { Meta, StoryObj } from '@storybook/react-vite'

import { FieldLabel } from './FieldLabel'

const meta = {
  title: 'Components/FieldLabel',
  component: FieldLabel,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    children: { control: 'text', description: 'Text or inline content of the label.' },
    asText: {
      control: 'boolean',
      description: 'Render a <span> instead of a <label>, for standalone explanatory text.'
    },
    strong: { control: 'boolean', description: 'Emphasis: strong white text rather than the default caption colour.' },
    muted: { control: 'boolean', description: 'The classic Label grey, for captions on a darker surface.' },
    heading: { control: 'boolean', description: 'Use the maize heading colour, for a label acting as a section title.' },
    error: {
      control: 'boolean',
      description: 'Actionable/validation failure state. Pair with a message; never colour alone.'
    },
    required: {
      control: 'boolean',
      description: 'Append a danger-coloured asterisk. Adds `aria-required` semantics.'
    },
    disabled: { control: 'boolean', description: 'Apply the sunken DisabledText1/DisabledText2 treatment.' },
    htmlFor: { control: 'text', description: 'Id of the control this label captions.' }
  },
  args: {
    children: 'Server name',
    asText: false,
    strong: false,
    muted: false,
    heading: false,
    error: false,
    required: false,
    disabled: false
  }
} satisfies Meta<typeof FieldLabel>

export default meta
type Story = StoryObj<typeof meta>

/** The ordinary caption: 14px `--vgui-text`, 5.49:1 on a green panel. */
export const Default: Story = {}

/** Captioning a control: a real `<label for>` focuses the field when clicked. */
export const CaptioningAControl: Story = {
  args: { htmlFor: 'server-name' },
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <FieldLabel {...args} />
      <input id="server-name" />
    </div>
  )
}

export const Strong: Story = {
  args: { strong: true, children: 'Server name' }
}

/** The classic `Label` grey `#A0AA95` — for captions on a darker surface, where it reaches 4.06:1. */
export const Muted: Story = {
  args: { muted: true, children: 'No servers match the current filters.' }
}

export const Heading: Story = {
  args: { heading: true, children: 'Advanced options' }
}

/** Pair with a message; the colour alone is 2.11:1 and is not the message. */
export const Error: Story = {
  args: { error: true, children: 'That server address is unreachable.' }
}

export const Required: Story = {
  args: { required: true, children: 'Server address' }
}

export const Disabled: Story = {
  args: { disabled: true, children: 'Server name' }
}

/** Standalone text: renders a `<span>`, since there is no control to caption. */
export const AsText: Story = {
  args: { asText: true, children: 'Sign in to see your friends list.' }
}

/** Normal, strong, muted, heading, error, required and disabled together. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <FieldLabel>Normal caption</FieldLabel>
      <FieldLabel strong>Strong caption</FieldLabel>
      <FieldLabel muted>Muted caption</FieldLabel>
      <FieldLabel heading>Heading caption</FieldLabel>
      <FieldLabel error>Error caption</FieldLabel>
      <FieldLabel required>Required caption</FieldLabel>
      <FieldLabel disabled>Disabled caption</FieldLabel>
    </div>
  )
}
