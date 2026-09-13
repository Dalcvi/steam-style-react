import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Splitter } from './Splitter'

const FIRST_PANE = 'Filters'
const SECOND_PANE = 'Servers'

function panes() {
  return {
    first: <span>{FIRST_PANE}</span>,
    second: <span>{SECOND_PANE}</span>,
  }
}

function getSeparator() {
  return screen.getByRole('separator')
}

function stubLayout(width: number, height: number) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect)
}

describe('Splitter', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders both panes and a focusable separator between them', () => {
    const { container } = render(<Splitter {...panes()} />)

    const root = container.querySelector('.vgui-splitter')
    const separator = getSeparator()

    expect(screen.getByText(FIRST_PANE)).toBeInTheDocument()
    expect(screen.getByText(SECOND_PANE)).toBeInTheDocument()
    // The handle is a sibling of the panes, not a child.
    expect(separator.parentElement).toBe(root)
    expect(separator.previousElementSibling).toHaveClass('vgui-splitter__pane--first')
    expect(separator.nextElementSibling).toHaveClass('vgui-splitter__pane--second')
    expect(separator).toHaveAttribute('tabindex', '0')
    expect(separator).toHaveClass('vgui-splitter__handle')
  })

  it('carries the centred grip texture', () => {
    const { container } = render(<Splitter {...panes()} />)

    const grip = container.querySelector('.vgui-splitter__handle-grip')
    expect(grip).toBeInTheDocument()
    expect(grip).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.vgui-splitter')).toHaveClass('vgui-splitter--horizontal')
  })

  it('names the separator, defaulting to "Resize panel"', () => {
    const { rerender } = render(<Splitter {...panes()} />)

    expect(getSeparator()).toHaveAccessibleName('Resize panel')

    rerender(<Splitter {...panes()} label="Resize filter pane" />)
    expect(getSeparator()).toHaveAccessibleName('Resize filter pane')
  })

  it('reports the separator orientation, not the pane axis', () => {
    const { rerender } = render(<Splitter {...panes()} />)

    // Horizontal layout ⇒ a vertical bar between the panes.
    expect(getSeparator()).toHaveAttribute('aria-orientation', 'vertical')

    rerender(<Splitter {...panes()} orientation="vertical" />)
    expect(getSeparator()).toHaveAttribute('aria-orientation', 'horizontal')
    expect(screen.getByText(FIRST_PANE).parentElement?.parentElement).toHaveClass(
      'vgui-splitter--vertical',
    )
  })

  it.each([
    ['horizontal', 'vgui-splitter--horizontal'],
    ['vertical', 'vgui-splitter--vertical'],
  ] as const)('adds the %s modifier class', (orientation, modifierClass) => {
    const { container } = render(<Splitter {...panes()} orientation={orientation} />)

    expect(container.querySelector('.vgui-splitter')).toHaveClass(modifierClass)
  })

  it('publishes a pixel size as `--vgui-splitter-size`', () => {
    const { container } = render(<Splitter {...panes()} defaultSize={200} />)

    const root = container.querySelector('.vgui-splitter')
    expect(root?.getAttribute('style')).toContain('--vgui-splitter-size: 200px')
  })

  it('passes a percentage size straight through', () => {
    const { container } = render(<Splitter {...panes()} defaultSize="30%" />)

    const root = container.querySelector('.vgui-splitter')
    expect(root?.getAttribute('style')).toContain('--vgui-splitter-size: 30%')
  })

  it('omits the size property entirely when no size is declared', () => {
    const { container } = render(<Splitter {...panes()} />)

    const root = container.querySelector('.vgui-splitter')
    expect(root?.getAttribute('style') ?? '').not.toContain('--vgui-splitter-size')
  })

  it('reports an even split when no size is declared', () => {
    render(<Splitter {...panes()} />)

    const separator = getSeparator()
    expect(separator).toHaveAttribute('aria-valuenow', '50')
    expect(separator).toHaveAttribute('aria-valuemin', '0')
    expect(separator).toHaveAttribute('aria-valuemax', '100')
    expect(separator).toHaveAttribute('aria-valuetext', '50 percent')
  })

  it('reports a percentage size as a proportion', () => {
    render(<Splitter {...panes()} defaultSize="42%" />)

    const separator = getSeparator()
    expect(separator).toHaveAttribute('aria-valuenow', '42')
    expect(separator).toHaveAttribute('aria-valuemin', '0')
    expect(separator).toHaveAttribute('aria-valuemax', '100')
    expect(separator).toHaveAttribute('aria-valuetext', '42 percent')
  })

  it('reports a pixel size against the documented pixel bounds', () => {
    render(<Splitter {...panes()} defaultSize={200} minSize={120} maxSize={320} />)

    const separator = getSeparator()
    expect(separator).toHaveAttribute('aria-valuenow', '200')
    expect(separator).toHaveAttribute('aria-valuemin', '120')
    expect(separator).toHaveAttribute('aria-valuemax', '320')
    expect(separator).toHaveAttribute('aria-valuetext', '200 pixels')
  })

  it('reports pointer deltas in pixels for an uncontrolled pixel size', () => {
    const onResize = vi.fn()
    render(<Splitter {...panes()} defaultSize={200} onResize={onResize} />)

    fireEvent.pointerDown(getSeparator(), { button: 0, pointerId: 1, clientX: 100, clientY: 50 })
    fireEvent.pointerMove(getSeparator(), { pointerId: 1, clientX: 140, clientY: 90 })

    expect(onResize).toHaveBeenCalledExactlyOnceWith(240)
  })

  it('measures a vertical splitter along the y axis', () => {
    const onResize = vi.fn()
    render(<Splitter {...panes()} orientation="vertical" defaultSize={200} onResize={onResize} />)

    const separator = getSeparator()
    fireEvent.pointerDown(separator, { button: 0, pointerId: 1, clientX: 100, clientY: 50 })
    fireEvent.pointerMove(separator, { pointerId: 1, clientX: 400, clientY: 80 })

    expect(onResize).toHaveBeenCalledExactlyOnceWith(230)
  })

  it('stops resizing once the pointer is released', () => {
    const onResize = vi.fn()
    render(<Splitter {...panes()} defaultSize={200} onResize={onResize} />)

    const separator = getSeparator()
    fireEvent.pointerDown(separator, { button: 0, pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(separator, { pointerId: 1, clientX: 10, clientY: 0 })
    fireEvent.pointerUp(separator, { pointerId: 1, clientX: 10, clientY: 0 })
    fireEvent.pointerMove(separator, { pointerId: 1, clientX: 90, clientY: 0 })

    expect(onResize).toHaveBeenCalledExactlyOnceWith(210)
  })

  it('ignores pointer presses that are not the primary button', () => {
    const onResize = vi.fn()
    render(<Splitter {...panes()} defaultSize={200} onResize={onResize} />)

    fireEvent.pointerDown(getSeparator(), { button: 2, pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(getSeparator(), { pointerId: 1, clientX: 40, clientY: 0 })

    expect(onResize).not.toHaveBeenCalled()
  })

  it('clamps a pointer drag to maxSize', () => {
    const onResize = vi.fn()
    render(<Splitter {...panes()} defaultSize={200} maxSize={220} onResize={onResize} />)

    fireEvent.pointerDown(getSeparator(), { button: 0, pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(getSeparator(), { pointerId: 1, clientX: 100, clientY: 0 })

    expect(onResize).toHaveBeenCalledExactlyOnceWith(220)
  })

  it('resolves a percentage against the laid-out container', () => {
    stubLayout(800, 400)
    const onResize = vi.fn()
    render(<Splitter {...panes()} defaultSize="25%" onResize={onResize} />)

    fireEvent.pointerDown(getSeparator(), { button: 0, pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(getSeparator(), { pointerId: 1, clientX: 100, clientY: 0 })

    // 25% of 800 is 200, plus the 100px drag.
    expect(onResize).toHaveBeenCalledExactlyOnceWith(300)
  })

  it('does not throw, or guess, when a percentage cannot be measured', () => {
    const onResize = vi.fn()
    render(<Splitter {...panes()} defaultSize="25%" onResize={onResize} />)

    fireEvent.pointerDown(getSeparator(), { button: 0, pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(getSeparator(), { pointerId: 1, clientX: 100, clientY: 0 })

    // jsdom reports a zero-sized rect: there is no honest pixel answer.
    expect(onResize).not.toHaveBeenCalled()
  })

  it('nudges by 10px from the keyboard, finely with Shift', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(<Splitter {...panes()} defaultSize={200} onResize={onResize} />)

    getSeparator().focus()
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowLeft}')
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}')

    expect(onResize).toHaveBeenNthCalledWith(1, 210)
    expect(onResize).toHaveBeenNthCalledWith(2, 200)
    expect(onResize).toHaveBeenNthCalledWith(3, 201)
  })

  it('nudges a vertical splitter with the up and down arrows', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(<Splitter {...panes()} orientation="vertical" defaultSize={200} onResize={onResize} />)

    getSeparator().focus()
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowUp}')

    expect(onResize).toHaveBeenNthCalledWith(1, 210)
    expect(onResize).toHaveBeenNthCalledWith(2, 200)
  })

  it('ignores the arrow keys that run along the separator', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(<Splitter {...panes()} defaultSize={200} onResize={onResize} />)

    getSeparator().focus()
    await user.keyboard('{ArrowUp}{ArrowDown}')

    expect(onResize).not.toHaveBeenCalled()
  })

  it('snaps to the bounds with Home and End', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(<Splitter {...panes()} defaultSize={200} minSize={120} maxSize={320} onResize={onResize} />)

    getSeparator().focus()
    await user.keyboard('{Home}')
    await user.keyboard('{End}')

    expect(onResize).toHaveBeenNthCalledWith(1, 120)
    expect(onResize).toHaveBeenNthCalledWith(2, 320)
  })

  it('updates its own size when uncontrolled', async () => {
    const user = userEvent.setup()
    const { container } = render(<Splitter {...panes()} defaultSize={200} />)

    getSeparator().focus()
    await user.keyboard('{ArrowRight}')

    expect(container.querySelector('.vgui-splitter')?.getAttribute('style')).toContain(
      '--vgui-splitter-size: 210px',
    )
  })

  it('leaves the size to the caller when controlled', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    const { container } = render(
      <Splitter {...panes()} size={200} onResize={onResize} />,
    )

    getSeparator().focus()
    await user.keyboard('{ArrowRight}')

    expect(onResize).toHaveBeenCalledExactlyOnceWith(210)
    expect(container.querySelector('.vgui-splitter')?.getAttribute('style')).toContain(
      '--vgui-splitter-size: 200px',
    )
  })

  it('becomes inert when aria-disabled is set', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(<Splitter {...panes()} defaultSize={200} aria-disabled onResize={onResize} />)

    const separator = getSeparator()
    expect(separator).toHaveAttribute('aria-disabled', 'true')
    expect(separator).toHaveAttribute('tabindex', '-1')

    separator.focus()
    await user.keyboard('{ArrowRight}')
    fireEvent.pointerDown(separator, { button: 0, pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(separator, { pointerId: 1, clientX: 40, clientY: 0 })

    expect(onResize).not.toHaveBeenCalled()
  })

  it('merges a caller className last and forwards the ref', () => {
    const ref = createRef<HTMLDivElement>()
    const { container } = render(
      <Splitter {...panes()} className="vgui-splitter--plain" ref={ref} />,
    )

    const root = container.querySelector('.vgui-splitter')
    expect(root?.className).toBe('vgui-splitter vgui-splitter--horizontal vgui-splitter--plain')
    expect(ref.current).toBe(root)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div style={{ width: 480, height: 240 }}>
        <Splitter {...panes()} defaultSize="30%" minSize={120} maxSize={320} />
        <Splitter {...panes()} orientation="vertical" defaultSize={200} />
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
