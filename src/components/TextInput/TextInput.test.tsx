import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { TextInput } from './TextInput'

/* JSX attribute literals do not process escapes, so the glyph is passed by expression. */
const GLYPH = '\u2315'

describe('TextInput', () => {
  it('renders a native text input inside the wrapper', () => {
    render(<TextInput aria-label="Server address" />)

    const input = screen.getByLabelText('Server address')
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveClass('vgui-text-input__field')
    expect(input.parentElement).toHaveClass('vgui-text-input')
  })

  it('reports typed text through onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TextInput aria-label="Server address" onChange={onChange} />)

    await user.type(screen.getByLabelText('Server address'), '1024')

    expect(onChange).toHaveBeenCalledTimes(4)
    expect(screen.getByLabelText('Server address')).toHaveValue('1024')
  })

  it('forwards the ref to the underlying input element', () => {
    const ref = createRef<HTMLInputElement>()
    render(<TextInput ref={ref} aria-label="Server address" defaultValue="dm" />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current).toHaveValue('dm')
  })

  it.each([
    [{ size: 'large' } as const, 'vgui-text-input--large'],
    [{ icon: GLYPH } as const, 'vgui-text-input--with-icon'],
    [{ suffix: 'ms' } as const, 'vgui-text-input--with-suffix'],
    [{ invalid: true } as const, 'vgui-text-input--invalid'],
    [{ clay: true } as const, 'vgui-text-input--clay'],
  ])('adds the modifier class for %o', (props, modifierClass) => {
    const { container } = render(<TextInput aria-label="Field" {...props} />)

    expect(container.firstElementChild).toHaveClass('vgui-text-input', modifierClass)
  })

  it('renders no modifier classes by default', () => {
    const { container } = render(<TextInput aria-label="Field" />)

    expect(container.firstElementChild?.className.split(' ')).toEqual(['vgui-text-input'])
  })

  it('merges a caller className last', () => {
    const { container } = render(
      <TextInput aria-label="Field" size="large" className="my-field" />,
    )

    expect(container.firstElementChild?.className).toBe(
      'vgui-text-input vgui-text-input--large my-field',
    )
  })

  it('renders the icon and suffix adornments hidden from assistive tech', () => {
    const { container } = render(<TextInput aria-label="Field" icon={GLYPH} suffix="ms" />)

    const adornments = container.querySelectorAll('.vgui-text-input__adornment')
    expect(adornments).toHaveLength(2)
    expect(adornments[0]).toHaveAttribute('aria-hidden', 'true')
    expect(adornments[0]).toHaveClass('vgui-text-input__adornment--start')
    expect(adornments[0]).toHaveTextContent(GLYPH)
    expect(adornments[1]).toHaveAttribute('aria-hidden', 'true')
    expect(adornments[1]).toHaveClass('vgui-text-input__adornment--end')
    expect(adornments[1]).toHaveTextContent('ms')
  })

  it('renders no adornments without an icon or suffix', () => {
    const { container } = render(<TextInput aria-label="Field" />)

    expect(container.querySelectorAll('.vgui-text-input__adornment')).toHaveLength(0)
  })

  it('does not set aria-invalid from the invalid prop', () => {
    render(<TextInput aria-label="Port" invalid defaultValue="99999" />)

    const input = screen.getByLabelText('Port')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toBeInvalid()
  })

  it('lets the caller own aria-invalid', () => {
    render(<TextInput aria-label="Port" invalid aria-invalid="true" />)

    expect(screen.getByLabelText('Port')).toHaveAttribute('aria-invalid', 'true')
  })

  it('passes native input attributes through to the inner input', () => {
    const { container } = render(
      <TextInput
        aria-label="Server address"
        id="server-ip"
        name="serverIp"
        type="search"
        autoComplete="off"
        maxLength={15}
      />,
    )

    const input = screen.getByLabelText('Server address')
    expect(input).toHaveAttribute('id', 'server-ip')
    expect(input).toHaveAttribute('name', 'serverIp')
    expect(input).toHaveAttribute('type', 'search')
    expect(input).toHaveAttribute('autocomplete', 'off')
    expect(input).toHaveAttribute('maxlength', '15')
    // `id` and `name` belong to the input, not to the wrapper.
    expect(container.firstElementChild).not.toHaveAttribute('id')
  })

  it('is read-only but still focusable', async () => {
    const user = userEvent.setup()
    render(<TextInput aria-label="Path" readOnly defaultValue="F:\Steam" />)

    const input = screen.getByLabelText('Path')
    await user.tab()

    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('readonly')
    expect(input).not.toBeDisabled()
  })

  it('is inert and skipped by the keyboard when disabled', async () => {
    const user = userEvent.setup()
    render(<TextInput aria-label="Path" disabled defaultValue="F:\Steam" />)

    await user.tab()

    const input = screen.getByLabelText('Path')
    expect(input).toBeDisabled()
    expect(input).not.toHaveFocus()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <TextInput aria-label="Server address" placeholder="203.0.113.4:27015" />
        <TextInput aria-label="Filter" icon={GLYPH} type="search" />
        <TextInput aria-label="Latency" suffix="ms" size="large" defaultValue="60" />
        <TextInput aria-label="Port" invalid aria-invalid="true" defaultValue="99999" />
        <TextInput aria-label="Install path" readOnly defaultValue="F:\Steam" />
        <TextInput aria-label="Disabled field" disabled />
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
