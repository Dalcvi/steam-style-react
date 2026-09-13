import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Button } from './Button'

describe('Button', () => {
  it('renders a native button with its label', () => {
    render(<Button>Join game</Button>)

    const button = screen.getByRole('button', { name: 'Join game' })
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveClass('vgui-button')
  })

  it('defaults to type="button" so it never accidentally submits a form', () => {
    render(<Button>Scan</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('honours an explicit type="submit"', () => {
    render(<Button type="submit">OK</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('forwards the ref to the underlying button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>OK</Button>)

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    expect(ref.current).toHaveTextContent('OK')
  })

  it('calls onClick when activated by pointer and by keyboard', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Join game</Button>)

    const button = screen.getByRole('button')
    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)

    button.focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(3)
  })

  it.each([
    ['fullWidth', 'vgui-button--full-width'],
    ['small', 'vgui-button--small'],
    ['large', 'vgui-button--large'],
    ['primary', 'vgui-button--primary'],
    ['danger', 'vgui-button--danger'],
    ['clay', 'vgui-button--clay'],
  ] as const)('adds the %s modifier class', (prop, modifierClass) => {
    render(<Button {...{ [prop]: true }}>OK</Button>)

    expect(screen.getByRole('button')).toHaveClass(modifierClass)
  })

  it('renders no modifier classes by default', () => {
    render(<Button>OK</Button>)

    const button = screen.getByRole('button')
    expect(button.className.split(' ')).toEqual(['vgui-button'])
  })

  it('merges a caller className last so it can override any variant', () => {
    render(
      <Button small className="my-button">
        OK
      </Button>,
    )

    expect(screen.getByRole('button').className).toBe('vgui-button vgui-button--small my-button')
  })

  it('is disabled and non-interactive when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Unavailable
      </Button>,
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Button>Join game</Button>
        <Button small clay>
          Browse…
        </Button>
        <Button danger>Remove</Button>
        <Button disabled>Unavailable</Button>
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
