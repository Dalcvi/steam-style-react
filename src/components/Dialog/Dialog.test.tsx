import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Dialog } from './Dialog'

const actions = (
  <>
    <button type="button">Cancel</button>
    <button type="button">OK</button>
  </>
)

function overlayOf(container: HTMLElement) {
  const overlay = container.querySelector('.vgui-dialog-overlay')
  if (!(overlay instanceof HTMLElement)) throw new Error('no overlay')
  return overlay
}

/** The close control, the frame's own button rather than one of the actions. */
function closeControl() {
  return screen.getByRole('button', { name: 'Close' })
}

function titlebarOf(container: HTMLElement) {
  const titlebar = container.querySelector('.vgui-window__titlebar')
  if (!(titlebar instanceof HTMLElement)) throw new Error('no title bar')
  return titlebar
}

function Harness() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Dialog
        title="Disconnect"
        open={open}
        onOpenChange={setOpen}
        actions={
          <button type="button" onClick={() => setOpen(false)}>
            OK
          </button>
        }
      >
        Disconnect from server?
      </Dialog>
    </>
  )
}

describe('Dialog', () => {
  it('renders nothing while closed', () => {
    const { container } = render(<Dialog title="Disconnect" open={false} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders a modal dialog labelled by its title', () => {
    const { container } = render(
      <Dialog title="Disconnect from server?" actions={actions}>
        This will drop your connection.
      </Dialog>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Disconnect from server?' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveClass('vgui-dialog')

    const title = container.querySelector('.vgui-window__title')
    expect(title).toHaveTextContent('Disconnect from server?')
    expect(dialog).toHaveAttribute('aria-labelledby', title?.firstElementChild?.id)
  })

  it('describes itself with the body when there is a prompt', () => {
    const { container } = render(<Dialog title="Disconnect">Disconnect from server?</Dialog>)

    const body = container.querySelector('.vgui-dialog__body')
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', body?.id)
    expect(body).toHaveTextContent('Disconnect from server?')
  })

  it('omits the description when there is no prompt', () => {
    render(<Dialog title="Disconnect" />)

    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby')
  })

  it('wraps the dialog in a non-focusable scrim', () => {
    const { container } = render(<Dialog title="Disconnect">Body</Dialog>)

    const overlay = overlayOf(container)
    expect(overlay).toContainElement(screen.getByRole('dialog'))
    expect(overlay).not.toHaveAttribute('tabindex')
  })

  it('defaults to the confirm variant', () => {
    render(<Dialog title="Disconnect" />)

    expect(screen.getByRole('dialog')).toHaveClass('vgui-dialog--confirm')
  })

  it.each(['alert', 'confirm', 'prompt', 'destructive'] as const)(
    'maps the %s variant to its class',
    (variant) => {
      render(<Dialog title="Disconnect" variant={variant} />)

      expect(screen.getByRole('dialog')).toHaveClass(`vgui-dialog--${variant}`)
    },
  )

  it('renders the body and footer regions', () => {
    const { container } = render(
      <Dialog title="Disconnect" actions={actions}>
        Body
      </Dialog>,
    )

    const body = container.querySelector('.vgui-dialog__body')
    const footer = container.querySelector('.vgui-dialog__footer')
    expect(body).toBeInTheDocument()
    expect(footer).toContainElement(screen.getByRole('button', { name: 'OK' }))
  })

  it('omits the footer when there are no actions', () => {
    const { container } = render(<Dialog title="Disconnect">Body</Dialog>)

    expect(container.querySelector('.vgui-dialog__footer')).not.toBeInTheDocument()
  })

  it('exposes a named close control and none of the desktop frame controls', () => {
    render(<Dialog title="Disconnect" />)

    expect(closeControl()).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Minimize' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Maximize' })).not.toBeInTheDocument()
  })

  it('drops the close control when unclosable', () => {
    render(<Dialog title="Disconnect" unclosable />)

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('asks the caller to close when the close control is used', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Dialog title="Disconnect" open onOpenChange={onOpenChange} />)

    await user.click(closeControl())

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('does not request a close on mount', () => {
    const onOpenChange = vi.fn()
    render(<Dialog title="Disconnect" onOpenChange={onOpenChange} />)

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('closes itself on Escape when uncontrolled', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { queryByRole } = render(
      <Dialog title="Disconnect" onOpenChange={onOpenChange}>
        Body
      </Dialog>,
    )

    await user.keyboard('{Escape}')

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    expect(queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('leaves a controlled dialog open on Escape and reports the request', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Dialog title="Disconnect" open onOpenChange={onOpenChange} />)

    await user.keyboard('{Escape}')

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('ignores Escape when unclosable', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Dialog title="Disconnect" unclosable onOpenChange={onOpenChange} />)

    await user.keyboard('{Escape}')

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('ignores a click on the scrim by default', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { container } = render(
      <Dialog title="Disconnect" onOpenChange={onOpenChange} actions={actions}>
        Body
      </Dialog>,
    )

    await user.click(overlayOf(container))

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('dismisses on a scrim click when asked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { container } = render(
      <Dialog title="Disconnect" dismissOnOverlayClick onOpenChange={onOpenChange} actions={actions}>
        Body
      </Dialog>,
    )

    await user.click(overlayOf(container))

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('does not treat a click inside the dialog as a scrim click', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { container } = render(
      <Dialog title="Disconnect" dismissOnOverlayClick onOpenChange={onOpenChange}>
        Body
      </Dialog>,
    )

    await user.click(container.querySelector('.vgui-dialog__body')!)

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('ignores the scrim while unclosable', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { container } = render(
      <Dialog title="Disconnect" dismissOnOverlayClick unclosable onOpenChange={onOpenChange} />,
    )

    await user.click(overlayOf(container))

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('moves focus to the first action on open', () => {
    render(<Dialog title="Disconnect" actions={actions} />)

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })

  it('honours initialFocusRef over the first action', () => {
    function Prompt() {
      const inputRef = useRef<HTMLInputElement>(null)

      return (
        <Dialog title="Rename" actions={actions} initialFocusRef={inputRef}>
          <input aria-label="Server name" ref={inputRef} />
        </Dialog>
      )
    }

    render(<Prompt />)

    expect(screen.getByRole('textbox', { name: 'Server name' })).toHaveFocus()
  })

  it('leaves focus on an autofocus child', () => {
    render(
      <Dialog
        title="Disconnect"
        actions={
          <>
            <button type="button">Cancel</button>
            <button type="button" autoFocus>
              OK
            </button>
          </>
        }
      />,
    )

    expect(screen.getByRole('button', { name: 'OK' })).toHaveFocus()
  })

  it('returns focus to the element that opened it', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(closeControl())

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus()
  })

  /*
   * The wrap is asserted with a raw `keydown` on purpose: `userEvent.tab()`
   * moves focus itself, which would mask whether the component wrapped it.
   */
  it('traps Tab at the end of the dialog', () => {
    const { container } = render(<Dialog title="Disconnect" actions={actions} />)

    const last = screen.getByRole('button', { name: 'OK' })
    last.focus()
    fireEvent.keyDown(last, { key: 'Tab' })

    expect(titlebarOf(container)).toHaveFocus()
  })

  it('traps Shift+Tab at the start of the dialog', () => {
    const { container } = render(<Dialog title="Disconnect" actions={actions} />)

    const first = titlebarOf(container)
    first.focus()
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })

    expect(screen.getByRole('button', { name: 'OK' })).toHaveFocus()
  })

  it('marks the dialog busy and inerts the action row', () => {
    const { container } = render(<Dialog title="Deleting" busy actions={actions} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-busy', 'true')
    expect(dialog).toHaveClass('vgui-dialog--busy')
    expect(container.querySelector('.vgui-dialog__footer')).toHaveAttribute('data-busy', 'true')

    const spinner = container.querySelector('.vgui-dialog__spinner')
    expect(spinner).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders no busy chrome by default', () => {
    const { container } = render(<Dialog title="Disconnect" actions={actions} />)

    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-busy')
    expect(screen.getByRole('dialog')).not.toHaveClass('vgui-dialog--busy')
    expect(container.querySelector('.vgui-dialog__spinner')).not.toBeInTheDocument()
  })

  it('appends a consumer class to its own', () => {
    render(<Dialog title="Disconnect" className="vgui-dialog--invalid" />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('vgui-dialog')
    expect(dialog).toHaveClass('vgui-dialog--invalid')
  })

  it('forwards its ref to the dialog element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Dialog title="Disconnect" ref={ref} />)

    expect(ref.current).toBe(screen.getByRole('dialog'))
    expect(ref.current).toHaveClass('vgui-dialog')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Dialog title="Delete screenshot?" variant="destructive" actions={actions}>
        This cannot be undone.
      </Dialog>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
