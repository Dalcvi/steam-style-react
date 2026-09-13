import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode } from 'react'

import './Tabs.css'

export interface TabSpec {
  /** Stable identity, used for the id/aria-controls pair. */
  id: string
  /** Visible tab label. */
  label: string
  /** Panel content rendered when this tab is selected. */
  content: ReactNode
  /** Renders a close affordance in the tab. */
  closable?: boolean
  /** Called when the close affordance is activated. */
  onClose?: () => void
  /** Renders as disabled and unselectable. */
  disabled?: boolean
  /** Panel content is not rendered until first activation. */
  lazy?: boolean
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  /** Tabs in order. The first enabled tab is selected when uncontrolled. */
  tabs: TabSpec[]
  /** Controlled selection. Pair with onValueChange. */
  value?: string
  /** Initial selection when uncontrolled. */
  defaultValue?: string
  /** Called with the newly selected tab id. */
  onValueChange?: (id: string) => void
  /** Selection follows focus, as VGUI's tab strip behaves. Defaults to true. */
  activateOnFocus?: boolean
  /** Panel surface. 'clay' is the VGUI property-sheet interior. */
  variant?: 'clay' | 'green'
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    tabs,
    value,
    defaultValue,
    onValueChange,
    activateOnFocus = true,
    variant = 'clay',
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...rest
  },
  ref,
) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const [visited, setVisited] = useState<string[]>(() => (defaultValue ? [defaultValue] : []))
  const baseId = useId()
  const tabNodes = useRef(new Map<string, HTMLButtonElement | HTMLDivElement>())

  const firstEnabled = tabs.find((tab) => !tab.disabled)?.id
  const requestedId = value !== undefined ? value : uncontrolledValue
  const requested = tabs.find((tab) => tab.id === requestedId)
  const selectedId = requested && !requested.disabled ? requested.id : firstEnabled

  // A lazy panel stays mounted once it has been shown, so switching away and
  // back does not throw away scroll position or form state.
  useEffect(() => {
    if (selectedId && !visited.includes(selectedId)) {
      setVisited((seen) => [...seen, selectedId])
    }
  }, [selectedId, visited])

  const setTabNode = (id: string, node: HTMLButtonElement | HTMLDivElement | null) => {
    if (node) {
      tabNodes.current.set(id, node)
    } else {
      tabNodes.current.delete(id)
    }
  }

  const selectTab = (nextId: string) => {
    const tab = tabs.find((item) => item.id === nextId)
    if (!tab || tab.disabled) return
    if (value === undefined) setUncontrolledValue(nextId)
    if (nextId !== selectedId) onValueChange?.(nextId)
  }

  const focusTab = (nextId: string | undefined) => {
    if (!nextId) return
    if (activateOnFocus) selectTab(nextId)
    tabNodes.current.get(nextId)?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = (event.target as HTMLElement | null)?.closest<HTMLElement>('[role="tab"]')
    const currentId = current?.dataset.tabId
    if (!currentId) return
    const enabledIds = tabs.filter((tab) => !tab.disabled).map((tab) => tab.id)
    const index = enabledIds.indexOf(currentId)
    if (index === -1) return

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        focusTab(enabledIds[(index + 1) % enabledIds.length])
        break
      case 'ArrowLeft':
        event.preventDefault()
        focusTab(enabledIds[(index - 1 + enabledIds.length) % enabledIds.length])
        break
      case 'Home':
        event.preventDefault()
        focusTab(enabledIds[0])
        break
      case 'End':
        event.preventDefault()
        focusTab(enabledIds[enabledIds.length - 1])
        break
      case 'Delete':
        event.preventDefault()
        tabs.find((tab) => tab.id === currentId)?.onClose?.()
        break
      default:
        break
    }
  }

  const rootClasses = ['vgui-tabs', `vgui-tabs--${variant}`]
  if (tabs.some((tab) => tab.closable)) rootClasses.push('vgui-tabs--closable')
  if (className) rootClasses.push(className)

  const panelClasses = ['vgui-tabs__panel', `vgui-tabs__panel--${variant}`]

  return (
    <div className={rootClasses.join(' ')} ref={ref} {...rest}>
      <div
        className="vgui-tabs__strip"
        role="tablist"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => {
          const isSelected = tab.id === selectedId
          const tabClasses = ['vgui-tabs__tab']
          if (isSelected) tabClasses.push('vgui-tabs__tab--selected')
          if (tab.disabled) tabClasses.push('vgui-tabs__tab--disabled')

          const shared = {
            className: tabClasses.join(' '),
            id: `${baseId}-tab-${tab.id}`,
            role: 'tab' as const,
            'aria-selected': isSelected,
            'aria-controls': `${baseId}-panel-${tab.id}`,
            'aria-disabled': tab.disabled || undefined,
            'aria-keyshortcuts': tab.closable && !tab.disabled ? 'Delete' : undefined,
            tabIndex: isSelected ? 0 : -1,
            'data-tab-id': tab.id,
            onClick: () => selectTab(tab.id),
          }

          const label = <span className="vgui-tabs__label">{tab.label}</span>

          if (!tab.closable) {
            return (
              <button
                key={tab.id}
                type="button"
                disabled={tab.disabled}
                {...shared}
                ref={(node) => {
                  setTabNode(tab.id, node)
                }}
              >
                {label}
              </button>
            )
          }

          // A `role="tab"` element has presentational children, so the close
          // affordance must not be focusable or it breaks the tab's own
          // interaction model (axe `nested-interactive`). Keyboard users close
          // the tab with Delete, announced through `aria-keyshortcuts`.
          return (
            <div
              key={tab.id}
              {...shared}
              ref={(node) => {
                setTabNode(tab.id, node)
              }}
            >
              {label}
              {tab.disabled ? null : (
                <span
                  className="vgui-tabs__close"
                  aria-hidden="true"
                  title={`Close ${tab.label} tab`}
                  onClick={(event: MouseEvent<HTMLSpanElement>) => {
                    event.stopPropagation()
                    tab.onClose?.()
                  }}
                >
                  ✕
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* The shelf under the strip. Decorative paint only: it carries no
          content and no role, so it stays out of the accessibility tree. */}
      <div className="vgui-tabs__box" />

      {tabs.map((tab) => {
        const isSelected = tab.id === selectedId
        const rendered = !tab.lazy || isSelected || visited.includes(tab.id)
        if (!rendered) return null
        return (
          <div
            key={tab.id}
            className={panelClasses.join(' ')}
            role="tabpanel"
            id={`${baseId}-panel-${tab.id}`}
            aria-labelledby={`${baseId}-tab-${tab.id}`}
            tabIndex={0}
            hidden={!isSelected}
          >
            {tab.content}
          </div>
        )
      })}
    </div>
  )
})

Tabs.displayName = 'Tabs'
