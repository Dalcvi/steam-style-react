import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { ColorPicker } from './ColorPicker'

const palette = [
  { name: 'GreenBG', value: '#4C5844' },
  { name: 'LightGreenBG', value: '#5A6A50' },
  { name: 'DarkGreenBG', value: '#3E4637' },
  { name: 'MaizeBG', value: '#91863C' },
]

const trigger = () => screen.getByRole('button', { name: 'Team colour' })

describe('ColorPicker', () => {
  it('renders a closed trigger with the value and the palette arrow', () => {
    const { container } = render(<ColorPicker aria-label="Team colour" value="#5A6A50" />)

    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('#5A6A50')).toHaveClass('vgui-color-picker__label')
    expect(container.querySelector('.vgui-color-picker__arrow')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('shows the swatch fill through the --vgui-swatch custom property', () => {
    const { container } = render(<ColorPicker aria-label="Team colour" value="#91863C" />)

    expect(container.querySelector('.vgui-color-picker__swatch')?.getAttribute('style')).toContain('--vgui-swatch: #91863C')
  })

  it('opens a listbox of named options when the trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<ColorPicker aria-label="Team colour" palette={palette} columns={2} />)

    await user.click(trigger())

    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByRole('option').map((option) => option.getAttribute('aria-label'))).toEqual([
      'GreenBG',
      'LightGreenBG',
      'DarkGreenBG',
      'MaizeBG',
    ])
    expect(screen.getByRole('option', { name: 'GreenBG' })).toHaveAttribute('aria-selected', 'true')
  })

  it('announces the whole palette through its own label, not through colour', async () => {
    const user = userEvent.setup()
    render(<ColorPicker aria-label="Team colour" />)

    await user.click(trigger())

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(36)
    expect(options.every((option) => (option.getAttribute('aria-label') ?? '').length > 0)).toBe(true)
    expect(screen.getByRole('listbox', { name: 'Colour palette' })).toBeInTheDocument()
  })

  it('commits the clicked swatch and closes the panel', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker aria-label="Team colour" palette={palette} columns={2} onValueChange={onValueChange} />)

    await user.click(trigger())
    await user.click(screen.getByRole('option', { name: 'MaizeBG' }))

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith('#91863C')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger()).toHaveFocus()
  })

  it('does not fire onValueChange when the same swatch is chosen again', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker aria-label="Team colour" palette={palette} columns={2} onValueChange={onValueChange} />)

    await user.click(trigger())
    await user.click(screen.getByRole('option', { name: 'GreenBG' }))

    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('only commits a swatch once, never continuously', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker aria-label="Team colour" palette={palette} columns={2} onValueChange={onValueChange} />)

    await user.click(trigger())
    await user.hover(screen.getByRole('option', { name: 'DarkGreenBG' }))
    await user.click(screen.getByRole('option', { name: 'DarkGreenBG' }))

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith('#3E4637')
  })

  it('moves the active option with the arrow keys and Home/End', async () => {
    const user = userEvent.setup()
    render(<ColorPicker aria-label="Team colour" palette={palette} columns={2} />)

    await user.click(trigger())
    const listbox = screen.getByRole('listbox')
    const optionId = (name: string) => screen.getByRole('option', { name }).id

    expect(listbox).toHaveAttribute('aria-activedescendant', optionId('GreenBG'))

    await user.keyboard('{ArrowRight}')
    expect(listbox).toHaveAttribute('aria-activedescendant', optionId('LightGreenBG'))

    await user.keyboard('{ArrowDown}')
    expect(listbox).toHaveAttribute('aria-activedescendant', optionId('MaizeBG'))

    await user.keyboard('{ArrowUp}')
    expect(listbox).toHaveAttribute('aria-activedescendant', optionId('LightGreenBG'))

    await user.keyboard('{ArrowLeft}')
    expect(listbox).toHaveAttribute('aria-activedescendant', optionId('GreenBG'))

    await user.keyboard('{End}')
    expect(listbox).toHaveAttribute('aria-activedescendant', optionId('MaizeBG'))

    await user.keyboard('{Home}')
    expect(listbox).toHaveAttribute('aria-activedescendant', optionId('GreenBG'))
  })

  it('clamps the active option at both ends of the palette', async () => {
    const user = userEvent.setup()
    render(<ColorPicker aria-label="Team colour" palette={palette} columns={2} />)

    await user.click(trigger())
    await user.keyboard('{ArrowLeft}')

    const listbox = screen.getByRole('listbox')
    expect(listbox).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'GreenBG' }).id)

    await user.keyboard('{End}{ArrowRight}')
    expect(listbox).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'MaizeBG' }).id)
  })

  it('commits the active option with Enter and with Space', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker aria-label="Team colour" palette={palette} columns={2} onValueChange={onValueChange} />)

    await user.click(trigger())
    await user.keyboard('{ArrowRight}{Enter}')

    expect(onValueChange).toHaveBeenCalledWith('#5A6A50')

    onValueChange.mockClear()
    await user.click(trigger())
    await user.keyboard('{ArrowRight}')
    fireEvent.keyDown(screen.getByRole('listbox'), { key: ' ' })

    expect(onValueChange).toHaveBeenCalledWith('#3E4637')
  })

  it('opens in place when the palette is asked for through the keyboard', async () => {
    const user = userEvent.setup()
    render(<ColorPicker aria-label="Team colour" palette={palette} columns={2} />)

    trigger().focus()
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('listbox')).toHaveFocus()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<ColorPicker aria-label="Team colour" palette={palette} columns={2} />)

    await user.click(trigger())
    expect(screen.getByRole('listbox')).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger()).toHaveFocus()
  })

  it('closes on Tab without trapping focus in the panel', async () => {
    const user = userEvent.setup()
    render(<ColorPicker aria-label="Team colour" palette={palette} columns={2} />)

    await user.click(trigger())
    await user.keyboard('{Tab}')

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('toggles the panel shut from the trigger', async () => {
    const user = userEvent.setup()
    render(<ColorPicker aria-label="Team colour" palette={palette} columns={2} />)

    await user.click(trigger())
    await user.click(trigger())

    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('hides the hex label in swatchOnly but keeps the accessible name', () => {
    const { container } = render(<ColorPicker aria-label="Team colour" swatchOnly value="#4C5844" />)

    expect(container.firstElementChild).toHaveClass('vgui-color-picker', 'vgui-color-picker--swatch-only')
    expect(screen.queryByText('#4C5844')).toBeNull()
    expect(trigger()).toHaveAccessibleName('Team colour')
  })

  it('renders the grid inline with no trigger and no panel', () => {
    const { container } = render(<ColorPicker aria-label="Team colour" palette={palette} inline />)

    expect(container.firstElementChild).toHaveClass('vgui-color-picker--inline')
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getAllByRole('option')).toHaveLength(4)
  })

  it('keeps an inline grid open after a swatch is chosen', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker aria-label="Team colour" palette={palette} columns={2} inline onValueChange={onValueChange} />)

    await user.click(screen.getByRole('option', { name: 'DarkGreenBG' }))

    expect(onValueChange).toHaveBeenCalledWith('#3E4637')
    expect(screen.getAllByRole('option')).toHaveLength(4)
  })

  it('mirrors the palette width into the --vgui-color-picker-columns property', () => {
    const { container } = render(<ColorPicker aria-label="Team colour" columns={6} />)

    expect((container.firstElementChild as HTMLElement).style.getPropertyValue('--vgui-color-picker-columns')).toBe('6')
  })

  it('applies a caller style without losing the column count', () => {
    const { container } = render(<ColorPicker aria-label="Team colour" columns={6} style={{ width: 320 }} />)
    const root = container.firstElementChild as HTMLElement

    expect(root.style.width).toBe('320px')
    expect(root.style.getPropertyValue('--vgui-color-picker-columns')).toBe('6')
  })

  it('does not open the panel when disabled', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker aria-label="Team colour" palette={palette} disabled onValueChange={onValueChange} />)

    expect(trigger()).toBeDisabled()
    await user.click(trigger())

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('marks every swatch aria-disabled and inert when the inline grid is disabled', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker aria-label="Team colour" palette={palette} columns={2} inline disabled onValueChange={onValueChange} />)

    const options = screen.getAllByRole('option')
    expect(options.every((option) => option.getAttribute('aria-disabled') === 'true')).toBe(true)

    await user.click(options[1])

    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('stays on the controlled value while still reporting the change', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker aria-label="Team colour" palette={palette} columns={2} value="#4C5844" onValueChange={onValueChange} />)

    await user.click(trigger())
    await user.click(screen.getByRole('option', { name: 'MaizeBG' }))

    expect(onValueChange).toHaveBeenCalledWith('#91863C')
    expect(screen.getByText('#4C5844')).toBeInTheDocument()
  })

  it('follows the value it is driven with', () => {
    const { rerender } = render(<ColorPicker aria-label="Team colour" value="#4C5844" />)

    rerender(<ColorPicker aria-label="Team colour" value="#91863C" />)

    expect(screen.getByText('#91863C')).toBeInTheDocument()
  })

  it('commits a typed hex value on Enter', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker aria-label="Team colour" hex palette={palette} columns={2} onValueChange={onValueChange} />)

    await user.click(trigger())
    const field = screen.getByRole('textbox', { name: 'Hex colour' })
    await user.clear(field)
    await user.type(field, '#1a2b3c{Enter}')

    expect(onValueChange).toHaveBeenCalledWith('#1A2B3C')
    expect(screen.getByText('#1A2B3C')).toBeInTheDocument()
  })

  it('flags an invalid hex draft and refuses to commit it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker aria-label="Team colour" hex palette={palette} columns={2} onValueChange={onValueChange} />)

    await user.click(trigger())
    const field = screen.getByRole('textbox', { name: 'Hex colour' })
    await user.clear(field)
    await user.type(field, 'zzz')

    expect(field).toHaveAttribute('aria-invalid', 'true')

    await user.tab()

    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('reverts an invalid draft on Escape', async () => {
    const user = userEvent.setup()
    render(<ColorPicker aria-label="Team colour" hex value="#4C5844" />)

    await user.click(trigger())
    const field = screen.getByRole('textbox', { name: 'Hex colour' })
    await user.clear(field)
    await user.type(field, 'nope{Escape}')

    expect(field).toHaveValue('#4C5844')
  })

  it('commits an alpha change once, as #RRGGBBAA', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker aria-label="Team colour" alpha value="#4C5844" onValueChange={onValueChange} />)

    await user.click(trigger())
    fireEvent.change(screen.getByRole('slider', { name: 'Alpha' }), { target: { value: '128' } })

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith('#4C584480')
  })

  it('previews an alpha drag without committing it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker aria-label="Team colour" alpha value="#4C5844" onValueChange={onValueChange} />)

    await user.click(trigger())
    fireEvent.input(screen.getByRole('slider', { name: 'Alpha' }), { target: { value: '0' } })

    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByText('#4C584400')).toBeInTheDocument()
  })

  it('describes the alpha slider as a percentage', async () => {
    const user = userEvent.setup()
    render(<ColorPicker aria-label="Team colour" alpha value="#4C584480" />)

    await user.click(trigger())
    const slider = screen.getByRole('slider', { name: 'Alpha' })

    expect(slider).toHaveValue('128')
    expect(slider).toHaveAttribute('aria-valuetext', '50%')
  })

  it('carries the edited alpha across a palette pick', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker aria-label="Team colour" palette={palette} columns={2} alpha value="#4C584480" onValueChange={onValueChange} />)

    await user.click(trigger())
    await user.click(screen.getByRole('option', { name: 'MaizeBG' }))

    expect(onValueChange).toHaveBeenCalledWith('#91863C80')
  })

  it('exposes hue, saturation and brightness sliders for the continuous variant', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker aria-label="Team colour" continuous value="#4C5844" onValueChange={onValueChange} />)

    await user.click(trigger())
    fireEvent.change(screen.getByRole('slider', { name: 'Hue' }), { target: { value: '0' } })

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange.mock.calls[0][0]).toMatch(/^#[0-9A-F]{6}$/)

    fireEvent.change(screen.getByRole('slider', { name: 'Saturation' }), { target: { value: '100' } })
    fireEvent.change(screen.getByRole('slider', { name: 'Brightness' }), { target: { value: '0' } })

    expect(onValueChange).toHaveBeenCalledTimes(3)
    expect(onValueChange.mock.calls[2][0]).toBe('#000000')
  })

  it('hides the continuous square from assistive tech', async () => {
    const user = userEvent.setup()
    const { container } = render(<ColorPicker aria-label="Team colour" continuous />)

    await user.click(trigger())

    expect(container.querySelector('.vgui-color-picker__sv')).toHaveAttribute('aria-hidden', 'true')
  })

  it('merges a caller className last', () => {
    const { container } = render(<ColorPicker aria-label="Team colour" hex className="my-picker" />)

    expect(container.firstElementChild?.className).toBe('vgui-color-picker vgui-color-picker--hex my-picker')
  })

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    const { container } = render(<ColorPicker ref={ref} aria-label="Team colour" />)

    expect(ref.current).toBe(container.firstElementChild)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <ColorPicker aria-label="Team colour" />
        <ColorPicker aria-label="Tag colour" swatchOnly value="#91863C" />
        <ColorPicker aria-label="Status colour" palette={palette} columns={4} hex alpha />
        <ColorPicker aria-label="Read-only palette" palette={palette} columns={4} inline />
        <ColorPicker aria-label="Disabled palette" palette={palette} columns={4} inline disabled />
        <ColorPicker aria-label="Alpha colour" alpha value="#4C584480" />
        <ColorPicker aria-label="Disabled picker" disabled />
        <ColorPicker aria-label="Theme editor" palette={palette} columns={6} inline hex alpha continuous />
        <ColorPicker aria-label="Backup palette" swatchOnly inline palette={palette} columns={2} />
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
