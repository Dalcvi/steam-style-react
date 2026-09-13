import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import type {
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  UIEvent as ReactUIEvent,
} from 'react'

import './Scrollbar.css'
import '../../styles/scrollbars.css'

export interface ScrollbarProps extends HTMLAttributes<HTMLDivElement> {
  /** Scrolling axis. Defaults to `"vertical"`. */
  orientation?: 'vertical' | 'horizontal'
  /**
   * Painting strategy. `"drawn"` renders the button/gutter/thumb tree, which
   * looks the same in every engine; `"native"` sets `scrollbar-color` and emits
   * no extra markup, leaving the bar to the platform. Defaults to `"drawn"`.
   */
  variant?: 'drawn' | 'native'
  /**
   * Bar thickness. Defaults to `--vgui-scrollbar-size` (18px). Honoured by both
   * variants, but the platform only paints a custom thickness in WebKit/Blink.
   */
  thickness?: number | string
  /** Reserve space for the bar even when the content does not overflow. */
  alwaysVisible?: boolean
  /**
   * Paint the gutter with nothing, matching `ScrollBarSlider:disabled`
   * (`steam.styles:2315`). The content stays scrollable.
   */
  disabled?: boolean
  /** Pixels of the region that must remain visible above the bar. */
  scrollPadding?: number
  /** Called with the scroll offset after every scroll frame. */
  onScrollOffsetChange?: (offset: number, max: number) => void
}

interface ScrollMetrics {
  offset: number
  max: number
  viewport: number
  content: number
}

const EMPTY_METRICS: ScrollMetrics = { offset: 0, max: 0, viewport: 0, content: 0 }

/** jsdom has no layout engine, so every measured number is 0/NaN there. */
function toExtent(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

export const Scrollbar = forwardRef<HTMLDivElement, ScrollbarProps>(function Scrollbar(
  {
    className,
    orientation = 'vertical',
    variant = 'drawn',
    thickness,
    alwaysVisible = false,
    disabled = false,
    scrollPadding,
    onScrollOffsetChange,
    children,
    style,
    tabIndex,
    onScroll,
    onKeyDown,
    ...rest
  },
  forwardedRef,
) {
  const regionRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const dragCleanupRef = useRef<(() => void) | null>(null)
  const [metrics, setMetrics] = useState<ScrollMetrics>(EMPTY_METRICS)

  const drawn = variant === 'drawn'
  const vertical = orientation === 'vertical'

  // In the native path the region scrolls itself; in the drawn path the inner
  // content does, and the bar is a flex sibling that never scrolls away.
  const scroller = drawn ? contentRef : regionRef

  const measure = useCallback(() => {
    const node = scroller.current
    if (!node) return

    const viewport = toExtent(vertical ? node.clientHeight : node.clientWidth)
    const content = toExtent(vertical ? node.scrollHeight : node.scrollWidth)
    const offset = Math.max(vertical ? node.scrollTop : node.scrollLeft, 0)
    const max = content > viewport ? content - viewport : 0

    setMetrics({
      offset: max > 0 ? Math.min(offset, max) : offset,
      max,
      viewport,
      content,
    })
    onScrollOffsetChange?.(max > 0 ? Math.min(offset, max) : offset, max)
  }, [onScrollOffsetChange, scroller, vertical])

  useEffect(() => {
    measure()

    const node = scroller.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [measure, scroller, children])

  useEffect(() => () => dragCleanupRef.current?.(), [])

  const setRegionRef = useCallback(
    (node: HTMLDivElement | null) => {
      regionRef.current = node
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [forwardedRef],
  )

  const handleScroll = useCallback(
    (event: ReactUIEvent<HTMLDivElement>) => {
      onScroll?.(event)
      measure()
    },
    [measure, onScroll],
  )

  const scrollByExtent = useCallback(
    (delta: number) => {
      const node = scroller.current
      if (!node) return

      // The engine clamps the far end to the content extent; the near end is
      // clamped here so a negative nudge cannot park the scroller above zero.
      if (vertical) node.scrollTop = Math.max(node.scrollTop + delta, 0)
      else node.scrollLeft = Math.max(node.scrollLeft + delta, 0)
      measure()
    },
    [measure, scroller, vertical],
  )

  const scrollToEdge = useCallback(
    (edge: 'start' | 'end') => {
      const node = scroller.current
      if (!node) return

      if (vertical) node.scrollTop = edge === 'start' ? 0 : node.scrollHeight
      else node.scrollLeft = edge === 'start' ? 0 : node.scrollWidth
      measure()
    },
    [measure, scroller, vertical],
  )

  const step = useCallback(
    (direction: -1 | 1, factor = 0.2) => {
      const node = scroller.current
      if (!node) return

      const viewport = toExtent(vertical ? node.clientHeight : node.clientWidth)
      const content = toExtent(vertical ? node.scrollHeight : node.scrollWidth)
      // A fifth of a viewport is a line-page; without a viewport it degrades to
      // the content or to a fixed 20px nudge, so the arrows still do something.
      const distance =
        viewport > 0
          ? Math.max(1, Math.round(viewport * factor))
          : Math.max(1, Math.round(content / 10) || 20)

      scrollByExtent(distance * direction)
    },
    [scrollByExtent, scroller, vertical],
  )

  const scrollToRatio = useCallback(
    (ratio: number) => {
      const node = scroller.current
      if (!node) return

      const viewport = toExtent(vertical ? node.clientHeight : node.clientWidth)
      const content = toExtent(vertical ? node.scrollHeight : node.scrollWidth)
      const max = content > viewport ? content - viewport : 0
      if (max <= 0) return

      const next = Math.round(Math.min(Math.max(ratio, 0), 1) * max)
      if (vertical) node.scrollTop = next
      else node.scrollLeft = next
      measure()
    },
    [measure, scroller, vertical],
  )

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event)

      // Only the drawn path needs this. Its region hides its overflow and lets
      // the inner box scroll, so the browser has no scroll container to move
      // when the region itself holds focus; the keys it would have handled
      // natively are mapped onto the scroller here instead.
      if (event.defaultPrevented || !drawn) return

      const back = vertical ? 'ArrowUp' : 'ArrowLeft'
      const forward = vertical ? 'ArrowDown' : 'ArrowRight'

      switch (event.key) {
        case back:
          event.preventDefault()
          step(-1)
          return
        case forward:
          event.preventDefault()
          step(1)
          return
        case 'PageUp':
          event.preventDefault()
          step(-1, 1)
          return
        case 'PageDown':
          event.preventDefault()
          step(1, 1)
          return
        case ' ':
          event.preventDefault()
          step(event.shiftKey ? -1 : 1, 1)
          return
        case 'Home':
          event.preventDefault()
          scrollToEdge('start')
          return
        case 'End':
          event.preventDefault()
          scrollToEdge('end')
          return
        default:
          return
      }
    },
    [drawn, onKeyDown, scrollToEdge, step, vertical],
  )

  const handleGutterPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return

      const gutter = event.currentTarget
      const extent = toExtent(vertical ? gutter.clientHeight : gutter.clientWidth)
      if (extent <= 0) return

      const start = vertical ? gutter.getBoundingClientRect().top : gutter.getBoundingClientRect().left
      scrollToRatio(((vertical ? event.clientY : event.clientX) - start) / extent)
    },
    [disabled, scrollToRatio, vertical],
  )

  const handleThumbPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return

      const node = scroller.current
      const gutter = event.currentTarget.parentElement
      if (!node || !gutter) return

      const extent = toExtent(vertical ? gutter.clientHeight : gutter.clientWidth)
      const viewport = toExtent(vertical ? node.clientHeight : node.clientWidth)
      const content = toExtent(vertical ? node.scrollHeight : node.scrollWidth)
      const max = content > viewport ? content - viewport : 0
      // Without a measurable gutter there is nothing to drag; leaving the event
      // alone keeps the thumb inert rather than jumping the scroll position.
      if (extent <= 0 || max <= 0) return

      const thumbExtent = Math.max(1, Math.min(extent, (viewport / content) * extent))
      const travel = extent - thumbExtent
      if (travel <= 0) return

      const axis = vertical ? 'clientY' : 'clientX'
      const startPosition = event[axis]
      const startOffset = vertical ? node.scrollTop : node.scrollLeft

      const onMove = (moveEvent: PointerEvent) => {
        const delta = (moveEvent[axis] - startPosition) / travel
        const next = Math.round(Math.min(Math.max(startOffset + delta * max, 0), max))
        if (vertical) node.scrollTop = next
        else node.scrollLeft = next
        measure()
      }
      const cleanup = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', cleanup)
        dragCleanupRef.current = null
      }

      dragCleanupRef.current?.()
      dragCleanupRef.current = cleanup
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', cleanup)
    },
    [disabled, measure, scroller, vertical],
  )

  const classes = ['vgui-scroll-region', `vgui-scroll-region--${orientation}`]
  if (drawn) classes.push('vgui-scroll-region--drawn')
  else classes.push('vgui-scroll-surface')
  if (alwaysVisible) classes.push('vgui-scroll-region--always-visible')
  if (className) classes.push(className)

  const regionStyle: CSSProperties = {
    ...style,
    ...(thickness === undefined ? null : { '--vgui-scrollbar-size': cssLength(thickness) }),
    ...(scrollPadding === undefined ? null : { '--vgui-scrollbar-scroll-padding': `${scrollPadding}px` }),
  } as CSSProperties

  // The thumb is sized from measurements that jsdom cannot provide, so an
  // unmeasurable region falls back to a full-length thumb rather than a
  // zero-length one.
  const ratio = metrics.max > 0 && metrics.viewport > 0 ? metrics.viewport / (metrics.max + metrics.viewport) : 1
  const lengthPercent = Math.round(Math.min(Math.max(ratio, 0.1), 1) * 100)
  const offsetFraction = metrics.max > 0 ? metrics.offset / metrics.max : 0
  const thumbStyle = {
    '--vgui-scrollbar-thumb-length': `${lengthPercent}%`,
    '--vgui-scrollbar-thumb-offset': offsetFraction,
  } as CSSProperties

  return (
    <div
      ref={setRegionRef}
      className={classes.join(' ')}
      style={regionStyle}
      tabIndex={tabIndex ?? 0}
      data-disabled={disabled ? '' : undefined}
      onKeyDown={handleKeyDown}
      {...(drawn ? null : { onScroll: handleScroll })}
      {...rest}
    >
      {drawn ? (
        <>
          <div ref={contentRef} className="vgui-scroll-region__content" onScroll={handleScroll}>
            {children}
          </div>
          <div className="vgui-scrollbar" data-orientation={orientation} aria-hidden="true">
            <button
              type="button"
              tabIndex={-1}
              className="vgui-scrollbar__button vgui-scrollbar__button--decrement"
              onClick={() => step(-1)}
            >
              <span className={`vgui-scrollbar__glyph vgui-scrollbar__glyph--${vertical ? 'up' : 'left'}`} />
            </button>
            <div className="vgui-scrollbar__gutter" onPointerDown={handleGutterPointerDown}>
              <div className="vgui-scrollbar__thumb" style={thumbStyle} onPointerDown={handleThumbPointerDown} />
            </div>
            <button
              type="button"
              tabIndex={-1}
              className="vgui-scrollbar__button vgui-scrollbar__button--increment"
              onClick={() => step(1)}
            >
              <span className={`vgui-scrollbar__glyph vgui-scrollbar__glyph--${vertical ? 'down' : 'right'}`} />
            </button>
          </div>
        </>
      ) : (
        children
      )}
    </div>
  )
})

function cssLength(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value
}

Scrollbar.displayName = 'Scrollbar'
