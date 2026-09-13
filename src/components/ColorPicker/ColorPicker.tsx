import { useEffect, useRef, useState, forwardRef } from 'react'
import type {
  ChangeEvent as ReactChangeEvent,
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
} from 'react'

import './ColorPicker.css'

/*
 * The palette is `foundations.md` §3 — the theme's own token table, which is
 * the corpus's colour list (`steamscheme.res:10-71`). These are data, not
 * styling: they are handed to CSS as custom properties, which is why they are
 * literal hex strings rather than `var()` references.
 */
const DEFAULT_PALETTE: Array<{ name: string; value: string }> = [
  { name: 'GreenBG', value: '#4C5844' },
  { name: 'LightGreenBG', value: '#5A6A50' },
  { name: 'DarkGreenBG', value: '#3E4637' },
  { name: 'BorderBright', value: '#899281' },
  { name: 'BorderDark', value: '#292D23' },
  { name: 'ShadeLighter', value: '#B8C4AD' },
  { name: 'OffWhite', value: '#D8DED3' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Label', value: '#A0AA95' },
  { name: 'DimListText', value: '#758666' },
  { name: 'DisabledText1', value: '#75806F' },
  { name: 'DisabledText2', value: '#282E22' },
  { name: 'Maize', value: '#C4B550' },
  { name: 'MaizeBG', value: '#91863C' },
  { name: 'Selection', value: '#96892D' },
  { name: 'NavHover', value: '#E3E41F' },
  { name: 'Link', value: '#AAAAAA' },
  { name: 'FullGreen', value: '#7EA64B' },
  { name: 'Success', value: '#1AE225' },
  { name: 'Warning', value: '#C4B550' },
  { name: 'Danger', value: '#E2251A' },
  { name: 'Info', value: '#0900FF' },
  { name: 'PingLow', value: '#6A1610' },
  { name: 'PingMedium', value: '#91863C' },
  { name: 'PingHigh', value: '#4C5844' },
  { name: 'FriendsSelected', value: '#111111' },
  { name: 'FriendsIgnored', value: '#F86C4F' },
  { name: 'FriendsAvatarOver', value: '#FFFFFF' },
  { name: 'ClayBG', value: '#464646' },
  { name: 'LightClayBG', value: '#686A65' },
  { name: 'LightClayButtonBG', value: '#7D8078' },
  { name: 'ClaySheetBottom', value: '#5C5957' },
  { name: 'DarkClayBG', value: '#2F312D' },
  { name: 'ClayLightGreen', value: '#ADB5A8' },
  { name: 'ClayDimLightGreen', value: '#A6ACA2' },
  { name: 'BorderSelection', value: '#000000' },
]

/* The corpus writes alpha as a fourth component (`"0 0 0 128"`), so it is part
 * of the value grammar even though the theme barely uses it. */
const HEX_PATTERN = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i

const isHex = (value: string) => HEX_PATTERN.test(value)

const normalizeHex = (value: string) => value.toUpperCase()

const rgbHex = (value: string) => value.slice(0, 7).toUpperCase()

const alphaOf = (value: string) => (value.length === 9 ? parseInt(value.slice(7, 9), 16) : 255)

const withAlpha = (value: string, alpha: number) =>
  `${rgbHex(value)}${Math.round(alpha).toString(16).padStart(2, '0').toUpperCase()}`

const channelsOf = (value: string) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255)

const toHsv = (value: string) => {
  const [r, g, b] = channelsOf(value)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max }
}

const fromHsv = ({ h, s, v }: { h: number; s: number; v: number }) => {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  const segments = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ]
  const [r, g, b] = segments[Math.min(5, Math.floor(h / 60))]
  const channel = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()

  return `#${channel(r)}${channel(g)}${channel(b)}`
}

let instance = 0

export interface ColorPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Current colour as `#RRGGBB` or `#RRGGBBAA`. */
  value?: string
  /** Called with the new colour when the user commits a choice. */
  onValueChange?: (value: string) => void
  /** Palette to show. Defaults to the scheme's named colours. */
  palette?: Array<{ name: string; value: string }>
  /** Show the hex text input beside the grid. */
  hex?: boolean
  /** Add a hue strip and saturation/value square. Not period-accurate. */
  continuous?: boolean
  /** Allow alpha editing. */
  alpha?: boolean
  /** Grid columns. 12 fits the scheme palette in three tidy rows. */
  columns?: number
  /** Render the swatch alone, with no hex label in the trigger. */
  swatchOnly?: boolean
  /** Grid always visible; no trigger or panel. */
  inline?: boolean
  /** Disable the control and the panel. */
  disabled?: boolean
}

export const ColorPicker = forwardRef<HTMLDivElement, ColorPickerProps>(function ColorPicker(
  {
    className,
    style,
    value,
    onValueChange,
    palette = DEFAULT_PALETTE,
    hex = false,
    continuous = false,
    alpha = false,
    columns = 12,
    swatchOnly = false,
    inline = false,
    disabled = false,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const fallback = palette[0]?.value ?? '#4C5844'
  const [internal, setInternal] = useState(() => normalizeHex(value ?? fallback))
  const current = normalizeHex(value ?? internal)

  const [ids] = useState(() => {
    instance += 1
    return {
      panel: `vgui-color-picker-${instance}-panel`,
      listbox: `vgui-color-picker-${instance}-grid`,
      option: (index: number) => `vgui-color-picker-${instance}-swatch-${index}`,
    }
  })

  const selectedIndex = palette.findIndex((entry) => normalizeHex(entry.value) === current)

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() => (selectedIndex >= 0 ? selectedIndex : 0))

  /* The hex field and the sliders own their text until the value is valid. */
  const [hexDraft, setHexDraft] = useState(current)
  const [seen, setSeen] = useState(current)

  /*
   * A live preview: a drag emits `input` continuously, so the value is only
   * committed when the interaction ends and the `change` event arrives, as the
   * doc's accessibility notes require.
   */
  const [pending, setPending] = useState<string | null>(null)
  const [hsv, setHsv] = useState(() => toHsv(current))

  if (seen !== current) {
    setSeen(current)
    setHexDraft(current)
    setHsv(toHsv(current))
  }

  const display = pending ?? current
  const shownAlpha = alphaOf(display)
  const hsvAlpha = alphaOf(current)
  const hueHex = fromHsv({ h: hsv.h, s: 1, v: 1 })

  const commit = (next: string) => {
    const normalized = normalizeHex(next)
    if (normalized === current) return
    if (value === undefined) setInternal(normalized)
    onValueChange?.(normalized)
  }

  /*
   * React maps `onChange` on a range input to both the `input` and the `change`
   * event; only the latter is the commit point. The intermediate value still
   * paints, so the swatch follows the drag.
   */
  const applySliderValue = (event: ReactChangeEvent<HTMLInputElement>, next: string) => {
    setPending(next)
    if (event.nativeEvent.type === 'change') {
      setPending(null)
      commit(next)
    }
  }

  const rootRef = useRef<HTMLDivElement | null>(null)
  const listboxRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const restoreFocus = useRef(true)
  const wasOpen = useRef(false)

  const setRefs = (node: HTMLDivElement | null) => {
    rootRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) (ref as { current: HTMLDivElement | null }).current = node
  }

  useEffect(() => {
    if (open) {
      wasOpen.current = true
      listboxRef.current?.focus()
      return
    }
    if (wasOpen.current) {
      wasOpen.current = false
      if (restoreFocus.current) triggerRef.current?.focus()
    }
    restoreFocus.current = true
  }, [open])

  const openPanel = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  const closePanel = () => setOpen(false)

  const choose = (index: number) => {
    const entry = palette[index]
    if (!entry || disabled) return
    /* An edited alpha carries across palette picks; a full alpha does not. */
    commit(compose(entry.value))
    if (!inline) closePanel()
  }

  const moveTo = (index: number) => setActiveIndex(Math.max(0, Math.min(palette.length - 1, index)))

  /* Alpha only survives a change when the control is actually editing it, so a
   * picker without `alpha` keeps emitting 6-digit values. */
  const compose = (hex: string) => (alpha && hsvAlpha < 255 ? withAlpha(hex, hsvAlpha) : normalizeHex(hex))

  const handleGridKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        moveTo(activeIndex + 1)
        break
      case 'ArrowLeft':
        event.preventDefault()
        moveTo(activeIndex - 1)
        break
      case 'ArrowDown':
        event.preventDefault()
        moveTo(activeIndex + columns)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveTo(activeIndex - columns)
        break
      case 'Home':
        event.preventDefault()
        moveTo(0)
        break
      case 'End':
        event.preventDefault()
        moveTo(palette.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        choose(activeIndex)
        break
      case 'Escape':
        event.preventDefault()
        closePanel()
        break
      case 'Tab':
        /* Not a focus trap: the panel simply closes and focus moves on. */
        restoreFocus.current = false
        closePanel()
        break
      default:
        break
    }
  }

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      openPanel()
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      closePanel()
    }
  }

  const commitHex = () => {
    if (!isHex(hexDraft)) return
    commit(hexDraft)
  }

  const handleHexChange = (event: ReactChangeEvent<HTMLInputElement>) => {
    setHexDraft(event.currentTarget.value.trim())
  }

  const handleHexKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitHex()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setHexDraft(current)
    }
  }

  const classes = ['vgui-color-picker']
  if (hex) classes.push('vgui-color-picker--hex')
  if (continuous) classes.push('vgui-color-picker--continuous')
  if (alpha) classes.push('vgui-color-picker--alpha')
  if (swatchOnly) classes.push('vgui-color-picker--swatch-only')
  if (inline) classes.push('vgui-color-picker--inline')
  if (className) classes.push(className)

  const rootStyle = {
    ...style,
    '--vgui-color-picker-columns': columns,
  } as CSSProperties

  const swatch = (
    <span
      className="vgui-color-picker__swatch"
      style={{ '--vgui-swatch': display } as CSSProperties}
      data-alpha={shownAlpha < 255 ? 'true' : undefined}
    />
  )

  const grid = (
    <div
      ref={listboxRef}
      id={inline ? undefined : ids.listbox}
      className="vgui-color-picker__grid"
      role="listbox"
      aria-label="Colour palette"
      aria-activedescendant={ids.option(activeIndex)}
      tabIndex={0}
      onKeyDown={handleGridKeyDown}
    >
      {palette.map((entry, index) => (
        <div
          key={`${entry.name}-${index}`}
          id={ids.option(index)}
          className="vgui-color-picker__option"
          role="option"
          aria-label={entry.name}
          aria-selected={normalizeHex(entry.value) === current}
          aria-disabled={disabled || undefined}
          data-active={index === activeIndex ? 'true' : undefined}
          data-alpha={alphaOf(entry.value) < 255 ? 'true' : undefined}
          title={entry.name}
          style={{ '--vgui-option-color': entry.value } as CSSProperties}
          onClick={() => choose(index)}
        />
      ))}
    </div>
  )

  const controls = (
    <>
      {continuous ? (
        <div className="vgui-color-picker__continuous">
          <input
            className="vgui-color-picker__slider vgui-color-picker__hue"
            type="range"
            min={0}
            max={359}
            step={1}
            aria-label="Hue"
            value={Math.round(hsv.h)}
            disabled={disabled}
            onChange={(event) => {
              const next = { ...hsv, h: Number(event.currentTarget.value) }
              setHsv(next)
              applySliderValue(event, compose(fromHsv(next)))
            }}
          />
          {/* The square is a data visualisation; the two sliders below it are
              the operable controls, which is what the a11y notes require. */}
          <div className="vgui-color-picker__sv" aria-hidden="true" style={{ '--vgui-hue': hueHex } as CSSProperties} />
          <input
            className="vgui-color-picker__slider vgui-color-picker__sv-saturation"
            type="range"
            min={0}
            max={100}
            step={1}
            aria-label="Saturation"
            value={Math.round(hsv.s * 100)}
            disabled={disabled}
            onChange={(event) => {
              const next = { ...hsv, s: Number(event.currentTarget.value) / 100 }
              setHsv(next)
              applySliderValue(event, compose(fromHsv(next)))
            }}
          />
          <input
            className="vgui-color-picker__slider vgui-color-picker__sv-value"
            type="range"
            min={0}
            max={100}
            step={1}
            aria-label="Brightness"
            value={Math.round(hsv.v * 100)}
            disabled={disabled}
            onChange={(event) => {
              const next = { ...hsv, v: Number(event.currentTarget.value) / 100 }
              setHsv(next)
              applySliderValue(event, compose(fromHsv(next)))
            }}
          />
        </div>
      ) : null}

      {alpha ? (
        <input
          className="vgui-color-picker__slider vgui-color-picker__alpha"
          type="range"
          min={0}
          max={255}
          step={1}
          aria-label="Alpha"
          aria-valuetext={`${Math.round((shownAlpha / 255) * 100)}%`}
          value={shownAlpha}
          disabled={disabled}
          onChange={(event) => applySliderValue(event, withAlpha(display, Number(event.currentTarget.value)))}
        />
      ) : null}

      {hex ? (
        <input
          className="vgui-color-picker__hex"
          type="text"
          aria-label="Hex colour"
          aria-invalid={isHex(hexDraft) ? undefined : true}
          spellCheck={false}
          value={hexDraft}
          disabled={disabled}
          onChange={handleHexChange}
          onKeyDown={handleHexKeyDown}
          onBlur={commitHex}
        />
      ) : null}
    </>
  )

  return (
    <div
      ref={setRefs}
      className={classes.join(' ')}
      style={rootStyle}
      {...rest}
    >
      {inline ? (
        <>
          {grid}
          {controls}
        </>
      ) : (
        <>
          <button
            ref={triggerRef}
            type="button"
            className="vgui-color-picker__trigger"
            aria-label={ariaLabel}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={ids.panel}
            disabled={disabled}
            onClick={() => (open ? closePanel() : openPanel())}
            onKeyDown={handleTriggerKeyDown}
          >
            {swatch}
            {swatchOnly ? null : <span className="vgui-color-picker__label">{display}</span>}
            <span className="vgui-color-picker__arrow" aria-hidden="true" />
          </button>
          {open ? (
            <div
              id={ids.panel}
              className="vgui-color-picker__panel"
              role="dialog"
              aria-label="Colour palette"
            >
              {grid}
              {controls}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
})

ColorPicker.displayName = 'ColorPicker'
