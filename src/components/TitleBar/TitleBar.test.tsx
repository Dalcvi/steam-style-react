import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { TitleBar } from './TitleBar'

describe('TitleBar', () => {
  it('renders the caption as a non-heading by default', () => {
    const { container } = render(<TitleBar>Player list</TitleBar>)

    const caption = container.querySelector('.vgui-titlebar__text')
    expect(caption).toHaveTextContent('Player list')
    expect(caption?.tagName).toBe('SPAN')
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('renders the caption with the raw string, leaving casing to CSS', () => {
    const { container } = render(<TitleBar>Player list</TitleBar>)

    // Upper-casing is a presentation detail, so assistive tech still reads and
    // copy/paste still yields the string the caller wrote.
    expect(container.querySelector('.vgui-titlebar__text')?.textContent).toBe('Player list')
  })

  it.each([1, 2, 3, 4, 5, 6] as const)('renders an h%i when level is set', (level) => {
    const { container } = render(<TitleBar level={level}>Friends</TitleBar>)

    const caption = container.querySelector('.vgui-titlebar__text')
    expect(caption?.tagName).toBe(`H${level}`)
    expect(screen.getByRole('heading', { level })).toHaveTextContent('Friends')
  })

  it.each([
    ['clay', 'vgui-titlebar--clay'],
    ['subdued', 'vgui-titlebar--subdued'],
  ] as const)('adds the %s modifier class', (prop, modifierClass) => {
    const { container } = render(<TitleBar {...{ [prop]: true }}>OK</TitleBar>)

    expect(container.firstElementChild).toHaveClass('vgui-titlebar', modifierClass)
  })

  it('renders no modifier classes by default', () => {
    const { container } = render(<TitleBar>OK</TitleBar>)

    expect((container.firstElementChild as HTMLElement).className.split(' ')).toEqual([
      'vgui-titlebar',
    ])
  })

  it('renders the icon in a decorative wrapper that carries no accessible name', () => {
    const { container } = render(<TitleBar icon={<svg data-testid="glyph" />}>Friends</TitleBar>)

    const icon = container.querySelector('.vgui-titlebar__icon')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(icon?.querySelector('[data-testid="glyph"]')).toBeInTheDocument()
  })

  it('omits the icon wrapper when no icon is given', () => {
    const { container } = render(<TitleBar>Friends</TitleBar>)

    expect(container.querySelector('.vgui-titlebar__icon')).not.toBeInTheDocument()
  })

  it('groups trailing actions and names the group', () => {
    render(
      <TitleBar
        actionsLabel="Window controls"
        actions={
          <button type="button" aria-label="Close">
            x
          </button>
        }
      >
        Friends
      </TitleBar>,
    )

    const group = screen.getByRole('group', { name: 'Window controls' })
    expect(group).toHaveClass('vgui-titlebar__actions')
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('omits the actions container when no actions are given', () => {
    const { container } = render(<TitleBar>Friends</TitleBar>)

    expect(container.querySelector('.vgui-titlebar__actions')).not.toBeInTheDocument()
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<TitleBar ref={ref}>Friends</TitleBar>)

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toHaveTextContent('Friends')
  })

  it('merges a caller className last so it can override any variant', () => {
    render(
      <TitleBar clay subdued className="my-title-bar">
        OK
      </TitleBar>,
    )

    expect(document.querySelector('.vgui-titlebar')?.className).toBe(
      'vgui-titlebar vgui-titlebar--clay vgui-titlebar--subdued my-title-bar',
    )
  })

  it('spreads extra attributes onto the root element', () => {
    render(
      <TitleBar id="list-title" data-testid="bar">
        OK
      </TitleBar>,
    )

    expect(screen.getByTestId('bar')).toHaveAttribute('id', 'list-title')
  })

  it('tracks the caption with a heading level and a control group together', async () => {
    const { container } = render(
      <div>
        <TitleBar level={2} icon={<svg aria-hidden="true" />} actionsLabel="Window controls" actions={<button type="button" aria-label="Close">x</button>}>
          Player list
        </TitleBar>
        <TitleBar clay>Properties</TitleBar>
        <TitleBar subdued>Player list (inactive)</TitleBar>
      </div>,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Player list' })).toBeInTheDocument()
    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
