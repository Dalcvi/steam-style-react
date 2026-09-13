---
'@dalcvil/steam-green-react': major
---

Rename the theme-prefixed components to plain names

`GreenButton` is now `Button` and `GreenPanel` is now `Panel`, and the
`greensteam-` CSS class prefix is now `vgui-`. The theme belongs in the design
tokens, not in a component's name — this is a general-purpose UI library with
one theme, not a theme with components bolted on.

Update code that used the old names:

```diff
-import { GreenButton } from '@dalcvil/steam-green-react'
+import { Button } from '@dalcvil/steam-green-react'

-<GreenButton primary>Join game</GreenButton>
+<Button primary>Join game</Button>
```

```diff
-import { GreenPanel } from '@dalcvil/steam-green-react'
+import { Panel } from '@dalcvil/steam-green-react'

-<GreenPanel heading="Server settings">…</GreenPanel>
+<Panel heading="Server settings">…</Panel>
```

Any custom CSS that targeted `.greensteam-button` or `.greensteam-panel` must be
repointed at `.vgui-button` / `.vgui-panel`. Modifiers are unchanged apart from
the prefix (`greensteam-button--primary` → `vgui-button--primary`).

The global theme gains a token layer. Every colour, metric and font now lives as
a `--vgui-*` custom property on `[data-vgui-theme]` rather than on `:root`, so a
component dropped into an unthemed page still renders. Theme variants ship as
`data-vgui-theme="green"` (the default), `"vgui1"`, `"black"`, `"warm"` and
`"clay"`. Importing `styles/theme.css` is still the way to opt in, and
`styles/tokens.css` is now exported on its own for consumers who only want the
variables.
