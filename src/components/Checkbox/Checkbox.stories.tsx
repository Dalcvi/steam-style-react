import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Checkbox } from './Checkbox'

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text', description: 'The label. Rendered as part of the clickable area.' },
    indeterminate: { control: 'boolean', description: 'Render the indeterminate third state.' },
    labelPosition: {
      control: 'inline-radio',
      options: ['start', 'end'],
      description: 'Put the box after the label instead of before.'
    },
    disabled: { control: 'boolean', description: 'Disable the checkbox.' },
    defaultChecked: { control: 'boolean', description: 'Initial checked state when uncontrolled.' },
    checked: { control: 'boolean', description: 'Controlled checked state.' },
    onChange: { control: false, description: 'Called when the checked state changes.' }
  },
  args: {
    label: 'Run in a window',
    indeterminate: false,
    labelPosition: 'start',
    disabled: false
  }
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Checked: Story = {
  args: { defaultChecked: true, label: 'Remember password' }
}

/** The third state — the same treatment `chkSomeSelStd` gets. */
export const Indeterminate: Story = {
  args: { indeterminate: true, label: 'All servers (mixed)' }
}

export const LabelEnd: Story = {
  args: { labelPosition: 'end', label: 'Automatically log me in' }
}

export const Disabled: Story = {
  args: { disabled: true, label: 'Enable voice' }
}

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true, label: 'Enable voice' }
}

/** Controlled through the parent. */
export const Controlled: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(false)
    return (
      <Checkbox
        {...args}
        label="Run in a window"
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
      />
    )
  }
}

/** The filter tree's "select all": indeterminate until every child is on. */
export const SelectAll: Story = {
  render: () => {
    const servers = ['Dust2', 'Office', 'Nuke']
    const [selected, setSelected] = useState<string[]>(['Dust2'])
    const all = selected.length === servers.length

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Checkbox
          label={`All servers${all || selected.length === 0 ? '' : ' (mixed)'}`}
          checked={all}
          indeterminate={!all && selected.length > 0}
          onChange={(event) => setSelected(event.target.checked ? servers : [])}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingLeft: 16 }}>
          {servers.map((server) => (
            <Checkbox
              key={server}
              label={server}
              checked={selected.includes(server)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...current, server]
                    : current.filter((item) => item !== server),
                )
              }
            />
          ))}
        </div>
      </div>
    )
  }
}

/** Normal, checked, mixed and disabled together. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Mixed" indeterminate />
      <Checkbox label="Disabled" disabled />
      <Checkbox label="Disabled checked" disabled defaultChecked />
    </div>
  )
}
