import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Scrollbar } from './Scrollbar'

function region(container: HTMLElement): HTMLElement {
  const node = container.querySelector<HTMLElement>('.vgui-scroll-region')
  if (!node) throw new Error('no scroll region rendered')
  return node
}

function content(container: HTMLElement): HTMLElement {
  const node = container.querySelector<HTMLElement>('.vgui-scroll-region__content')
  if (!node) throw new Error('no drawn content wrapper rendered')
  return node
}

describe('Scrollbar', () => {
  it('draws the bar by default, which is the preferred path', () => {
    const { container } = render(<Scrollbar>log</Scrollbar>)

    expect(region(container)).toHaveClass(
      'vgui-scroll-region',
      'vgui-scroll-region--vertical',
      'vgui-scroll-region--drawn',
    )
    expect(container.querySelector('.vgui-scrollbar')).not.toBeNull()
    expect(region(container)).not.toHaveClass('vgui-scroll-surface')
    expect(region(container)).toHaveTextContent('log')
  })

  it('defers to the platform bar in the native variant', () => {
    const { container } = render(<Scrollbar variant="native">log</Scrollbar>)

    expect(container.querySelector('.vgui-scrollbar')).toBeNull()
    expect(region(container)).toHaveClass('vgui-scroll-surface')
    expect(region(container)).toHaveTextContent('log')
  })

  it('defaults to the vertical axis and switches to horizontal', () => {
    const { container, rerender } = render(<Scrollbar />)
    expect(region(container).className).toBe(
      'vgui-scroll-region vgui-scroll-region--vertical vgui-scroll-region--drawn',
    )

    rerender(<Scrollbar orientation="horizontal" />)
    expect(region(container).className).toBe(
      'vgui-scroll-region vgui-scroll-region--horizontal vgui-scroll-region--drawn',
    )
  })

  it('renders the button/gutter/thumb tree, hidden, for the drawn variant', () => {
    const { container } = render(<Scrollbar variant="drawn" />)

    const bar = container.querySelector<HTMLElement>('.vgui-scrollbar')
    expect(bar).not.toBeNull()
    expect(bar).toHaveAttribute('aria-hidden', 'true')
    expect(bar).toHaveAttribute('data-orientation', 'vertical')
    expect(container.querySelectorAll('.vgui-scrollbar__button')).toHaveLength(2)
    expect(container.querySelector('.vgui-scrollbar__gutter')).not.toBeNull()
    expect(container.querySelector('.vgui-scrollbar__thumb')).not.toBeNull()
    expect(container.querySelector('.vgui-scrollbar__glyph--up')).not.toBeNull()
    expect(container.querySelector('.vgui-scrollbar__glyph--down')).not.toBeNull()
  })

  it('keeps the drawn arrow buttons out of the tab order', () => {
    const { container } = render(<Scrollbar variant="drawn" />)

    const buttons = container.querySelectorAll('.vgui-scrollbar__button')
    expect(buttons).toHaveLength(2)
    buttons.forEach((button) => expect(button).toHaveAttribute('tabindex', '-1'))
  })

  it('labels the axes of the drawn bar rather than the buttons', () => {
    const { container } = render(<Scrollbar variant="drawn" orientation="horizontal" />)

    expect(container.querySelector('.vgui-scrollbar')).toHaveAttribute('data-orientation', 'horizontal')
    expect(container.querySelector('.vgui-scrollbar__glyph--left')).not.toBeNull()
    expect(container.querySelector('.vgui-scrollbar__glyph--right')).not.toBeNull()
  })

  it('accepts a numeric or a string thickness and leaves the default alone', () => {
    const { container, rerender } = render(<Scrollbar thickness={12} />)
    expect(region(container).style.getPropertyValue('--vgui-scrollbar-size')).toBe('12px')

    rerender(<Scrollbar thickness="1.5rem" />)
    expect(region(container).style.getPropertyValue('--vgui-scrollbar-size')).toBe('1.5rem')

    rerender(<Scrollbar />)
    expect(region(container).style.getPropertyValue('--vgui-scrollbar-size')).toBe('')
  })

  it('adds the always-visible modifier only when asked', () => {
    const { container, rerender } = render(<Scrollbar />)
    expect(region(container)).not.toHaveClass('vgui-scroll-region--always-visible')

    rerender(<Scrollbar alwaysVisible />)
    expect(region(container)).toHaveClass('vgui-scroll-region--always-visible')
  })

  it('paints a disabled gutter without disabling scrolling', () => {
    const { container } = render(
      <Scrollbar variant="drawn" disabled>
        log
      </Scrollbar>,
    )

    const node = region(container)
    expect(node).toHaveAttribute('data-disabled')
    expect(node).not.toHaveAttribute('aria-disabled')
    expect(node).not.toHaveAttribute('disabled')
    expect(content(container)).toHaveTextContent('log')
  })

  it('routes scroll padding through a single local property', () => {
    const { container } = render(<Scrollbar scrollPadding={6} />)

    expect(region(container).style.getPropertyValue('--vgui-scrollbar-scroll-padding')).toBe('6px')
  })

  it('forwards the ref, the className and the remaining div attributes', () => {
    const ref = createRef<HTMLDivElement>()
    const { container } = render(
      <Scrollbar ref={ref} className="my-scroll" id="log" aria-label="Server log">
        log
      </Scrollbar>,
    )

    expect(ref.current).toBe(region(container))
    expect(region(container)).toHaveClass('my-scroll')
    expect(region(container)).toHaveAttribute('id', 'log')
    expect(screen.getByLabelText('Server log')).toBe(region(container))
  })

  it('reports the offset and the extent after every scroll, guarded against a missing layout engine', () => {
    const onScrollOffsetChange = vi.fn()
    const onScroll = vi.fn()
    const { container } = render(
      <Scrollbar onScroll={onScroll} onScrollOffsetChange={onScrollOffsetChange}>
        log
      </Scrollbar>,
    )

    const node = content(container)
    node.scrollTop = 40
    fireEvent.scroll(node)

    expect(onScroll).toHaveBeenCalledTimes(1)
    expect(onScrollOffsetChange).toHaveBeenLastCalledWith(40, 0)
    expect(Number.isNaN(onScrollOffsetChange.mock.lastCall?.[0] as number)).toBe(false)
  })

  it('never reports a negative offset or extent', () => {
    const onScrollOffsetChange = vi.fn()
    const { container } = render(<Scrollbar onScrollOffsetChange={onScrollOffsetChange} />)

    fireEvent.scroll(content(container))

    expect(onScrollOffsetChange).toHaveBeenLastCalledWith(0, 0)
  })

  it('steps the drawn variant with its arrow buttons', async () => {
    const user = userEvent.setup()
    const { container } = render(<Scrollbar variant="drawn" />)
    const scroller = content(container)

    await user.click(container.querySelector('.vgui-scrollbar__button--increment') as HTMLElement)
    expect(scroller.scrollTop).toBe(20)

    await user.click(container.querySelector('.vgui-scrollbar__button--decrement') as HTMLElement)
    expect(scroller.scrollTop).toBe(0)
  })

  it('degrades to a no-op when the gutter cannot be measured', async () => {
    const user = userEvent.setup()
    const { container } = render(<Scrollbar variant="drawn" />)
    const scroller = content(container)
    const thumb = container.querySelector('.vgui-scrollbar__thumb') as HTMLElement

    await user.pointer({ keys: '[MouseLeft>]', target: thumb })
    await user.pointer({ keys: '[/MouseLeft]', target: thumb })

    expect(scroller.scrollTop).toBe(0)
  })

  it('sizes an unmeasurable thumb from end to end rather than to nothing', () => {
    const { container } = render(<Scrollbar variant="drawn" />)
    const thumb = container.querySelector<HTMLElement>('.vgui-scrollbar__thumb')

    expect(thumb?.style.getPropertyValue('--vgui-scrollbar-thumb-length')).toBe('100%')
    expect(thumb?.style.getPropertyValue('--vgui-scrollbar-thumb-offset')).toBe('0')
  })

  it('scrolls the region from the keyboard once it holds focus', async () => {
    const user = userEvent.setup()
    const { container } = render(<Scrollbar>log</Scrollbar>)

    await user.tab()
    expect(region(container)).toHaveFocus()

    // The drawn region hides its own overflow, so these keys are handled in
    // JavaScript rather than by the engine.
    await user.keyboard('{ArrowDown}')
    expect(content(container).scrollTop).toBe(20)

    await user.keyboard('{ArrowUp}')
    expect(content(container).scrollTop).toBe(0)
  })

  it('maps the remaining scroll keys onto the drawn scroller', async () => {
    const user = userEvent.setup()
    const { container } = render(<Scrollbar>log</Scrollbar>)
    const scroller = content(container)
    Object.defineProperty(scroller, 'clientHeight', { value: 100, configurable: true })
    Object.defineProperty(scroller, 'scrollHeight', { value: 400, configurable: true })

    await user.tab()
    await user.keyboard('{PageDown}')
    expect(scroller.scrollTop).toBe(100)

    await user.keyboard(' ')
    expect(scroller.scrollTop).toBe(200)

    await user.keyboard('{End}')
    expect(scroller.scrollTop).toBe(400)

    await user.keyboard('{Home}')
    expect(scroller.scrollTop).toBe(0)
  })

  it('leaves the keyboard to the browser in the native path', async () => {
    const user = userEvent.setup()
    const { container } = render(<Scrollbar variant="native">log</Scrollbar>)

    await user.tab()
    await user.keyboard('{ArrowDown}')

    expect(region(container).scrollTop).toBe(0)
    expect(container.querySelector('.vgui-scroll-region__content')).toBeNull()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Scrollbar aria-label="Server log" style={{ height: 120 }}>
          <p>line 1</p>
        </Scrollbar>
        <Scrollbar variant="native" aria-label="Avatar grid" style={{ height: 120 }}>
          <p>avatar</p>
        </Scrollbar>
        <Scrollbar variant="drawn" orientation="horizontal" disabled aria-label="Timeline">
          <p>timeline</p>
        </Scrollbar>
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
