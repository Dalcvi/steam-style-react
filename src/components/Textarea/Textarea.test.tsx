import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { a11yViolations } from '../../test/a11y'
import { Textarea } from './Textarea'

/* jsdom reports `scrollHeight` as 0, so auto-grow needs the getter stubbed. */
const stubScrollHeight = (height: number) =>
  vi.spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(height)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Textarea', () => {
  it('renders a native textarea inside the wrapper', () => {
    render(<Textarea aria-label="Ban reason" />)

    const field = screen.getByLabelText('Ban reason')
    expect(field.tagName).toBe('TEXTAREA')
    expect(field).toHaveClass('vgui-textarea__field')
    expect(field.parentElement).toHaveClass('vgui-textarea')
  })

  it('accepts multi-line input', async () => {
    const user = userEvent.setup()
    render(<Textarea aria-label="Ban reason" />)

    await user.type(screen.getByLabelText('Ban reason'), 'line one{Enter}line two')

    expect(screen.getByLabelText('Ban reason')).toHaveValue('line one\nline two')
  })

  it('forwards the ref to the underlying textarea element', () => {
    const ref = createRef<HTMLTextAreaElement>()
    render(<Textarea ref={ref} aria-label="Ban reason" defaultValue="hi" />)

    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
    expect(ref.current).toHaveValue('hi')
  })

  it.each([
    [{ resize: 'none' } as const, 'vgui-textarea--fixed'],
    [{ autoGrow: true } as const, 'vgui-textarea--auto-grow'],
    [{ mono: true } as const, 'vgui-textarea--mono'],
    [{ invalid: true } as const, 'vgui-textarea--invalid'],
  ])('adds the modifier class for %o', (props, modifierClass) => {
    const { container } = render(<Textarea aria-label="Field" {...props} />)

    expect(container.firstElementChild).toHaveClass('vgui-textarea', modifierClass)
  })

  it('renders no modifier classes by default', () => {
    const { container } = render(<Textarea aria-label="Field" />)

    expect(container.firstElementChild?.className.split(' ')).toEqual(['vgui-textarea'])
  })

  it('merges a caller className last', () => {
    const { container } = render(<Textarea aria-label="Field" mono className="my-area" />)

    expect(container.firstElementChild?.className).toBe('vgui-textarea vgui-textarea--mono my-area')
  })

  it('sets rows and passes native attributes through', () => {
    render(
      <Textarea
        aria-label="Field"
        rows={6}
        name="reason"
        maxLength={256}
        spellCheck={false}
        defaultValue="text"
      />,
    )

    const field = screen.getByLabelText('Field')
    expect(field).toHaveAttribute('rows', '6')
    expect(field).toHaveAttribute('name', 'reason')
    expect(field).toHaveAttribute('maxlength', '256')
    expect(field).toHaveAttribute('spellcheck', 'false')
  })

  it('grows to the content height when autoGrow is on', () => {
    stubScrollHeight(120)
    render(<Textarea aria-label="Field" autoGrow defaultValue="three lines" />)

    expect(screen.getByLabelText('Field').style.height).toBe('120px')
  })

  it('clamps auto-grow at maxHeight', () => {
    stubScrollHeight(400)
    render(<Textarea aria-label="Field" autoGrow maxHeight={240} />)

    expect(screen.getByLabelText('Field').style.height).toBe('240px')
    expect(screen.getByLabelText('Field')).toHaveStyle({ maxHeight: '240px' })
  })

  it('re-measures while typing without a re-render', async () => {
    const user = userEvent.setup()
    const scrollHeight = stubScrollHeight(120)
    render(<Textarea aria-label="Field" autoGrow />)

    expect(screen.getByLabelText('Field').style.height).toBe('120px')

    scrollHeight.mockReturnValue(200)
    await user.type(screen.getByLabelText('Field'), 'more')

    expect(screen.getByLabelText('Field').style.height).toBe('200px')
  })

  it('leaves the height alone when autoGrow is off', () => {
    stubScrollHeight(400)
    render(<Textarea aria-label="Field" />)

    expect(screen.getByLabelText('Field').style.height).toBe('')
  })

  it('renders the live count against maxLength and hides it from assistive tech', async () => {
    const user = userEvent.setup()
    const { container } = render(<Textarea aria-label="Field" showCount maxLength={10} />)

    const count = container.querySelector('.vgui-textarea__count')
    expect(count).toHaveAttribute('aria-hidden', 'true')
    expect(count).toHaveTextContent('0 / 10')

    await user.type(screen.getByLabelText('Field'), 'abc')
    expect(count).toHaveTextContent('3 / 10')
  })

  it('counts a controlled value', () => {
    const { container } = render(
      <Textarea aria-label="Field" showCount value="hello" onChange={() => {}} />,
    )

    expect(container.querySelector('.vgui-textarea__count')).toHaveTextContent('5')
  })

  it('renders no counter unless asked', () => {
    const { container } = render(<Textarea aria-label="Field" />)

    expect(container.querySelector('.vgui-textarea__count')).toBeNull()
  })

  it('moves focus out on Tab rather than trapping it', async () => {
    const user = userEvent.setup()
    render(<Textarea aria-label="Ban reason" />)

    await user.tab()
    expect(screen.getByLabelText('Ban reason')).toHaveFocus()

    await user.tab()
    expect(screen.getByLabelText('Ban reason')).not.toHaveFocus()
  })

  it('is inert when disabled and still focusable when read-only', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Textarea aria-label="Locked" disabled />
        <Textarea aria-label="Archive" readOnly defaultValue="frozen" />
      </div>,
    )

    expect(screen.getByLabelText('Locked')).toBeDisabled()

    await user.tab()
    expect(screen.getByLabelText('Archive')).toHaveFocus()
    expect(screen.getByLabelText('Archive')).toHaveAttribute('readonly')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Textarea aria-label="Ban reason" rows={4} maxLength={256} showCount />
        <Textarea aria-label="Console" mono readOnly defaultValue="sv_cheats 1" />
        <Textarea aria-label="Auto" autoGrow rows={1} />
        <Textarea aria-label="Bad" invalid aria-invalid="true" />
        <Textarea aria-label="Locked" disabled />
      </div>,
    )

    await expect(a11yViolations(container)).resolves.toEqual([])
  })
})
