import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Divider } from './Divider'

describe('Divider', () => {
  it('renders a div with role="separator" rather than an hr', () => {
    render(<Divider />)

    const separator = screen.getByRole('separator')
    expect(separator.tagName).toBe('DIV')
    expect(separator).toHaveClass('vgui-divider')
  })

  it('marks the horizontal variant explicitly, since ARIA defaults to vertical', () => {
    render(<Divider />)

    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal')
  })

  it('marks the vertical variant', () => {
    render(<Divider vertical />)

    const separator = screen.getByRole('separator')
    expect(separator).toHaveAttribute('aria-orientation', 'vertical')
    expect(separator).toHaveClass('vgui-divider--vertical')
  })

  it.each([
    ['inset', 'vgui-divider--inset'],
    ['vertical', 'vgui-divider--vertical'],
    ['spaced', 'vgui-divider--spaced'],
  ] as const)('adds the %s modifier class', (prop, modifierClass) => {
    render(<Divider {...{ [prop]: true }} />)

    expect(screen.getByRole('separator')).toHaveClass(modifierClass)
  })

  it('renders no modifier classes by default', () => {
    render(<Divider />)

    expect(screen.getByRole('separator').className.split(' ')).toEqual(['vgui-divider'])
  })

  it('merges a caller className last so it can override any variant', () => {
    render(<Divider spaced className="my-divider" />)

    expect(screen.getByRole('separator').className).toBe(
      'vgui-divider vgui-divider--spaced my-divider',
    )
  })

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Divider ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toHaveAttribute('role', 'separator')
  })

  it('spreads extra attributes onto the element', () => {
    render(<Divider data-testid="rule" id="rule-1" />)

    expect(screen.getByTestId('rule')).toHaveAttribute('id', 'rule-1')
  })

  it('is never focusable', () => {
    render(<Divider />)

    expect(screen.getByRole('separator')).not.toHaveAttribute('tabindex')
  })

  it('has no accessibility violations in any documented variant', async () => {
    const { container } = render(
      <div>
        <Divider />
        <Divider inset />
        <Divider spaced />
        <div style={{ height: 32 }}>
          <Divider vertical />
        </div>
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
