import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { a11yViolations } from '../../test/a11y'
import { ScrollArea } from './ScrollArea'

const stubScroll = (
  viewport: HTMLElement,
  { top, clientHeight, scrollHeight }: { top: number; clientHeight: number; scrollHeight: number },
) => {
  Object.defineProperty(viewport, 'clientHeight', { value: clientHeight, configurable: true })
  Object.defineProperty(viewport, 'scrollHeight', { value: scrollHeight, configurable: true })
  viewport.scrollTop = top
  fireEvent.scroll(viewport)
}

const viewportOf = (container: HTMLElement) =>
  container.querySelector('.vgui-scroll-area__viewport') as HTMLElement

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ScrollArea', () => {
  it('renders children inside a scrolling viewport', () => {
    const { container } = render(<ScrollArea>Server list</ScrollArea>)

    const root = container.querySelector('.vgui-scroll-area') as HTMLElement
    const viewport = viewportOf(container)

    expect(root).toBeInTheDocument()
    expect(root).toHaveClass('vgui-scroll-area')
    expect(viewport).toContainElement(screen.getByText('Server list'))
  })

  it('defaults to the vertical axis with no modifier class', () => {
    const { container } = render(<ScrollArea>content</ScrollArea>)

    const root = container.querySelector('.vgui-scroll-area') as HTMLElement
    expect(root).not.toHaveClass('vgui-scroll-area--horizontal')
    expect(root).not.toHaveClass('vgui-scroll-area--both')
  })

  it('maps the axis prop to overflow longhands', () => {
    const { container, unmount } = render(<ScrollArea axis="horizontal">content</ScrollArea>)
    expect(container.querySelector('.vgui-scroll-area')).toHaveClass(
      'vgui-scroll-area--horizontal',
    )
    unmount()

    const both = render(<ScrollArea axis="both">content</ScrollArea>)
    expect(both.container.querySelector('.vgui-scroll-area')).toHaveClass(
      'vgui-scroll-area--both',
    )
  })

  it('recesses the viewport for the inset variant', () => {
    const { container } = render(<ScrollArea inset>content</ScrollArea>)

    expect(container.querySelector('.vgui-scroll-area')).toHaveClass('vgui-scroll-area--inset')
  })

  it('disables the edge shadows with the no-shadows modifier', () => {
    const { container } = render(<ScrollArea shadows={false}>content</ScrollArea>)

    const root = container.querySelector('.vgui-scroll-area') as HTMLElement
    expect(root).toHaveClass('vgui-scroll-area--no-shadows')
    expect(root.querySelectorAll('.vgui-scroll-area__shadow')).toHaveLength(2)
    for (const shadow of root.querySelectorAll('.vgui-scroll-area__shadow')) {
      expect(shadow).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('caps the viewport height from a number or a string', () => {
    const { container, unmount } = render(<ScrollArea maxHeight={240}>content</ScrollArea>)
    expect(viewportOf(container)).toHaveStyle({ maxHeight: '240px' })
    unmount()

    const sized = render(<ScrollArea maxHeight="50%">content</ScrollArea>)
    expect(viewportOf(sized.container)).toHaveStyle({ maxHeight: '50%' })
  })

  describe('focusable viewport', () => {
    it('becomes a labelled region when asked to', () => {
      render(
        <ScrollArea focusable aria-label="Server list">
          content
        </ScrollArea>,
      )

      const region = screen.getByRole('region', { name: 'Server list' })
      expect(region).toHaveAttribute('tabindex', '0')
      expect(region).toHaveClass('vgui-scroll-area__viewport')
    })

    it('stays a plain viewport when it holds focusable children', () => {
      const { container } = render(
        <ScrollArea>
          <button type="button">Refresh</button>
        </ScrollArea>,
      )

      const viewport = viewportOf(container)
      expect(viewport).not.toHaveAttribute('tabindex')
      expect(viewport).not.toHaveAttribute('role')
    })

    it('makes itself focusable when the children cannot take focus', () => {
      const { container } = render(<ScrollArea>Plain transcript</ScrollArea>)

      const viewport = viewportOf(container)
      expect(viewport).toHaveAttribute('tabindex', '0')
      expect(viewport).toHaveAttribute('role', 'region')
    })

    it('lets the consumer opt out of the automatic fallback', () => {
      const { container } = render(<ScrollArea focusable={false}>Plain transcript</ScrollArea>)

      expect(viewportOf(container)).not.toHaveAttribute('tabindex')
    })
  })

  describe('scroll reporting', () => {
    it('reports the scroll offset to the consumer', () => {
      const onScrollPositionChange = vi.fn()
      const { container } = render(
        <ScrollArea onScrollPositionChange={onScrollPositionChange}>content</ScrollArea>,
      )

      stubScroll(viewportOf(container), { top: 100, clientHeight: 200, scrollHeight: 500 })

      expect(onScrollPositionChange).toHaveBeenCalledExactlyOnceWith(100, 0)
    })

    it('shows the top shadow only once the viewport has scrolled', () => {
      const { container } = render(<ScrollArea>content</ScrollArea>)
      const viewport = viewportOf(container)
      const top = container.querySelector('.vgui-scroll-area__shadow--top') as HTMLElement
      const bottom = container.querySelector('.vgui-scroll-area__shadow--bottom') as HTMLElement

      expect(top).not.toHaveAttribute('data-visible')
      expect(bottom).not.toHaveAttribute('data-visible')

      stubScroll(viewport, { top: 100, clientHeight: 200, scrollHeight: 500 })

      expect(top).toHaveAttribute('data-visible', 'true')
      expect(bottom).toHaveAttribute('data-visible', 'true')

      stubScroll(viewport, { top: 300, clientHeight: 200, scrollHeight: 500 })

      expect(top).toHaveAttribute('data-visible', 'true')
      expect(bottom).not.toHaveAttribute('data-visible')
    })

    it('keeps both shadows hidden when the content is shorter than the viewport', () => {
      const { container } = render(<ScrollArea>content</ScrollArea>)

      stubScroll(viewportOf(container), { top: 0, clientHeight: 200, scrollHeight: 200 })

      expect(container.querySelector('.vgui-scroll-area__shadow--top')).not.toHaveAttribute(
        'data-visible',
      )
      expect(container.querySelector('.vgui-scroll-area__shadow--bottom')).not.toHaveAttribute(
        'data-visible',
      )
    })
  })

  describe('drawn scrollbar', () => {
    it('renders a themed scrollbar instead of the platform one', () => {
      const { container } = render(<ScrollArea>content</ScrollArea>)

      const root = container.querySelector('.vgui-scroll-area') as HTMLElement
      expect(root).toHaveClass('vgui-scroll-area--drawn')

      const bar = root.querySelector('.vgui-scroll-area__scrollbar--vertical') as HTMLElement
      expect(bar).toHaveAttribute('aria-hidden', 'true')
      expect(bar.querySelectorAll('.vgui-scroll-area__button')).toHaveLength(2)
      expect(bar.querySelector('.vgui-scroll-area__thumb')).toBeInTheDocument()
      expect(root.querySelector('.vgui-scroll-area__scrollbar--horizontal')).not.toBeInTheDocument()
    })

    it('renders a horizontal bar for the horizontal axis and both for both', () => {
      const { container, unmount } = render(
        <ScrollArea axis="horizontal">
          content
        </ScrollArea>,
      )
      expect(
        container.querySelector('.vgui-scroll-area__scrollbar--horizontal'),
      ).toBeInTheDocument()
      expect(container.querySelector('.vgui-scroll-area__scrollbar--vertical')).not.toBeInTheDocument()
      unmount()

      const both = render(
        <ScrollArea axis="both">
          content
        </ScrollArea>,
      )
      expect(both.container.querySelector('.vgui-scroll-area__scrollbar--vertical')).toBeInTheDocument()
      expect(both.container.querySelector('.vgui-scroll-area__scrollbar--horizontal')).toBeInTheDocument()
    })

    it('sizes the thumb to the visible proportion of the content', () => {
      const { container } = render(<ScrollArea>content</ScrollArea>)

      stubScroll(viewportOf(container), { top: 0, clientHeight: 200, scrollHeight: 500 })

      expect(container.querySelector('.vgui-scroll-area__thumb')).toHaveStyle({ height: '40%' })
    })

    it('falls back to the platform bar in the native variant', () => {
      const { container } = render(
        <ScrollArea variant="native">content</ScrollArea>,
      )

      const root = container.querySelector('.vgui-scroll-area') as HTMLElement
      expect(root).toHaveClass('vgui-scroll-area--native')
      expect(root.querySelector('.vgui-scroll-area__scrollbar')).not.toBeInTheDocument()
      expect(viewportOf(container)).toHaveClass('vgui-scroll-surface')
    })
  })

  it('forwards the ref and merges the className onto the root', () => {
    const ref = createRef<HTMLDivElement>()
    const { container } = render(
      <ScrollArea ref={ref} className="custom-class">
        content
      </ScrollArea>,
    )

    expect(ref.current).toBe(container.querySelector('.vgui-scroll-area'))
    expect(ref.current).toHaveClass('vgui-scroll-area', 'custom-class')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ScrollArea inset variant="native" aria-label="Server list">
        <ul>
          <li>Counter-Strike: Source</li>
        </ul>
      </ScrollArea>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
