import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { FieldLabel } from './FieldLabel'

describe('FieldLabel', () => {
  it('renders a real <label> with the muted default and no modifiers', () => {
    const { container } = render(<FieldLabel htmlFor="server-name">Server name</FieldLabel>)

    const label = screen.getByText('Server name')
    expect(label.tagName).toBe('LABEL')
    expect(label.className).toBe('vgui-field-label')
    expect(container.querySelectorAll('span.vgui-field-label')).toHaveLength(0)
  })

  it('associates with a control through htmlFor', () => {
    render(
      <>
        <FieldLabel htmlFor="server-name">Server name</FieldLabel>
        <input id="server-name" />
      </>
    )

    expect(screen.getByLabelText('Server name')).toBe(screen.getByRole('textbox'))
  })

  it('focuses the captioned control when the label is clicked', async () => {
    const user = userEvent.setup()
    render(
      <>
        <FieldLabel htmlFor="server-name">Server name</FieldLabel>
        <input id="server-name" />
      </>
    )

    await user.click(screen.getByText('Server name'))

    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('renders a <span> and drops the label/control association when asText is set', () => {
    const { container } = render(
      <FieldLabel asText htmlFor="server-name">
        Sign in to see your friends list.
      </FieldLabel>
    )

    const span = screen.getByText('Sign in to see your friends list.')
    expect(span.tagName).toBe('SPAN')
    expect(span.className).toBe('vgui-field-label')
    expect(span.hasAttribute('for')).toBe(false)
    expect(container.querySelector('label')).toBeNull()
  })

  it('maps each variant prop to its own modifier class', () => {
    const { unmount } = render(<FieldLabel strong>Strong</FieldLabel>)
    expect(screen.getByText('Strong').className).toBe('vgui-field-label vgui-field-label--strong')
    unmount()

    render(<FieldLabel muted>Muted</FieldLabel>)
    expect(screen.getByText('Muted').className).toBe('vgui-field-label vgui-field-label--muted')
  })

  it('supports the heading and error variants', () => {
    const { unmount } = render(<FieldLabel heading>Advanced options</FieldLabel>)
    expect(screen.getByText('Advanced options').className).toBe('vgui-field-label vgui-field-label--heading')
    unmount()

    render(<FieldLabel error>That address is unreachable.</FieldLabel>)
    expect(screen.getByText('That address is unreachable.').className).toBe(
      'vgui-field-label vgui-field-label--error'
    )
  })

  it('marks a required caption with the asterisk modifier, leaving the requirement to the control', () => {
    render(
      <>
        <FieldLabel htmlFor="server-address" required>
          Server address
        </FieldLabel>
        <input id="server-address" required />
      </>
    )

    const label = screen.getByText('Server address')
    expect(label.className).toContain('vgui-field-label--required')
    // The asterisk is drawn by CSS and is invisible to assistive tech, so the
    // requirement has to survive on the control itself — `aria-required` is not
    // permitted on the generic role a bare `<label>` maps to.
    expect(screen.getByLabelText('Server address')).toBeRequired()
    expect(label).not.toHaveAttribute('aria-required')
  })

  it('does not emit the required modifier when required is false', () => {
    render(<FieldLabel>Server name</FieldLabel>)

    expect(screen.getByText('Server name').className).not.toContain('--required')
  })

  it('exposes the sunken disabled treatment through data-disabled and aria-disabled', () => {
    render(<FieldLabel disabled>Server name</FieldLabel>)

    const label = screen.getByText('Server name')
    expect(label).toHaveAttribute('data-disabled', 'true')
    expect(label).toHaveAttribute('aria-disabled', 'true')
  })

  it('emits no disabled attributes while enabled', () => {
    render(<FieldLabel>Server name</FieldLabel>)

    const label = screen.getByText('Server name')
    expect(label).not.toHaveAttribute('data-disabled')
    expect(label).not.toHaveAttribute('aria-disabled')
  })

  it('threads className through last', () => {
    render(
      <FieldLabel strong className="checkout__label">
        Total
      </FieldLabel>
    )

    expect(screen.getByText('Total').className).toBe(
      'vgui-field-label vgui-field-label--strong checkout__label'
    )
  })

  it('passes arbitrary attributes such as id and aria-describedby through to the node', () => {
    render(
      <FieldLabel id="cost-label" aria-describedby="cost-hint">
        Total
      </FieldLabel>
    )

    const label = screen.getByText('Total')
    expect(label).toHaveAttribute('id', 'cost-label')
    expect(label).toHaveAttribute('aria-describedby', 'cost-hint')
  })

  it('forwards ref to the underlying label node', () => {
    const ref = createRef<HTMLLabelElement>()
    render(
      <FieldLabel ref={ref} htmlFor="server-name">
        Server name
      </FieldLabel>
    )

    expect(ref.current).toBeInstanceOf(HTMLLabelElement)
    expect(ref.current).toBe(screen.getByText('Server name'))
  })

  it('has no accessibility violations in its variants', async () => {
    const { container } = render(
      <form>
        <FieldLabel htmlFor="server-name">Server name</FieldLabel>
        <input id="server-name" />
        <FieldLabel htmlFor="server-address" required>
          Server address
        </FieldLabel>
        <input id="server-address" required aria-describedby="server-address-error" />
        <FieldLabel asText muted>
          Filters apply to the current list only.
        </FieldLabel>
        <FieldLabel id="server-address-error" error>
          That server address is unreachable.
        </FieldLabel>
        <FieldLabel htmlFor="server-port" disabled>
          Server port
        </FieldLabel>
        <input id="server-port" disabled />
      </form>
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
