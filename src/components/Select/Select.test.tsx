import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Select } from './Select'
import type { SelectOption } from './Select'

const options: SelectOption[] = [
  { value: '800x600', label: '800 × 600' },
  { value: '1024x768', label: '1024 × 768' },
  { value: '1280x960', label: '1280 × 960' },
  { value: 'widescreen', label: 'Widescreen', disabled: true },
  { value: '1600x1200', label: '1600 × 1200' },
]

const letters: SelectOption[] = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
  { value: 'closed', label: 'Closed' },
  { value: 'delta', label: 'Delta' },
]

const trigger = () => screen.getByRole('combobox')
const list = () => screen.getByRole('listbox')
const rows = () => within(list()).getAllByRole('option')

describe('Select', () => {
  it('renders the trigger as a closed combobox button', () => {
    render(<Select options={options} aria-label="Resolution" />)

    expect(trigger().tagName).toBe('BUTTON')
    expect(trigger()).toHaveAttribute('type', 'button')
    expect(trigger()).toHaveAttribute('aria-haspopup', 'listbox')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(trigger()).toHaveAccessibleName('Resolution')
  })

  it('unmounts the list while closed rather than hiding it', () => {
    render(<Select options={options} aria-label="Resolution" />)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger()).not.toHaveAttribute('aria-controls')
  })

  it('shows the selected option label', () => {
    render(<Select options={options} defaultValue="1024x768" aria-label="Resolution" />)

    expect(trigger()).toHaveTextContent('1024 × 768')
    expect(trigger().querySelector('.vgui-select__value')).not.toHaveAttribute('data-placeholder')
  })

  it('shows the placeholder as dim text when nothing is selected', () => {
    render(<Select options={options} placeholder="Choose a resolution" aria-label="Resolution" />)

    expect(trigger()).toHaveTextContent('Choose a resolution')
    expect(trigger().querySelector('.vgui-select__value')).toHaveAttribute('data-placeholder', 'true')
  })

  it('opens the listbox on click', async () => {
    const user = userEvent.setup()
    render(<Select options={options} defaultValue="1024x768" aria-label="Resolution" />)

    await user.click(trigger())

    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(trigger()).toHaveAttribute('aria-controls', list().id)
    expect(list()).toHaveAttribute('role', 'listbox')
    expect(list()).toHaveAccessibleName('Resolution')
    expect(rows()).toHaveLength(5)
    expect(rows()[1]).toHaveAttribute('aria-selected', 'true')
    expect(rows()[0]).toHaveAttribute('aria-selected', 'false')
  })

  it('marks the option the keyboard would land on when it opens', async () => {
    const user = userEvent.setup()
    render(<Select options={options} defaultValue="1280x960" aria-label="Resolution" />)

    await user.click(trigger())

    expect(rows()[2]).toHaveAttribute('data-active', 'true')
    expect(trigger()).toHaveAttribute('aria-activedescendant', rows()[2].id)
  })

  it('commits the clicked option and closes', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Select options={options} defaultValue="800x600" onValueChange={onValueChange} aria-label="Resolution" />)

    await user.click(trigger())
    await user.click(screen.getByRole('option', { name: '1280 × 960' }))

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith('1280x960')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(trigger()).toHaveTextContent('1280 × 960')
  })

  it('does not call onValueChange when the current option is chosen again', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Select options={options} defaultValue="1024x768" onValueChange={onValueChange} aria-label="Resolution" />)

    await user.click(trigger())
    await user.click(screen.getByRole('option', { name: '1024 × 768' }))

    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('is controlled by value', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Select options={options} value="800x600" onValueChange={onValueChange} aria-label="Resolution" />)

    await user.click(trigger())
    await user.click(screen.getByRole('option', { name: '1600 × 1200' }))

    expect(onValueChange).toHaveBeenCalledWith('1600x1200')
    expect(trigger()).toHaveTextContent('800 × 600')
  })

  it('follows the value prop when it changes', () => {
    const { rerender } = render(<Select options={options} value="800x600" aria-label="Resolution" />)

    rerender(<Select options={options} value="1280x960" aria-label="Resolution" />)

    expect(trigger()).toHaveTextContent('1280 × 960')
  })

  it('opens with Enter, Space and Alt+ArrowDown', async () => {
    const user = userEvent.setup()
    const keys = ['{Enter}', '[Space]', '{Alt>}{ArrowDown}{/Alt}']

    for (const key of keys) {
      const { unmount } = render(<Select options={options} aria-label="Resolution" />)
      await user.tab()
      expect(trigger()).toHaveFocus()

      await user.keyboard(key)

      expect(trigger()).toHaveAttribute('aria-expanded', 'true')
      unmount()
    }
  })

  it('closes with Escape and keeps focus on the trigger', async () => {
    const user = userEvent.setup()
    render(<Select options={options} defaultValue="1024x768" aria-label="Resolution" />)

    await user.click(trigger())
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger()).toHaveFocus()
  })

  it('moves the active option with the arrow keys and commits with Enter', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Select options={options} defaultValue="1024x768" onValueChange={onValueChange} aria-label="Resolution" />)

    await user.click(trigger())
    await user.keyboard('{ArrowDown}')

    expect(onValueChange).not.toHaveBeenCalled()
    expect(rows()[2]).toHaveAttribute('data-active', 'true')
    expect(trigger()).toHaveAttribute('aria-activedescendant', rows()[2].id)

    await user.keyboard('{Enter}')

    expect(onValueChange).toHaveBeenCalledWith('1280x960')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('skips disabled options when moving', async () => {
    const user = userEvent.setup()
    render(<Select options={options} defaultValue="1280x960" aria-label="Resolution" />)

    await user.click(trigger())
    await user.keyboard('{ArrowDown}')

    expect(rows()[3]).toHaveAttribute('aria-disabled', 'true')
    expect(rows()[4]).toHaveAttribute('data-active', 'true')

    await user.keyboard('{ArrowUp}')

    expect(rows()[2]).toHaveAttribute('data-active', 'true')
  })

  it('wraps around when moving past the ends', async () => {
    const user = userEvent.setup()
    render(<Select options={options} defaultValue="800x600" aria-label="Resolution" />)

    await user.click(trigger())
    await user.keyboard('{ArrowUp}')

    expect(rows()[4]).toHaveAttribute('data-active', 'true')
  })

  it('jumps to the first and last enabled option with Home and End', async () => {
    const user = userEvent.setup()
    render(<Select options={options} defaultValue="1280x960" aria-label="Resolution" />)

    await user.click(trigger())
    await user.keyboard('{End}')
    expect(rows()[4]).toHaveAttribute('data-active', 'true')

    await user.keyboard('{Home}')
    expect(rows()[0]).toHaveAttribute('data-active', 'true')
  })

  it('does not commit a disabled option', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Select options={options} defaultValue="1024x768" onValueChange={onValueChange} aria-label="Resolution" />)

    await user.click(trigger())
    await user.click(screen.getByRole('option', { name: 'Widescreen' }))

    expect(onValueChange).not.toHaveBeenCalled()
    expect(list()).toBeInTheDocument()
  })

  it('closes the list when tabbing away', async () => {
    const user = userEvent.setup()
    render(<Select options={options} defaultValue="1024x768" aria-label="Resolution" />)

    await user.click(trigger())
    await user.keyboard('{Tab}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('type-ahead chooses an option from a closed list', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Select options={letters} onValueChange={onValueChange} aria-label="Letter" />)

    await user.tab()
    await user.keyboard('d')

    expect(onValueChange).toHaveBeenCalledWith('delta')
    expect(trigger()).toHaveTextContent('Delta')
  })

  it('type-ahead only moves the active option while the list is open', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Select options={letters} onValueChange={onValueChange} aria-label="Letter" />)

    await user.click(trigger())
    await user.keyboard('c')

    expect(onValueChange).not.toHaveBeenCalled()
    expect(rows()[2]).toHaveAttribute('data-active', 'true')
    expect(trigger()).toHaveAttribute('aria-activedescendant', rows()[2].id)
  })

  it('gives every option an id so aria-activedescendant can resolve', async () => {
    const user = userEvent.setup()
    render(<Select options={options} aria-label="Resolution" />)

    await user.click(trigger())

    const ids = rows().map((row) => row.id)
    expect(ids.every((id) => id.length > 0)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps the ids of two selects on the page apart', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Select options={options} aria-label="First" />
        <Select options={options} aria-label="Second" />
      </div>,
    )

    await user.click(screen.getByRole('combobox', { name: 'First' }))
    await user.click(screen.getByRole('combobox', { name: 'Second' }))

    const lists = screen.getAllByRole('listbox')
    expect(lists).toHaveLength(2)
    expect(lists[0].id).not.toBe(lists[1].id)
    expect(screen.getByRole('combobox', { name: 'First' })).toHaveAttribute('aria-controls', lists[0].id)
    expect(screen.getByRole('combobox', { name: 'Second' })).toHaveAttribute('aria-controls', lists[1].id)
  })

  it('disables the whole control when disabled', async () => {
    const user = userEvent.setup()
    const { container } = render(<Select options={options} defaultValue="1024x768" disabled aria-label="Resolution" />)

    expect(trigger()).toBeDisabled()
    expect(container.firstElementChild).toHaveClass('vgui-select', 'vgui-select--disabled')

    await user.click(trigger())

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('adds the size and invalid variant classes', () => {
    const { container, unmount } = render(<Select options={options} size="small" invalid aria-label="Resolution" />)

    expect(container.firstElementChild).toHaveClass('vgui-select--small', 'vgui-select--invalid')
    unmount()

    const second = render(<Select options={options} size="large" aria-label="Resolution" />)

    expect(second.container.firstElementChild).toHaveClass('vgui-select--large')
  })

  it('threads a caller className through', () => {
    const { container } = render(<Select options={options} className="vgui-select--clay mine" aria-label="Resolution" />)

    expect(container.firstElementChild).toHaveClass('vgui-select', 'vgui-select--clay', 'mine')
  })

  it('spreads the remaining attributes onto the wrapper', () => {
    const { container } = render(<Select options={options} data-testid="picker" aria-label="Resolution" />)

    expect(container.firstElementChild).toHaveAttribute('data-testid', 'picker')
  })

  it('renders a hidden input for form submission when name is given', async () => {
    const user = userEvent.setup()
    const { container } = render(<Select options={options} defaultValue="800x600" name="resolution" aria-label="Resolution" />)

    const hidden = container.querySelector<HTMLInputElement>('input[type="hidden"]')
    expect(hidden).toHaveAttribute('name', 'resolution')
    expect(hidden).toHaveValue('800x600')

    await user.click(trigger())
    await user.click(screen.getByRole('option', { name: '1600 × 1200' }))

    expect(container.querySelector<HTMLInputElement>('input[type="hidden"]')).toHaveValue('1600x1200')
  })

  it('renders no hidden input without a name', () => {
    const { container } = render(<Select options={options} aria-label="Resolution" />)

    expect(container.querySelector('input[type="hidden"]')).toBeNull()
  })

  it('puts the id on the trigger so a visible label names it', () => {
    render(
      <>
        <label htmlFor="resolution">Resolution</label>
        <Select options={options} id="resolution" />
      </>,
    )

    expect(trigger()).toHaveAttribute('id', 'resolution')
    expect(trigger()).toHaveAccessibleName('Resolution')
  })

  it('names the trigger from aria-labelledby', () => {
    render(
      <>
        <span id="resolution-label">Resolution</span>
        <Select options={options} aria-labelledby="resolution-label" />
      </>,
    )

    expect(trigger()).toHaveAccessibleName('Resolution')
  })

  it('forwards the ref to the wrapper element', () => {
    const ref = createRef<HTMLDivElement>()
    const { container } = render(<Select ref={ref} options={options} aria-label="Resolution" />)

    expect(ref.current).toBe(container.firstElementChild)
    expect(ref.current).toHaveClass('vgui-select')
  })

  describe('editable', () => {
    it('renders a text input as the combobox', () => {
      render(<Select options={letters} defaultValue="alpha" editable aria-label="Letter" />)

      expect(trigger().tagName).toBe('INPUT')
      expect(trigger()).toHaveAttribute('type', 'text')
      expect(trigger()).toHaveAttribute('aria-autocomplete', 'list')
      expect(trigger()).toHaveAttribute('aria-expanded', 'false')
      expect(trigger()).toHaveValue('Alpha')
    })

    it('reports every keystroke and opens the list', async () => {
      const user = userEvent.setup()
      const onInputChange = vi.fn()
      const onValueChange = vi.fn()
      render(
        <Select
          options={letters}
          defaultValue=""
          editable
          onInputChange={onInputChange}
          onValueChange={onValueChange}
          aria-label="Letter"
        />,
      )

      await user.click(trigger())
      await user.keyboard('be')

      expect(onInputChange).toHaveBeenNthCalledWith(1, 'b')
      expect(onInputChange).toHaveBeenNthCalledWith(2, 'be')
      expect(trigger()).toHaveValue('be')
      expect(trigger()).toHaveAttribute('aria-expanded', 'true')
      expect(onValueChange).not.toHaveBeenCalled()
    })

    it('commits the typed text when there is nothing to match', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(
        <Select
          options={[]}
          defaultValue=""
          editable
          placeholder="27015"
          onValueChange={onValueChange}
          aria-label="Server port"
        />,
      )

      expect(trigger()).toHaveAttribute('placeholder', '27015')

      await user.type(trigger(), '27016')
      await user.keyboard('{Enter}')

      expect(onValueChange).toHaveBeenCalledWith('27016')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('resolves typed text that names an option back to its value', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(
        <Select options={letters} defaultValue="" editable onValueChange={onValueChange} aria-label="Letter" />,
      )

      await user.type(trigger(), 'Delta')
      await user.tab()

      expect(onValueChange).toHaveBeenCalledTimes(1)
      expect(onValueChange).toHaveBeenCalledWith('delta')
    })

    it('commits the draft on blur', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(
        <Select options={[]} defaultValue="" editable onValueChange={onValueChange} aria-label="Server port" />,
      )

      await user.type(trigger(), 'abc')
      await user.tab()

      expect(onValueChange).toHaveBeenCalledWith('abc')
    })

    it('opens from the caret button without stealing focus', async () => {
      const user = userEvent.setup()
      const { container } = render(<Select options={letters} defaultValue="alpha" editable aria-label="Letter" />)

      const caret = container.querySelector<HTMLButtonElement>('.vgui-select__button')
      expect(caret).not.toBeNull()

      await user.click(trigger())
      expect(trigger()).toHaveFocus()

      await user.click(caret as HTMLButtonElement)

      expect(trigger()).toHaveAttribute('aria-expanded', 'true')
      expect(trigger()).toHaveFocus()
    })

    it('commits the active option with Enter', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<Select options={letters} defaultValue="alpha" editable onValueChange={onValueChange} aria-label="Letter" />)

      await user.click(trigger())
      await user.keyboard('{ArrowDown}')
      expect(trigger()).toHaveAttribute('aria-expanded', 'true')
      expect(trigger()).toHaveAttribute('aria-activedescendant', rows()[0].id)

      await user.keyboard('{ArrowDown}')
      expect(trigger()).toHaveAttribute('aria-activedescendant', rows()[1].id)

      await user.keyboard('{Enter}')

      expect(onValueChange).toHaveBeenCalledWith('beta')
      expect(trigger()).toHaveValue('Beta')
    })

    it('Escape closes the list and a second Escape reverts the draft', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<Select options={letters} defaultValue="alpha" editable onValueChange={onValueChange} aria-label="Letter" />)

      await user.click(trigger())
      await user.keyboard('zz')
      expect(trigger()).toHaveAttribute('aria-expanded', 'true')

      await user.keyboard('{Escape}')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

      await user.keyboard('{Escape}')

      expect(trigger()).toHaveValue('Alpha')
      expect(onValueChange).not.toHaveBeenCalled()
    })

    it('disables the input and the caret when disabled', () => {
      const { container } = render(<Select options={letters} defaultValue="alpha" editable disabled aria-label="Letter" />)

      expect(trigger()).toBeDisabled()
      expect(container.querySelector('.vgui-select__button')).toBeDisabled()
    })
  })

  it('has no accessibility violations', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <div>
        <Select options={options} defaultValue="1024x768" aria-label="Closed" />
        <Select options={options} placeholder="Choose one" aria-label="Empty" />
        <Select options={options} defaultValue="1024x768" invalid aria-label="Invalid" />
        <Select options={options} defaultValue="1024x768" disabled aria-label="Disabled" />
        <Select options={letters} defaultValue="alpha" editable aria-label="Editable" />
      </div>,
    )

    await user.click(screen.getByRole('combobox', { name: 'Closed' }))

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
