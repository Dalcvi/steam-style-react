import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { glyphs } from '../IconButton/IconButton'
import { ToggleButton } from './ToggleButton'

describe('ToggleButton', () => {
  it('renders a native button with its label', () => {
    render(<ToggleButton>Show details</ToggleButton>)

    const button = screen.getByRole('button', { name: 'Show details' })
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveClass('vgui-toggle-button')
  })

  it('starts unpressed and announces the state through aria-pressed', () => {
    render(<ToggleButton>Show details</ToggleButton>)

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('honours defaultPressed as the uncontrolled initial state', () => {
    render(<ToggleButton defaultPressed>Show details</ToggleButton>)

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('toggles itself when uncontrolled and reports the next state', async () => {
    const user = userEvent.setup()
    const onPressedChange = vi.fn()
    render(<ToggleButton onPressedChange={onPressedChange}>Show details</ToggleButton>)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(onPressedChange).toHaveBeenLastCalledWith(true)

    await user.click(button)

    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(onPressedChange).toHaveBeenLastCalledWith(false)
    expect(onPressedChange).toHaveBeenCalledTimes(2)
  })

  it('does not change a controlled button until the parent says so', async () => {
    const user = userEvent.setup()
    const onPressedChange = vi.fn()
    const { rerender } = render(
      <ToggleButton pressed={false} onPressedChange={onPressedChange}>
        Show details
      </ToggleButton>,
    )

    await user.click(screen.getByRole('button'))

    expect(onPressedChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')

    rerender(
      <ToggleButton pressed onPressedChange={onPressedChange}>
        Show details
      </ToggleButton>,
    )
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('still calls onClick, and skips the toggle when onClick prevents default', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn((event: ReactMouseEvent) => event.preventDefault())
    const onPressedChange = vi.fn()
    render(
      <ToggleButton onClick={onClick} onPressedChange={onPressedChange}>
        Show details
      </ToggleButton>,
    )

    await user.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onPressedChange).not.toHaveBeenCalled()
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('toggles from the keyboard with Space and Enter', async () => {
    const user = userEvent.setup()
    render(<ToggleButton>Show details</ToggleButton>)

    const button = screen.getByRole('button')
    button.focus()
    await user.keyboard(' ')
    expect(button).toHaveAttribute('aria-pressed', 'true')

    await user.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('names an icon-only button from label and hides the glyph', async () => {
    render(<ToggleButton icon="pin" iconOnly label="Pin panel" />)

    const button = screen.getByRole('button', { name: 'Pin panel' })
    expect(button).toHaveClass('vgui-toggle-button--icon-only')
    expect(screen.queryByText('Show details')).toBeNull()
    expect(button.querySelector('.vgui-toggle-button__label')).toBeNull()

    const glyph = button.querySelector('.vgui-toggle-button__icon')
    expect(glyph).toHaveAttribute('aria-hidden', 'true')
    expect(glyph?.getAttribute('style')).toContain(glyphs.pin)
  })

  it('renders a caller-supplied icon node', () => {
    render(
      <ToggleButton icon={<svg data-testid="custom-icon" viewBox="0 0 12 12" />}>
        Details
      </ToggleButton>,
    )

    const icon = screen.getByTestId('custom-icon')
    expect(icon.parentElement).toHaveClass('vgui-toggle-button__icon--node')
    expect(icon.parentElement?.getAttribute('style')).toBeNull()
  })

  it.each([
    ['iconOnly', 'vgui-toggle-button--icon-only'],
    ['small', 'vgui-toggle-button--small'],
    ['clay', 'vgui-toggle-button--clay'],
  ] as const)('adds the %s modifier class', (prop, modifierClass) => {
    render(<ToggleButton {...{ [prop]: true, label: 'Toggle' }}>Details</ToggleButton>)

    expect(screen.getByRole('button')).toHaveClass(modifierClass)
  })

  it('keeps aria-pressed while disabled and cannot be toggled', async () => {
    const user = userEvent.setup()
    const onPressedChange = vi.fn()
    render(
      <ToggleButton disabled onPressedChange={onPressedChange}>
        Details
      </ToggleButton>,
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-pressed', 'false')

    await user.click(button)
    expect(onPressedChange).not.toHaveBeenCalled()
  })

  it('forwards the ref to the underlying button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<ToggleButton ref={ref}>Details</ToggleButton>)

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    expect(ref.current).toHaveTextContent('Details')
  })

  it('merges a caller className last so it can override any variant', () => {
    render(
      <ToggleButton small className="my-toggle">
        Details
      </ToggleButton>,
    )

    expect(screen.getByRole('button').className).toBe(
      'vgui-toggle-button vgui-toggle-button--small my-toggle',
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <ToggleButton>Show details</ToggleButton>
        <ToggleButton defaultPressed>Show hidden</ToggleButton>
        <ToggleButton icon="grid" iconOnly label="Grid view" defaultPressed />
        <ToggleButton small clay>
          Advanced
        </ToggleButton>
        <ToggleButton disabled>Unavailable</ToggleButton>
        <div className="vgui-toggle-group" role="group" aria-label="View style">
          <ToggleButton defaultPressed>List</ToggleButton>
          <ToggleButton>Grid</ToggleButton>
        </div>
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
