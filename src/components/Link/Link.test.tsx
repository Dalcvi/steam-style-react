import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Link } from './Link'

describe('Link', () => {
  it('renders a real anchor when it has an href', () => {
    render(<Link href="/servers">Server list</Link>)

    const link = screen.getByRole('link', { name: 'Server list' })
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/servers')
    expect(link).toHaveClass('vgui-link')
  })

  it('renders a button instead of an anchor when the href is omitted', () => {
    render(<Link>Refresh</Link>)

    const button = screen.getByRole('button', { name: 'Refresh' })
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveClass('vgui-link--button')
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('renders a button when asButton is set, even with an href', () => {
    render(
      <Link href="/servers" asButton>
        Refresh
      </Link>,
    )

    expect(screen.getByRole('button', { name: 'Refresh' })).toHaveClass('vgui-link--button')
  })

  it('adds the quiet modifier for the low-emphasis URLLabel colour', () => {
    render(
      <Link href="/servers" quiet>
        Server list
      </Link>,
    )

    expect(screen.getByRole('link')).toHaveClass('vgui-link--quiet')
  })

  it('adds the external modifier, target and rel, and announces the new tab', () => {
    render(
      <Link href="https://example.com" external>
        Steam Support
      </Link>,
    )

    const link = screen.getByRole('link', { name: /Steam Support/ })
    expect(link).toHaveAccessibleName(/opens in a new tab/)
    expect(link).toHaveClass('vgui-link--external')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer noopener')
    expect(link.querySelector('.vgui-link__external')).toHaveAttribute('aria-hidden', 'true')
  })

  it('does not add target or the external glyph to a text button', () => {
    render(
      <Link asButton external>
        Refresh
      </Link>,
    )

    const button = screen.getByRole('button')
    expect(button).not.toHaveAttribute('target')
    expect(button).not.toHaveClass('vgui-link--external')
    expect(button.querySelector('.vgui-link__external')).toBeNull()
  })

  it('merges a caller className last', () => {
    render(
      <Link href="/servers" quiet className="my-link">
        Server list
      </Link>,
    )

    expect(screen.getByRole('link').className).toBe('vgui-link vgui-link--quiet my-link')
  })

  it('forwards the ref to the anchor it renders', () => {
    const ref = createRef<HTMLElement>()
    render(
      <Link href="/servers" ref={ref}>
        Server list
      </Link>,
    )

    expect(ref.current).toBeInstanceOf(HTMLAnchorElement)
    expect(ref.current).toHaveTextContent('Server list')
  })

  it('forwards the ref to the button it renders for a text button', () => {
    const ref = createRef<HTMLElement>()
    render(<Link ref={ref}>Refresh</Link>)

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('calls onClick when activated', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      // A fragment destination, so the click does not ask jsdom to navigate.
      <Link href="#servers" onClick={onClick}>
        Server list
      </Link>,
    )

    await user.click(screen.getByRole('link'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('marks a disabled link aria-disabled, removes it from the tab order and blocks activation', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Link href="#servers" disabled onClick={onClick}>
        Server list
      </Link>,
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('aria-disabled', 'true')
    expect(link).toHaveAttribute('tabindex', '-1')

    await user.click(link)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('disables a text button natively so it is skipped by keyboard and pointer alike', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Link asButton disabled onClick={onClick}>
        Refresh
      </Link>,
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <p>
        Found <Link href="/servers?f=notfull">142 servers</Link>. See the{' '}
        <Link href="https://developer.valvesoftware.com/wiki/VGUI" external>
          VGUI docs
        </Link>{' '}
        for the design language.
        <Link quiet href="/about">
          About
        </Link>
        <Link asButton>Refresh</Link>
        <Link href="/gone" disabled>
          Gone
        </Link>
      </p>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
