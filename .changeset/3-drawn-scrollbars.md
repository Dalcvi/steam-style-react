---
'@dalcvil/steam-green-react': major
---

Make the drawn VGUI scrollbar the default everywhere

The button/gutter/thumb tree that VGUI painted by hand was opt-in as
`variant="custom"`, which had it backwards: the platform scrollbar cannot be made
to look like the original at all. Firefox has no `::-webkit-scrollbar-button`, so
it loses the bevel and the arrows outright, and neither engine can be given the
18px metric through `scrollbar-width` (`auto | thin | none` only). The drawn bar
is now the default in every component that scrolls.

```diff
-<Scrollbar variant="custom" thickness={19}>
+<Scrollbar>
   {log}
 </Scrollbar>
```

The variant value is renamed to match what it does:

```diff
-<Scrollbar variant="custom" />
+<Scrollbar variant="drawn" />

-<ScrollArea customScrollbar>
+<ScrollArea variant="drawn" />   {/* the default; can be omitted */}
```

`ScrollArea`'s `customScrollbar` boolean is replaced by `variant`, and
`variant="native"` is the documented fallback for a pane where per-instance DOM
cost matters more than the arrows. The custom class modifier is now
`vgui-scroll-region--drawn` / `vgui-scroll-area--drawn`.

Every self-scrolling component — `Table`, `Dialog`, `Console`, `List`, `Select`,
`Splitter`, `Textarea`, `TreeView` — now shares one platform-bar skin,
`.vgui-scroll-surface`, which now ships as `styles/scrollbars.css` so a
self-scrolling element outside the library can opt into the same look. The bar's
metrics moved into the shared token layer, so restyling every bar on a page is
one override: `--vgui-scrollbar-size`, `--vgui-scrollbar-button-size`,
`--vgui-scrollbar-gutter`, `--vgui-scrollbar-thumb`, `--vgui-scrollbar-corner`
and the glyph's `--vgui-scrollbar-glyph-*` triple. `--vgui-scrollbar-width`,
which no file ever declared, is gone.

Because the drawn region hides its own overflow and lets the inner box scroll,
`Scrollbar` now maps the scroll keys (`ArrowUp`/`ArrowDown` or
`ArrowLeft`/`ArrowRight`, `PageUp`/`PageDown`, `Space`, `Home`/`End`) onto that
inner box in the drawn path. The native path is untouched and still lets the
browser handle its own keys.
