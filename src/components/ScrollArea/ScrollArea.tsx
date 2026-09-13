import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type UIEvent,
} from 'react'
import './ScrollArea.css'

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  /** Recess the viewport to the VGUI list-interior look. */
  inset?: boolean
  /** Which axes may scroll. */
  axis?: 'vertical' | 'horizontal' | 'both'
  /** Render a themed 18px scrollbar instead of the platform one. */
  customScrollbar?: boolean
  /** Maximum height of the viewport; omit to fill the parent. */
  maxHeight?: number | string
  /** Show the fade affordances at the scrollable edges. */
  shadows?: boolean
  /** Make the viewport focusable so keyboard users can scroll it. */
  focusable?: boolean
  /** Called with the scroll offset; throttle at the call site if needed. */
  onScrollPositionChange?: (top: number, left: number) => void
}

interface Metrics {
  /** Whether the scrollable axis actually overflows, so its bars are present. */
  scrollable: boolean
  /** Whether each end of the scrollable axis is reached, so its shadow hides. */
  atStart: boolean
  atEnd: boolean
  /** Visible proportion of each axis, as a percentage for the thumb. */
  thumbY: number
  thumbX: number
}

const EMPTY: Metrics = {
  scrollable: false,
  atStart: true,
  atEnd: true,
  thumbY: 100,
  thumbX: 100,
}

/** Anything that can hold focus without a programmatic `tabIndex`. */
const FOCUSABLE_SELECTOR =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'

const toPercent = (value: number) => `${Math.round(value * 100) / 100}%`

const readMetrics = (node: HTMLElement, horizontal: boolean): Metrics => {
  const scrollable = horizontal
    ? node.scrollWidth > node.clientWidth
    : node.scrollHeight > node.clientHeight

  return {
    scrollable,
    atStart: horizontal ? node.scrollLeft <= 0 : node.scrollTop <= 0,
    atEnd: horizontal
      ? node.scrollLeft + node.clientWidth >= node.scrollWidth
      : node.scrollTop + node.clientHeight >= node.scrollHeight,
    thumbY: node.scrollHeight > 0 ? (node.clientHeight / node.scrollHeight) * 100 : 100,
    thumbX: node.scrollWidth > 0 ? (node.clientWidth / node.scrollWidth) * 100 : 100,
  }
}

const toLength = (value: number | string | undefined) => {
  if (value === undefined) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  {
    axis = 'vertical',
    children,
    className,
    customScrollbar = false,
    focusable,
    inset = false,
    maxHeight,
    onScrollPositionChange,
    shadows = true,
    ...rest
  },
  ref,
) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [metrics, setMetrics] = useState<Metrics>(EMPTY)
  const [autoFocusable, setAutoFocusable] = useState(false)

  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  const isFocusable = focusable ?? autoFocusable
  const horizontal = axis === 'horizontal'

  const measure = useCallback(() => {
    const node = viewportRef.current
    if (!node) return
    setMetrics(readMetrics(node, horizontal))
  }, [horizontal])

  // A viewport with no focusable descendants has to become one itself: a
  // `overflow: auto` box is otherwise unscrollable without a pointer (WCAG 2.1.1).
  useLayoutEffect(() => {
    if (focusable !== undefined) return
    const node = viewportRef.current
    if (!node) return
    setAutoFocusable(node.querySelector(FOCUSABLE_SELECTOR) === null)
  }, [children, focusable])

  useLayoutEffect(() => {
    measure()
  }, [children, measure])

  useEffect(() => {
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [measure])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const node = event.currentTarget
    setMetrics(readMetrics(node, horizontal))
    onScrollPositionChange?.(node.scrollTop, node.scrollLeft)
  }

  const scrollbar = (
    scrollAxis: 'vertical' | 'horizontal',
    thumb: number,
  ) => (
    <div
      aria-hidden="true"
      className={[
        'vgui-scroll-area__scrollbar',
        `vgui-scroll-area__scrollbar--${scrollAxis}`,
      ].join(' ')}
    >
      <span className="vgui-scroll-area__button vgui-scroll-area__button--decrement" />
      <span className="vgui-scroll-area__track">
        <span
          className="vgui-scroll-area__thumb"
          style={
            scrollAxis === 'vertical'
              ? { height: toPercent(thumb) }
              : { width: toPercent(thumb) }
          }
        />
      </span>
      <span className="vgui-scroll-area__button vgui-scroll-area__button--increment" />
    </div>
  )

  const viewportStyle: CSSProperties = {}
  const maxHeightValue = toLength(maxHeight)
  if (maxHeightValue !== undefined) viewportStyle.maxHeight = maxHeightValue

  return (
    <div
      {...rest}
      ref={setRoot}
      className={[
        'vgui-scroll-area',
        axis === 'vertical' ? null : `vgui-scroll-area--${axis}`,
        inset ? 'vgui-scroll-area--inset' : null,
        customScrollbar ? 'vgui-scroll-area--custom' : null,
        shadows ? null : 'vgui-scroll-area--no-shadows',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        ref={viewportRef}
        className="vgui-scroll-area__viewport"
        style={viewportStyle}
        tabIndex={isFocusable ? 0 : undefined}
        role={isFocusable ? 'region' : undefined}
        aria-label={isFocusable ? rest['aria-label'] : undefined}
        aria-labelledby={isFocusable ? rest['aria-labelledby'] : undefined}
        onScroll={handleScroll}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className="vgui-scroll-area__shadow vgui-scroll-area__shadow--top"
        data-visible={metrics.scrollable && !metrics.atStart ? 'true' : undefined}
      />
      <div
        aria-hidden="true"
        className="vgui-scroll-area__shadow vgui-scroll-area__shadow--bottom"
        data-visible={metrics.scrollable && !metrics.atEnd ? 'true' : undefined}
      />
      {customScrollbar && axis !== 'horizontal'
        ? scrollbar('vertical', metrics.thumbY)
        : null}
      {customScrollbar && axis !== 'vertical'
        ? scrollbar('horizontal', metrics.thumbX)
        : null}
    </div>
  )
})

ScrollArea.displayName = 'ScrollArea'
