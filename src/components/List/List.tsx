import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type {
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react'

import './List.css'

export interface ListRow {
  /** Stable identity; also the React key. */
  id: string
  /** Row content when used flat; see Table for named columns. */
  content: ReactNode
  /** Renders as non-interactive and dimmed. */
  disabled?: boolean
  /** Arbitrary payload returned by onSelectedChange. */
  data?: unknown
}

export interface ListSection {
  /** Stable identity for the section. */
  id: string
  /** Optional heading, rendered in the Over/maize colour. */
  title?: string
  /** Rows in this section. */
  rows: ListRow[]
}

export interface ListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Rows, or sections when `grouped` is set. */
  items: ListRow[] | ListSection[]
  /** Treats `items` as `ListSection[]` and renders collapsers. */
  grouped?: boolean
  /** Uses the raised `CGamesListPanel` bevel instead of the recessed well. */
  raised?: boolean
  /** Controlled selection. Use `string[]` when `multi` is set. */
  selected?: string | string[]
  /** Initial selection when uncontrolled. */
  defaultSelected?: string | string[]
  /** Allows Ctrl/Shift multi-selection. */
  multi?: boolean
  /** Called with the new selection. */
  onSelectedChange?: (ids: string | string[]) => void
  /** Message rendered when there are no rows. */
  emptyMessage?: string
  /** Row pitch in pixels. Defaults to 17. */
  rowHeight?: number
  /**
   * Accessible name for the listbox, used when neither `aria-label` nor
   * `aria-labelledby` is given. ARIA requires a listbox to be named, so it
   * falls back to `"List"`.
   */
  label?: string
}

/** `PerPixelScrolling "1"` implies the pitch is a runtime value; 17px is the doc's guess. */
const DEFAULT_ROW_PITCH = 17

/** How long a run of typed characters keeps building a typeahead query. */
const TYPEAHEAD_RESET_MS = 600

/** A flat list is one unnamed section; it never renders a collapser. */
const FLAT_SECTION_ID = '__list'

function toIdArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value.slice() : [value]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export const List = forwardRef<HTMLDivElement, ListProps>(function List(props, forwardedRef) {
  const {
    className,
    items,
    grouped = false,
    raised = false,
    selected,
    defaultSelected,
    multi = false,
    onSelectedChange,
    emptyMessage,
    rowHeight,
    label,
    style,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...rest
  } = props

  const baseId = useId()
  const rowRefs = useRef(new Map<string, HTMLDivElement>())
  /**
   * Shift+click anchors on the row that was focused when the range started.
   * It lives in a ref because a pointer press moves DOM focus before the click
   * lands, which would otherwise overwrite the anchor with the clicked row.
   */
  const anchorRef = useRef<string | null>(null)
  const typeaheadRef = useRef<{ query: string; timer: ReturnType<typeof setTimeout> | null }>({
    query: '',
    timer: null,
  })

  // Sections are always materialised so the flat and grouped paths share one
  // renderer; a flat list is a single section with no header.
  const sections = useMemo<ListSection[]>(() => {
    if (grouped) {
      return (items as ListSection[]).map((section) => ({
        id: section.id,
        title: section.title,
        rows: Array.isArray(section.rows) ? section.rows : [],
      }))
    }
    return [{ id: FLAT_SECTION_ID, rows: items as ListRow[] }]
  }, [grouped, items])

  const [collapsedSections, setCollapsedSections] = useState<string[]>([])
  const [uncontrolledSelected, setUncontrolledSelected] = useState<string[]>(() =>
    toIdArray(defaultSelected),
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const allRows = useMemo(() => sections.flatMap((section) => section.rows), [sections])
  const selectedIds = selected === undefined ? uncontrolledSelected : toIdArray(selected)
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  // Rows inside a collapsed section stay mounted but out of the a11y tree, so
  // they drop out of arrow-key navigation too.
  const navigableRows = useMemo(
    () =>
      sections
        .filter((section) => !collapsedSections.includes(section.id))
        .flatMap((section) => section.rows),
    [collapsedSections, sections],
  )

  // Roving tabindex: exactly one row is the tab stop. A stale active row (its
  // section collapsed, or its row removed) falls back to the selection and then
  // to the first row.
  const fallbackActiveId =
    navigableRows.find((row) => selectedSet.has(row.id))?.id ?? navigableRows[0]?.id ?? null
  const activeRowId =
    activeId !== null && navigableRows.some((row) => row.id === activeId)
      ? activeId
      : fallbackActiveId

  useEffect(() => {
    const typeahead = typeaheadRef.current
    return () => {
      if (typeahead.timer !== null) clearTimeout(typeahead.timer)
    }
  }, [])

  const setRowRef = useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) rowRefs.current.set(id, node)
    else rowRefs.current.delete(id)
  }, [])

  const textOf = useCallback(
    (id: string) => (rowRefs.current.get(id)?.textContent ?? '').trim(),
    [],
  )

  const commit = useCallback(
    (next: string[]) => {
      if (selected === undefined) setUncontrolledSelected(next)
      onSelectedChange?.(multi ? next : (next[0] ?? ''))
    },
    [multi, onSelectedChange, selected],
  )

  const describe = useCallback(
    (id: string, next: string[]) => {
      const name = textOf(id).slice(0, 60)
      const position = allRows.findIndex((row) => row.id === id) + 1
      const state = next.includes(id) ? 'selected' : 'not selected'
      return [`${name || 'Row'}, ${state}`, `${position} of ${allRows.length}`].join(', ')
    },
    [allRows, textOf],
  )

  const focusRow = useCallback((id: string) => {
    setActiveId(id)
    anchorRef.current = id
    const node = rowRefs.current.get(id)
    if (!node) return
    /**
     * jsdom has no layout engine, so `scrollIntoView` may be a stub or missing
     * entirely; `PerPixelScrolling` only asks that the active row be brought
     * into view, so a missing implementation is not fatal.
     */
    if (typeof node.scrollIntoView === 'function') node.scrollIntoView({ block: 'nearest' })
    node.focus()
  }, [])

  const moveActive = useCallback(
    (step: number | 'first' | 'last') => {
      const ids = navigableRows.map((row) => row.id)
      if (ids.length === 0) return

      const current = activeRowId === null ? -1 : ids.indexOf(activeRowId)
      const base = current < 0 ? 0 : current
      const next =
        step === 'first' ? 0 : step === 'last' ? ids.length - 1 : clamp(base + step, 0, ids.length - 1)
      focusRow(ids[next])
    },
    [activeRowId, focusRow, navigableRows],
  )

  const typeahead = useCallback(
    (character: string) => {
      const state = typeaheadRef.current
      const buffer = (state.query + character).toLowerCase()
      state.query = buffer
      if (state.timer !== null) clearTimeout(state.timer)
      state.timer = setTimeout(() => {
        state.query = ''
      }, TYPEAHEAD_RESET_MS)

      const ids = navigableRows.map((row) => row.id)
      if (ids.length === 0) return

      // Disabled rows advertise their existence but are not typeahead targets.
      const targets = navigableRows.filter((row) => !row.disabled).map((row) => row.id)
      if (targets.length === 0) return

      const start = activeRowId === null ? -1 : ids.indexOf(activeRowId)
      for (let offset = 1; offset <= ids.length; offset += 1) {
        const id = ids[(start + offset + ids.length) % ids.length]
        if (!targets.includes(id)) continue
        if (textOf(id).toLowerCase().startsWith(buffer)) {
          focusRow(id)
          return
        }
      }
    },
    [activeRowId, focusRow, navigableRows, textOf],
  )

  const selectRow = useCallback(
    (id: string, mode: 'replace' | 'toggle' | 'range') => {
      const anchor = anchorRef.current ?? activeRowId
      let next: string[]

      if (mode === 'range' && anchor !== null && anchor !== id) {
        const ids = allRows.map((row) => row.id)
        const from = ids.indexOf(anchor)
        const to = ids.indexOf(id)
        next = ids.slice(Math.min(from, to), Math.max(from, to) + 1)
      } else if (mode === 'range' || mode === 'replace') {
        next = [id]
      } else {
        next = selectedSet.has(id) ? selectedIds.filter((entry) => entry !== id) : [...selectedIds, id]
      }

      // A range keeps its original anchor; every other gesture moves it.
      if (mode !== 'range') anchorRef.current = id

      setAnnouncement(describe(id, next))
      commit(next)
    },
    [activeRowId, allRows, commit, describe, selectedIds, selectedSet],
  )

  const activate = useCallback(
    (id: string) => {
      const row = allRows.find((entry) => entry.id === id)
      if (!row || row.disabled) return
      selectRow(id, multi ? 'toggle' : 'replace')
    },
    [allRows, multi, selectRow],
  )

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const { key } = event

      if (key === 'ArrowDown' || key === 'ArrowUp') {
        event.preventDefault()
        moveActive(key === 'ArrowDown' ? 1 : -1)
        return
      }

      if (key === 'Home' || key === 'End') {
        event.preventDefault()
        moveActive(key === 'Home' ? 'first' : 'last')
        return
      }

      if (key === 'Enter' || key === ' ') {
        event.preventDefault()
        if (activeRowId !== null) activate(activeRowId)
        return
      }

      if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        typeahead(key)
      }
    },
    [activate, activeRowId, moveActive, typeahead],
  )

  const handleRowClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>, id: string) => {
      const row = allRows.find((entry) => entry.id === id)
      if (!row || row.disabled) return

      // Roving tabindex means the pointer must move the active row too.
      setActiveId(id)

      if (!multi) {
        selectRow(id, 'replace')
        return
      }
      if (event.shiftKey) {
        selectRow(id, 'range')
        return
      }
      selectRow(id, event.ctrlKey || event.metaKey ? 'toggle' : 'replace')
    },
    [allRows, multi, selectRow],
  )

  const toggleSection = useCallback((id: string) => {
    setCollapsedSections((previous) =>
      previous.includes(id) ? previous.filter((entry) => entry !== id) : [...previous, id],
    )
  }, [])

  const classes = ['vgui-list']
  classes.push(raised ? 'vgui-list--raised' : 'vgui-list--recessed')
  if (grouped) classes.push('vgui-list--sectioned')
  if (multi) classes.push('vgui-list--multi')
  if (allRows.length === 0) classes.push('vgui-list--empty')
  if (className) classes.push(className)

  const listStyle = {
    ...style,
    '--vgui-list-row-height': `${rowHeight ?? DEFAULT_ROW_PITCH}px`,
  } as CSSProperties

  const isEmpty = allRows.length === 0

  const renderRow = (row: ListRow) => {
    const isSelected = selectedSet.has(row.id)
    const rowClasses = ['vgui-list__row']
    if (isSelected) rowClasses.push('vgui-list__row--selected')
    if (row.disabled) rowClasses.push('vgui-list__row--disabled')

    return (
      <div
        key={row.id}
        id={`${baseId}-row-${row.id}`}
        ref={(node) => setRowRef(row.id, node)}
        className={rowClasses.join(' ')}
        role="option"
        aria-selected={isSelected}
        aria-disabled={row.disabled ? true : undefined}
        // Roving tabindex: the active row is the listbox's single tab stop.
        tabIndex={row.id === activeRowId ? 0 : -1}
        onClick={(event) => handleRowClick(event, row.id)}
        onFocus={() => setActiveId(row.id)}
      >
        <span className="vgui-list__label">{row.content}</span>
      </div>
    )
  }

  return (
    <div ref={forwardedRef} className={classes.join(' ')} style={listStyle} {...rest}>
      <div className="vgui-list__interior">
        {isEmpty ? (
          // An empty `listbox` is itself an `aria-required-children` violation,
          // so the empty state drops the widget and announces through a status
          // region instead of a dangling `aria-describedby`.
          <p className="vgui-list__empty" role="status">
            {emptyMessage}
          </p>
        ) : (
          <>
            {sections.map((section, index) => {
              const titled = grouped && section.title !== undefined
              const titleId = `${baseId}-${section.id}-title`
              const rowsId = `${baseId}-${section.id}-rows`
              const collapsed = collapsedSections.includes(section.id)
              const sectionName =
                grouped && label !== undefined ? `${label}: ${section.title ?? index + 1}` : label

              return (
                <div key={section.id} className="vgui-list__section">
                  {grouped ? (
                    <div className="vgui-list__section-header">
                      <button
                        type="button"
                        className="vgui-list__collapser"
                        aria-expanded={!collapsed}
                        aria-controls={rowsId}
                        aria-label={
                          section.title === undefined
                            ? `${collapsed ? 'Expand' : 'Collapse'} section ${index + 1}`
                            : `${collapsed ? 'Expand' : 'Collapse'} ${section.title}`
                        }
                        onClick={() => toggleSection(section.id)}
                      >
                        <span
                          className="vgui-list__collapser-glyph"
                          data-state={collapsed ? 'collapsed' : 'expanded'}
                          aria-hidden="true"
                        />
                      </button>
                      {section.title !== undefined ? (
                        <span className="vgui-list__section-title" id={titleId} aria-hidden="true">
                          {section.title}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <div
                    id={rowsId}
                    className="vgui-list__rows"
                    role="listbox"
                    aria-labelledby={titled ? titleId : ariaLabelledBy}
                    aria-label={
                      titled || ariaLabelledBy
                        ? undefined
                        : grouped
                          ? (sectionName ?? 'List')
                          : (ariaLabel ?? sectionName ?? 'List')
                    }
                    aria-multiselectable={multi ? true : undefined}
                    hidden={grouped ? collapsed : undefined}
                    onKeyDown={handleKeyDown}
                  >
                    {section.rows.map(renderRow)}
                  </div>
                </div>
              )
            })}
            <div className="vgui-list__live" role="status">
              {announcement}
            </div>
          </>
        )}
      </div>
    </div>
  )
})

List.displayName = 'List'
