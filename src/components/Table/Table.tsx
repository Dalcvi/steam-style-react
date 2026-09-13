import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react'

import './Table.css'

export interface TableSort {
  /** Column the rows are ordered by. */
  columnId: string
  /** Ordering direction. */
  direction: 'asc' | 'desc'
}

export interface TableColumn<Row> {
  /** Stable identity; also the aria-colindex key. */
  id: string
  /** Header label. */
  header: string
  /** Cell renderer for a row. */
  cell: (row: Row) => ReactNode
  /** Fixed width in pixels; omit to flex. */
  width?: number
  /** Initial width when resizable and uncontrolled. */
  defaultWidth?: number
  /**
   * Value the rows are ordered by. Falls back to the rendered text when the
   * cell produces a string or a number, and to nothing otherwise — a cell
   * holding markup has no order the component could guess.
   */
  sortValue?: (row: Row) => string | number
  /** Makes the header a sort button for this column. */
  sortable?: boolean
  /** Header alignment; VGUI headers are left-aligned. */
  align?: 'start' | 'center' | 'end'
  /** Optional header glyph, e.g. the VAC shield. */
  headerIcon?: ReactNode
}

export interface TableProps<Row> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Column definitions, in display order. */
  columns: TableColumn<Row>[]
  /** Row data. */
  rows: Row[]
  /** Returns the stable id used for selection and React keys. */
  rowId: (row: Row) => string
  /** Controlled selection. Use `string[]` when `multi` is set. */
  selected?: string | string[]
  /** Initial selection when uncontrolled. */
  defaultSelected?: string | string[]
  /** Allows Ctrl/Shift multi-selection. */
  multi?: boolean
  /** Called with the new selection. */
  onSelectedChange?: (ids: string | string[]) => void
  /** Controlled sort. */
  sort?: TableSort
  /** Called when a sortable header is activated. */
  onSortChange?: (sort: TableSort) => void
  /** Allows column resizing with a visible dragger. */
  resizable?: boolean
  /** Called with the new width after a resize gesture ends. */
  onColumnResize?: (columnId: string, width: number) => void
  /** Renders headers in uppercase, as the main client window does. */
  headerUppercase?: boolean
  /** Sticky header. No corpus precedent; see Open questions. */
  stickyHeader?: boolean
  /** Message shown in the grid's single row when there are no rows. */
  emptyMessage?: string
  /** Sets `aria-busy` on the grid while a refresh is in flight. */
  busy?: boolean
}

/** No column widths exist in the corpus, so an unresized flex column still
 * needs a number: `aria-valuenow` has to report something. */
const FALLBACK_COLUMN_WIDTH = 120

/** WCAG 2.5.8 again — a column narrower than this cannot be grabbed. */
const MIN_COLUMN_WIDTH = 24

/** One arrow keypress on the dragger; a round number inside the 2/4/8 scale. */
const RESIZE_STEP = 8

/** How long a run of typed characters keeps building a typeahead query. */
const TYPEAHEAD_RESET_MS = 600

function toIdArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value.slice() : [value]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function toSortKey(value: ReactNode): string | number {
  return typeof value === 'string' || typeof value === 'number' ? value : ''
}

function compare(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') {
    // A NaN from either side would make the comparator non-transitive.
    if (Number.isNaN(a) || Number.isNaN(b)) return 0
    return a - b
  }
  return String(a).localeCompare(String(b))
}

export function Table<Row>(props: TableProps<Row>) {
  const {
    className,
    columns,
    rows,
    rowId,
    selected,
    defaultSelected,
    multi = false,
    onSelectedChange,
    sort,
    onSortChange,
    resizable = false,
    onColumnResize,
    headerUppercase = false,
    stickyHeader = false,
    emptyMessage = 'No rows.',
    busy = false,
    style,
    'aria-label': ariaLabel,
    ...rest
  } = props

  const [uncontrolledSelected, setUncontrolledSelected] = useState<string[]>(() =>
    toIdArray(defaultSelected),
  )
  const [uncontrolledSort, setUncontrolledSort] = useState<TableSort | null>(null)
  const [widths, setWidths] = useState<Record<string, number>>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const [headerIndex, setHeaderIndex] = useState(0)

  const rowRefs = useRef(new Map<string, HTMLDivElement>())
  const headerRefs = useRef(new Map<string, HTMLButtonElement>())
  const typeaheadRef = useRef<{ query: string; timer: ReturnType<typeof setTimeout> | null }>({
    query: '',
    timer: null,
  })
  /**
   * Shift+click anchors on the row that was active when the range started. It
   * lives in a ref because a pointer press moves DOM focus before the click
   * lands, which would otherwise overwrite the anchor with the clicked row.
   */
  const anchorRef = useRef<string | null>(null)

  const activeSort = sort === undefined ? uncontrolledSort : sort
  const selectedIds = selected === undefined ? uncontrolledSelected : toIdArray(selected)
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  // Sorting is applied here rather than by the caller so a controlled `sort`
  // still reorders the rows; `sortValue` is the only way to order markup cells.
  const orderedRows = useMemo(() => {
    const column = activeSort ? columns.find((entry) => entry.id === activeSort.columnId) : undefined
    if (!activeSort || !column) return rows

    const valueOf = column.sortValue ?? ((row: Row) => toSortKey(column.cell(row)))
    const direction = activeSort.direction === 'asc' ? 1 : -1
    // `Array.prototype.sort` is stable, so rows that compare equal keep their
    // original order instead of shuffling on every render.
    return rows.slice().sort((a, b) => compare(valueOf(a), valueOf(b)) * direction)
  }, [activeSort, columns, rows])

  const ids = useMemo(() => orderedRows.map((row) => rowId(row)), [orderedRows, rowId])
  const isEmpty = ids.length === 0

  const sortableColumns = useMemo(() => columns.filter((column) => column.sortable), [columns])
  const activeHeader = sortableColumns.length === 0 ? -1 : clamp(headerIndex, 0, sortableColumns.length - 1)

  const fallbackActiveId = ids.find((id) => selectedSet.has(id)) ?? ids[0] ?? null
  const activeRowId = activeId !== null && ids.includes(activeId) ? activeId : fallbackActiveId

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

  const textOf = useCallback((id: string) => (rowRefs.current.get(id)?.textContent ?? '').trim(), [])

  const commit = useCallback(
    (next: string[]) => {
      if (selected === undefined) setUncontrolledSelected(next)
      onSelectedChange?.(multi ? next : (next[0] ?? ''))
    },
    [multi, onSelectedChange, selected],
  )

  const focusRow = useCallback((id: string) => {
    setActiveId(id)
    anchorRef.current = id
    const node = rowRefs.current.get(id)
    if (!node) return
    /**
     * jsdom has no layout engine, so `scrollIntoView` may be a stub or missing
     * entirely; the active row is still the active row without it.
     */
    if (typeof node.scrollIntoView === 'function') node.scrollIntoView({ block: 'nearest' })
    node.focus()
  }, [])

  const moveActive = useCallback(
    (step: number | 'first' | 'last') => {
      if (ids.length === 0) return
      const current = activeRowId === null ? -1 : ids.indexOf(activeRowId)
      const base = current < 0 ? 0 : current
      const next =
        step === 'first' ? 0 : step === 'last' ? ids.length - 1 : clamp(base + step, 0, ids.length - 1)
      focusRow(ids[next])
    },
    [activeRowId, focusRow, ids],
  )

  const selectRow = useCallback(
    (id: string, mode: 'replace' | 'toggle' | 'range') => {
      const anchor = anchorRef.current ?? activeRowId
      let next: string[]

      if (mode === 'range' && anchor !== null && anchor !== id) {
        const from = ids.indexOf(anchor)
        const to = ids.indexOf(id)
        next = ids.slice(Math.min(from, to), Math.max(from, to) + 1)
      } else if (mode === 'range' || mode === 'replace') {
        next = [id]
      } else {
        next = selectedSet.has(id)
          ? selectedIds.filter((entry) => entry !== id)
          : [...selectedIds, id]
      }

      // A range keeps its original anchor; every other gesture moves it.
      if (mode !== 'range') anchorRef.current = id
      commit(next)
    },
    [activeRowId, commit, ids, selectedIds, selectedSet],
  )

  const activate = useCallback(
    (id: string) => {
      selectRow(id, multi ? 'toggle' : 'replace')
    },
    [multi, selectRow],
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

      if (ids.length === 0) return
      const start = activeRowId === null ? -1 : ids.indexOf(activeRowId)
      for (let offset = 1; offset <= ids.length; offset += 1) {
        const id = ids[(start + offset + ids.length) % ids.length]
        if (textOf(id).toLowerCase().startsWith(buffer)) {
          focusRow(id)
          return
        }
      }
    },
    [activeRowId, focusRow, ids, textOf],
  )

  const handleRowKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const { key } = event

      if (key === 'ArrowDown') {
        event.preventDefault()
        moveActive(1)
        return
      }

      if (key === 'ArrowUp') {
        event.preventDefault()
        // The first row hands focus back to the sortable header strip, which is
        // the grid's single tab stop, so the grid is not a keyboard dead end.
        if (activeRowId === ids[0] && sortableColumns.length > 0) {
          const header = sortableColumns[activeHeader]
          if (header) headerRefs.current.get(header.id)?.focus()
          return
        }
        moveActive(-1)
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
    [activate, activeHeader, activeRowId, ids, moveActive, sortableColumns, typeahead],
  )

  const handleRowClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>, id: string) => {
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
    [multi, selectRow],
  )

  const cycleSort = useCallback(
    (columnId: string) => {
      // `TableSort` carries no third value, so the cycle is asc → desc → asc.
      // A caller that wants the sorted state cleared passes `sort={undefined}`.
      const direction = activeSort?.columnId === columnId && activeSort.direction === 'asc' ? 'desc' : 'asc'
      const next: TableSort = { columnId, direction }
      if (sort === undefined) setUncontrolledSort(next)
      onSortChange?.(next)
    },
    [activeSort, onSortChange, sort],
  )

  const focusHeader = useCallback(
    (index: number) => {
      if (sortableColumns.length === 0) return
      const next = clamp(index, 0, sortableColumns.length - 1)
      setHeaderIndex(next)
      headerRefs.current.get(sortableColumns[next].id)?.focus()
    },
    [sortableColumns],
  )

  const handleHeaderKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      const { key } = event

      if (key === 'ArrowRight') {
        event.preventDefault()
        focusHeader(index + 1)
        return
      }
      if (key === 'ArrowLeft') {
        event.preventDefault()
        focusHeader(index - 1)
        return
      }
      if (key === 'Home' || key === 'End') {
        event.preventDefault()
        focusHeader(key === 'Home' ? 0 : sortableColumns.length - 1)
        return
      }
      // The single tab stop lands on the header strip, so the rows sit one
      // ArrowDown away and the grid is reachable in both directions.
      if (key === 'ArrowDown') {
        event.preventDefault()
        if (ids[0] !== undefined) focusRow(ids[0])
      }
    },
    [focusHeader, focusRow, ids, sortableColumns.length],
  )

  const widthOf = useCallback(
    (column: TableColumn<Row>) => widths[column.id] ?? column.defaultWidth ?? column.width,
    [widths],
  )

  const applyWidth = useCallback((columnId: string, width: number) => {
    const next = Number.isFinite(width) ? Math.max(MIN_COLUMN_WIDTH, Math.round(width)) : MIN_COLUMN_WIDTH
    setWidths((previous) => ({ ...previous, [columnId]: next }))
    return next
  }, [])

  const handleDraggerKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>, column: TableColumn<Row>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      const current = widthOf(column) ?? FALLBACK_COLUMN_WIDTH
      const step = event.key === 'ArrowLeft' ? -RESIZE_STEP : RESIZE_STEP
      const next = applyWidth(column.id, current + step)
      onColumnResize?.(column.id, next)
    },
    [applyWidth, onColumnResize, widthOf],
  )

  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ columnId: string; startX: number; startWidth: number; width: number } | null>(
    null,
  )

  const handleDraggerPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, column: TableColumn<Row>) => {
      const startWidth = widthOf(column) ?? FALLBACK_COLUMN_WIDTH
      dragRef.current = { columnId: column.id, startX: event.clientX, startWidth, width: startWidth }
      setDragging(true)
    },
    [widthOf],
  )

  useEffect(() => {
    if (!dragging) return

    const handleMove = (event: PointerEvent) => {
      const drag = dragRef.current
      // jsdom reports no coordinates at all, so a synthetic drag is a no-op
      // rather than a resize to NaN.
      if (!drag || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return
      drag.width = applyWidth(drag.columnId, drag.startWidth + (event.clientX - drag.startX))
    }

    const handleUp = () => {
      const drag = dragRef.current
      dragRef.current = null
      setDragging(false)
      if (drag) onColumnResize?.(drag.columnId, drag.width)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [applyWidth, dragging, onColumnResize])

  const columnStyle = useCallback(
    (column: TableColumn<Row>): CSSProperties => {
      const width = widthOf(column)
      return width === undefined
        ? { flex: '1 1 auto', minWidth: 0 }
        : { flex: `0 0 ${width}px`, width }
    },
    [widthOf],
  )

  const gridClassName = [
    'vgui-table',
    headerUppercase ? 'vgui-table--header-uppercase' : null,
    resizable ? 'vgui-table--resizable' : null,
    stickyHeader ? 'vgui-table--sticky' : null,
    dragging ? 'vgui-table--dragging' : null,
    className ?? null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      {...rest}
      className={gridClassName}
      style={style}
      role="grid"
      aria-label={ariaLabel}
      aria-colcount={columns.length}
      aria-rowcount={ids.length}
      aria-multiselectable={multi ? true : undefined}
      aria-busy={busy || undefined}
    >
      <div className="vgui-table__head" role="row">
        {columns.map((column, index) => {
          const sorted = activeSort?.columnId === column.id
          const sortableIndex = sortableColumns.indexOf(column)
          const label = (
            <span className="vgui-table__th-label">
              {column.headerIcon ? (
                <span className="vgui-table__th-icon" aria-hidden="true">
                  {column.headerIcon}
                </span>
              ) : null}
              {column.header}
            </span>
          )

          return (
            <div
              key={column.id}
              className="vgui-table__th"
              role="columnheader"
              aria-colindex={index + 1}
              // `none` is never emitted: an unsorted header carries no state at
              // all, so `aria-sort` is absent rather than falsely neutral.
              aria-sort={sorted ? (activeSort?.direction === 'asc' ? 'ascending' : 'descending') : undefined}
              data-align={column.align ?? 'start'}
              style={columnStyle(column)}
            >
              {column.sortable ? (
                <button
                  type="button"
                  className="vgui-table__sort"
                  ref={(node) => {
                    if (node) headerRefs.current.set(column.id, node)
                    else headerRefs.current.delete(column.id)
                  }}
                  tabIndex={sortableIndex === activeHeader ? 0 : -1}
                  onClick={() => cycleSort(column.id)}
                  onKeyDown={(event) => handleHeaderKeyDown(event, sortableIndex)}
                >
                  {label}
                  <span
                    className="vgui-table__sort-indicator"
                    data-direction={sorted ? activeSort?.direction : 'none'}
                    aria-hidden="true"
                  />
                </button>
              ) : (
                label
              )}
              {resizable ? (
                <div
                  className="vgui-table__dragger"
                  role="separator"
                  aria-orientation="vertical"
                  aria-label={`Resize ${column.header} column`}
                  aria-valuemin={MIN_COLUMN_WIDTH}
                  aria-valuenow={widthOf(column) ?? FALLBACK_COLUMN_WIDTH}
                  tabIndex={0}
                  onPointerDown={(event) => handleDraggerPointerDown(event, column)}
                  onKeyDown={(event) => handleDraggerKeyDown(event, column)}
                />
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="vgui-table__body" role="rowgroup">
        {isEmpty ? (
          <div className="vgui-table__row vgui-table__row--empty" role="row">
            {/*
             * An empty `rowgroup` is an `aria-required-children` violation, so
             * the empty state keeps the grid and its headers — a refresh should
             * not take the column strip away — and puts the message in one cell
             * that spans the grid. No `aria-rowindex` here: the grid's
             * `aria-rowcount` is 0, and a message is not a row of data. The
             * message is a live region without changing the cell's role.
             */}
            <div
              className="vgui-table__cell vgui-table__empty"
              role="gridcell"
              aria-colindex={1}
              aria-colspan={columns.length}
              aria-live="polite"
            >
              {emptyMessage}
            </div>
          </div>
        ) : (
          orderedRows.map((row, index) => {
            const id = rowId(row)
            const isSelected = selectedSet.has(id)

            return (
              <div
                key={id}
                ref={(node) => setRowRef(id, node)}
                className={['vgui-table__row', isSelected ? 'vgui-table__row--selected' : null]
                  .filter(Boolean)
                  .join(' ')}
                role="row"
                aria-rowindex={index + 1}
                aria-selected={isSelected}
                tabIndex={id === activeRowId ? 0 : -1}
                onClick={(event) => handleRowClick(event, id)}
                onFocus={() => setActiveId(id)}
                onKeyDown={handleRowKeyDown}
              >
                {columns.map((column, columnIndex) => (
                  <div
                    key={column.id}
                    className="vgui-table__cell"
                    role="gridcell"
                    aria-colindex={columnIndex + 1}
                    data-align={column.align ?? 'start'}
                    style={columnStyle(column)}
                  >
                    {column.cell(row)}
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
