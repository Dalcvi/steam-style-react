import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Panel } from './Panel'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Panel', () => {
  it('renders its children', () => {
    render(<Panel>Body content</Panel>)

    expect(screen.getByText('Body content')).toBeInTheDocument()
  })

  it('is a plain div when there is no heading', () => {
    const { container } = render(<Panel>Body</Panel>)

    const panel = container.querySelector('.vgui-panel')
    expect(panel?.tagName).toBe('DIV')
    expect(container.querySelector('.vgui-panel__titlebar')).toBeNull()
  })

  it('becomes a named region wired to its caption when a heading is given', () => {
    render(<Panel heading="Server browser">Body</Panel>)

    const region = screen.getByRole('region', { name: 'Server browser' })
    expect(region.tagName).toBe('SECTION')

    const titlebar = region.querySelector('.vgui-panel__titlebar')
    expect(titlebar).not.toBeNull()
    expect(titlebar?.id).toBeTruthy()
    expect(region).toHaveAttribute('aria-labelledby', titlebar?.id)
  })

  it('gives separate panels distinct titlebar ids', () => {
    const { container } = render(
      <>
        <Panel heading="One">A</Panel>
        <Panel heading="Two">B</Panel>
      </>,
    )

    const [first, second] = [...container.querySelectorAll('.vgui-panel__titlebar')]
    expect(first.id).not.toBe(second.id)
  })

  it('renders the caption at the requested heading level', () => {
    const { container } = render(
      <Panel heading="Filters" headingLevel={2}>
        Body
      </Panel>,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Filters' })).toHaveClass(
      'vgui-panel__titlebar',
    )
    expect(container.querySelector('h2')).not.toBeNull()
  })

  it('renders a plain caption element when no heading level is given', () => {
    const { container } = render(<Panel heading="Filters">Body</Panel>)

    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull()
  })

  it('applies the inset modifier', () => {
    render(<Panel inset>Body</Panel>)

    expect(screen.getByText('Body')).toHaveClass('vgui-panel--inset')
  })

  it('applies the rounded modifier', () => {
    render(<Panel rounded>Body</Panel>)

    expect(screen.getByText('Body')).toHaveClass('vgui-panel--rounded')
  })

  it('warns when inset and rounded are combined', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <Panel inset rounded>
        Body
      </Panel>,
    )

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('inset'))
  })

  it('does not warn for either modifier on its own', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <>
        <Panel inset>Inset</Panel>
        <Panel rounded>Rounded</Panel>
      </>,
    )

    expect(warn).not.toHaveBeenCalled()
  })

  it('forwards the ref and merges a caller className', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <Panel ref={ref} className="my-panel">
        Body
      </Panel>,
    )

    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current).toHaveClass('vgui-panel', 'my-panel')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Panel heading="Server browser" headingLevel={2}>
          Content
        </Panel>
        <Panel inset>Recessed</Panel>
        <Panel rounded>Tip</Panel>
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
