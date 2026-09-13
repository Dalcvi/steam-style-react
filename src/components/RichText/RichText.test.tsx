import { render } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { RichText, RichTextBold, RichTextEmphasis, RichTextLink } from './RichText'

describe('RichText', () => {
  it('renders its children as text', () => {
    const { container } = render(<RichText>Server will restart in five minutes.</RichText>)

    expect(container.querySelector('.vgui-rich-text')?.textContent).toBe(
      'Server will restart in five minutes.',
    )
  })

  it('renders the recessed frame class by default', () => {
    const { container } = render(<RichText>text</RichText>)
    const root = container.querySelector('.vgui-rich-text')

    expect(root).not.toBeNull()
    expect(root).not.toHaveClass('vgui-rich-text--interior')
  })

  it('adds the interior modifier only when interior is set', () => {
    const { container } = render(<RichText interior>text</RichText>)

    expect(container.querySelector('.vgui-rich-text')).toHaveClass('vgui-rich-text--interior')
  })

  it('merges a caller className last', () => {
    const { container } = render(
      <RichText className="vgui-rich-text--list custom">text</RichText>,
    )

    expect(container.querySelector('.vgui-rich-text')?.className).toBe(
      'vgui-rich-text vgui-rich-text--list custom',
    )
  })

  it('spreads the remaining attributes onto the root', () => {
    const { container } = render(
      <RichText id="motd" data-testid="motd" hidden={false}>
        text
      </RichText>,
    )
    const root = container.querySelector('.vgui-rich-text')

    expect(root).toHaveAttribute('id', 'motd')
    expect(root).toHaveAttribute('data-testid', 'motd')
  })

  it('forwards the ref to the DOM node', () => {
    const ref = createRef<HTMLDivElement>()
    render(<RichText ref={ref}>text</RichText>)

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toHaveClass('vgui-rich-text')
  })

  it('never injects markup from a string child', () => {
    const { container } = render(
      <RichText>{'<img src=x onerror="alert(1)"> & <script>alert(2)</script>'}</RichText>,
    )
    const root = container.querySelector('.vgui-rich-text')

    expect(root?.querySelector('img')).toBeNull()
    expect(root?.querySelector('script')).toBeNull()
    expect(root?.textContent).toBe('<img src=x onerror="alert(1)"> & <script>alert(2)</script>')
  })

  it('does not expose an innerHTML escape hatch', () => {
    const { container } = render(<RichText>{'<b>x</b><script>alert(1)</script>'}</RichText>)
    const root = container.querySelector('.vgui-rich-text')

    expect(root?.querySelector('b')).toBeNull()
    expect(root?.querySelector('script')).toBeNull()
    expect(root?.textContent).toBe('<b>x</b><script>alert(1)</script>')
  })

  it('names the components for devtools', () => {
    expect(RichText.displayName).toBe('RichText')
    expect(RichTextLink.displayName).toBe('RichTextLink')
    expect(RichTextBold.displayName).toBe('RichTextBold')
    expect(RichTextEmphasis.displayName).toBe('RichTextEmphasis')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <RichText>
        <p className="vgui-rich-text__interior">
          The server will restart in <RichTextBold>five minutes</RichTextBold>. See{' '}
          <RichTextLink href="/rules">the rules</RichTextLink> for{' '}
          <RichTextEmphasis>why</RichTextEmphasis>.
        </p>
      </RichText>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})

describe('RichTextLink', () => {
  it('renders an anchor with the url class and its href', () => {
    const { container } = render(<RichTextLink href="/rules">the rules</RichTextLink>)
    const anchor = container.querySelector('a')

    expect(anchor).toHaveClass('vgui-rich-text__url')
    expect(anchor).toHaveAttribute('href', '/rules')
    expect(anchor).toHaveTextContent('the rules')
  })

  it('merges a caller className and extra anchor attributes', () => {
    const { container } = render(
      <RichTextLink href="https://example.com" target="_blank" rel="noreferrer" className="ext">
        site
      </RichTextLink>,
    )

    expect(container.querySelector('a')?.className).toBe('vgui-rich-text__url ext')
    expect(container.querySelector('a')).toHaveAttribute('rel', 'noreferrer')
  })

  it('forwards the ref to the anchor', () => {
    const ref = createRef<HTMLAnchorElement>()
    render(
      <RichTextLink ref={ref} href="/rules">
        the rules
      </RichTextLink>,
    )

    expect(ref.current).toBeInstanceOf(HTMLAnchorElement)
  })
})

describe('RichTextBold', () => {
  it('renders a strong element with the bold class', () => {
    const { container } = render(<RichTextBold>five minutes</RichTextBold>)

    expect(container.querySelector('strong')).toHaveClass('vgui-rich-text__bold')
    expect(container.querySelector('strong')?.tagName).toBe('STRONG')
  })

  it('forwards the ref to the element', () => {
    const ref = createRef<HTMLElement>()
    render(<RichTextBold ref={ref}>bold</RichTextBold>)

    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current?.tagName).toBe('STRONG')
  })
})

describe('RichTextEmphasis', () => {
  it('renders an em element with the emphasis class', () => {
    const { container } = render(<RichTextEmphasis>why</RichTextEmphasis>)

    expect(container.querySelector('em')).toHaveClass('vgui-rich-text__emphasis')
  })

  it('forwards the ref to the element', () => {
    const ref = createRef<HTMLElement>()
    render(<RichTextEmphasis ref={ref}>why</RichTextEmphasis>)

    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current?.tagName).toBe('EM')
  })
})
