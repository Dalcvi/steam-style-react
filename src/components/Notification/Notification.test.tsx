import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Notification } from './Notification'

describe('Notification', () => {
  // A test that fails mid-way must never leave fake timers installed: the next
  // test's `userEvent` would then await a timer that only the test can advance.
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a polite live region by default', () => {
    render(
      <Notification title="Gordon Freeman is now online">Playing Half-Life 2</Notification>,
    )

    const notification = screen.getByRole('status')
    expect(notification).toHaveClass('vgui-notification')
    expect(notification).toHaveTextContent('Gordon Freeman is now online')
    expect(notification).toHaveTextContent('Playing Half-Life 2')
  })

  it('is assertive for the error variant', () => {
    render(
      <Notification variant="error" title="Error">
        Could not connect to the server.
      </Notification>,
    )

    expect(screen.getByRole('alert')).toHaveClass('vgui-notification--error')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it.each(['info', 'success', 'warning', 'error'] as const)(
    'reflects variant="%s" in the modifier class',
    (variant) => {
      const { container } = render(
        <Notification variant={variant} title="Title">
          Message
        </Notification>,
      )

      expect(container.querySelector('.vgui-notification')).toHaveClass(
        `vgui-notification--${variant}`,
      )
    },
  )

  it.each(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const)(
    'reflects corner="%s" in the positioning class',
    (corner) => {
      render(
        <Notification corner={corner} title="Title">
          Message
        </Notification>,
      )

      expect(screen.getByRole('status')).toHaveClass(`vgui-notification--corner-${corner}`)
    },
  )

  it('defaults to the bottom-right corner, the corner Steam used', () => {
    render(<Notification title="Title">Message</Notification>)

    expect(screen.getByRole('status')).toHaveClass('vgui-notification--corner-bottom-right')
  })

  it('marks the entering state for the mount animation', () => {
    render(<Notification title="Title">Message</Notification>)

    expect(screen.getByRole('status')).toHaveClass('vgui-notification--entering')
  })

  it('publishes the stacking index as a custom property', () => {
    render(
      <Notification title="Title" index={3}>
        Message
      </Notification>,
    )

    expect(screen.getByRole('status').style.getPropertyValue('--vgui-notification-index')).toBe('3')
  })

  it('renders a variant glyph by default and lets the icon prop override it', () => {
    const { rerender } = render(<Notification title="Title">Message</Notification>)

    expect(screen.getByRole('status').querySelector('.vgui-notification__icon svg')).not.toBeNull()

    rerender(
      <Notification title="Title" icon={<span data-testid="custom-icon" />}>
        Message
      </Notification>,
    )

    const notification = screen.getByRole('status')
    expect(notification.querySelector('[data-testid="custom-icon"]')).toBeInTheDocument()
    expect(notification.querySelector('svg')).not.toBeInTheDocument()
  })

  it('keeps the glyph out of the accessibility tree', () => {
    const { container } = render(<Notification title="Title">Message</Notification>)

    const icon = container.querySelector('.vgui-notification__icon')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('omits the dismiss button unless dismissable', () => {
    render(<Notification title="Title">Message</Notification>)

    expect(screen.queryByRole('button', { name: 'Dismiss notification' })).not.toBeInTheDocument()
  })

  it('names the dismiss button and calls onDismiss when pressed', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(
      <Notification title="Title" dismissable onDismiss={onDismiss}>
        Message
      </Notification>,
    )

    const dismiss = screen.getByRole('button', { name: 'Dismiss notification' })
    await user.click(dismiss)

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('leads an error message with a word, since colour alone is not an indicator', () => {
    render(<Notification variant="error">Could not connect to the server.</Notification>)

    expect(screen.getByRole('alert')).toHaveTextContent('Error: Could not connect to the server.')
  })

  it('does not repeat the prefix when a title already carries it', () => {
    const { container } = render(
      <Notification variant="error" title="Error">
        Could not connect to the server.
      </Notification>,
    )

    expect(container.querySelector('.vgui-notification__prefix')).not.toBeInTheDocument()
  })

  it('calls onDismiss after the duration elapses', async () => {
    vi.useFakeTimers()
    try {
      const onDismiss = vi.fn()
      render(
        <Notification title="Title" duration={5000} onDismiss={onDismiss}>
          Message
        </Notification>,
      )

      await act(async () => {
        await vi.advanceTimersByTimeAsync(4999)
      })
      expect(onDismiss).not.toHaveBeenCalled()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1)
      })
      expect(onDismiss).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('never auto-dismisses an error, whatever the duration says', async () => {
    vi.useFakeTimers()
    try {
      const onDismiss = vi.fn()
      render(
        <Notification variant="error" title="Error" duration={5000} onDismiss={onDismiss}>
          Could not connect to the server.
        </Notification>,
      )

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60000)
      })

      expect(onDismiss).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not auto-dismiss when no duration is given', async () => {
    vi.useFakeTimers()
    try {
      const onDismiss = vi.fn()
      render(
        <Notification title="Title" onDismiss={onDismiss}>
          Message
        </Notification>,
      )

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60000)
      })

      expect(onDismiss).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('pauses the timer on hover and restarts it on pointer leave', async () => {
    vi.useFakeTimers()
    try {
      const onDismiss = vi.fn()
      render(
        <Notification title="Title" duration={1000} onDismiss={onDismiss}>
          Message
        </Notification>,
      )

      const notification = screen.getByRole('status')
      fireEvent.pointerOver(notification)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000)
      })
      expect(onDismiss).not.toHaveBeenCalled()

      fireEvent.pointerOut(notification)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })
      expect(onDismiss).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('pauses the timer while focus is inside the notification', async () => {
    vi.useFakeTimers()
    try {
      const onDismiss = vi.fn()
      render(
        <Notification title="Title" duration={1000} dismissable onDismiss={onDismiss}>
          <a href="#details">Details</a>
        </Notification>,
      )

      const dismiss = screen.getByRole('button', { name: 'Dismiss notification' })
      act(() => {
        dismiss.focus()
      })
      expect(dismiss).toHaveFocus()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000)
      })
      expect(onDismiss).not.toHaveBeenCalled()

      act(() => {
        dismiss.blur()
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })
      expect(onDismiss).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('dismisses on Escape without moving focus', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(
      <Notification title="Title" dismissable onDismiss={onDismiss}>
        Message
      </Notification>,
    )

    await user.tab()
    const dismiss = screen.getByRole('button', { name: 'Dismiss notification' })
    expect(dismiss).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(dismiss).toHaveFocus()
  })

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Notification ref={ref} title="Title" />)

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toHaveClass('vgui-notification')
  })

  it('merges a caller className last and keeps caller styles', () => {
    render(
      <Notification
        className="my-toast"
        style={{ opacity: 0.5 }}
        variant="warning"
        title="Title"
      >
        Message
      </Notification>,
    )

    const notification = screen.getByRole('status')
    expect(notification.className.split(' ')).toContain('my-toast')
    expect(notification).toHaveStyle({ opacity: '0.5' })
  })

  it('spreads extra attributes onto the root element', () => {
    render(
      <Notification title="Title" data-testid="toast" aria-atomic="true">
        Message
      </Notification>,
    )

    expect(screen.getByTestId('toast')).toHaveAttribute('aria-atomic', 'true')
  })

  it('has no accessibility violations for any variant', async () => {
    const { container } = render(
      <div>
        <Notification variant="info" title="Gordon Freeman is now online" dismissable>
          Playing Half-Life 2
        </Notification>
        <Notification variant="success" title="Download complete">
          Half-Life 2: Episode Two is ready to play.
        </Notification>
        <Notification variant="warning" title="Low disk space">
          Only 1.2 GB of free space remains.
        </Notification>
        <Notification variant="error" title="Error" dismissable>
          Could not connect to the server.
        </Notification>
        <Notification variant="error" dismissable>
          Could not connect to the server.
        </Notification>
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
