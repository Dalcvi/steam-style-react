import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { StatusLabel } from './StatusLabel'

describe('StatusLabel', () => {
  it('renders a plain span with the status string', () => {
    render(<StatusLabel>Downloading</StatusLabel>)

    const label = screen.getByText('Downloading')
    expect(label.tagName).toBe('SPAN')
    expect(label).toHaveClass('vgui-status-label')
  })

  it('renders no variant classes by default', () => {
    render(<StatusLabel>Downloading</StatusLabel>)

    expect(screen.getByText('Downloading').className.split(' ')).toEqual(['vgui-status-label'])
  })

  it('renders an anchor with the --link modifier when href is set', () => {
    render(<StatusLabel href="steam://open/downloads">Downloading game</StatusLabel>)

    const link = screen.getByRole('link', { name: 'Downloading game' })
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', 'steam://open/downloads')
    expect(link).toHaveClass('vgui-status-label', 'vgui-status-label--link')
  })

  it('adds the --with-dot modifier for the decorative dot', () => {
    render(<StatusLabel withDot>Connected</StatusLabel>)

    expect(screen.getByText('Connected')).toHaveClass('vgui-status-label--with-dot')
  })

  it('adds the --strong modifier and keeps it combinable with --with-dot', () => {
    const { container } = render(
      <StatusLabel withDot strong>
        Away — idle for 12 minutes
      </StatusLabel>,
    )

    const label = container.querySelector('.vgui-status-label')
    expect(label).toHaveClass('vgui-status-label--strong')
    expect(label).toHaveClass('vgui-status-label--with-dot')
  })

  it('does not render a live region by default', () => {
    const { container } = render(<StatusLabel>Downloading</StatusLabel>)

    expect(container.querySelector('.vgui-status-label')).not.toHaveAttribute('aria-live')
  })

  it.each(['polite', 'assertive'] as const)('maps live="%s" to an aria-live region', (live) => {
    const { container } = render(<StatusLabel live={live}>Downloading</StatusLabel>)

    expect(container.querySelector('.vgui-status-label')).toHaveAttribute('aria-live', live)
  })

  it('renders the accessible prefix as hidden text before the status string', () => {
    const { container } = render(
      <StatusLabel accessiblePrefix="Status:">47%</StatusLabel>,
    )

    const prefix = container.querySelector('.vgui-status-label__prefix')
    expect(prefix).toHaveTextContent('Status:')
    expect(container.querySelector('.vgui-status-label')).toHaveTextContent('Status:47%')
  })

  it('renders no prefix element when accessiblePrefix is omitted', () => {
    const { container } = render(<StatusLabel>47%</StatusLabel>)

    expect(container.querySelector('.vgui-status-label__prefix')).toBeNull()
  })

  it('merges a caller className last', () => {
    const { container } = render(<StatusLabel className="strip-label">Downloading</StatusLabel>)

    expect(container.querySelector('.vgui-status-label')?.className).toBe(
      'vgui-status-label strip-label',
    )
  })

  it('spreads the remaining attributes onto the root element', () => {
    render(
      <StatusLabel id="download-status" aria-disabled="true" data-state="idle">
        Idle
      </StatusLabel>,
    )

    const label = screen.getByText('Idle')
    expect(label).toHaveAttribute('id', 'download-status')
    expect(label).toHaveAttribute('aria-disabled', 'true')
    expect(label).toHaveAttribute('data-state', 'idle')
  })

  it('marks a disabled label with aria-disabled and data-disabled', () => {
    render(<StatusLabel disabled>Idle</StatusLabel>)

    const label = screen.getByText('Idle')
    expect(label).toHaveAttribute('aria-disabled', 'true')
    expect(label).toHaveAttribute('data-disabled', 'true')
  })

  it('lets an explicit aria-disabled override the disabled prop', () => {
    render(
      <StatusLabel disabled aria-disabled="false">
        Idle
      </StatusLabel>,
    )

    expect(screen.getByText('Idle')).toHaveAttribute('aria-disabled', 'false')
  })

  it('leaves a default label without disabled attributes', () => {
    render(<StatusLabel>Downloading</StatusLabel>)

    const label = screen.getByText('Downloading')
    expect(label).not.toHaveAttribute('aria-disabled')
    expect(label).not.toHaveAttribute('data-disabled')
  })

  it('forwards the ref to the span element', () => {
    const ref = createRef<HTMLElement>()
    render(<StatusLabel ref={ref}>Downloading</StatusLabel>)

    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
    expect(ref.current).toHaveTextContent('Downloading')
  })

  it('forwards the ref to the anchor element when href is set', () => {
    const ref = createRef<HTMLElement>()
    render(
      <StatusLabel ref={ref} href="steam://open/downloads">
        Downloading game
      </StatusLabel>,
    )

    expect(ref.current).toBeInstanceOf(HTMLAnchorElement)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <StatusLabel>Downloading…</StatusLabel>
        <StatusLabel href="steam://open/downloads">Downloading game</StatusLabel>
        <StatusLabel withDot accessiblePrefix="Status:">
          Connected
        </StatusLabel>
        <StatusLabel strong>Signed in as dalcvi</StatusLabel>
        <StatusLabel live="polite" accessiblePrefix="Status:">
          47%
        </StatusLabel>
        <StatusLabel disabled>Idle</StatusLabel>
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
