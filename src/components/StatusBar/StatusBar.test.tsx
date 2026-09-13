import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { StatusBar } from './StatusBar'

describe('StatusBar', () => {
  it('renders a contentinfo strip with an uppercase message', () => {
    render(<StatusBar message="Downloading Team Fortress 2" />)

    const bar = screen.getByRole('contentinfo')
    expect(bar.tagName).toBe('DIV')
    expect(bar).toHaveClass('vgui-status-bar')
    expect(screen.getByText('Downloading Team Fortress 2')).toHaveClass('vgui-status-label')
  })

  it('treats the message as optional', () => {
    const { container } = render(<StatusBar value={20} />)

    expect(screen.getByRole('contentinfo').children).toHaveLength(1)
    expect(container.querySelector('.vgui-status-bar__message')).toBeNull()
  })

  it('marks the message-only variant and renders no bar at all', () => {
    const { container } = render(<StatusBar message="Download complete" />)

    expect(screen.getByRole('contentinfo')).toHaveClass('vgui-status-bar--message-only')
    expect(container.querySelector('.vgui-status-bar__progress')).toBeNull()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('distinguishes an omitted value from a value of zero', () => {
    const { container, unmount } = render(<StatusBar message="Starting" />)
    expect(container.querySelector('.vgui-status-bar__progress')).toBeNull()
    unmount()

    const zero = render(<StatusBar message="Starting" value={0} />)
    expect(zero.container.querySelector('.vgui-status-bar__progress')).not.toBeNull()
  })

  it('reports determinate progress through the progressbar role', () => {
    const { container } = render(<StatusBar message="Downloading" value={47} />)

    const bar = screen.getByRole('progressbar', { name: 'Downloading' })
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-valuenow', '47')
    expect(bar.firstElementChild).toHaveStyle({ width: '47%' })
    expect(container.querySelector('.vgui-status-bar__progress')).toBe(bar)
  })

  it('clamps a value outside 0–100', () => {
    render(<StatusBar message="Downloading" value={140} />)

    const bar = screen.getByRole('progressbar', { name: 'Downloading' })
    expect(bar).toHaveAttribute('aria-valuenow', '100')
    expect(bar.firstElementChild).toHaveStyle({ width: '100%' })
  })

  it('renders a spinner instead of a bar when busy', () => {
    const { container } = render(<StatusBar message="Scanning for servers" busy value={10} />)

    expect(container.querySelector('.vgui-status-bar__progress')).toBeNull()
    expect(container.querySelector('.vgui-spinner')).not.toBeNull()
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument()
  })

  it('names the progressbar after the message when the message is not a link', () => {
    render(<StatusBar message="Compressing files" value={5} />)

    expect(screen.getByRole('progressbar', { name: 'Compressing files' })).toBeInTheDocument()
  })

  it('gives the progressbar a name when there is no message', () => {
    render(<StatusBar value={5} />)

    expect(screen.getByRole('progressbar', { name: 'Progress' })).toBeInTheDocument()
  })

  it('turns the message into a link when href is set', () => {
    render(<StatusBar message="Downloading game" href="steam://open/downloads" />)

    const link = screen.getByRole('link', { name: 'Downloading game' })
    expect(link).toHaveAttribute('href', 'steam://open/downloads')
    expect(link).toHaveClass('vgui-status-bar__message')
  })

  it('announces the message politely but never the ticking bar', () => {
    const { container } = render(<StatusBar message="Downloading" value={47} />)

    expect(container.querySelector('.vgui-status-bar__message')).toHaveAttribute(
      'aria-live',
      'polite',
    )
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-live')
  })

  it('left-aligns on request', () => {
    render(<StatusBar message="Downloading" value={47} align="left" />)

    expect(screen.getByRole('contentinfo')).toHaveClass('vgui-status-bar--left')
  })

  it('renders the numeric percentage when showValue is set', () => {
    render(<StatusBar message="Downloading" value={47} showValue />)

    expect(screen.getByText('47%')).toHaveClass('vgui-status-bar__value')
  })

  it('renders no percentage when showValue is off', () => {
    const { container } = render(<StatusBar message="Downloading" value={47} />)

    expect(container.querySelector('.vgui-status-bar__value')).toBeNull()
  })

  it.each([
    ['error', 'vgui-status-bar--error'],
    ['compact', 'vgui-status-bar--compact'],
  ] as const)('adds the %s modifier class', (prop, modifierClass) => {
    render(<StatusBar message="Downloading" {...{ [prop]: true }} />)

    expect(screen.getByRole('contentinfo')).toHaveClass(modifierClass)
  })

  it('lays arbitrary children out as a field row', () => {
    const { container } = render(
      <StatusBar>
        <span>Ln 42, Col 7</span>
        <span>UTF-8</span>
      </StatusBar>,
    )

    const bar = screen.getByRole('contentinfo')
    expect(bar).toHaveClass('vgui-status-bar--fields')
    expect(container.querySelector('.vgui-status-bar--fields')).toContainElement(
      screen.getByText('UTF-8'),
    )
  })

  it('renders no modifier classes by default beyond the message-only state', () => {
    render(<StatusBar value={10} />)

    expect(screen.getByRole('contentinfo').className.split(' ')).toEqual(['vgui-status-bar'])
  })

  it('merges a caller className last', () => {
    render(<StatusBar message="Downloading" value={10} className="strip" />)

    expect(screen.getByRole('contentinfo').className.split(' ')).toEqual([
      'vgui-status-bar',
      'strip',
    ])
  })

  it('forwards the ref to the strip element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<StatusBar message="Downloading" ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toHaveAttribute('role', 'contentinfo')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <StatusBar message="Downloading Team Fortress 2" value={47} showValue href="steam://open/downloads" />,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })

  it('has no accessibility violations with a spinner, fields and an error', async () => {
    const busy = render(<StatusBar message="Scanning for servers" busy />)
    await expect(a11yViolations(busy.container)).resolves.toEqual([])
    busy.unmount()

    const fields = render(
      <StatusBar>
        <span>Ln 42, Col 7</span>
        <span>UTF-8</span>
      </StatusBar>,
    )
    await expect(a11yViolations(fields.container)).resolves.toEqual([])
    fields.unmount()

    const failed = render(<StatusBar message="Connection failed" error showValue />)
    await expect(a11yViolations(failed.container)).resolves.toEqual([])
  })

  it('renders the Spinner component in the busy slot', () => {
    const { container } = render(<StatusBar message="Scanning" busy />)

    expect(container.querySelector('.vgui-status-bar > .vgui-spinner')).toBeInTheDocument()
    expect(container.querySelector('.vgui-spinner__frame')).toBeInTheDocument()
  })
})
