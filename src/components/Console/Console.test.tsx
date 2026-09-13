import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Console } from './Console'
import type { ConsoleLine } from './Console'

const log: ConsoleLine[] = [
  { id: '1', kind: 'text', text: 'Connecting to 192.168.1.10:27015...' },
  { id: '2', kind: 'error', text: 'Bad challenge from 192.168.1.10' },
  { id: '3', kind: 'history', text: 'Server is out of date' },
]

describe('Console', () => {
  it('is a polite live log with an accessible name', () => {
    render(<Console label="Server console" lines={log} />)

    const node = screen.getByRole('log', { name: 'Server console' })

    expect(node).toHaveAttribute('aria-live', 'polite')
    // Scrollable by keyboard.
    expect(node).toHaveAttribute('tabindex', '0')
  })

  it('renders one list item per line, in order, verbatim', () => {
    render(<Console label="Server console" lines={log} />)

    const items = screen.getAllByRole('listitem')

    expect(items).toHaveLength(3)
    expect(items.map((item) => item.textContent)).toEqual([
      'Connecting to 192.168.1.10:27015...',
      'Bad challenge from 192.168.1.10',
      'Server is out of date',
    ])
    expect(screen.getByRole('log').querySelector('ol')).not.toBeNull()
  })

  it('maps each line kind to its documented modifier class', () => {
    const { container } = render(<Console label="Server console" lines={log} />)

    const lines = Array.from(container.querySelectorAll('li'))

    expect(lines[0].className).toBe('vgui-console__line')
    expect(lines[1].className).toBe('vgui-console__line vgui-console__line--error')
    expect(lines[2].className).toBe('vgui-console__line vgui-console__line--history')
  })

  it('defaults the error prefix to "ERR: " and lets a caller override it', () => {
    const { rerender } = render(<Console label="Console" lines={log} />)

    expect(
      screen.getByRole('log').style.getPropertyValue('--vgui-console-error-prefix'),
    ).toBe('"ERR: "')

    rerender(<Console label="Console" lines={log} errorPrefix="!! " />)

    expect(
      screen.getByRole('log').style.getPropertyValue('--vgui-console-error-prefix'),
    ).toBe('"!! "')
  })

  it('drops the prefix and marks the opt-out when errorPrefix is empty', () => {
    render(<Console label="Console" lines={log} errorPrefix="" />)

    const node = screen.getByRole('log')

    expect(node).toHaveClass('vgui-console', 'vgui-console--no-error-prefix')
    expect(node.style.getPropertyValue('--vgui-console-error-prefix')).toBe('""')
  })

  it('trims the oldest lines past maxLines', () => {
    const { rerender } = render(<Console label="Console" lines={log} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(3)

    rerender(<Console label="Console" lines={log} maxLines={2} />)

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Bad challenge from 192.168.1.10',
      'Server is out of date',
    ])

    rerender(<Console label="Console" lines={log} maxLines={0} />)

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('scrolls to the newest line only when follow is set', () => {
    const scrollHeight = { current: 480 }
    const scrollTop = { current: 0 }
    const { container, rerender } = render(<Console label="Console" lines={[log[0]]} />)
    const node = container.querySelector('.vgui-console') as HTMLDivElement

    Object.defineProperty(node, 'scrollHeight', {
      configurable: true,
      get: () => scrollHeight.current,
    })
    Object.defineProperty(node, 'scrollTop', {
      configurable: true,
      get: () => scrollTop.current,
      set: (value: number) => {
        scrollTop.current = value
      },
    })

    rerender(<Console label="Console" lines={log} />)

    expect(scrollTop.current).toBe(0)

    rerender(<Console label="Console" lines={log} follow />)

    expect(scrollTop.current).toBe(480)

    scrollTop.current = 0
    scrollHeight.current = 512
    rerender(<Console label="Console" lines={[...log, { id: '4', kind: 'text', text: 'Latest' }]} follow />)

    expect(scrollTop.current).toBe(512)
  })

  it('renders line text as text, never as markup', () => {
    const { container } = render(
      <Console
        label="Console"
        lines={[{ id: '1', kind: 'text', text: '<b>bold</b> & "quoted"' }]}
      />,
    )

    expect(screen.getByText('<b>bold</b> & "quoted"')).toBeInTheDocument()
    expect(container.querySelector('b')).toBeNull()
  })

  it('appends the caller className to its own class list', () => {
    render(<Console label="Console" lines={log} className="my-console" />)

    expect(screen.getByRole('log')).toHaveClass('vgui-console', 'my-console')
  })

  it('forwards the ref to the log element', () => {
    const ref = createRef<HTMLDivElement>()

    render(<Console ref={ref} label="Console" lines={log} />)

    expect(ref.current).toBe(screen.getByRole('log'))
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Console label="Server console" lines={log} follow maxLines={2000} />)

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
