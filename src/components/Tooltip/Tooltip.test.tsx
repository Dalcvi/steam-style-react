import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Tooltip } from './Tooltip'

describe('Tooltip', () => {
  // A test that fails mid-way must never leave fake timers installed: the next
  // test's `userEvent` would then await a timer that only the test can advance.
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders only the trigger until the tooltip is shown', () => {
    render(
      <Tooltip content="Reload the current page">
        <button type="button">Reload</button>
      </Tooltip>,
    )

    const trigger = screen.getByRole('button', { name: 'Reload' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    // A description pointing at a card that is not rendered would be dangling.
    expect(trigger).not.toHaveAttribute('aria-describedby')
  })

  it('shows immediately on keyboard focus, with no delay', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Reload the current page" delay={5000}>
        <button type="button">Reload</button>
      </Tooltip>,
    )

    await user.tab()

    const trigger = screen.getByRole('button', { name: 'Reload' })
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('Reload the current page')
    // The description is appended, never the name: the trigger keeps its own.
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id)
    expect(trigger).toHaveAccessibleName('Reload')
  })

  it('hides on blur', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Reload the current page">
        <button type="button">Reload</button>
      </Tooltip>,
    )

    await user.tab()
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    await user.tab()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('waits for the hover delay and cancels it on pointer leave', async () => {
    vi.useFakeTimers()
    try {
      render(
        <Tooltip content="Reload the current page" delay={600}>
          <button type="button">Reload</button>
        </Tooltip>,
      )

      const trigger = screen.getByRole('button', { name: 'Reload' })
      fireEvent.pointerOver(trigger)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(600)
      })
      expect(screen.getByRole('tooltip')).toBeInTheDocument()

      fireEvent.pointerOut(trigger)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('never delays a hover when the delay is zero', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Reload the current page" delay={0}>
        <button type="button">Reload</button>
      </Tooltip>,
    )

    await user.hover(screen.getByRole('button', { name: 'Reload' }))

    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('dismisses on Escape without moving focus, and stays dismissed until re-entry', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Reload the current page" delay={0}>
        <button type="button">Reload</button>
      </Tooltip>,
    )

    const trigger = screen.getByRole('button', { name: 'Reload' })
    await user.tab()
    expect(trigger).toHaveFocus()
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    // WCAG 1.4.13: dismissing must not move focus away from the trigger...
    expect(trigger).toHaveFocus()
    // ...and the content must not come straight back while it is still hovered.
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.unhover(trigger)
    await user.hover(trigger)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('shows again after focus moves away and back', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Reload the current page">
        <button type="button">Reload</button>
      </Tooltip>,
    )

    const trigger = screen.getByRole('button', { name: 'Reload' })
    await user.tab()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.tab({ shift: true })
    await user.tab()
    expect(trigger).toHaveFocus()
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('renders a headline above the body', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Tooltip headline="Achievements locked" content="Launch the game once.">
        <button type="button">Achievements</button>
      </Tooltip>,
    )

    await user.tab()

    expect(screen.getByRole('tooltip')).toHaveTextContent('Achievements locked')
    expect(container.querySelector('.vgui-tooltip__headline')).toHaveTextContent(
      'Achievements locked',
    )
    expect(container.querySelector('.vgui-tooltip__body')).toHaveTextContent(
      'Launch the game once.',
    )
  })

  it('omits the headline element when there is no headline', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Tooltip content="Reload the current page">
        <button type="button">Reload</button>
      </Tooltip>,
    )

    await user.tab()

    expect(container.querySelector('.vgui-tooltip__headline')).not.toBeInTheDocument()
  })

  it('renders content nodes, including the keyboard chip', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip
        content={
          <>
            Press <kbd className="vgui-tooltip__key">Shift</kbd> to run
          </>
        }
      >
        <button type="button">Run</button>
      </Tooltip>,
    )

    await user.tab()

    expect(screen.getByText('Shift')).toHaveClass('vgui-tooltip__key')
    expect(screen.getByRole('tooltip')).toHaveTextContent('Press Shift to run')
  })

  it('takes the documented default placement and compact modifier', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Opens in the in-game browser" compact>
        <button type="button">Browse</button>
      </Tooltip>,
    )

    await user.tab()

    expect(screen.getByRole('tooltip').className.split(' ').sort()).toEqual([
      'vgui-tooltip',
      'vgui-tooltip--compact',
      'vgui-tooltip--placement-top',
    ])
  })

  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'reflects placement="%s" in the card classes',
    async (placement) => {
      const user = userEvent.setup()
      render(
        <Tooltip content="Reload the current page" placement={placement}>
          <button type="button">Reload</button>
        </Tooltip>,
      )

      await user.tab()

      expect(screen.getByRole('tooltip')).toHaveClass(`vgui-tooltip--placement-${placement}`)
    },
  )

  it('keeps a trigger that already had aria-describedby described by both', async () => {
    const user = userEvent.setup()
    render(
      <>
        <span id="extra-hint">Reloading keeps your place</span>
        <Tooltip content="Reload the current page">
          <button type="button" aria-describedby="extra-hint">
            Reload
          </button>
        </Tooltip>
      </>,
    )

    const trigger = screen.getByRole('button', { name: 'Reload' })
    await user.tab()

    const describedBy = trigger.getAttribute('aria-describedby')?.split(' ') ?? []
    expect(describedBy).toHaveLength(2)
    expect(describedBy[0]).toBe('extra-hint')
    expect(describedBy[1]).toBe(screen.getByRole('tooltip').id)
  })

  it('preserves the trigger’s own focus and pointer handlers', async () => {
    const user = userEvent.setup()
    const onFocus = vi.fn()
    const onPointerEnter = vi.fn()
    render(
      <Tooltip content="Reload the current page">
        <button type="button" onFocus={onFocus} onPointerEnter={onPointerEnter}>
          Reload
        </button>
      </Tooltip>,
    )

    const trigger = screen.getByRole('button', { name: 'Reload' })
    await user.hover(trigger)
    await user.tab()

    expect(onPointerEnter).toHaveBeenCalledTimes(1)
    expect(onFocus).toHaveBeenCalledTimes(1)
  })

  it('reports open and close through onOpenChange', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <Tooltip content="Reload the current page" onOpenChange={onOpenChange}>
        <button type="button">Reload</button>
      </Tooltip>,
    )

    await user.tab()
    expect(onOpenChange).toHaveBeenLastCalledWith(true)

    await user.tab()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('honours a controlled open prop', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <Tooltip open={false} content="Reload the current page">
        <button type="button">Reload</button>
      </Tooltip>,
    )

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    rerender(
      <Tooltip open content="Reload the current page">
        <button type="button">Reload</button>
      </Tooltip>,
    )

    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    // The card stays mounted because the owner still says it is open; the
    // component only reports the request.
    await user.tab()
    await user.tab()
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('never puts the card in the tab order', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Reload the current page">
        <button type="button">Reload</button>
      </Tooltip>,
    )

    await user.tab()

    expect(screen.getByRole('tooltip')).not.toHaveAttribute('tabindex')
  })

  it('has no accessibility violations while shown', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <div>
        <Tooltip headline="Reload" content="Reload the current page" placement="bottom">
          <button type="button">Reload</button>
        </Tooltip>
      </div>,
    )

    await user.tab()

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
