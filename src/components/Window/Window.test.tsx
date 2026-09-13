import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Window } from './Window'

function getTitlebar(container: HTMLElement) {
  const titlebar = container.querySelector('.vgui-window__titlebar')
  if (!(titlebar instanceof HTMLElement)) throw new Error('no title bar')
  return titlebar
}

describe('Window', () => {
  it('renders a named region labelled by its title bar', () => {
    const { container } = render(<Window title="Servers">Body</Window>)

    const window = screen.getByRole('region', { name: 'Servers' })
    expect(window.tagName).toBe('SECTION')
    expect(window).toHaveClass('vgui-window')

    const title = container.querySelector('.vgui-window__title')
    expect(title).toHaveTextContent('Servers')
    expect(window).toHaveAttribute('aria-labelledby', title?.id)
  })

  it('renders children inside the body region', () => {
    const { container } = render(<Window title="Servers">No servers found</Window>)

    const body = container.querySelector('.vgui-window__body')
    expect(body).toHaveTextContent('No servers found')
    expect(body).toContainElement(screen.getByText('No servers found'))
  })

  it('renders one named button per enabled control', () => {
    render(<Window title="Servers" />)

    expect(screen.getByRole('button', { name: 'Minimize' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Maximize' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('groups the controls under a label', () => {
    render(<Window title="Servers" />)

    expect(screen.getByRole('group', { name: 'Window controls' })).toBeInTheDocument()
  })

  it('honours a custom controls label', () => {
    render(<Window title="Servers" controlsLabel="Server browser controls" />)

    expect(screen.getByRole('group', { name: 'Server browser controls' })).toBeInTheDocument()
  })

  it('omits the controls it was told not to render', () => {
    render(<Window title="Servers" minimizable={false} maximizable={false} />)

    expect(screen.queryByRole('button', { name: 'Minimize' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Maximize' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('drops the whole control group when every control is disabled', () => {
    render(<Window title="Servers" minimizable={false} maximizable={false} closable={false} />)

    expect(screen.queryByRole('group')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it.each([
    ['minimize', 'Minimize'],
    ['maximize', 'Maximize'],
    ['close', 'Close'],
  ] as const)('reports the %s action', async (action, name) => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(<Window title="Servers" onAction={onAction} />)

    await user.click(screen.getByRole('button', { name }))

    expect(onAction).toHaveBeenCalledExactlyOnceWith(action)
  })

  it('swaps the middle control for a restore action while maximized', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(<Window title="Servers" maximized onAction={onAction} />)

    expect(screen.queryByRole('button', { name: 'Maximize' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Restore' }))

    expect(onAction).toHaveBeenCalledExactlyOnceWith('restore')
  })

  it('closes on Escape only when it owns the focus scope', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    const { container, rerender } = render(<Window title="Servers" onAction={onAction} />)

    getTitlebar(container).focus()
    await user.keyboard('{Escape}')
    expect(onAction).not.toHaveBeenCalled()

    rerender(<Window title="Servers" role="dialog" aria-modal="true" onAction={onAction} />)
    getTitlebar(container).focus()
    await user.keyboard('{Escape}')
    expect(onAction).toHaveBeenCalledExactlyOnceWith('close')
  })

  it('does not close on Escape when closing is not offered', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    const { container } = render(
      <Window title="Servers" role="dialog" aria-modal="true" closable={false} onAction={onAction} />,
    )

    getTitlebar(container).focus()
    await user.keyboard('{Escape}')

    expect(onAction).not.toHaveBeenCalled()
  })

  it('adds the focused and maximized modifier classes', () => {
    const { container, rerender } = render(<Window title="Servers" focused maximized />)

    const window = container.querySelector('.vgui-window')
    expect(window).toHaveClass('vgui-window--focused')
    expect(window).toHaveClass('vgui-window--maximized')

    rerender(<Window title="Servers" />)
    expect(container.querySelector('.vgui-window')?.className.split(' ')).toEqual(['vgui-window'])
  })

  it('renders no grip when the window is not resizable or is maximized', () => {
    const { container, rerender } = render(<Window title="Servers" />)
    expect(container.querySelector('.vgui-window__grip')).toBeInTheDocument()

    rerender(<Window title="Servers" resizable={false} />)
    expect(container.querySelector('.vgui-window__grip')).not.toBeInTheDocument()

    rerender(<Window title="Servers" maximized />)
    expect(container.querySelector('.vgui-window__grip')).not.toBeInTheDocument()
  })

  it('announces the grip as a resize control only when it can report a drag', () => {
    const { container, rerender } = render(<Window title="Servers" />)

    const decorativeGrip = container.querySelector('.vgui-window__grip')
    expect(decorativeGrip).toHaveAttribute('aria-hidden', 'true')
    expect(decorativeGrip).not.toHaveAttribute('tabindex')

    rerender(<Window title="Servers" onDrag={() => undefined} />)
    expect(screen.getByLabelText('Resize window')).toHaveAttribute('tabindex', '0')
  })

  it('exposes the native tooltip through title while the caption keeps its own name', () => {
    render(<Window title="Servers" tooltip="Steam server browser" />)

    const window = screen.getByRole('region', { name: 'Servers' })
    expect(window).toHaveAttribute('title', 'Steam server browser')
  })

  it('reports pointer deltas relative to the start of the drag', () => {
    const onDrag = vi.fn()
    const { container } = render(<Window title="Servers" onDrag={onDrag} />)
    const titlebar = getTitlebar(container)

    fireEvent.pointerDown(titlebar, { button: 0, pointerId: 1, clientX: 100, clientY: 40 })
    fireEvent.pointerMove(titlebar, { pointerId: 1, clientX: 140, clientY: 25 })

    expect(onDrag).toHaveBeenCalledExactlyOnceWith(40, -15)
  })

  it('stops reporting once the pointer is released', () => {
    const onDrag = vi.fn()
    const { container } = render(<Window title="Servers" onDrag={onDrag} />)
    const titlebar = getTitlebar(container)

    fireEvent.pointerDown(titlebar, { button: 0, pointerId: 1, clientX: 10, clientY: 10 })
    fireEvent.pointerMove(titlebar, { pointerId: 1, clientX: 20, clientY: 10 })
    fireEvent.pointerUp(titlebar, { pointerId: 1, clientX: 20, clientY: 10 })
    fireEvent.pointerMove(titlebar, { pointerId: 1, clientX: 90, clientY: 90 })

    expect(onDrag).toHaveBeenCalledExactlyOnceWith(10, 0)
  })

  it('ignores pointer presses that are not the primary button', () => {
    const onDrag = vi.fn()
    const { container } = render(<Window title="Servers" onDrag={onDrag} />)

    fireEvent.pointerDown(getTitlebar(container), {
      button: 2,
      pointerId: 1,
      clientX: 0,
      clientY: 0,
    })
    fireEvent.pointerMove(getTitlebar(container), { pointerId: 1, clientX: 30, clientY: 30 })

    expect(onDrag).not.toHaveBeenCalled()
  })

  it('nudges the window from the keyboard, finely with Shift', async () => {
    const user = userEvent.setup()
    const onDrag = vi.fn()
    const { container } = render(<Window title="Servers" onDrag={onDrag} />)
    const titlebar = getTitlebar(container)

    titlebar.focus()
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowUp}')
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')

    expect(onDrag).toHaveBeenNthCalledWith(1, 8, 0)
    expect(onDrag).toHaveBeenNthCalledWith(2, 0, -8)
    expect(onDrag).toHaveBeenNthCalledWith(3, 0, 1)
  })

  it('lets the keyboard drive the resize grip too', async () => {
    const user = userEvent.setup()
    const onDrag = vi.fn()
    render(<Window title="Servers" onDrag={onDrag} />)

    screen.getByLabelText('Resize window').focus()
    await user.keyboard('{ArrowLeft}{ArrowDown}')

    expect(onDrag).toHaveBeenNthCalledWith(1, -8, 0)
    expect(onDrag).toHaveBeenNthCalledWith(2, 0, 8)
  })

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <Window title="Servers" ref={ref}>
        Body
      </Window>,
    )

    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current).toHaveClass('vgui-window')
    expect(ref.current).toHaveRole('region')
  })

  it('merges a caller className after its own classes', () => {
    render(<Window title="Servers" maximized className="my-window" />)

    expect(screen.getByRole('region').className).toBe(
      'vgui-window vgui-window--maximized my-window',
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Window title="Servers" focused>
          Refresh this list to see the latest servers.
        </Window>
        <Window title="Library" minimizable={false} maximizable={false} resizable={false}>
          <button type="button">Play</button>
        </Window>
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
