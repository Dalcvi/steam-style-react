# Green VGUI component documentation

Design documentation for `@dalcvil/steam-green-react` — a React component library
that reproduces the look of the classic **Green Steam / VGUI** interface from
Valve's games and the 2003–2010 Steam client.

This is **not** an API reference. It is the specification the API is built from:
what each component is, how it looks in every state, exactly which colours and
pixel sizes it uses, what the CSS recipe is, and how to make it accessible.

## Reading order

1. **[foundations.md](./foundations.md)** — read this first. What VGUI is, the
   colour tokens, the bevel primitive, typography, metrics, the theme layer, and
   the accessibility baseline that every component inherits. **Component docs do
   not repeat any of it.**
2. **`components/*.md`** — one file per component, in the order listed below.

## A note on naming

Components are named for what they *are*: `Button`, not `GreenButton`. The theme
belongs in the tokens, not in a component's name — this is a general-purpose UI
library that happens to have one theme, not a theme with components bolted on.

The library shipped `GreenButton` and `GreenPanel` before this convention was
written down. Both are **renamed** in the current release: `GreenButton` is now
`Button`, `GreenPanel` is now `Panel`, and the `greensteam-` CSS prefix is now
`vgui-`. This is a breaking change and is marked as such in the changeset.

## Component inventory

Every component below is **Shipped**: it exists in `src/components/`, exports its
value and its props type from `src/index.ts`, ships its own stylesheet beside
itself, and has unit tests (including an accessibility assertion) and Storybook
stories.

### Containers & chrome

| Component | VGUI original | Purpose |
| --- | --- | --- |
| [Panel](./components/Panel.md) | `Panel` / `EditablePanel` | Beveled surface. The base of nearly everything. |
| [Window](./components/Window.md) | `Frame` | Draggable window with titlebar and frame buttons. |
| [TitleBar](./components/TitleBar.md) | `FrameTitle` | The 18px uppercase caption strip. |
| [GroupBox](./components/GroupBox.md) | *(none — composed)* | Labelled border around a related set of fields. |
| [Divider](./components/Divider.md) | `Divider` | Two-row engraved horizontal rule. |
| [Splitter](./components/Splitter.md) | `Dragger` / `SplitterHandle` | Draggable pane divider. |
| [ScrollArea](./components/ScrollArea.md) | `ScrollPanel` | Overflow container with a themed scrollbar. |
| [Tooltip](./components/Tooltip.md) | `TooltipWindow` | The one inverted surface in the theme. |
| [Notification](./components/Notification.md) | `Notification` | Corner toast, as used by Steam for friend sign-ins. |
| [Dialog](./components/Dialog.md) | `MessageBox` / `PropertyDialog` | Modal with a fixed button row. |

### Form controls

| Component | VGUI original | Purpose |
| --- | --- | --- |
| [Button](./components/Button.md) | `Button` | 25px push button with an inverting bevel. |
| [IconButton](./components/IconButton.md) | `Button` + `ImagePanel` | Square glyph button for toolbars and frame controls. |
| [ToggleButton](./components/ToggleButton.md) | `ToggleButton` | Button that latches; used for CS 1.6-style preferences. |
| [Checkbox](./components/Checkbox.md) | `CheckButton` | 15px inset box with a sprite checkmark. |
| [Radio](./components/Radio.md) | `RadioButton` | Round-sprite alternative to Checkbox, plus a `RadioGroup`. |
| [TextInput](./components/TextInput.md) | `TextEntry` | Single-line inset field. |
| [Textarea](./components/Textarea.md) | `TextEntry` (multiline) | Multi-line inset field with its own scrollbar. |
| [Select](./components/Select.md) | `ComboBox` | Split dropdown: inset field plus a beveled arrow button. |
| [Slider](./components/Slider.md) | `Slider` / `SliderHoriz` | 8×16 thumb on a 4px recessed track. |
| [ProgressBar](./components/ProgressBar.md) | `ProgressBar` | 26px inset trough with an 8px-on/4px-off striped fill. |
| [SpinBox](./components/SpinBox.md) | `TextEntry` + steppers | Numeric entry with paired up/down buttons. |
| [ColorPicker](./components/ColorPicker.md) | *(none — library-original)* | Colour swatch with a palette dropdown. |
| [FieldLabel](./components/FieldLabel.md) | `Label` | Form label, including the sunken disabled treatment. |

### Navigation

| Component | VGUI original | Purpose |
| --- | --- | --- |
| [Tabs](./components/Tabs.md) | `PropertySheet` / `PageTab` | Tab strip over a page area. |
| [Menu](./components/Menu.md) | `Menu` / `MenuItem` | Raised dropdown with checkable and disabled items. |
| [MenuBar](./components/MenuBar.md) | `MenuBar` / `MenuButton` | Top-level menu strip. |
| [NavBar](./components/NavBar.md) | `MainNav` / `SuperNavMenu` | The client's main horizontal nav with dropdowns. |
| [Link](./components/Link.md) | `URLLabel` | Underlined-on-hover anchor. |
| [Toolbar](./components/Toolbar.md) | `ToolBar` / `Panel` | Beveled strip of IconButtons. |

### Data display

| Component | VGUI original | Purpose |
| --- | --- | --- |
| [List](./components/List.md) | `ListPanel` | Selectable rows on a dark inset. |
| [Table](./components/Table.md) | `SectionedListPanel` | Grouped columns — the server browser. |
| [TreeView](./components/TreeView.md) | `TreeView` / `TreeNode` | Expandable hierarchy with connector lines. |
| [Scrollbar](./components/Scrollbar.md) | `ScrollBar` | Gutter, handle and 18px arrow buttons. |
| [StatusBar](./components/StatusBar.md) | *(none — composed)* | Bottom strip of status fields. |
| [StatusLabel](./components/StatusLabel.md) | `StatusLabel` | Single sunken status indicator. |
| [Console](./components/Console.md) | `TextEntry`-log / `ConsoleText` | Monospace scrolling log. |
| [Spinner](./components/Spinner.md) | `minithrobber01..12` | 12-frame indeterminate throbber. |
| [LevelMeter](./components/LevelMeter.md) | `rampUp_1..4` / `rampDown_1..4` | Segmented signal-level bars. |
| [Avatar](./components/Avatar.md) | `AvatarImage` *(Steam client only)* | Beveled player picture with status ring. |
| [RichText](./components/RichText.md) | `RichText` | Styled inline text runs. |

## Compositions and library-originals

Four controls people ask for do not exist as named classes in the public VGUI
SDK, and these docs say so rather than inventing a precedent. They are
implemented as **compositions** of the controls that do exist:

- **`GroupBox`** is a `Frame`-styled `EditablePanel`.
- **`StatusBar`** is a bottom `Panel` containing `Label`s.
- **`SpinBox`** is a `TextEntry` plus two stepper `Button`s. It also has no
  up-arrow sprite to draw the steppers with; see `components/SpinBox.md` §9.
- **`AvatarImage`** exists only in Steam's own (non-SDK) client library, so its
  metrics come from the client resources, not from `source-sdk-2013`.

**`ColorPicker` has no evidence in this corpus at all.** A case-insensitive
search for `ColorPicker` across every resource file in `OG-Steam/` and across the
whole `vgui.css` port returns zero hits — there is no class, no stylesheet block
and no layout that references one. `components/ColorPicker.md` therefore
specifies it as a **library-original**: the corpus's own named palette
(`steamscheme.res:10-71`) and its `ComboBox` dropdown grammar
(`steam.styles:703`) supply the design, and every value in the doc is marked as
either a real token or an invention.

An earlier revision of this file claimed `ColorPicker` "exists in Steam's client
resource set (`resource/layout/`)". **That claim is not supported by this
corpus** and has been removed.

## Deviation policy

The docs are the specification, but three rules outrank a literal value in a doc,
and the implementation follows the rules where they conflict:

1. **Accessibility beats fidelity.** Focus rings, contrast and target size come
   from `foundations.md` §10. Valve's own 1px dashed/dotted rings sit at 1.87:1
   against these surfaces, so the accessible ring is the default and the Valve
   ring is reachable through the `.vgui-crisp` opt-in class.
2. **Tokens beat literals.** A colour, metric or font is read from a
   `--vgui-*` token. Where no shared token exists, a component declares a
   component-local `--vgui-<name>-*` property as
   `var(--vgui-shared-token, <literal>)` so it still resolves unthemed.
3. **Contradictions get resolved in code, and noted in a comment.** Several docs
   contradict themselves or contradict `foundations.md`; the source says which
   way it went and why.

## Validation

Any component built from these docs must pass, in this order:

```bash
pnpm run typecheck
pnpm test
pnpm run build
pnpm run build-storybook
```

A published-package change also needs a changeset (`pnpm changeset`), and the
PR title must be a Conventional Commit — see `.github/copilot-instructions.md`.