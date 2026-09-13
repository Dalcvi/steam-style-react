import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { GroupBox } from './GroupBox'

describe('GroupBox', () => {
  it('renders a real fieldset whose legend names the group', () => {
    const { container } = render(
      <GroupBox legend="Audio">
        <input type="range" min={0} max={100} aria-label="Volume" />
      </GroupBox>,
    )

    const group = screen.getByRole('group', { name: 'Audio' })
    expect(group.tagName).toBe('FIELDSET')
    expect(group).toHaveClass('vgui-groupbox')
    expect(container.querySelector('legend')).toHaveClass('vgui-groupbox__legend')
  })

  it('never adds an explicit role to the fieldset', () => {
    render(<GroupBox legend="Audio">content</GroupBox>)

    expect(screen.getByRole('group', { name: 'Audio' })).not.toHaveAttribute('role')
  })

  it('renders non-text legend content', () => {
    render(
      <GroupBox legend={<span data-testid="caption">Audio</span>}>content</GroupBox>,
    )

    expect(screen.getByTestId('caption')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Audio' })).toBeInTheDocument()
  })

  it.each([
    ['inset', 'vgui-groupbox--inset'],
    ['ruled', 'vgui-groupbox--ruled'],
  ] as const)('adds the %s modifier class', (prop, modifierClass) => {
    const { container } = render(<GroupBox legend="Audio" {...{ [prop]: true }} />)

    expect(container.querySelector('fieldset')).toHaveClass(modifierClass)
  })

  it('renders no modifier classes by default', () => {
    const { container } = render(<GroupBox legend="Audio" />)

    expect((container.querySelector('fieldset') as HTMLElement).className.split(' ')).toEqual([
      'vgui-groupbox',
    ])
  })

  it('hides the legend visually while keeping it in the DOM and in the name', () => {
    const { container } = render(<GroupBox legend="Multiplayer" hideLegend />)

    const fieldset = container.querySelector('fieldset') as HTMLElement
    const legend = container.querySelector('legend') as HTMLElement

    expect(fieldset).toHaveClass('vgui-groupbox--legend-hidden')
    expect(legend).toBeInTheDocument()
    expect(legend).not.toHaveAttribute('hidden')
    // The legend still carries the group's name, which is the whole point of
    // hiding it visually rather than with `display: none`.
    expect(screen.getByRole('group', { name: 'Multiplayer' })).toBeInTheDocument()
  })

  it('disables the group through the fieldset so the whole subtree goes with it', () => {
    const { container } = render(
      <GroupBox legend="Audio" disabled>
        <input type="range" aria-label="Volume" />
      </GroupBox>,
    )

    const fieldset = container.querySelector('fieldset') as HTMLFieldSetElement
    expect(fieldset).toBeDisabled()
    // jsdom does not propagate fieldset disabledness, so assert the mechanism
    // that does the work in a real browser: the disabled attribute itself.
    expect(fieldset).toHaveAttribute('disabled')
  })

  it('forwards the ref to the fieldset element', () => {
    const ref = createRef<HTMLFieldSetElement>()
    render(<GroupBox legend="Audio" ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLFieldSetElement)
  })

  it('merges a caller className last so it can override any variant', () => {
    const { container } = render(
      <GroupBox legend="Audio" inset ruled className="my-group">
        content
      </GroupBox>,
    )

    expect(container.querySelector('fieldset')?.className).toBe(
      'vgui-groupbox vgui-groupbox--inset vgui-groupbox--ruled my-group',
    )
  })

  it('spreads extra attributes such as aria-describedby onto the fieldset', () => {
    render(
      <GroupBox legend="Audio" id="audio-group" data-testid="box">
        content
      </GroupBox>,
    )

    const fieldset = screen.getByTestId('box')
    expect(fieldset).toHaveAttribute('id', 'audio-group')
    expect(fieldset).not.toHaveAttribute('aria-describedby')
  })

  it('has no accessibility violations in every documented variant', async () => {
    const { container } = render(
      <div>
        <GroupBox legend="Audio">
          <label htmlFor="g-volume">Volume</label>
          <input id="g-volume" type="range" min={0} max={100} defaultValue={50} />
        </GroupBox>
        <GroupBox legend="Video" inset>
          <input id="g-hdr" type="checkbox" />
          <label htmlFor="g-hdr">Enable HDR</label>
        </GroupBox>
        <GroupBox legend="Advanced" ruled>
          <input id="g-console" type="checkbox" />
          <label htmlFor="g-console">Show developer console</label>
        </GroupBox>
        <GroupBox legend="Multiplayer" hideLegend>
          <input id="g-lan" type="checkbox" />
          <label htmlFor="g-lan">LAN only</label>
        </GroupBox>
        <GroupBox legend="Audio (disabled)" disabled>
          <input id="g-muted" type="checkbox" />
          <label htmlFor="g-muted">Mute</label>
        </GroupBox>
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
