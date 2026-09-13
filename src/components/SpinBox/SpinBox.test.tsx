import { createRef } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { SpinBox } from './SpinBox'

const stepper = (label: string) => screen.getByRole('button', { name: label })

afterEach(() => {
  vi.useRealTimers()
})

describe('SpinBox', () => {
  it('renders a text field with the spinbutton role', () => {
    render(<SpinBox aria-label="Players" defaultValue={16} />)

    const input = screen.getByRole('spinbutton', { name: 'Players' })
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveValue('16')
  })

  it('wraps the field in a labelled group', () => {
    render(<SpinBox defaultValue={16} />)

    expect(screen.getByRole('group')).toBeInTheDocument()
  })

  it('renders only the base class by default', () => {
    const { container } = render(<SpinBox defaultValue={16} />)

    expect(container.firstElementChild?.className.split(' ')).toEqual(['vgui-spin-box'])
  })

  it.each([
    ['vgui-spin-box--horizontal', { horizontal: true }],
    ['vgui-spin-box--small', { small: true }],
    ['vgui-spin-box--no-steppers', { noSteppers: true }],
  ])('maps the documented variant to %s', (expected, props) => {
    const { container } = render(<SpinBox defaultValue={16} {...props} />)

    expect(container.firstElementChild).toHaveClass(expected)
  })

  it('appends a caller className last', () => {
    const { container } = render(<SpinBox className="mine" defaultValue={16} small />)

    expect(container.firstElementChild?.className).toBe('vgui-spin-box vgui-spin-box--small mine')
  })

  it('spreads the remaining props onto the input, not the wrapper', () => {
    const { container } = render(<SpinBox defaultValue={16} id="players" name="players" />)

    expect(container.firstElementChild).not.toHaveAttribute('id')
    expect(screen.getByRole('spinbutton')).toHaveAttribute('id', 'players')
    expect(screen.getByRole('spinbutton')).toHaveAttribute('name', 'players')
  })

  it('uses a numeric keyboard by default and a decimal one with --decimal', () => {
    const { unmount } = render(<SpinBox defaultValue={16} />)
    expect(screen.getByRole('spinbutton')).toHaveAttribute('inputmode', 'numeric')
    unmount()

    render(<SpinBox defaultValue={6} decimal />)
    expect(screen.getByRole('spinbutton')).toHaveAttribute('inputmode', 'decimal')
  })

  it('exposes the value and bounds through aria', () => {
    render(<SpinBox defaultValue={16} min={1} max={100} valueText="16 players" />)

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('aria-valuenow', '16')
    expect(input).toHaveAttribute('aria-valuemin', '1')
    expect(input).toHaveAttribute('aria-valuemax', '100')
    expect(input).toHaveAttribute('aria-valuetext', '16 players')
  })

  it('omits aria-valuenow while the value is empty', () => {
    render(<SpinBox min={1} max={100} />)

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue('')
    expect(input).not.toHaveAttribute('aria-valuenow')
  })

  it('renders two labelled steppers outside the tab order', () => {
    render(<SpinBox defaultValue={16} />)

    const up = stepper('Increase')
    const down = stepper('Decrease')
    expect(up).toHaveAttribute('tabindex', '-1')
    expect(down).toHaveAttribute('tabindex', '-1')
    expect(up).toHaveAttribute('type', 'button')
    expect(up.querySelector('.vgui-spin-box__glyph')).toBeInTheDocument()
  })

  it('steps and commits when a stepper is clicked', async () => {
    const onValueChange = vi.fn()
    render(<SpinBox defaultValue={16} onValueChange={onValueChange} />)

    await userEvent.click(stepper('Increase'))

    expect(onValueChange).toHaveBeenCalledWith(17)
    expect(screen.getByRole('spinbutton')).toHaveValue('17')
  })

  it('steps down as well as up', async () => {
    render(<SpinBox defaultValue={16} />)

    await userEvent.click(stepper('Decrease'))

    expect(screen.getByRole('spinbutton')).toHaveValue('15')
  })

  it('honours a fractional step with --decimal', async () => {
    render(<SpinBox defaultValue={6} step={0.5} decimal />)

    await userEvent.click(stepper('Increase'))

    expect(screen.getByRole('spinbutton')).toHaveValue('6.5')
  })

  it('disables the stepper that would leave the range', () => {
    render(<SpinBox defaultValue={100} min={1} max={100} />)

    expect(stepper('Increase')).toBeDisabled()
    expect(stepper('Decrease')).toBeEnabled()
  })

  it('disables the lower stepper at the minimum', () => {
    render(<SpinBox defaultValue={1} min={1} max={100} />)

    expect(stepper('Decrease')).toBeDisabled()
    expect(stepper('Increase')).toBeEnabled()
  })

  it('keeps both steppers live with --wrap and wraps at the maximum', async () => {
    render(<SpinBox defaultValue={100} min={1} max={100} wrap />)

    expect(stepper('Increase')).toBeEnabled()
    await userEvent.click(stepper('Increase'))

    expect(screen.getByRole('spinbutton')).toHaveValue('1')
  })

  it('does not step past the maximum without --wrap', async () => {
    const onValueChange = vi.fn()
    render(<SpinBox defaultValue={100} min={1} max={100} onValueChange={onValueChange} />)
    const input = screen.getByRole('spinbutton')
    await userEvent.click(input)

    await userEvent.keyboard('{ArrowUp}')

    expect(onValueChange).not.toHaveBeenCalled()
    expect(input).toHaveValue('100')
  })

  it.each([
    ['{ArrowUp}', '17'],
    ['{ArrowDown}', '15'],
    ['{PageUp}', '26'],
    ['{PageDown}', '6'],
    ['{Home}', '1'],
    ['{End}', '100'],
  ])('handles %s from the keyboard', async (key, expected) => {
    render(<SpinBox aria-label="Players" defaultValue={16} min={1} max={100} />)

    const input = screen.getByRole('spinbutton')
    await userEvent.click(input)
    await userEvent.keyboard(key)

    expect(input).toHaveValue(expected)
  })

  it('leaves Home and End alone when the bound is unbounded', async () => {
    render(<SpinBox defaultValue={16} />)

    const input = screen.getByRole('spinbutton')
    await userEvent.type(input, '{Home}{End}')

    expect(input).toHaveValue('16')
  })

  it('commits typed input on Enter', async () => {
    const onValueChange = vi.fn()
    render(<SpinBox defaultValue={16} onValueChange={onValueChange} />)

    const input = screen.getByRole('spinbutton')
    await userEvent.clear(input)
    await userEvent.type(input, '24{Enter}')

    expect(onValueChange).toHaveBeenCalledWith(24)
    expect(input).toHaveValue('24')
  })

  it('never emits while the user is still typing', async () => {
    const onValueChange = vi.fn()
    render(<SpinBox defaultValue={16} onValueChange={onValueChange} />)

    await userEvent.clear(screen.getByRole('spinbutton'))
    await userEvent.type(screen.getByRole('spinbutton'), '24')

    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByRole('spinbutton')).toHaveValue('24')
  })

  it('commits typed input on blur', async () => {
    const onValueChange = vi.fn()
    render(
      <>
        <SpinBox defaultValue={16} onValueChange={onValueChange} />
        <button type="button">elsewhere</button>
      </>,
    )

    const input = screen.getByRole('spinbutton')
    await userEvent.clear(input)
    await userEvent.type(input, '24')
    await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }))

    expect(onValueChange).toHaveBeenCalledWith(24)
    expect(input).toHaveValue('24')
  })

  it('clamps typed input to the bounds', async () => {
    const onValueChange = vi.fn()
    render(<SpinBox defaultValue={16} min={1} max={100} onValueChange={onValueChange} />)

    const input = screen.getByRole('spinbutton')
    await userEvent.clear(input)
    await userEvent.type(input, '999{Enter}')

    expect(onValueChange).toHaveBeenCalledWith(100)
    expect(input).toHaveValue('100')
  })

  it('accepts a comma as the decimal separator with --decimal', async () => {
    const onValueChange = vi.fn()
    render(<SpinBox defaultValue={6} step={0.5} decimal onValueChange={onValueChange} />)

    const input = screen.getByRole('spinbutton')
    await userEvent.clear(input)
    await userEvent.type(input, '6,5{Enter}')

    expect(onValueChange).toHaveBeenCalledWith(6.5)
    expect(input).toHaveValue('6.5')
  })

  it('keeps the precision the user typed with --decimal', async () => {
    render(<SpinBox defaultValue={6} step={0.5} decimal />)

    const input = screen.getByRole('spinbutton')
    await userEvent.clear(input)
    await userEvent.type(input, '6.25{Enter}')

    expect(input).toHaveValue('6.25')
  })

  it('rounds to an integer without --decimal', async () => {
    render(<SpinBox defaultValue={16} />)

    const input = screen.getByRole('spinbutton')
    await userEvent.clear(input)
    await userEvent.type(input, '16.4{Enter}')

    expect(input).toHaveValue('16')
  })

  it('reverts unparseable input', async () => {
    const onValueChange = vi.fn()
    render(<SpinBox defaultValue={16} onValueChange={onValueChange} />)

    const input = screen.getByRole('spinbutton')
    await userEvent.clear(input)
    await userEvent.type(input, 'abc{Enter}')

    expect(onValueChange).not.toHaveBeenCalled()
    expect(input).toHaveValue('16')
  })

  it('reverts an emptied field to the last good value', async () => {
    render(<SpinBox defaultValue={16} />)

    const input = screen.getByRole('spinbutton')
    await userEvent.clear(input)
    await userEvent.type(input, '   ')
    await userEvent.tab()

    expect(input).toHaveValue('16')
  })

  it('reverts to the value at focus time on Escape', async () => {
    render(<SpinBox defaultValue={16} />)

    const input = screen.getByRole('spinbutton')
    await userEvent.click(input)
    await userEvent.clear(input)
    await userEvent.type(input, '99')
    await userEvent.keyboard('{Escape}')

    expect(input).toHaveValue('16')
  })

  it('discards steps taken during the focus session on Escape', async () => {
    render(<SpinBox defaultValue={16} min={1} max={100} />)

    const input = screen.getByRole('spinbutton')
    await userEvent.click(input)
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{Escape}')

    expect(input).toHaveValue('16')
  })

  it('hides the steppers with --no-steppers but keeps the arrow keys', async () => {
    render(<SpinBox defaultValue={16} noSteppers />)

    expect(screen.queryByRole('button', { name: 'Increase' })).not.toBeInTheDocument()

    const input = screen.getByRole('spinbutton')
    await userEvent.click(input)
    await userEvent.keyboard('{ArrowUp}')

    expect(input).toHaveValue('17')
  })

  it('falls the value back into sync when the controlled value changes', () => {
    const { rerender } = render(<SpinBox value={16} onValueChange={vi.fn()} />)
    const input = screen.getByRole('spinbutton')

    rerender(<SpinBox value={42} onValueChange={vi.fn()} />)

    expect(input).toHaveValue('42')
  })

  it('does not move a controlled value on its own', async () => {
    const onValueChange = vi.fn()
    render(<SpinBox value={16} onValueChange={onValueChange} />)

    await userEvent.click(stepper('Increase'))

    expect(onValueChange).toHaveBeenCalledWith(17)
    expect(screen.getByRole('spinbutton')).toHaveValue('16')
  })

  it('disables the field and both steppers together', () => {
    render(<SpinBox defaultValue={16} disabled />)

    expect(screen.getByRole('spinbutton')).toBeDisabled()
    expect(stepper('Increase')).toBeDisabled()
    expect(stepper('Decrease')).toBeDisabled()
    expect(screen.getByRole('group')).toHaveAttribute('aria-disabled', 'true')
  })

  it('repeats while a stepper is held down', () => {
    vi.useFakeTimers()
    render(<SpinBox defaultValue={16} min={1} max={100} />)
    const up = stepper('Increase')
    const input = screen.getByRole('spinbutton') as HTMLInputElement

    fireEvent.pointerDown(up, { button: 0 })
    expect(input).toHaveValue('17')

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(input).toHaveValue('18')

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(Number(input.value)).toBeGreaterThanOrEqual(19)

    fireEvent.pointerUp(up)
    const held = input.value
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(input.value).toBe(held)
  })

  it('steps once for a keyboard or screen-reader activation of a stepper', () => {
    render(<SpinBox defaultValue={16} />)

    fireEvent.click(stepper('Increase'))

    expect(screen.getByRole('spinbutton')).toHaveValue('17')
  })

  it('does not let a non-primary pointer button step twice', () => {
    render(<SpinBox defaultValue={16} />)

    fireEvent.pointerDown(stepper('Increase'), { button: 2 })

    expect(screen.getByRole('spinbutton')).toHaveValue('16')
  })

  it('forwards its ref to the input', () => {
    const ref = createRef<HTMLInputElement>()
    render(<SpinBox ref={ref} defaultValue={16} />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current).toBe(screen.getByRole('spinbutton'))
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <SpinBox aria-label="Players" defaultValue={16} min={1} max={100} />
        <SpinBox aria-label="Field of view" defaultValue={6} step={0.5} decimal />
        <SpinBox aria-label="Tickrate" defaultValue={128} small noSteppers />
        <SpinBox aria-label="Disabled" defaultValue={16} disabled />
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
