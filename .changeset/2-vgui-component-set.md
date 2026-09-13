---
'@dalcvil/steam-green-react': minor
---

Add the classic VGUI component set

Thirty-eight new components, all built from the design specifications in
`docs/components/`, cover the rest of the classic Green Steam look:

- **Containers and chrome** — `Window`, `TitleBar`, `GroupBox`, `Divider`,
  `Splitter`, `ScrollArea`, `Tooltip`, `Notification`, `Dialog`.
- **Form controls** — `IconButton`, `ToggleButton`, `Checkbox`, `Radio` with
  `RadioGroup`, `FieldLabel`, `TextInput`, `Textarea`, `Select`, `Slider`,
  `ProgressBar`, `SpinBox`, `ColorPicker`.
- **Navigation** — `Link`, `Tabs`, `Menu`, `MenuBar`, `NavBar`, `Toolbar`.
- **Data display** — `List`, `Table`, `TreeView`, `Scrollbar`, `StatusBar`,
  `StatusLabel`, `Console`, `Spinner`, `LevelMeter`, `Avatar`, `RichText`.

Every component ships its own stylesheet beside it, reads only `--vgui-*`
tokens, and exports its props type from the package root. Each one is
accompanied by unit tests (including an axe accessibility assertion) and
Storybook stories, and all of them are documented in `docs/components/`.

Accessibility notes worth knowing:

- The accessible focus ring is the default. Valve's own 1px dashed rings sit at
  1.87:1 against these surfaces, so they are opt-in through `.vgui-crisp`.
- Controls that VGUI draws at 18px grow an invisible 24px hit area to meet
  WCAG 2.5.8.
- Font smoothing stays enabled and `image-rendering: pixelated` is confined to
  `.vgui-crisp`, because both override the user's own rendering preferences.
