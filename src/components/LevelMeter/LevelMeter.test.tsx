import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { LevelMeter } from './LevelMeter'

const meter = () => screen.getByRole('meter')

describe('LevelMeter', () => {
  it('is a meter, not a progress bar, with the documented range', () => {
    render(<LevelMeter />)

    expect(meter()).toHaveAttribute('aria-valuemin', '0')
    expect(meter()).toHaveAttribute('aria-valuemax', '4')
    expect(meter()).toHaveAttribute('aria-valuenow', '0')
  })

  it('lights exactly `level` segments, from the first', () => {
    const { container } = render(<LevelMeter level={3} />)

    const segments = Array.from(container.querySelectorAll('.vgui-level-meter__segment'))

    expect(segments).toHaveLength(4)
    expect(segments.map((segment) => segment.classList.contains('is-lit'))).toEqual([
      true,
      true,
      true,
      false,
    ])
    expect(meter()).toHaveAttribute('aria-valuenow', '3')
    expect(meter()).toHaveAttribute('data-level', '3')
  })

  it('clamps out-of-range levels into the segment count', () => {
    const { rerender } = render(<LevelMeter level={9} />)

    expect(meter()).toHaveAttribute('aria-valuenow', '4')
    expect(meter()).toHaveAttribute('data-level', '4')

    rerender(<LevelMeter level={-3} />)

    expect(meter()).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByRole('meter').querySelectorAll('.is-lit')).toHaveLength(0)
  })

  it('honours a custom segment count', () => {
    const { container } = render(<LevelMeter level={5} segments={6} />)

    expect(meter()).toHaveAttribute('aria-valuemax', '6')
    expect(meter()).toHaveAttribute('aria-valuenow', '5')
    expect(container.querySelectorAll('.vgui-level-meter__segment')).toHaveLength(6)
    expect(container.querySelectorAll('.is-lit')).toHaveLength(5)
  })

  it('keeps at least one segment so the range stays valid', () => {
    const { container } = render(<LevelMeter segments={0} level={4} />)

    expect(container.querySelectorAll('.vgui-level-meter__segment')).toHaveLength(1)
    expect(meter()).toHaveAttribute('aria-valuemax', '1')
    expect(meter()).toHaveAttribute('aria-valuenow', '1')
  })

  it('maps direction to a modifier class, ascending by default', () => {
    const { rerender } = render(<LevelMeter />)

    expect(meter()).toHaveClass('vgui-level-meter', 'vgui-level-meter--up')

    rerender(<LevelMeter direction="down" />)

    expect(meter()).toHaveClass('vgui-level-meter--down')
    expect(meter()).not.toHaveClass('vgui-level-meter--up')
  })

  it('maps inline, animating and disabled onto the root', () => {
    const { rerender } = render(<LevelMeter />)

    expect(meter()).not.toHaveClass('vgui-level-meter--inline')
    expect(meter()).not.toHaveClass('vgui-level-meter--animating')
    expect(meter()).not.toHaveAttribute('aria-disabled')

    rerender(<LevelMeter inline animating disabled />)

    expect(meter()).toHaveClass(
      'vgui-level-meter--inline',
      'vgui-level-meter--animating',
    )
    expect(meter()).toHaveAttribute('aria-disabled', 'true')
  })

  it('announces valueText in both the name and the value text', () => {
    const { rerender } = render(<LevelMeter level={2} valueText="Fair — 120ms" />)

    expect(meter()).toHaveAttribute('aria-label', 'Fair — 120ms')
    expect(meter()).toHaveAttribute('aria-valuetext', 'Fair — 120ms')

    // Without valueText a screen reader would hear only a number, so a name is
    // still supplied and no value text is faked.
    rerender(<LevelMeter level={2} />)

    expect(meter()).toHaveAttribute('aria-label', 'Level')
    expect(meter()).not.toHaveAttribute('aria-valuetext')
  })

  it('lets the caller override the accessible name', () => {
    render(<LevelMeter level={1} aria-label="Connection quality" />)

    expect(screen.getByRole('meter', { name: 'Connection quality' })).toBeInTheDocument()
  })

  it('carries the segment ordinal so the height profile needs no count rules', () => {
    const { container } = render(<LevelMeter level={2} segments={5} />)

    const segments = Array.from(
      container.querySelectorAll<HTMLElement>('.vgui-level-meter__segment'),
    )

    expect(segments.map((segment) => segment.style.getPropertyValue('--vgui-level-meter-index'))).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
    ])
    expect(
      segments.every(
        (segment) => segment.style.getPropertyValue('--vgui-level-meter-count') === '5',
      ),
    ).toBe(true)
  })

  it('pulses with CSS only, so unmounting leaves no pending timer', () => {
    vi.useFakeTimers()

    try {
      const { unmount } = render(<LevelMeter level={2} animating />)

      expect(meter()).toHaveClass('vgui-level-meter--animating')

      unmount()

      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('appends the caller className to its own class list', () => {
    render(<LevelMeter className="my-meter" />)

    expect(meter()).toHaveClass('vgui-level-meter', 'my-meter')
  })

  it('forwards the ref to the meter element', () => {
    const ref = createRef<HTMLDivElement>()

    render(<LevelMeter ref={ref} level={4} />)

    expect(ref.current).toBe(meter())
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <LevelMeter level={3} valueText="Good" />
        <LevelMeter level={1} direction="down" inline animating />
        <LevelMeter level={0} disabled valueText="Muted" />
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
