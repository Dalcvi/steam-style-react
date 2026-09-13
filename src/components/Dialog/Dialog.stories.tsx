import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'

import { Button } from '../Button'
import { Dialog } from './Dialog'
import type { DialogProps } from './Dialog'

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  /*
   * The scrim is `position: fixed`, so it fills the preview rather than the
   * decorator box. The box still gives the centred layout real dimensions and
   * keeps a single dialog from collapsing the canvas.
   */
  argTypes: {
    title: { control: 'text' },
    children: { control: false },
    actions: { control: false },
    open: { control: 'boolean' },
    onOpenChange: { control: false },
    unclosable: { control: 'boolean' },
    dismissOnOverlayClick: { control: 'boolean' },
    initialFocusRef: { control: false },
    busy: { control: 'boolean' },
    variant: {
      control: 'select',
      options: ['alert', 'confirm', 'prompt', 'destructive'],
    },
    icon: { control: false },
    tooltip: { control: 'text' },
    controlsLabel: { control: 'text' },
    focused: { control: 'boolean' },
    closable: { control: 'boolean' },
    onDrag: { control: false },
  },
  args: {
    title: 'Delete local content?',
    children: 'This will delete the game’s local content. It cannot be undone.',
    actions: (
      <Button primary>OK</Button>
    ),
    onOpenChange: () => undefined,
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

const confirmActions = (
  <>
    <Button primary>OK</Button>
    <Button>Cancel</Button>
  </>
)

/** The classic two-button MessageBox. */
export const Default: Story = {
  args: { actions: confirmActions },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '100%', minHeight: 360 }}>
        <Story />
      </div>
    ),
  ],
}

/** `alert` reports something the user cannot refuse: one button, no choice. */
export const Alert: Story = {
  decorators: Default.decorators,
  args: {
    variant: 'alert',
    title: 'Connection failed',
    children: 'Could not connect to the Steam network. Try again later.',
    actions: <Button primary>OK</Button>,
  },
}

/** `prompt` takes input, so `initialFocusRef` sends focus straight to the field. */
export const Prompt: Story = {
  decorators: Default.decorators,
  render: (args: DialogProps) => {
    const inputRef = useRef<HTMLInputElement>(null)

    return (
      <Dialog
        {...args}
        initialFocusRef={inputRef}
        actions={
          <>
            <Button primary>Rename</Button>
            <Button>Cancel</Button>
          </>
        }
      >
        <label htmlFor="dialog-prompt-name">Server name</label>
        <input id="dialog-prompt-name" ref={inputRef} defaultValue="Dust2 only" />
      </Dialog>
    )
  },
}

/** `destructive` recolours the last action with `--vgui-danger`. */
export const Destructive: Story = {
  decorators: Default.decorators,
  args: {
    variant: 'destructive',
    title: 'Delete 3 files?',
    actions: (
      <>
        <Button>Cancel</Button>
        <Button danger>Delete</Button>
      </>
    ),
  },
}

/**
 * `unclosable` hides the frame's close control and ignores Escape — for a
 * dialog the user has to answer.
 */
export const Unclosable: Story = {
  decorators: Default.decorators,
  args: {
    unclosable: true,
    title: 'Update required',
    children: 'Steam must restart to finish updating.',
    actions: <Button primary>Restart now</Button>,
  },
}

/** `busy` makes the button row inert and swaps the leading slot for a spinner. */
export const Busy: Story = {
  decorators: Default.decorators,
  args: { busy: true, actions: confirmActions },
}

/** `closable={false}` keeps the caption bare without changing dismissal. */
export const NoCloseControl: Story = {
  decorators: Default.decorators,
  args: { closable: false, actions: confirmActions },
}

/** The Error state of the states table: the body carries the danger colour. */
export const ErrorState: Story = {
  decorators: Default.decorators,
  args: {
    className: 'vgui-dialog--invalid',
    title: 'Could not save',
    children: 'The disk is full. Free some space and try again.',
    actions: confirmActions,
  },
}

/** Uncontrolled by default; the scrim dismisses only when asked. */
export const DismissOnOverlayClick: Story = {
  decorators: Default.decorators,
  args: { dismissOnOverlayClick: true, actions: confirmActions },
}

/** A controlled dialog: `open` is owned by the caller and mirrored in a button. */
export const Controlled: Story = {
  decorators: Default.decorators,
  render: (args: DialogProps) => {
    const [open, setOpen] = useState(false)

    return (
      <>
        <Button onClick={() => setOpen(true)}>Show dialog</Button>
        <Dialog {...args} open={open} onOpenChange={setOpen} actions={confirmActions} />
      </>
    )
  },
}

/*
 * All four MessageBox shapes at once. The scrim is switched to static position
 * for this story only, so the frames can sit in a row instead of stacking on
 * top of each other.
 */
export const Variants: Story = {
  decorators: Default.decorators,
  render: (args: DialogProps) => (
    <>
      <style>{`.vgui-dialog-overlay { position: static; }`}</style>
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {(['alert', 'confirm', 'prompt', 'destructive'] as const).map((variant) => (
          <Dialog
            {...args}
            key={variant}
            variant={variant}
            title={variant}
            children={`variant="${variant}"`}
            actions={
              <>
                <Button primary>OK</Button>
                <Button>Cancel</Button>
              </>
            }
          />
        ))}
      </div>
    </>
  ),
}

/** Busy and idle next to each other, to show what the spinner replaces. */
export const States: Story = {
  decorators: Default.decorators,
  render: (args: DialogProps) => (
    <>
      <style>{`.vgui-dialog-overlay { position: static; }`}</style>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <Dialog {...args} title="Idle" actions={confirmActions} />
        <Dialog {...args} title="Busy" busy actions={confirmActions} />
      </div>
    </>
  ),
}
