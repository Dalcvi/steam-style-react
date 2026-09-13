import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Tabs } from './Tabs'
import type { TabSpec } from './Tabs'

const tabs: TabSpec[] = [
  { id: 'video', label: 'Video', content: 'Video page' },
  { id: 'audio', label: 'Audio', content: 'Audio page' },
  { id: 'keyboard', label: 'Keyboard', content: 'Keyboard page', disabled: true },
  { id: 'multiplayer', label: 'Multiplayer', content: 'Multiplayer page' },
]

const tab = (name: string) => screen.getByRole('tab', { name })

describe('Tabs', () => {
  it('renders a named tablist with one tab per spec', () => {
    render(<Tabs aria-label="Settings" tabs={tabs} />)

    expect(screen.getByRole('tablist', { name: 'Settings' })).toHaveClass('vgui-tabs__strip')
    expect(screen.getAllByRole('tab')).toHaveLength(4)
    expect(tab('Video')).toHaveClass('vgui-tabs__tab')
  })

  it('draws the shelf between the tablist and the panels', () => {
    const { container } = render(<Tabs tabs={tabs} />)

    const strip = screen.getByRole('tablist')
    const box = container.querySelector('.vgui-tabs__box')

    // The shelf is as wide as the sheet, not as wide as the tabs, so it is the
    // strip's sibling rather than one of its flex items.
    expect(box).not.toBeNull()
    expect(strip.nextElementSibling).toBe(box)
    expect(box?.nextElementSibling).toHaveClass('vgui-tabs__panel')
    // Decorative paint: no content, no role, no tab stop.
    expect(box).toBeEmptyDOMElement()
  })

  it('selects the first enabled tab and keeps the strip a single tab stop', () => {
    render(<Tabs tabs={tabs} defaultValue="keyboard" />)

    expect(tab('Video')).toHaveAttribute('aria-selected', 'true')
    expect(tab('Video')).toHaveAttribute('tabindex', '0')
    expect(tab('Audio')).toHaveAttribute('aria-selected', 'false')
    expect(tab('Audio')).toHaveAttribute('tabindex', '-1')
  })

  it('honours defaultValue', () => {
    render(<Tabs tabs={tabs} defaultValue="audio" />)

    expect(tab('Audio')).toHaveAttribute('aria-selected', 'true')
    expect(tab('Video')).toHaveAttribute('tabindex', '-1')
  })

  it('wires the tab/panel id triple and gives the panel a tab stop', () => {
    render(<Tabs tabs={tabs} />)

    const panel = screen.getByRole('tabpanel')
    expect(tab('Video')).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('aria-labelledby', tab('Video').id)
    expect(panel).toHaveAttribute('tabindex', '0')
    expect(panel).toHaveTextContent('Video page')
  })

  it('mounts every panel but exposes only the selected one', () => {
    const { container } = render(<Tabs tabs={tabs} />)

    expect(container.querySelectorAll('.vgui-tabs__panel')).toHaveLength(4)
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Video page')
  })

  it('selects on click and reports the new id', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Tabs tabs={tabs} onValueChange={onValueChange} />)

    await user.click(tab('Audio'))

    expect(onValueChange).toHaveBeenCalledWith('audio')
    expect(tab('Audio')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Audio page')
  })

  it('follows a controlled value and still reports changes', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Tabs tabs={tabs} value="audio" onValueChange={onValueChange} />)

    expect(tab('Audio')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Audio page')

    await user.click(tab('Video'))
    expect(onValueChange).toHaveBeenCalledWith('video')
    expect(tab('Audio')).toHaveAttribute('aria-selected', 'true')
  })

  it('moves selection with the arrow keys, wrapping and skipping disabled tabs', async () => {
    const user = userEvent.setup()
    render(<Tabs tabs={tabs} />)

    tab('Video').focus()
    await user.keyboard('{ArrowRight}')
    expect(tab('Audio')).toHaveAttribute('aria-selected', 'true')
    expect(document.activeElement).toBe(tab('Audio'))

    // Keyboard is disabled, so the next stop wraps past it.
    await user.keyboard('{ArrowRight}')
    expect(tab('Multiplayer')).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowRight}')
    expect(tab('Video')).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowLeft}')
    expect(tab('Multiplayer')).toHaveAttribute('aria-selected', 'true')
  })

  it('jumps to the ends with Home and End', async () => {
    const user = userEvent.setup()
    render(<Tabs tabs={tabs} />)

    tab('Audio').focus()
    await user.keyboard('{End}')
    expect(tab('Multiplayer')).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Home}')
    expect(tab('Video')).toHaveAttribute('aria-selected', 'true')
  })

  it('moves focus without selecting when activateOnFocus is false', async () => {
    const user = userEvent.setup()
    render(<Tabs tabs={tabs} activateOnFocus={false} />)

    tab('Video').focus()
    await user.keyboard('{ArrowRight}')

    expect(document.activeElement).toBe(tab('Audio'))
    expect(tab('Audio')).toHaveAttribute('aria-selected', 'false')
    expect(tab('Video')).toHaveAttribute('aria-selected', 'true')
    expect(tab('Video')).toHaveAttribute('tabindex', '0')
  })

  it('does not render lazy panel content until the tab is first selected', async () => {
    const user = userEvent.setup()
    render(<Tabs tabs={tabs.map((item) => ({ ...item, lazy: true }))} />)

    expect(screen.queryByText('Audio page')).not.toBeInTheDocument()

    await user.click(tab('Audio'))
    expect(screen.getByText('Audio page')).toBeInTheDocument()

    await user.click(tab('Video'))
    // Once visited the panel stays mounted, hidden rather than discarded.
    expect(screen.getByText('Audio page')).toBeInTheDocument()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Video page')
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
  })

  it('selects a disabled tab never', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Tabs tabs={tabs} onValueChange={onValueChange} />)

    const disabled = tab('Keyboard')
    expect(disabled).toBeDisabled()
    expect(disabled).toHaveAttribute('aria-disabled', 'true')

    await user.click(disabled)
    expect(onValueChange).not.toHaveBeenCalled()
    expect(disabled).toHaveAttribute('aria-selected', 'false')
  })

  it('reports a close request from the affordance and from Delete', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { container } = render(
      <Tabs tabs={[{ id: 'audio', label: 'Audio', content: 'Audio page', closable: true, onClose }]} />,
    )

    const close = container.querySelector('.vgui-tabs__close')
    expect(close).not.toBeNull()
    expect(close).toHaveAttribute('title', 'Close Audio tab')
    // Presentational children: the affordance must not be a tab stop of its own.
    expect(close).not.toHaveAttribute('tabindex')

    await user.click(close as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)

    tab('Audio').focus()
    await user.keyboard('{Delete}')
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(tab('Audio')).toHaveAttribute('aria-keyshortcuts', 'Delete')
  })

  it('adds the documented variant and closable modifier classes', () => {
    render(<Tabs tabs={tabs} variant="green" />)
    expect(screen.getByRole('tablist').parentElement).toHaveClass('vgui-tabs--green')
    expect(screen.getByRole('tabpanel')).toHaveClass('vgui-tabs__panel--green')
  })

  it('adds --clay by default and --closable when a tab is closable', () => {
    render(<Tabs tabs={tabs.map((item) => ({ ...item, closable: true }))} />)

    const root = screen.getByRole('tablist').parentElement
    expect(root).toHaveClass('vgui-tabs')
    expect(root).toHaveClass('vgui-tabs--clay')
    expect(root).toHaveClass('vgui-tabs--closable')
  })

  it('merges a caller className last and forwards the ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Tabs tabs={tabs} className="my-sheet" ref={ref} />)

    const root = screen.getByRole('tablist').parentElement
    const classes = root?.className.split(' ') ?? []
    expect(classes[classes.length - 1]).toBe('my-sheet')
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toHaveClass('vgui-tabs')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Tabs
        aria-label="Settings"
        tabs={tabs.map((item) => ({ ...item, closable: true, lazy: true, onClose: () => undefined }))}
      />,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
