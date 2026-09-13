import { forwardRef, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, HTMLAttributes, KeyboardEvent, ReactNode } from 'react'
import './Select.css'
import '../../styles/scrollbars.css'

export interface SelectOption {
  /** Value committed to `value` when this option is chosen. */
  value: string
  /** Row content. Anything non-textual is ignored by type-ahead. */
  label: ReactNode
  /** Skip the row: it can be read but not chosen. */
  disabled?: boolean
}

export interface SelectProps extends HTMLAttributes<HTMLDivElement> {
  /** Options, in list order. */
  options: SelectOption[]
  /** Controlled value. */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Called with the chosen value. */
  onValueChange?: (value: string) => void
  /** Shown when nothing is selected. */
  placeholder?: string
  /** Allow typing an arbitrary value instead of choosing one. */
  editable?: boolean
  /** Called as the user types in `editable` mode. */
  onInputChange?: (value: string) => void
  /** Height variant: `18px`, the default `19px`, or `25px` like `Button`. */
  size?: 'small' | 'default' | 'large'
  /** Render the invalid border. Does not set aria-invalid. */
  invalid?: boolean
  /** Disable the whole control. */
  disabled?: boolean
  /** Accessible name when there is no visible `FieldLabel`. */
  'aria-label'?: string
  /** Id of the visible label. */
  'aria-labelledby'?: string
  /** Id of the control, for `FieldLabel htmlFor`. */
  id?: string
  /** Optional name for form submission via a hidden input. */
  name?: string
}

let instance = 0

/** The text of a label, for type-ahead and the editable draft. */
const labelText = (label: ReactNode) => (typeof label === 'string' || typeof label === 'number' ? String(label) : '')

const isPrintable = (event: KeyboardEvent<HTMLElement>) =>
  event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey

/**
 * A collapsed list that opens into an overlay list of options, with a caret on
 * the right — VGUI's `ComboBox`, which is a text entry plus a button plus a
 * `Menu`-shaped popup.
 *
 * Built from plain markup rather than from `Menu` so the package stays
 * tree-shakable; the popup deliberately reproduces `Menu`'s geometry, row
 * fill and `aria-activedescendant` keyboard model.
 */
export const Select = forwardRef<HTMLDivElement, SelectProps>(function Select(
  {
    options,
    value,
    defaultValue,
    onValueChange,
    placeholder,
    editable = false,
    onInputChange,
    size = 'default',
    invalid = false,
    disabled = false,
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    id,
    name,
    ...rest
  },
  ref,
) {
  const [internal, setInternal] = useState(() => defaultValue ?? '')
  const current = value !== undefined ? value : internal

  const selectedIndex = options.findIndex((option) => option.value === current)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined
  const firstEnabled = options.findIndex((option) => !option.disabled)
  const lastEnabled = options.reduce((last, option, index) => (option.disabled ? last : index), -1)

  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(() => (selectedIndex >= 0 ? selectedIndex : Math.max(0, firstEnabled)))

  // The editable field shows the selection's label when there is one and the
  // raw value otherwise. Kept as draft state so typing is uncontrolled until a
  // commit, which is what makes `onValueChange` fire once per choice.
  const [seen, setSeen] = useState(current)
  const [draft, setDraft] = useState(() => labelText(selected?.label) || current)
  if (seen !== current) {
    setSeen(current)
    setDraft(labelText(selected?.label) || current)
  }

  const [ids] = useState(() => {
    instance += 1
    return {
      list: `vgui-select-${instance}-list`,
      option: (index: number) => `vgui-select-${instance}-option-${index}`,
    }
  })

  const typed = useRef({ text: '', timer: 0 })

  useEffect(() => {
    const buffer = typed.current
    return () => window.clearTimeout(buffer.timer)
  }, [])

  const commit = (next: string) => {
    if (next === current) return
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
  }

  const openList = (index?: number) => {
    if (disabled) return
    setActive(index ?? (selectedIndex >= 0 ? selectedIndex : Math.max(0, firstEnabled)))
    setOpen(true)
  }

  const closeList = () => setOpen(false)

  const move = (step: number) => {
    if (options.length === 0) return
    let index = active
    for (let i = 0; i < options.length; i += 1) {
      index = (index + step + options.length) % options.length
      if (!options[index].disabled) break
    }
    setActive(index)
    if (editable) setDraft(labelText(options[index].label) || options[index].value)
  }

  const choose = (index: number) => {
    const option = options[index]
    if (!option || option.disabled || disabled) return
    setActive(index)
    if (editable) setDraft(labelText(option.label) || option.value)
    commit(option.value)
    closeList()
  }

  /** The editable half's text, resolved back to an option when it names one. */
  const commitDraft = () => {
    const match = options.find((option) => labelText(option.label) === draft)
    commit(match ? match.value : draft)
  }

  const typeAhead = (key: string) => {
    const buffer = typed.current
    buffer.text += key
    window.clearTimeout(buffer.timer)
    buffer.timer = window.setTimeout(() => {
      buffer.text = ''
    }, 500)
    const needle = buffer.text.toLowerCase()
    const index = options.findIndex(
      (option) => !option.disabled && (labelText(option.label) || option.value).toLowerCase().startsWith(needle),
    )
    if (index < 0) return
    if (open) setActive(index)
    else choose(index)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (disabled) return
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (open && !event.altKey) move(1)
        else if (!open) openList()
        return
      case 'ArrowUp':
        event.preventDefault()
        if (open) {
          if (event.altKey) return
          move(-1)
        } else {
          openList()
        }
        return
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (open) choose(active)
        else openList()
        return
      case 'Escape':
        if (open) {
          event.preventDefault()
          closeList()
        }
        return
      case 'Home':
        if (open) {
          event.preventDefault()
          setActive(Math.max(0, firstEnabled))
        }
        return
      case 'End':
        if (open) {
          event.preventDefault()
          setActive(Math.max(0, lastEnabled))
        }
        return
      case 'Tab':
        closeList()
        return
      default:
        break
    }
    if (isPrintable(event)) {
      event.preventDefault()
      typeAhead(event.key)
    }
  }

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (open && !event.altKey) move(1)
        else if (!open) openList()
        return
      case 'ArrowUp':
        event.preventDefault()
        if (open) {
          if (event.altKey) return
          move(-1)
        } else {
          openList()
        }
        return
      case 'Enter':
        event.preventDefault()
        if (open) choose(active)
        else commitDraft()
        return
      case 'Escape':
        event.preventDefault()
        if (open) closeList()
        else setDraft(labelText(selected?.label) || current)
        return
      case 'Tab':
        commitDraft()
        closeList()
        return
      default:
        break
    }
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.currentTarget.value
    setDraft(next)
    onInputChange?.(next)
    if (!open && options.length > 0) openList()
  }

  const classes = ['vgui-select']
  if (size === 'small') classes.push('vgui-select--small')
  if (size === 'large') classes.push('vgui-select--large')
  if (editable) classes.push('vgui-select--editable')
  if (invalid) classes.push('vgui-select--invalid')
  if (disabled) classes.push('vgui-select--disabled')
  if (open) classes.push('vgui-select--open')
  if (className) classes.push(className)

  const showingPlaceholder = !selected && current === ''
  const listId = open ? ids.list : undefined
  const activeId = open ? ids.option(active) : undefined

  return (
    <div ref={ref} className={classes.join(' ')} {...rest}>
      {editable ? (
        <span className="vgui-select__field">
          <input
            id={id}
            className="vgui-select__input"
            type="text"
            role="combobox"
            autoComplete="off"
            spellCheck={false}
            placeholder={showingPlaceholder ? placeholder : undefined}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={listId}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            value={draft}
            disabled={disabled}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={commitDraft}
          />
          {/* Not tabbable: the pattern keeps focus in the input, and the caret
              is decorative to assistive technology. */}
          <button
            type="button"
            className="vgui-select__button"
            tabIndex={-1}
            aria-hidden="true"
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => (open ? closeList() : openList())}
          />
        </span>
      ) : (
        <button
          type="button"
          id={id}
          className="vgui-select__trigger"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          disabled={disabled}
          onClick={() => (open ? closeList() : openList())}
          onKeyDown={handleKeyDown}
        >
          <span className="vgui-select__value" data-placeholder={showingPlaceholder ? 'true' : undefined}>
            {selected ? selected.label : current || placeholder}
          </span>
          <span className="vgui-select__button" aria-hidden="true" />
        </button>
      )}

      {/* `Select` is not a native control, so form submission needs its own
          hidden input. */}
      {name ? <input type="hidden" name={name} value={current} /> : null}

      {open ? (
        <ul
          id={ids.list}
          className="vgui-select__list vgui-scroll-surface"
          role="listbox"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={ids.option(index)}
              className="vgui-select__option"
              role="option"
              aria-selected={option.value === current}
              aria-disabled={option.disabled || undefined}
              data-active={index === active ? 'true' : undefined}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
})

Select.displayName = 'Select'
