import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Avatar } from './Avatar'

const image = (container: HTMLElement) => container.querySelector('.vgui-avatar__image')

describe('Avatar', () => {
  it('renders the image with alt defaulting to decorative', () => {
    const { container } = render(<Avatar src="/avatars/dalcvi.png" />)

    const img = image(container) as HTMLImageElement

    expect(img).not.toBeNull()
    expect(img).toHaveAttribute('src', '/avatars/dalcvi.png')
    expect(img).toHaveAttribute('alt', '')
  })

  it('passes a real alt through for an avatar that stands alone', () => {
    render(<Avatar src="/avatars/dalcvi.png" alt="dalcvi" />)

    expect(screen.getByAltText('dalcvi')).toBeInTheDocument()
  })

  it('maps size presets to modifier classes, medium by default', () => {
    const { container, rerender } = render(<Avatar src="/a.png" />)
    const root = () => container.querySelector('.vgui-avatar') as HTMLElement

    expect(root()).toHaveClass('vgui-avatar--md')

    rerender(<Avatar src="/a.png" size="sm" />)
    expect(root()).toHaveClass('vgui-avatar--sm')

    rerender(<Avatar src="/a.png" size="lg" />)
    expect(root()).toHaveClass('vgui-avatar--lg')
    expect(root()).not.toHaveClass('vgui-avatar--md')
  })

  it('renders the placeholder with derived initials when there is no image', () => {
    const { container, rerender } = render(<Avatar name="dave coder" />)
    const root = () => container.querySelector('.vgui-avatar') as HTMLElement

    expect(root()).toHaveClass('vgui-avatar--placeholder')
    expect(root()).toHaveAttribute('data-initials', 'dc')
    expect(image(container)).toBeNull()

    rerender(<Avatar name="dalcvi" />)
    expect(root()).toHaveAttribute('data-initials', 'd')

    rerender(<Avatar />)
    expect(root()).toHaveAttribute('data-initials', '')
  })

  it('falls back to the placeholder when the image fails to load', () => {
    const onError = vi.fn()
    const { container } = render(<Avatar src="/avatars/missing.png" name="dale" onError={onError} />)
    const img = image(container) as HTMLImageElement

    expect(container.querySelector('.vgui-avatar')).not.toHaveClass('vgui-avatar--placeholder')

    fireEvent.error(img)

    expect(img).toHaveAttribute('data-failed', 'true')
    expect(container.querySelector('.vgui-avatar')).toHaveClass('vgui-avatar--placeholder')
    expect(container.querySelector('.vgui-avatar')).toHaveAttribute('data-initials', 'd')
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('keeps the image element on failure so no broken-image path exists', () => {
    const { container } = render(<Avatar src="/avatars/missing.png" alt="dalcvi" />)

    fireEvent.error(image(container) as HTMLImageElement)

    expect(image(container)).not.toBeNull()
    expect((image(container) as HTMLImageElement).className).toBe('vgui-avatar__image')
  })

  it('draws the status ring as a decorative, classed, aria-hidden edge', () => {
    const { container, rerender } = render(<Avatar src="/a.png" />)

    expect(container.querySelector('.vgui-avatar__status')).toBeNull()
    expect(container.querySelector('.vgui-avatar')).not.toHaveClass('vgui-avatar--status')

    rerender(<Avatar src="/a.png" status="online" />)

    const ring = container.querySelector('.vgui-avatar__status') as HTMLElement

    expect(ring).toHaveClass('vgui-avatar__status--online')
    expect(ring).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.vgui-avatar')).toHaveClass('vgui-avatar--status')

    rerender(<Avatar src="/a.png" status="busy" />)
    expect(container.querySelector('.vgui-avatar__status')).toHaveClass('vgui-avatar__status--busy')

    rerender(<Avatar src="/a.png" status="away" />)
    expect(container.querySelector('.vgui-avatar__status')).toHaveClass('vgui-avatar__status--away')

    rerender(<Avatar src="/a.png" status="offline" />)
    expect(container.querySelector('.vgui-avatar__status')).toHaveClass('vgui-avatar__status--offline')
  })

  it('marks an ignored friend, bare and round frames', () => {
    const { container, rerender } = render(<Avatar src="/a.png" />)
    const root = () => container.querySelector('.vgui-avatar') as HTMLElement

    expect(root()).not.toHaveClass('vgui-avatar--ignored')
    expect(root()).not.toHaveClass('vgui-avatar--bare')
    expect(root()).not.toHaveClass('vgui-avatar--round')

    rerender(<Avatar src="/a.png" ignored bare round />)

    expect(root()).toHaveClass('vgui-avatar--ignored')
    expect(root()).toHaveClass('vgui-avatar--bare')
    expect(root()).toHaveClass('vgui-avatar--round')
  })

  it('appends the caller className to its own class list', () => {
    const { container } = render(<Avatar src="/a.png" className="my-avatar" />)

    expect(container.querySelector('.vgui-avatar')).toHaveClass('vgui-avatar', 'my-avatar')
  })

  it('forwards the ref to the root span', () => {
    const ref = createRef<HTMLSpanElement>()
    const { container } = render(<Avatar ref={ref} src="/a.png" />)

    expect(ref.current).toBe(container.querySelector('.vgui-avatar'))
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Avatar src="/avatars/dalcvi.png" alt="dalcvi" size="sm" status="online" />
        <Avatar src="/avatars/other.png" name="dave coder" />
        <Avatar name="dale" size="lg" status="offline" ignored bare />
        <Avatar round status="away" />
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
