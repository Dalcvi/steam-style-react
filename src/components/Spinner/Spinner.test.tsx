import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('exposes an indeterminate progressbar named "Loading" by default', () => {
    render(<Spinner />)

    const spinner = screen.getByRole('progressbar', { name: 'Loading' })
    expect(spinner.tagName).toBe('SPAN')
    expect(spinner).toHaveClass('vgui-spinner')
    expect(spinner).not.toHaveAttribute('aria-valuenow')
  })

  it('uses the label prop as the accessible name', () => {
    render(<Spinner label="Loading server list" />)

    expect(screen.getByRole('progressbar', { name: 'Loading server list' })).toBeInTheDocument()
  })

  it('never attaches a live region, because the frames are not announcements', () => {
    render(<Spinner />)

    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-live')
  })

  it('hides the visual frame from assistive tech while keeping the container exposed', () => {
    const { container } = render(<Spinner />)

    const frame = container.querySelector('.vgui-spinner__frame')
    expect(frame).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('progressbar')).toContainElement(frame as HTMLElement)
  })

  it('writes the size prop as the component-local size token', () => {
    const { container } = render(<Spinner size={24} />)

    const spinner = container.querySelector('.vgui-spinner') as HTMLElement
    expect(spinner.getAttribute('style')).toContain('--vgui-spinner-size: 24px')
  })

  it('leaves the size token alone so the block variant can raise it', () => {
    const { container } = render(<Spinner block />)

    const spinner = container.querySelector('.vgui-spinner') as HTMLElement
    expect(spinner.getAttribute('style') ?? '').not.toContain('--vgui-spinner-size')
  })

  it('writes the durationMs prop as the component-local duration token', () => {
    const { container } = render(<Spinner durationMs={600} />)

    const spinner = container.querySelector('.vgui-spinner') as HTMLElement
    expect(spinner.getAttribute('style')).toContain('--vgui-spinner-duration: 600ms')
  })

  it.each([
    ['paused', 'vgui-spinner--paused'],
    ['block', 'vgui-spinner--block'],
    ['showLabel', 'vgui-spinner--inline-label'],
  ] as const)('adds the %s modifier class', (prop, modifierClass) => {
    render(<Spinner {...{ [prop]: true }} />)

    expect(screen.getByRole('progressbar')).toHaveClass(modifierClass)
  })

  it('renders no modifier classes by default', () => {
    render(<Spinner />)

    expect(screen.getByRole('progressbar').className.split(' ')).toEqual(['vgui-spinner'])
  })

  it('repeats the label as visible text for reduced-motion users', () => {
    const { container } = render(<Spinner showLabel label="Loading server list" />)

    const label = container.querySelector('.vgui-spinner__label')
    expect(label).toHaveTextContent('Loading server list')
  })

  it('prefers children over the label for the visible text', () => {
    const { container } = render(
      <Spinner showLabel label="Loading">
        Loading server list…
      </Spinner>,
    )

    expect(container.querySelector('.vgui-spinner__label')).toHaveTextContent(
      'Loading server list…',
    )
  })

  it('renders no visible label when showLabel is off', () => {
    const { container } = render(<Spinner label="Loading" />)

    expect(container.querySelector('.vgui-spinner__label')).toBeNull()
  })

  it('switches to the sprite-sheet variant when frames is given', () => {
    const { container } = render(<Spinner frames="/assets/minithrobber.png" />)

    const spinner = container.querySelector('.vgui-spinner') as HTMLElement
    expect(spinner).toHaveClass('vgui-spinner--sprite')
    expect(spinner.getAttribute('style')).toContain(
      '--vgui-spinner-sheet: url("/assets/minithrobber.png")',
    )
  })

  it('merges a caller className and inline style last', () => {
    const { container } = render(<Spinner className="field-throbber" style={{ margin: 4 }} />)

    const spinner = container.querySelector('.vgui-spinner') as HTMLElement
    expect(spinner.className).toBe('vgui-spinner field-throbber')
    expect(spinner.getAttribute('style')).toContain('margin: 4px')
  })

  it('forwards the ref to the span element', () => {
    const ref = createRef<HTMLSpanElement>()
    render(<Spinner ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
    expect(ref.current).toHaveAttribute('role', 'progressbar')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Spinner />
        <Spinner paused label="Queued" />
        <Spinner showLabel>Loading server list…</Spinner>
        <Spinner label="Capturing screenshot" />
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
