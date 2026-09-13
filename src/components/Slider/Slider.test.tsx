import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Slider } from './Slider'

const range = (container: HTMLElement) => container.querySelector('input') as HTMLInputElement

describe('Slider', () => {
  it('renders a native range input inside a layout wrapper', () => {
    const { container } = render(<Slider aria-label="Master volume" />)

    expect(container.firstElementChild).toBeInstanceOf(HTMLSpanElement)
    expect(container.firstElementChild?.className).toBe('vgui-slider')
    expect(range(container).type).toBe('range')
    expect(range(container).className).toBe('vgui-slider__input')
  })

  it('defaults min, max and step to 0, 100 and 1', () => {
    const { container } = render(<Slider aria-label="Master volume" />)
    const input = range(container)

    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '100')
    expect(input).toHaveAttribute('step', '1')
  })

  it('paints the accessible range from the same min/max the labels use', () => {
    const { container } = render(<Slider aria-label="Sensitivity" min={0.1} max={20} step={0.1} />)
    const input = range(container)

    expect(input).toHaveAttribute('min', '0.1')
    expect(input).toHaveAttribute('max', '20')
    expect(input).toHaveAttribute('step', '0.1')
    expect(input).toHaveAttribute('aria-valuemin', '0.1')
    expect(input).toHaveAttribute('aria-valuemax', '20')
  })

  it('calls onValueChange with a number on every input event', () => {
    const onValueChange = vi.fn()
    const onValueCommit = vi.fn()
    const { container } = render(
      <Slider aria-label="Master volume" onValueChange={onValueChange} onValueCommit={onValueCommit} />,
    )

    fireEvent.input(range(container), { target: { value: '42' } })

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith(42)
    expect(onValueCommit).not.toHaveBeenCalled()
  })

  it('calls onValueCommit only once the interaction ends', () => {
    const onValueChange = vi.fn()
    const onValueCommit = vi.fn()
    const { container } = render(
      <Slider aria-label="Master volume" onValueChange={onValueChange} onValueCommit={onValueCommit} />,
    )

    fireEvent.input(range(container), { target: { value: '30' } })
    fireEvent.input(range(container), { target: { value: '70' } })
    expect(onValueCommit).not.toHaveBeenCalled()

    fireEvent.change(range(container), { target: { value: '80' } })

    expect(onValueChange).toHaveBeenCalledTimes(3)
    expect(onValueCommit).toHaveBeenCalledTimes(1)
    expect(onValueCommit).toHaveBeenCalledWith(80)
  })

  it('still calls a caller-supplied onChange', () => {
    const onChange = vi.fn()
    const { container } = render(<Slider aria-label="Master volume" onChange={onChange} />)

    fireEvent.input(range(container), { target: { value: '12' } })

    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('keeps its own value when uncontrolled', () => {
    const { container } = render(<Slider aria-label="Master volume" defaultValue={25} />)

    expect(range(container).value).toBe('25')

    fireEvent.input(range(container), { target: { value: '60' } })

    expect(range(container).value).toBe('60')
  })

  it('starts at the midpoint of the range when no default is given', () => {
    const { container } = render(<Slider aria-label="Master volume" min={0} max={60} />)

    expect(range(container).value).toBe('30')
  })

  it('renders the controlled value and ignores its own state', () => {
    const { container, rerender } = render(<Slider aria-label="Master volume" value={75} />)

    expect(range(container).value).toBe('75')

    fireEvent.input(range(container), { target: { value: '20' } })
    expect(range(container).value).toBe('75')

    rerender(<Slider aria-label="Master volume" value={20} />)
    expect(range(container).value).toBe('20')
  })

  it('drives both the readout and aria-valuetext from formatValue', () => {
    const { container } = render(
      <Slider
        aria-label="Master volume"
        min={0}
        max={1}
        step={0.01}
        value={0.75}
        showValue
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />,
    )

    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(range(container)).toHaveAttribute('aria-valuetext', '75%')
  })

  it('shows the raw value when no formatter is given', () => {
    render(<Slider aria-label="Master volume" value={30} showValue />)

    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('hides the readout unless showValue is set', () => {
    const { container } = render(<Slider aria-label="Master volume" value={30} />)

    expect(container.querySelector('.vgui-slider__value')).toBeNull()
  })

  it('marks the ticks groove', () => {
    const { container } = render(<Slider aria-label="Master volume" ticks />)

    expect(range(container).className).toBe('vgui-slider__input vgui-slider__input--ticks')
  })

  it('appends className to the wrapper, not to the control', () => {
    const { container } = render(<Slider aria-label="Master volume" className="row-slider" />)

    expect(container.firstElementChild?.className).toBe('vgui-slider row-slider')
    expect(range(container).className).toBe('vgui-slider__input')
  })

  it('maps each variant to its documented class in a stable order', () => {
    const { container, rerender } = render(<Slider aria-label="Master volume" small />)
    expect(container.firstElementChild?.className).toBe('vgui-slider vgui-slider--small')

    rerender(<Slider aria-label="Master volume" small showValue className="last" />)
    expect(container.firstElementChild?.className).toBe('vgui-slider vgui-slider--small vgui-slider--with-value last')
  })

  it('passes arbitrary input attributes through to the control', () => {
    const { container } = render(<Slider aria-label="Volume" id="volume" name="volume" disabled />)
    const input = range(container)

    expect(input).toHaveAttribute('id', 'volume')
    expect(input).toHaveAttribute('name', 'volume')
    expect(input).toBeDisabled()
    expect(container.firstElementChild).not.toHaveAttribute('id')
  })

  it('is reachable with the keyboard', async () => {
    const user = userEvent.setup()
    render(<Slider aria-label="Master volume" />)

    await user.tab()

    expect(screen.getByRole('slider')).toHaveFocus()
  })

  it('is not reachable with the keyboard when disabled', async () => {
    const user = userEvent.setup()
    render(<Slider aria-label="Master volume" disabled />)

    await user.tab()

    expect(screen.getByRole('slider')).not.toHaveFocus()
  })

  it.each(['ArrowRight', 'ArrowLeft', 'Home', 'End', 'PageUp', 'PageDown'])(
    'does not swallow the native %s key',
    (key) => {
      const { container } = render(<Slider aria-label="Master volume" />)
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

      range(container).dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
    },
  )

  it('forwards its ref to the control', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Slider ref={ref} aria-label="Master volume" />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current?.type).toBe('range')
  })

  it('has no accessibility violations across its variants', async () => {
    const { container } = render(
      <div>
        <Slider aria-label="Master volume" defaultValue={50} />
        <Slider aria-label="With ticks" ticks />
        <Slider aria-label="Readout" showValue formatValue={(v) => `${v}%`} />
        <Slider aria-label="Small" small />
        <Slider aria-label="Disabled" disabled />
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
