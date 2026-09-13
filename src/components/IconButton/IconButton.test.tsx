import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { IconButton, glyphs } from './IconButton'

describe('IconButton', () => {
  it('renders a native button named by its label', () => {
    render(<IconButton icon="reload" label="Reload" />)

    const button = screen.getByRole('button', { name: 'Reload' })
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveClass('vgui-icon-button')
  })

  it('defaults to type="button" so a toolbar never submits a form', () => {
    render(<IconButton icon="close" label="Close" />)

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('resolves a built-in glyph name to a mask-image custom property', () => {
    render(<IconButton icon="stop" label="Stop loading" />)

    const glyph = document.querySelector('.vgui-icon-button__glyph')
    expect(glyph).not.toBeNull()
    expect(glyph).toHaveAttribute('aria-hidden', 'true')
    // The URI travels as a custom property on the button and is inherited by
    // the glyph box, so the stylesheet holds no per-glyph rule.
    expect(screen.getByRole('button').getAttribute('style')).toContain(glyphs.stop)
  })

  it('renders a caller-supplied icon node instead of a mask', () => {
    render(
      <IconButton
        label="Stop loading"
        icon={
          <svg data-testid="custom-glyph" viewBox="0 0 12 12">
            <rect width="12" height="12" />
          </svg>
        }
      />,
    )

    const glyph = screen.getByTestId('custom-glyph')
    expect(glyph).toBeInTheDocument()
    expect(glyph.parentElement).toHaveClass('vgui-icon-button__glyph--node')
    expect(glyph.parentElement?.getAttribute('style')).toBeNull()
  })

  it.each([
    [15, 'vgui-icon-button--small'],
    [18, 'vgui-icon-button--gutter'],
    [25, 'vgui-icon-button--large'],
  ] as const)('maps size %i onto the %s modifier', (size, modifierClass) => {
    render(<IconButton size={size} icon="arrow-down" label="Scroll down" />)

    expect(screen.getByRole('button')).toHaveClass(modifierClass)
  })

  it('renders no size modifier at the default 20px', () => {
    render(<IconButton icon="arrow-down" label="Scroll down" />)

    const button = screen.getByRole('button')
    expect(button.className.split(' ')).toEqual(['vgui-icon-button'])
  })

  it.each([
    ['frameless', 'vgui-icon-button--frameless'],
    ['clay', 'vgui-icon-button--clay'],
  ] as const)('adds the %s modifier class', (prop, modifierClass) => {
    render(<IconButton {...{ [prop]: true }} icon="grid" label="Grid view" />)

    expect(screen.getByRole('button')).toHaveClass(modifierClass)
  })

  it('is an ordinary button when off and announces itself pressed when toggled', () => {
    const { rerender } = render(<IconButton icon="grid" label="Grid view" />)
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed')

    rerender(<IconButton icon="grid" label="Grid view" toggled />)

    const button = screen.getByRole('button', { name: 'Grid view' })
    expect(button).toHaveClass('vgui-icon-button--toggled')
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('forwards the ref to the underlying button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<IconButton ref={ref} icon="home" label="Home" />)

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('calls onClick on pointer and keyboard activation', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<IconButton icon="reload" label="Reload" onClick={onClick} />)

    const button = screen.getByRole('button')
    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)

    button.focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(3)
  })

  it('keeps its accessible name while disabled and cannot be activated', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<IconButton disabled icon="stop" label="Stop loading" onClick={onClick} />)

    const button = screen.getByRole('button', { name: 'Stop loading' })
    expect(button).toBeDisabled()

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('merges a caller className last and keeps a caller style', () => {
    render(
      <IconButton
        icon="grid"
        label="Grid view"
        className="my-icon-button"
        style={{ marginTop: 4 }}
        data-testid="icon"
      />,
    )

    const button = screen.getByTestId('icon')
    expect(button.className).toBe('vgui-icon-button my-icon-button')
    expect(button).toHaveStyle({ marginTop: '4px' })
    expect(button.getAttribute('style')).toContain('--vgui-icon-button-glyph')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <IconButton icon="back" label="Back" size={25} />
        <IconButton icon="grid" label="Grid view" toggled />
        <IconButton icon="chevron-down" label="Show options" frameless />
        <IconButton icon="stop" label="Stop loading" disabled />
        <IconButton
          icon={
            <svg aria-hidden="true" focusable="false" viewBox="0 0 12 12">
              <path d="M0 0h12v12H0z" />
            </svg>
          }
          label="Close"
        />
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
