import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import type { ChangeEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('renders a native checkbox named by its label', () => {
    render(<Checkbox label="Run in a window" />)

    const input = screen.getByRole('checkbox', { name: 'Run in a window' })
    expect(input).toHaveAttribute('type', 'checkbox')
    expect(input).not.toBeChecked()
  })

  it('starts checked with defaultChecked and keeps the state itself', async () => {
    const user = userEvent.setup()
    render(<Checkbox label="Remember password" defaultChecked />)

    const input = screen.getByRole('checkbox')
    expect(input).toBeChecked()

    await user.click(screen.getByText('Remember password'))
    expect(input).not.toBeChecked()
  })

  it('makes the whole row the hit area by wrapping the input in a label', () => {
    render(<Checkbox label="Enable voice" />)

    const input = screen.getByRole('checkbox')
    expect(input.closest('label')).toHaveClass('vgui-checkbox')
  })

  it('exposes the box as a decorative sibling', () => {
    const { container } = render(<Checkbox label="Enable voice" />)

    const box = container.querySelector('.vgui-checkbox__box')
    expect(box).toHaveAttribute('aria-hidden', 'true')
  })

  it('reports the next checked state', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox label="Enable voice" onChange={onChange} />)

    await user.click(screen.getByRole('checkbox'))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect((onChange.mock.calls[0][0] as ChangeEvent<HTMLInputElement>).target.checked).toBe(true)
  })

  it('stays controlled when checked is given', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(
      <Checkbox label="Enable voice" checked={false} onChange={onChange} />,
    )

    await user.click(screen.getByRole('checkbox'))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('checkbox')).not.toBeChecked()

    rerender(<Checkbox label="Enable voice" checked onChange={onChange} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('sets the indeterminate DOM property without touching checked', () => {
    const { rerender } = render(<Checkbox label="All servers (mixed)" indeterminate />)

    const input = screen.getByRole('checkbox') as HTMLInputElement
    expect(input.indeterminate).toBe(true)
    expect(input).not.toBeChecked()

    rerender(<Checkbox label="All servers" />)
    expect((screen.getByRole('checkbox') as HTMLInputElement).indeterminate).toBe(false)
  })

  it('does not synchronise indeterminate with checked', () => {
    render(<Checkbox label="All servers (mixed)" indeterminate checked onChange={() => {}} />)

    const input = screen.getByRole('checkbox') as HTMLInputElement
    expect(input.indeterminate).toBe(true)
    expect(input).toBeChecked()
  })

  it('moves the box after the label with labelPosition="end"', () => {
    const { container, rerender } = render(<Checkbox label="Automatically log me in" />)
    const root = container.querySelector('.vgui-checkbox')
    expect(container.querySelector('.vgui-checkbox__box')?.nextElementSibling).toHaveClass(
      'vgui-checkbox__label',
    )

    rerender(<Checkbox label="Automatically log me in" labelPosition="end" />)

    expect(root).toHaveClass('vgui-checkbox--label-end')
    expect(container.querySelector('.vgui-checkbox__label')?.nextElementSibling).toHaveClass(
      'vgui-checkbox__box',
    )
  })

  it('toggles from the keyboard with Space', async () => {
    const user = userEvent.setup()
    render(<Checkbox label="Enable voice" />)

    await user.tab()
    expect(screen.getByRole('checkbox')).toHaveFocus()

    await user.keyboard(' ')
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('is disabled and cannot be toggled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox label="Enable voice" disabled onChange={onChange} />)

    const input = screen.getByRole('checkbox')
    expect(input).toBeDisabled()

    await user.click(input)
    expect(onChange).not.toHaveBeenCalled()
    expect(input).not.toBeChecked()
  })

  it('puts caller input props on the input and className on the row', () => {
    render(<Checkbox label="Enable voice" name="voice" value="on" id="voice" className="my-row" />)

    const input = screen.getByRole('checkbox')
    expect(input).toHaveAttribute('name', 'voice')
    expect(input).toHaveAttribute('value', 'on')
    expect(input).toHaveAttribute('id', 'voice')
    expect(input.closest('label')).toHaveClass('vgui-checkbox', 'my-row')
  })

  it('forwards the ref to the underlying input element', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Checkbox ref={ref} label="Enable voice" />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current).toHaveAttribute('type', 'checkbox')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Checkbox label="Run in a window" />
        <Checkbox label="Remember password" defaultChecked />
        <Checkbox label="All servers (mixed)" indeterminate />
        <Checkbox label="Enable voice" disabled />
        <Checkbox label="Automatically log me in" labelPosition="end" />
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
