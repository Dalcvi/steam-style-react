# TreeView

## Purpose

An expandable hierarchy with indentation, disclosure triangles and a selection
row. This is the client's category sidebar and the CS 1.6-style options tree.

## VGUI original

This is the sparsest component in the whole corpus. `steam.styles:2653–2682`
contains four blocks, and **three of them are empty**:

```
TreeNode {}

TreeNodeImage {}

TreeNodeText
{
    font-family = basefont
    font-size = 13
    textcolor = Text
    selectedtextcolor = White
    selectedbgcolor = BorderDark
    bgcolor = none
}

TreeView {}

TreeViewSubPanel
{
    bgcolor = DarkGreenBG
    render_bg
    {
        1="fill( x0, y0, x1, y0 + 1, BorderDark )"            // top
//      2="fill( x0, y1 - 1, x1, y1, BorderBright )"          // bottom
        3="fill( x0, y0, x0 + 1, y1 - 1, BorderDark )"        // left
//      4="fill( x1 - 1, y0, x1, y1, BorderBright )"          // right
    }
}
```

Colour values from `steamscheme.res`: `Text` = `#A0AA95` (`:20`/`steam.styles:57`),
`BorderDark` = `#282E22` (`steamscheme.res:69`), `DarkGreenBG` = `#3E4637`
(`:48`).

### Four things to extract

1. **The bottom and right borders are commented out *in the source*.** Lines 2
   and 4 are still present as `//` comments, which means Valve edited them out
   deliberately rather than never writing them. The result is a **two-sided
   recess** — dark along the top and left only — which reads as a panel that is
   sunk *into* its top-left corner with no bottom-right shadow at all. This
   asymmetry is instantly recognisable and almost never reproduced; a CSS
   recreation that draws a symmetric inset bevel here is wrong.
2. **The selection fill is a bevel colour, not a highlight colour, and this is
   the house style rather than a slip.** `selectedbgcolor = BorderDark` — and
   Valve annotates `BorderDark` as *"the dark/unlit side of a control"*
   (`steamscheme.res:69`). The **selected tree row is drawn darker than the panel
   behind it**: `#282E22` on `#3E4637` is **1.41:1**, i.e. subtle. The identical
   choice appears in `ListPanel` (`steam.styles:1162`), `"Page ListPanel"`
   (`:1182`) and `CGamesListPanel` (`:1203`), so four list-family controls all
   agree: **selection pushes the row in rather than lighting it up.** Only the
   SDK's `SectionedListPanel` (`:2331`) and the menus use a bright `MaizeBG`
   highlight. A tree selection says "pressed in", a menu selection says "picked
   out", and a library that unifies them has overridden a real distinction.
3. **`TreeNodeText` is 13px — the only 13px text in `steam.styles`.** Everything
   else in the UI is 14 (or 21 for `MainNav`). One pixel of reduction per level
   makes the tree visibly denser than a list, which is what lets a deep hierarchy
   fit in a narrow sidebar. Do not "fix" this to 14px.
4. **`TreeNode {}`, `TreeNodeImage {}` and `TreeView {}` are all empty, so
   essentially nothing about the tree is specified.** The disclosure triangle,
   the indentation step, the connector lines and the row height are all
   undetermined by the stylesheet — they were drawn by the control in C++ or set
   at the call site. **A faithful tree is therefore mostly invention**, and this
   document is honest about which parts are which: the four colours and the
   13px font are evidence; the 16px indent and the glyph designs are not.

## Variants

| Variant | Class | Notes |
| --- | --- | --- |
| Default | `vgui-tree` | Expand/collapse hierarchy |
| Checkable | `--checkable` | Checkbox per node (no VGUI precedent, see *Open questions*) |
| Multi-select | `--multi` | Ctrl/Shift ranges |
| Sidebar | `--sidebar` | The two-sided recess, `DarkGreenBG`, full height |

## Anatomy

```html
<div class="vgui-tree vgui-tree--sidebar">
  <div class="vgui-tree__subpanel" role="tree" aria-label="Servers">
    <div class="vgui-tree__node" role="treeitem" aria-expanded="true"
         aria-level="1" aria-selected="false" tabindex="0" id="n-internet">
      <span class="vgui-tree__image vgui-tree__image--expanded" aria-hidden="true"></span>
      <span class="vgui-tree__text">Internet</span>
    </div>
    <div role="group">
      <div class="vgui-tree__node vgui-tree__node--selected" role="treeitem"
           aria-level="2" aria-selected="true" tabindex="-1" id="n-a">
        <span class="vgui-tree__image" aria-hidden="true"></span>
        <span class="vgui-tree__text">Server A</span>
      </div>
    </div>
  </div>
</div>
```

`role="tree"` goes on the **container**, not on each node, and each node carries
`aria-level`, `aria-expanded` (only when it has children) and `aria-selected`.

## States

| State | Fill | Text |
| --- | --- | --- |
| Sub-panel interior | `#3E4637` (`DarkGreenBG`) | — |
| Node, idle | transparent | `#A0AA95` 13px (`Text`) |
| Node, selected | `#282E22` (`BorderDark`) | `#FFFFFF` (`selectedtextcolor`) |
| Node, hover | *unspecified* | *unspecified* |
| Node, focused | transparent | `#FFFFFF` |
| Node, disabled | transparent | `#75806F` + `#282E22` shadow |

## Tokens

| Token | Value | Where |
| --- | --- | --- |
| `--vgui-tree-bg` | `#3E4637` | Sub-panel interior (`DarkGreenBG`) — same as `--vgui-surface-dark` |
| `--vgui-tree-selected-bg` | `#292D23` | Selected node (`BorderDark`) — the same value as `--vgui-bevel-dark` |
| `--vgui-text-muted` | `#A0AA95` | Node text (`Text`) |
| `--vgui-text-strong` | `#FFFFFF` | Selected node text |
| `--vgui-tree-font-size` | `13px` | The only 13px in the corpus — **new token** |
| `--vgui-tree-indent` | `16px` | Indent per level — **new token, inferred** |
| `--vgui-tree-glyph-size` | `13px` | Disclosure glyph box — **inferred** |

Only two genuinely new tokens. The two inferred ones are flagged in
*Open questions*; do not present them as VGUI values.

## CSS recipe

```css
.vgui-tree {
  background-color: var(--vgui-tree-bg, #3e4637);
  /* TreeViewSubPanel: dark on the TOP and LEFT only. The bottom and right
     borders are commented out in the source — this asymmetry is deliberate. */
  border-top: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-right: 0;
  border-bottom: 0;
  overflow: auto;
}

.vgui-tree__node {
  display: flex;
  align-items: center;
  gap: 2px;
  min-height: 16px;
  padding: 0 4px;
  color: var(--vgui-text-muted, #a0aa95);
  font-size: var(--vgui-tree-font-size, 13px);  /* 13px — the corpus value */
  cursor: default;
  /* Indentation is per level, applied by the consumer as --level. */
  padding-left: calc(4px + var(--level, 0) * var(--vgui-tree-indent, 16px));
}

.vgui-tree__node[aria-selected='true'] {
  /* Darker than the panel, i.e. recessed, not highlighted. */
  background-color: var(--vgui-tree-selected-bg, #282e22);
  color: var(--vgui-text-strong, #fff);
}

.vgui-tree__node:focus-visible {
  outline: 1px dotted var(--vgui-text, #d8ded3);
  outline-offset: -2px;
}

.vgui-tree__image {
  flex: 0 0 var(--vgui-tree-glyph-size, 13px);
  width: var(--vgui-tree-glyph-size, 13px);
  height: 13px;
  background-repeat: no-repeat;
  background-position: center;
}

.vgui-tree__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**Why `background-color` on the node and not a `::before` bar.** VGUI's
`selectedbgcolor` fills the entire row, unlike a modern "accent stripe on the
left" treatment. Resist the stripe.

**Do not give the selected node the maize fill.** It is tempting to unify with
`List`, but the corpus is explicit for both controls and they genuinely differ.
If the library wants one selection vocabulary, that is a *departure* and belongs
in `foundations.md` as a decision, not in this component as a silent choice.

## React API

```tsx
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

export interface TreeViewProps {
  /** Root nodes, in order. */
  nodes: TreeNode[]
  /** Controlled selected node id. */
  selected?: string
  /** Initial selection when uncontrolled. */
  defaultSelected?: string
  /** Called with the newly selected node id. */
  onSelectedChange?: (id: string) => void
  /** Expands nodes when the whole row is clicked, not just the glyph. */
  expandOnRowClick?: boolean
  /** Indent per level in pixels. Defaults to 16. */
  indentSize?: number
}
```

## Accessibility

- **`role="tree"` on the container, `role="treeitem"` on every node, and
  `role="group"` wrapping each node's children.** Without the `group` wrapper
  the `aria-level` values are meaningless to a screen reader and the hierarchy
  flattens.
- **Roving tabindex.** The tree is one tab stop; `Up`/`Down` move the active
  node, `Right` expands a collapsed node (then moves to the first child),
  `Left` collapses an expanded node (then moves to the parent), `Home`/`End`
  jump to the ends, and typing a letter jumps to the next matching node.
  This is one of the more intricate ARIA keyboard models — allocate time for it.
- **Exactly one node may be `aria-selected="true"`** unless the tree is
  `aria-multiselectable`. Do not set `aria-selected="false"` on every node *and*
  `aria-selected` implicitly elsewhere; be consistent.
- **`aria-expanded` goes only on nodes that have children.** Setting it on a leaf
  is a lie that makes assistive technology announce "collapsed" for something
  that has nothing to expand.
- **The selected fill fails 1.4.11 and needs a second cue.** `#282E22` on
  `#3E4637` is **1.41:1** — well under the 3:1 required for a UI state
  indicator. The white text on the selected node (**13.96:1**) is the giveaway
  that saves it, plus the focus ring, but a colourblind or low-vision user
  relying on shape alone has nothing. Add a non-colour marker (a leading dot, or
  bold text) if the tree is used for a consequential choice.
- **The disclosure glyph must be a button, not a click handler on the row** —
  unless `expandOnRowClick` is set, in which case the *row* is a button and the
  glyph is decorative. Either way the glyph needs an accessible name
  (`aria-label="Expand Internet"`) or `aria-hidden="true"` if the row carries
  `aria-expanded`; never both.
- **Connector lines are decorative.** A column of `│`/`├` glyphs drawn with
  borders must be `aria-hidden="true"` and is better implemented with
  `background-image` gradients, which are invisible to assistive technology by
  default.
- **Indentation must not depend on font metrics.** Reproduce the 16px step with
  padding or a spacer element; a run of `&nbsp;` breaks at wide/narrow fonts and
  in user stylesheets.
- **Truncated labels need a full-text fallback.** The recipe uses
  `text-overflow: ellipsis`, which hides information from a sighted user —
  pair it with a `title` attribute or an expandable row.

## Assets

- **`TreeNodeImage {}` is empty, so the corpus names no file.** The disclosure
  glyph and any node icons are set at runtime by `IScheme` lookups elsewhere in
  the client, and neither `steam.styles` nor `steamscheme.res` references a tree
  glyph. There is no `tree_expand`/`tree_collapse` in the asset set.
- **No connector-line art exists either** — so if the tree is to have the
  classic `├ └ │` rails, they must be drawn (CSS borders or a generated sprite),
  and that is invention.
- The port's green asset set is 16 files (`checkmark`, `close`/`close2`,
  `minimize`/`minimize2`, `download`/`download_pressed`, `radio_off`/`radio_on`,
  `resize`, four scroll arrows, `sliderticks`, `steamico`); **none is a tree
  glyph**.
- **Assets:** this package ships **no image assets, by policy** — no `public/`,
  no `src/assets/`. See `docs/assets.md`.

## Examples

```tsx
<TreeView
  variant="sidebar"
  defaultSelected="server-a"
  nodes={[
    { id: 'internet', label: 'Internet', defaultExpanded: true, children: [
      { id: 'server-a', label: 'My favourite server' },
      { id: 'server-b', label: 'Another server' },
    ] },
    { id: 'lan', label: 'LAN', children: [] },
    { id: 'history', label: 'History', disabled: true },
  ]}
/>
```

## Open questions

- **Every metric is unverified.** The 16px indent, the 16px row height, the
  glyph box size and the exact triangle design are all inferences. Only the
  13px font size and the four colours are evidence. A screenshot with a ruler,
  or the C++ `TreeView.cpp` defaults, would settle them.
- **The commented-out bottom and right borders need an explanation.** They imply
  the tree is always docked against a parent that supplies the missing sides —
  i.e. `TreeViewSubPanel` is a *fragment* of a larger inset, not a standalone
  panel. If the library's `TreeView` is used standalone, drawing only two sides
  will look broken. Either require the sidebar context or add the missing sides
  and note the departure.
- **No hover state exists** for `TreeNodeText`. Any hover treatment is invented;
  see `List`'s identical problem.
- **`selectedbgcolor = BorderDark` recurs four times, which makes it deliberate —
  but at 1.41:1 it is barely visible, so the accessibility fix is still needed.**
  `ListPanel` (`steam.styles:1162`), `"Page ListPanel"` (`:1182`),
  `CGamesListPanel` (`:1203`) and this block all select with the same bevel
  colour, so this is a considered house style and not a stray value. The open
  question is therefore not "is it a bug" but "how do we keep the recessed
  feeling while reaching 3:1" — an inner shadow, a leading marker, or a
  deliberate switch to the `MaizeBG` vocabulary. Record the answer in
  `foundations.md`, since `List` faces exactly the same decision.
- **Is the tree's selection ever drawn in C++?** VGUI's `TreeView` is known to
  draw some chrome itself, and if it painted its own highlight this
  `selectedbgcolor` would be dead code. A screenshot of a selected node in the
  client would settle both this and the row-height question.
- **Is the tree's font really 13px everywhere, or is there a `TreeNodeText`
  override per dialog?** Only one `TreeNodeText` block exists in
  `steam.styles`. The `[$OSX]` conditional that every other block carries is
  **absent** here — the only text block in the file without one, which is
  suspicious and may mean the block was never updated when the others were.
- **`Checkable` tree nodes have no VGUI precedent** in this corpus. VGUI's
  `TreeView` had no checkbox support in the public SDK, so a checkable tree is a
  composition of `TreeNodeText` plus the `CheckButton` sprite and should be
  documented as such, not as a VGUI feature.
- **`TreeView {}` being empty means there is no tree-level font or colour** —
  nodes could in principle differ per level. Nothing in the corpus suggests they
  do; the recipe assumes uniform.
