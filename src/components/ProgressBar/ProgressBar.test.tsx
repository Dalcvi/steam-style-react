import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { ProgressBar } from './ProgressBar'

const fill = (container: HTMLElement) => container.querySelector<HTMLElement>('.vgui-progress__fill')

describe('ProgressBar', () => {
  it('exposes the progressbar role with its value range', () => {
    render(<ProgressBar value={45} label="Verifying game cache" />)

    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-valuenow', '45')
    expect(bar).toHaveAccessibleName('Verifying game cache')
  })

  it('drives the fill with the --vgui-progress custom property', () => {
    const { container } = render(<ProgressBar value={45} label="Cache" />)

    expect(fill(container)?.style.getPropertyValue('--vgui-progress')).toBe('45%')
  })

  it('omits aria-valuenow entirely when there is no value', () => {
    render(<ProgressBar label="Connecting" />)

    const bar = screen.getByRole('progressbar')
    expect(bar).not.toHaveAttribute('aria-valuenow')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('adds the indeterminate variant when the value is omitted', () => {
    const { container } = render(<ProgressBar />)

    expect(container.firstElementChild).toHaveClass('vgui-progress', 'vgui-progress--indeterminate')
    expect(fill(container)?.style.getPropertyValue('--vgui-progress')).toBe('0%')
  })

  it('renders the default label as a rounded percentage', () => {
    render(<ProgressBar value={45} showValue />)

    expect(screen.getByText('45%')).toBeInTheDocument()
    expect(screen.getByText('45%')).toHaveClass('vgui-progress__text')
  })

  it('computes the percentage against max', () => {
    const { container } = render(<ProgressBar value={4.2} max={12} showValue />)

    expect(fill(container)?.style.getPropertyValue('--vgui-progress')).toBe('35%')
    expect(screen.getByText('35%')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '12')
  })

  it('clamps out-of-range values instead of overflowing the trough', () => {
    const { container } = render(<ProgressBar value={150} showValue />)

    expect(fill(container)?.style.getPropertyValue('--vgui-progress')).toBe('100%')
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('clamps negative values to zero', () => {
    const { container } = render(<ProgressBar value={-5} />)

    expect(fill(container)?.style.getPropertyValue('--vgui-progress')).toBe('0%')
  })

  it('survives a zero or negative max without dividing by zero', () => {
    const { container } = render(<ProgressBar value={5} max={0} />)

    expect(fill(container)?.style.getPropertyValue('--vgui-progress')).toBe('0%')
    expect(fill(container)?.style.getPropertyValue('--vgui-progress')).not.toBe('Infinity%')
  })

  it('uses formatValue for the label and for aria-valuetext', () => {
    const formatValue = (value: number, max: number) => `${value.toFixed(1)} of ${max} MB`
    render(<ProgressBar value={4.2} max={12} showValue formatValue={formatValue} />)

    expect(screen.getByText('4.2 of 12 MB')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '4.2 of 12 MB')
  })

  it('leaves aria-valuetext unset for a plain percentage', () => {
    render(<ProgressBar value={45} showValue />)

    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuetext')
  })

  it('renders no label unless showValue is set', () => {
    const { container } = render(<ProgressBar value={45} />)

    expect(container.querySelector('.vgui-progress__text')).toBeNull()
    expect(container.firstElementChild).not.toHaveClass('vgui-progress--with-text')
  })

  it('renders no label for an indeterminate bar', () => {
    const { container } = render(<ProgressBar showValue />)

    expect(container.querySelector('.vgui-progress__text')).toBeNull()
  })

  it.each([
    [{ small: true } as const, 'vgui-progress--small'],
    [{ error: true } as const, 'vgui-progress--error'],
    [{ continuous: true } as const, 'vgui-progress--continuous'],
    [{ showValue: true } as const, 'vgui-progress--with-text'],
  ])('adds the modifier class for %o', (props, modifierClass) => {
    const { container } = render(<ProgressBar value={50} {...props} />)

    expect(container.firstElementChild).toHaveClass('vgui-progress', modifierClass)
  })

  it('treats continuous as indeterminate for assistive tech', () => {
    render(<ProgressBar continuous label="Indexing content" />)

    const bar = screen.getByRole('progressbar')
    expect(bar).not.toHaveAttribute('aria-valuenow')
    expect(bar).toHaveClass('vgui-progress--continuous')
  })

  it('merges a caller className last', () => {
    const { container } = render(<ProgressBar value={10} small className="my-bar" />)

    expect(container.firstElementChild?.className).toBe('vgui-progress vgui-progress--small my-bar')
  })

  it('is never focusable', async () => {
    const user = userEvent.setup()
    render(<ProgressBar value={10} label="Cache" />)

    await user.tab()

    expect(screen.getByRole('progressbar')).not.toHaveFocus()
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('tabindex')
  })

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<ProgressBar ref={ref} value={10} label="Cache" />)

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toHaveAttribute('role', 'progressbar')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <ProgressBar value={45} label="Verifying game cache" showValue />
        <ProgressBar label="Connecting to 203.0.113.4:27015" />
        <ProgressBar continuous label="Indexing content" />
        <ProgressBar value={4.2} max={12} label="Downloading de_dust2" showValue formatValue={(v, m) => `${v} of ${m} MB`} />
        <ProgressBar value={80} error label="Download failed" aria-describedby="dl-error" />
        <span id="dl-error">The download failed. Check your connection.</span>
        <ProgressBar value={62} small label="Uploading" />
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
