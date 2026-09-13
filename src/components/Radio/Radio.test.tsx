import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Radio, RadioGroup } from './Radio'

function DisplayMode(props: { onValueChange?: (value: string) => void; disabled?: boolean } = {}) {
  return (
    <RadioGroup label="Display mode" defaultValue="windowed" {...props}>
      <Radio value="fullscreen" label="Fullscreen" />
      <Radio value="windowed" label="Run in a window" />
      <Radio value="borderless" label="Borderless window" />
    </RadioGroup>
  )
}

describe('Radio', () => {
  it('renders a native radio inside a named fieldset', () => {
    render(<DisplayMode />)

    expect(screen.getByRole('group', { name: 'Display mode' }).tagName).toBe('FIELDSET')
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('radio', { name: 'Run in a window' })).toBeChecked()
  })

  it('gives every radio in the group the same name so they stay exclusive', () => {
    render(<DisplayMode />)

    const [first, second, third] = screen.getAllByRole('radio')
    const name = first.getAttribute('name')
    expect(name).toBeTruthy()
    expect(second).toHaveAttribute('name', name)
    expect(third).toHaveAttribute('name', name)
  })

  it('uses an explicit group name when given one', () => {
    render(
      <RadioGroup label="Display mode" name="display-mode">
        <Radio value="fullscreen" label="Fullscreen" />
      </RadioGroup>,
    )

    expect(screen.getByRole('radio')).toHaveAttribute('name', 'display-mode')
  })

  it('selects exactly one value when uncontrolled', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DisplayMode onValueChange={onValueChange} />)

    await user.click(screen.getByRole('radio', { name: 'Borderless window' }))

    expect(screen.getByRole('radio', { name: 'Borderless window' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Run in a window' })).not.toBeChecked()
    expect(
      screen.getAllByRole('radio').filter((input) => (input as HTMLInputElement).checked),
    ).toHaveLength(1)
    expect(onValueChange).toHaveBeenCalledWith('borderless')
  })

  it('does not change a controlled group until the parent says so', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = render(
      <RadioGroup label="Display mode" value="fullscreen" onValueChange={onValueChange}>
        <Radio value="fullscreen" label="Fullscreen" />
        <Radio value="windowed" label="Run in a window" />
      </RadioGroup>,
    )

    await user.click(screen.getByRole('radio', { name: 'Run in a window' }))

    expect(onValueChange).toHaveBeenCalledWith('windowed')
    expect(screen.getByRole('radio', { name: 'Fullscreen' })).toBeChecked()

    rerender(
      <RadioGroup label="Display mode" value="windowed" onValueChange={onValueChange}>
        <Radio value="fullscreen" label="Fullscreen" />
        <Radio value="windowed" label="Run in a window" />
      </RadioGroup>,
    )
    expect(screen.getByRole('radio', { name: 'Run in a window' })).toBeChecked()
  })

  it('selects the focused radio with Space, as the platform does', async () => {
    const user = userEvent.setup()
    render(<DisplayMode />)

    const radio = screen.getByRole('radio', { name: 'Borderless window' })
    radio.focus()
    await user.keyboard(' ')

    expect(radio).toBeChecked()
  })

  it('keeps one tab stop for the whole group', async () => {
    const user = userEvent.setup()
    render(<DisplayMode />)

    await user.tab()
    expect(screen.getByRole('radio', { name: 'Run in a window' })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('radio', { name: 'Run in a window' })).not.toHaveFocus()
  })

  it('makes a label click select its radio', async () => {
    const user = userEvent.setup()
    render(<DisplayMode />)

    await user.click(screen.getByText('Fullscreen'))

    expect(screen.getByRole('radio', { name: 'Fullscreen' })).toBeChecked()
  })

  it('disables every radio in a disabled group', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DisplayMode disabled onValueChange={onValueChange} />)

    const radios = screen.getAllByRole('radio')
    expect(radios.every((input) => input.hasAttribute('disabled'))).toBe(true)

    await user.click(radios[0])
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('lets a single radio opt out of the group and stay standalone', async () => {
    const user = userEvent.setup()
    render(<Radio value="alone" label="Standalone" />)

    const radio = screen.getByRole('radio', { name: 'Standalone' })
    expect(radio).not.toBeChecked()

    await user.click(radio)
    expect(radio).toBeChecked()
  })

  it('reports the change to a caller onChange as well as the group', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <RadioGroup label="Display mode">
        <Radio value="fullscreen" label="Fullscreen" onChange={onChange} />
        <Radio value="windowed" label="Run in a window" />
      </RadioGroup>,
    )

    await user.click(screen.getByRole('radio', { name: 'Fullscreen' }))
    expect(onChange).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('radio', { name: 'Run in a window' }))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('lays a horizontal group out as one wrapped row', () => {
    const { container } = render(
      <RadioGroup label="Microphone" orientation="horizontal">
        <Radio value="off" label="Disabled" />
        <Radio value="ptt" label="Push to talk" />
      </RadioGroup>,
    )

    const group = container.querySelector('.vgui-radio-group')
    expect(group).toHaveClass('vgui-radio-group--horizontal')
    expect(container.querySelector('.vgui-radio-group__legend')).toHaveTextContent('Microphone')
  })

  it('forwards the ref to the underlying input element', () => {
    const ref = createRef<HTMLInputElement>()
    render(
      <RadioGroup label="Display mode">
        <Radio ref={ref} value="fullscreen" label="Fullscreen" />
      </RadioGroup>,
    )

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current).toHaveAttribute('type', 'radio')
  })

  it('merges a caller className onto the row', () => {
    render(<Radio value="fullscreen" label="Fullscreen" className="my-radio" />)

    expect(screen.getByRole('radio').closest('label')).toHaveClass('vgui-radio', 'my-radio')
  })

  it('exposes the circle as a decorative sibling', () => {
    const { container } = render(<Radio value="fullscreen" label="Fullscreen" />)

    expect(container.querySelector('.vgui-radio__circle')).toHaveAttribute('aria-hidden', 'true')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <DisplayMode />
        <RadioGroup label="Microphone" orientation="horizontal">
          <Radio value="off" label="Disabled" />
          <Radio value="ptt" label="Push to talk" />
        </RadioGroup>
        <RadioGroup label="Quality" disabled>
          <Radio value="low" label="Low" />
          <Radio value="high" label="High" />
        </RadioGroup>
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
