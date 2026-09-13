import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Toolbar } from './Toolbar'
import type { ToolbarItem } from './Toolbar'

const makeItems = (): ToolbarItem[] => [
  { id: 'back', label: 'Back', icon: 'icon_button_back', disabled: true },
  { id: 'forward', label: 'Forward', icon: 'icon_button_forward' },
  { id: 'home', label: 'Home', icon: 'icon_button_home' },
  { id: 'reload', label: 'Reload', icon: 'icon_button_reload' },
  { id: 'stop', label: 'Stop', icon: 'icon_button_stop', disabled: true },
]

const button = (name: string) => screen.getByRole('button', { name })

const focusButton = (name: string) => {
  act(() => {
    button(name).focus()
  })
}

describe('Toolbar', () => {
  it('renders a named toolbar landmark with the scoped classes, threading className and ref', () => {
    const ref = createRef<HTMLDivElement>()

    render(<Toolbar ref={ref} label="Browser" items={makeItems()} className="extra" title="Chrome" />)

    const toolbar = screen.getByRole('toolbar', { name: 'Browser' })

    expect(toolbar).toHaveClass('vgui-toolbar', 'vgui-toolbar--bare', 'extra')
    expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal')
    // `...rest` is spread onto the root element.
    expect(toolbar).toHaveAttribute('title', 'Chrome')
    expect(ref.current).toBe(toolbar)
  })

  it('renders one labelled button per item, with the glyph class derived from the icon name', () => {
    render(<Toolbar label="Browser" items={makeItems()} />)

    expect(screen.getAllByRole('button')).toHaveLength(5)
    expect(button('Back')).toHaveClass('vgui-toolbar__button--back')
    expect(button('Forward')).toHaveClass('vgui-toolbar__button--forward')
    expect(button('Home')).toHaveClass('vgui-toolbar__button--home')
    expect(button('Reload')).toHaveClass('vgui-toolbar__button--reload')
    expect(button('Stop')).toHaveClass('vgui-toolbar__button--stop')
    expect(button('Back')).toHaveAttribute('data-icon', 'icon_button_back')
    // The glyph *is* the button: no text content, the sprite is a background.
    expect(button('Home')).toBeEmptyDOMElement()
  })

  it('renders the chromeless variant by default and the bevelled one when raised', () => {
    render(<Toolbar raised label="Viewer" items={makeItems()} />)

    const toolbar = screen.getByRole('toolbar', { name: 'Viewer' })

    expect(toolbar).toHaveClass('vgui-toolbar--raised')
    expect(toolbar).not.toHaveClass('vgui-toolbar--bare')
  })

  it('renders text items in the footer variant with visible text instead of a sprite', () => {
    render(
      <Toolbar
        footer
        label="Server browser"
        items={[{ id: 'add', label: 'Add server', icon: 'icon_button_home', text: 'Add Server' }]}
      />,
    )

    const toolbar = screen.getByRole('toolbar', { name: 'Server browser' })
    const add = button('Add Server')

    expect(toolbar).toHaveClass('vgui-toolbar--footer')
    expect(add).toHaveClass('vgui-toolbar__button--text')
    expect(add).not.toHaveClass('vgui-toolbar__button--home')
    expect(add).toHaveTextContent('Add Server')
    // Named by its own visible text, so no `aria-label` that could diverge.
    expect(add).not.toHaveAttribute('aria-label')
  })

  it('announces only toggles through aria-pressed', () => {
    render(
      <Toolbar
        label="Viewer"
        items={[
          { id: 'mute', label: 'Mute', icon: 'icon_controller_bpm', pressed: true },
          { id: 'zoom', label: 'Zoom in', icon: 'icon_controller_bpm' },
        ]}
      />,
    )

    expect(button('Mute')).toHaveAttribute('aria-pressed', 'true')
    expect(button('Zoom in')).not.toHaveAttribute('aria-pressed')
    expect(button('Mute')).toHaveClass('vgui-toolbar__button--controller-bpm')
  })

  it('calls onClick on activation and reflects a controlled pressed state', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()

    function Harness() {
      const [pressed, setPressed] = useState(false)

      return (
        <Toolbar
          raised
          label="Viewer"
          items={[
            {
              id: 'back',
              label: 'Back',
              icon: 'icon_button_back',
              onClick: onBack,
            },
            {
              id: 'fullscreen',
              label: 'Fullscreen',
              icon: 'icon_controller_bpm',
              pressed,
              onClick: () => setPressed((value) => !value),
            },
          ]}
        />
      )
    }

    render(<Harness />)

    await user.click(button('Back'))
    expect(onBack).toHaveBeenCalledTimes(1)

    expect(button('Fullscreen')).toHaveAttribute('aria-pressed', 'false')
    await user.click(button('Fullscreen'))
    expect(button('Fullscreen')).toHaveAttribute('aria-pressed', 'true')
  })

  it('never activates a disabled item', async () => {
    const user = userEvent.setup()
    const onStop = vi.fn()

    render(
      <Toolbar
        label="Browser"
        items={[{ id: 'stop', label: 'Stop', icon: 'icon_button_stop', disabled: true, onClick: onStop }]}
      />,
    )

    const stop = button('Stop')

    expect(stop).toBeDisabled()
    expect(stop).toHaveAttribute('tabindex', '-1')

    await user.click(stop)
    expect(onStop).not.toHaveBeenCalled()
  })

  it('is a single tab stop with a roving tabindex that starts at the first enabled button', async () => {
    const user = userEvent.setup()

    render(<Toolbar label="Browser" items={makeItems()} />)

    const buttons = screen.getAllByRole('button')

    expect(buttons.filter((node) => node.getAttribute('tabindex') === '0')).toHaveLength(1)
    expect(button('Forward')).toHaveAttribute('tabindex', '0')
    // Disabled buttons are not tab stops either.
    expect(button('Back')).toHaveAttribute('tabindex', '-1')

    await user.tab()
    expect(button('Forward')).toHaveFocus()
  })

  it('moves focus with Arrow Left/Right, wrapping and skipping disabled buttons', async () => {
    const user = userEvent.setup()

    render(<Toolbar label="Browser" items={makeItems()} />)

    // Focus is already on the first enabled button, so the toolbar's own
    // handler is what is under test here.
    focusButton('Forward')
    expect(button('Forward')).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(button('Home')).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(button('Reload')).toHaveFocus()

    // The next two are disabled, so focus wraps round to Forward.
    await user.keyboard('{ArrowRight}')
    expect(button('Forward')).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    expect(button('Reload')).toHaveFocus()
  })

  it('jumps to the ends with Home and End', async () => {
    const user = userEvent.setup()

    render(<Toolbar label="Browser" items={makeItems()} />)

    focusButton('Home')

    await user.keyboard('{End}')
    expect(button('Reload')).toHaveFocus()

    await user.keyboard('{Home}')
    expect(button('Forward')).toHaveFocus()
  })

  it('leaves other keys to the caller', async () => {
    const user = userEvent.setup()
    const onKeyDown = vi.fn()

    render(<Toolbar label="Browser" items={makeItems()} onKeyDown={onKeyDown} />)

    focusButton('Forward')
    await user.keyboard('{ArrowRight}')
    await user.keyboard('a')

    expect(onKeyDown).toHaveBeenCalledTimes(2)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Toolbar label="Browser" items={makeItems()} />
        <Toolbar
          raised
          footer
          label="Viewer"
          items={[
            { id: 'mute', label: 'Mute', icon: 'icon_controller_bpm', pressed: true },
            { id: 'add', label: 'Add server', icon: 'icon_button_home', text: 'Add Server' },
          ]}
        />
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
