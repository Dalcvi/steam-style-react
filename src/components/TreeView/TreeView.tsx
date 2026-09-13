import { Fragment, forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type {
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react'

import './TreeView.css'

export interface TreeNode {
  /** Stable identity; also the React key. */
  id: string
  /** Visible node label. */
  label: string
  /** Child nodes. A node with an empty array still renders a leaf. */
  children?: TreeNode[]
  /** Renders disabled and unselectable. */
  disabled?: boolean
  /** Initial expansion when uncontrolled. */
  defaultExpanded?: boolean
  /** Arbitrary payload returned on selection. */
  data?: unknown
}

export type TreeViewVariant = 'default' | 'sidebar'

export interface TreeViewProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Root nodes, in order. */
  nodes: TreeNode[]
  /** `sidebar` draws the two-sided `TreeViewSubPanel` recess and fills its parent. */
  variant?: TreeViewVariant
  /** Controlled selection. Use `string[]` when `multi` is set. */
  selected?: string | string[]
  /** Initial selection when uncontrolled. */
  defaultSelected?: string | string[]
  /** Allows Ctrl/Shift multi-selection. */
  multi?: boolean
  /** Called with the newly selected node id, or ids when `multi` is set. */
  onSelectedChange?: (ids: string | string[]) => void
  /** Expands nodes when the whole row is clicked, not just the disclosure glyph. */
  expandOnRowClick?: boolean
  /** Indent per level in pixels. Defaults to 16. */
  indentSize?: number
  /** Message rendered when there are no nodes. */
  emptyMessage?: string
  /**
   * Accessible name for the tree, used when neither `aria-label` nor
   * `aria-labelledby` is given. ARIA requires a tree to be named, so it falls
   * back to `"Tree"`.
   */
  label?: string
}

/** How long a run of typed characters keeps building a typeahead query. */
const TYPEAHEAD_RESET_MS = 600

/** `--vgui-tree-indent` defaults to 16px, which is the doc's inference. */
const DEFAULT_INDENT = 16

interface FlatNode {
  node: TreeNode
  level: number
  parentId: string | null
  hasChildren: boolean
}

function toIdArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value.slice() : [value]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** The doc is explicit that a node with an empty array still renders a leaf. */
function hasChildren(node: TreeNode): boolean {
  return Array.isArray(node.children) && node.children.length > 0
}

/**
 * Walks the visible nodes in depth-first order, descending into a subtree only
 * while it is expanded — so this list is both the rendering order and the
 * arrow-key/typeahead order, and a collapsed subtree is simply absent.
 */
function flatten(
  nodes: TreeNode[],
  expanded: Set<string>,
  level = 1,
  parentId: string | null = null,
  out: FlatNode[] = [],
): FlatNode[] {
  for (const node of nodes) {
    const children = hasChildren(node)
    out.push({ node, level, parentId, hasChildren: children })
    if (children && expanded.has(node.id)) {
      flatten(node.children as TreeNode[], expanded, level + 1, node.id, out)
    }
  }
  return out
}

/** `defaultExpanded` seeds the uncontrolled expansion state at every depth. */
function initialExpanded(nodes: TreeNode[]): string[] {
  return nodes.flatMap((node) => [
    ...(node.defaultExpanded ? [node.id] : []),
    ...initialExpanded(Array.isArray(node.children) ? node.children : []),
  ])
}

export const TreeView = forwardRef<HTMLDivElement, TreeViewProps>(function TreeView(
  props,
  forwardedRef,
) {
  const {
    className,
    nodes,
    variant = 'default',
    selected,
    defaultSelected,
    multi = false,
    onSelectedChange,
    expandOnRowClick = false,
    indentSize,
    emptyMessage,
    label,
    style,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...rest
  } = props

  const baseId = useId()
  const nodeRefs = useRef(new Map<string, HTMLDivElement>())
  /**
   * Shift+click anchors on the node that was focused when the range started.
   * It lives in a ref because a pointer press moves DOM focus before the click
   * lands, which would otherwise overwrite the anchor with the clicked node.
   */
  const anchorRef = useRef<string | null>(null)
  const typeaheadRef = useRef<{ query: string; timer: ReturnType<typeof setTimeout> | null }>({
    query: '',
    timer: null,
  })

  const [uncontrolledSelected, setUncontrolledSelected] = useState<string[]>(() =>
    toIdArray(defaultSelected),
  )
  const [expandedIds, setExpandedIds] = useState<string[]>(() => initialExpanded(nodes))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const expandedSet = useMemo(() => new Set(expandedIds), [expandedIds])
  const visible = useMemo(() => flatten(nodes, expandedSet), [expandedSet, nodes])
  const nodeById = useMemo(
    () => new Map(visible.map((entry) => [entry.node.id, entry])),
    [visible],
  )

  const selectedIds = selected === undefined ? uncontrolledSelected : toIdArray(selected)
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  // Roving tabindex: exactly one node is the tab stop. A stale active node (its
  // ancestor collapsed, or its node removed) falls back to the selection and
  // then to the first visible node.
  const fallbackActiveId =
    visible.find((entry) => selectedSet.has(entry.node.id))?.node.id ?? visible[0]?.node.id ?? null
  const activeNodeId =
    activeId !== null && nodeById.has(activeId) ? activeId : fallbackActiveId

  useEffect(() => {
    const typeahead = typeaheadRef.current
    return () => {
      if (typeahead.timer !== null) clearTimeout(typeahead.timer)
    }
  }, [])

  const setNodeRef = useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) nodeRefs.current.set(id, node)
    else nodeRefs.current.delete(id)
  }, [])

  const labelOf = useCallback(
    (id: string) => nodeById.get(id)?.node.label ?? '',
    [nodeById],
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
      const entry = nodeById.get(id)
      const name = (entry?.node.label ?? '').slice(0, 60)
      const state = next.includes(id) ? 'selected' : 'not selected'
      const level = entry?.level ?? 1
      const position = visible.findIndex((candidate) => candidate.node.id === id) + 1
      return [
        `${name || 'Node'}, ${state}`,
        `level ${level}`,
        `${position} of ${visible.length}`,
      ].join(', ')
    },
    [nodeById, visible],
  )

  const focusNode = useCallback((id: string) => {
    setActiveId(id)
    anchorRef.current = id
    const node = nodeRefs.current.get(id)
    if (!node) return
    /**
     * jsdom has no layout engine, so `scrollIntoView` may be a stub or missing
     * entirely; the tree only asks that the active node be brought into view,
     * so a missing implementation is not fatal.
     */
    if (typeof node.scrollIntoView === 'function') node.scrollIntoView({ block: 'nearest' })
    node.focus()
  }, [])

  const moveActive = useCallback(
    (step: number | 'first' | 'last') => {
      const ids = visible.map((entry) => entry.node.id)
      if (ids.length === 0) return

      const current = activeNodeId === null ? -1 : ids.indexOf(activeNodeId)
      const base = current < 0 ? 0 : current
      const next =
        step === 'first'
          ? 0
          : step === 'last'
            ? ids.length - 1
            : clamp(base + step, 0, ids.length - 1)
      focusNode(ids[next])
    },
    [activeNodeId, focusNode, visible],
  )

  const setExpanded = useCallback((id: string, next: boolean) => {
    setExpandedIds((previous) => {
      if (next) return previous.includes(id) ? previous : [...previous, id]
      return previous.includes(id) ? previous.filter((entry) => entry !== id) : previous
    })
  }, [])

  const toggleExpanded = useCallback(
    (id: string) => setExpanded(id, !expandedSet.has(id)),
    [expandedSet, setExpanded],
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

      const ids = visible.map((entry) => entry.node.id)
      if (ids.length === 0) return

      // Disabled nodes advertise their existence but are not typeahead targets.
      const targets = visible
        .filter((entry) => !entry.node.disabled)
        .map((entry) => entry.node.id)
      if (targets.length === 0) return

      const start = activeNodeId === null ? -1 : ids.indexOf(activeNodeId)
      for (let offset = 1; offset <= ids.length; offset += 1) {
        const id = ids[(start + offset + ids.length) % ids.length]
        if (!targets.includes(id)) continue
        if (labelOf(id).toLowerCase().startsWith(buffer)) {
          focusNode(id)
          return
        }
      }
    },
    [activeNodeId, focusNode, labelOf, visible],
  )

  const selectNode = useCallback(
    (id: string, mode: 'replace' | 'toggle' | 'range') => {
      const anchor = anchorRef.current ?? activeNodeId
      const ids = visible.map((entry) => entry.node.id)
      let next: string[]

      const from = anchor === null ? -1 : ids.indexOf(anchor)
      if (mode === 'range' && from >= 0 && anchor !== id) {
        const to = ids.indexOf(id)
        next = ids.slice(Math.min(from, to), Math.max(from, to) + 1)
      } else if (mode === 'range' || mode === 'replace') {
        next = [id]
      } else {
        next =
          selectedSet.has(id)
            ? selectedIds.filter((entry) => entry !== id)
            : [...selectedIds, id]
      }

      // A range keeps its original anchor; every other gesture moves it.
      if (mode !== 'range') anchorRef.current = id

      setAnnouncement(describe(id, next))
      commit(next)
    },
    [activeNodeId, commit, describe, selectedIds, selectedSet, visible],
  )

  const selectByKeyboard = useCallback(
    (id: string) => {
      const entry = nodeById.get(id)
      if (!entry || entry.node.disabled) return
      selectNode(id, multi ? 'toggle' : 'replace')
    },
    [multi, nodeById, selectNode],
  )

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const { key } = event
      const entry = activeNodeId === null ? undefined : nodeById.get(activeNodeId)

      if (key === 'ArrowDown' || key === 'ArrowUp') {
        event.preventDefault()
        moveActive(key === 'ArrowDown' ? 1 : -1)
        return
      }

      if (key === 'ArrowRight' && entry !== undefined) {
        event.preventDefault()
        if (!entry.hasChildren) return
        // An expanded node hands focus to its first child; a collapsed one opens
        // in place.
        if (expandedSet.has(entry.node.id)) {
          const children = entry.node.children as TreeNode[]
          const first = children[0]
          if (first) focusNode(first.id)
          return
        }
        setExpanded(entry.node.id, true)
        return
      }

      if (key === 'ArrowLeft' && entry !== undefined) {
        event.preventDefault()
        // An expanded node closes in place; a collapsed child steps out to its
        // parent, which is the ARIA tree model and costs a keyboard user no
        // second tab stop.
        if (entry.hasChildren && expandedSet.has(entry.node.id)) {
          setExpanded(entry.node.id, false)
          return
        }
        if (entry.parentId !== null) focusNode(entry.parentId)
        return
      }

      if (key === 'Home' || key === 'End') {
        event.preventDefault()
        moveActive(key === 'Home' ? 'first' : 'last')
        return
      }

      if (key === 'Enter' || key === ' ') {
        event.preventDefault()
        if (activeNodeId !== null) selectByKeyboard(activeNodeId)
        return
      }

      if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        typeahead(key)
      }
    },
    [
      activeNodeId,
      expandedSet,
      focusNode,
      moveActive,
      nodeById,
      selectByKeyboard,
      setExpanded,
      typeahead,
    ],
  )

  const handleNodeClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>, node: TreeNode) => {
      if (node.disabled) return

      // Roving tabindex means the pointer must move the active node too.
      setActiveId(node.id)

      // The glyph is decorative (`aria-hidden`) because the row already carries
      // `aria-expanded`, so it is hit-tested here rather than being a second
      // interactive control inside the `treeitem`.
      const clickedGlyph = Boolean(
        (event.target as Element | null)?.closest?.('.vgui-tree__image'),
      )
      if (clickedGlyph && hasChildren(node)) {
        toggleExpanded(node.id)
        return
      }

      if (!multi) {
        selectNode(node.id, 'replace')
      } else if (event.shiftKey) {
        selectNode(node.id, 'range')
      } else {
        selectNode(node.id, event.ctrlKey || event.metaKey ? 'toggle' : 'replace')
      }

      if (expandOnRowClick && hasChildren(node)) toggleExpanded(node.id)
    },
    [expandOnRowClick, multi, selectNode, toggleExpanded],
  )

  const classes = ['vgui-tree']
  classes.push(`vgui-tree--${variant}`)
  if (multi) classes.push('vgui-tree--multi')
  if (nodes.length === 0) classes.push('vgui-tree--empty')
  if (className) classes.push(className)

  const treeStyle = {
    ...style,
    '--vgui-tree-indent': `${indentSize ?? DEFAULT_INDENT}px`,
  } as CSSProperties

  const renderNodes = (children: TreeNode[], level: number): ReactNode =>
    children.map((node) => {
      const nodeHasChildren = hasChildren(node)
      const expanded = nodeHasChildren && expandedSet.has(node.id)
      const isSelected = selectedSet.has(node.id)
      const isActive = node.id === activeNodeId
      const nodeClasses = ['vgui-tree__node']
      if (isSelected) nodeClasses.push('vgui-tree__node--selected')
      if (node.disabled) nodeClasses.push('vgui-tree__node--disabled')

      return (
        <Fragment key={node.id}>
          <div
            id={`${baseId}-node-${node.id}`}
            ref={(element) => setNodeRef(node.id, element)}
            className={nodeClasses.join(' ')}
            role="treeitem"
            aria-level={level}
            // `aria-expanded` only on nodes that have children: announcing
            // "collapsed" for a leaf is a lie.
            aria-expanded={nodeHasChildren ? expanded : undefined}
            aria-selected={isSelected}
            aria-disabled={node.disabled ? true : undefined}
            // Roving tabindex: the active node is the tree's single tab stop.
            tabIndex={isActive ? 0 : -1}
            style={{ '--vgui-tree-level': level - 1 } as CSSProperties}
            // The recipe truncates long labels, so the full text is kept
            // reachable as a tooltip.
            title={node.label}
            onClick={(event) => handleNodeClick(event, node)}
            onFocus={() => {
              // A disabled node may hold the tab stop — the arrow keys walk
              // onto it so its existence is discoverable — but activation is
              // guarded separately in `selectByKeyboard`.
              setActiveId(node.id)
            }}
          >
            <span
              className={`vgui-tree__image${
                nodeHasChildren
                  ? expanded
                    ? ' vgui-tree__image--expanded'
                    : ' vgui-tree__image--collapsed'
                  : ' vgui-tree__image--leaf'
              }`}
              aria-hidden="true"
            />
            <span className="vgui-tree__text">{node.label}</span>
          </div>
          {/* `role="group"` is what makes `aria-level` mean anything; a
              collapsed subtree is unmounted rather than hidden so it leaves the
              accessibility tree with its `aria-expanded="false"` parent. */}
          {expanded ? (
            <div className="vgui-tree__group" role="group">
              {renderNodes(node.children ?? [], level + 1)}
            </div>
          ) : null}
        </Fragment>
      )
    })

  const isEmpty = nodes.length === 0

  return (
    <div ref={forwardedRef} className={classes.join(' ')} style={treeStyle} {...rest}>
      {isEmpty ? (
        // An empty `tree` is itself an `aria-required-children` violation, so
        // the empty state drops the widget and announces through a status
        // region instead of a dangling role.
        <div className="vgui-tree__subpanel">
          <p className="vgui-tree__empty" role="status">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <>
          <div
            className="vgui-tree__subpanel"
            role="tree"
            aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? label ?? 'Tree')}
            aria-labelledby={ariaLabelledBy}
            aria-multiselectable={multi ? true : undefined}
            onKeyDown={handleKeyDown}
          >
            {renderNodes(nodes, 1)}
          </div>
          <div className="vgui-tree__live" role="status">
            {announcement}
          </div>
        </>
      )}
    </div>
  )
})

TreeView.displayName = 'TreeView'
