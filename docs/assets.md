# Assets

**This package ships no image files, and that is a policy rather than a gap.**

Every visual detail the corpus expresses as a sprite — chevrons, carets, radio
dots, check marks, disclosure triangles, sort arrows, resize grips, the titlebar
glyphs, the throbber — is drawn procedurally in CSS: a `clip-path` polygon, a
`border` triangle, a `radial-gradient`, or a `mask-image` over an inline SVG data
URI. Nothing is fetched at runtime, nothing 404s, and there is no `public/` or
`src/assets/` directory to publish.

Three reasons, in order of weight:

1. **Copyright.** Valve's `.tga` sprites are the game's copyrighted artwork. This
   package is redistributable, so it cannot carry them — not even the ports. The
   same applies to the recoloured PNGs in the `vgui.css` theme, which are
   derivatives of the same art.
2. **The artifact is JS + CSS.** `dist/index.js` plus one stylesheet per component
   is the published surface. A bundled `public/` folder would be copied into
   `dist/` but is not part of the package's `files`, so a `/icons/...` URL would
   resolve against the *consumer's* server root, not the package.
3. **Themes.** A sprite baked into an image cannot follow `--vgui-text-strong`
   under `[data-vgui-theme='black']`. Drawing the glyph as a mask over
   `background-color` means every variant recolours it for free. A `data:` URI
   cannot read a CSS variable, which is exactly why the mask layer exists.

## Where the corpus artwork lives

Both reference repositories are siblings of this one, outside the package:

| Location | Contents | Usable as-is? |
| --- | --- | --- |
| `..\OG-Steam\OG-Steam\graphics\` | ~250 Valve `.tga` sprites: `Window-{Min,Max,Close,Restore}`, `resizer`, `chk{Unsel,Sel}{Std,Dis,Down,Focus}`, `rad{Unsel,Sel}*`, `icon_{left,right}_{default,hover}`, `icon_down_*`, `minithrobber01..12`, the full `icon_button_*` toolbar set, plus an `@2x` family | No — `.tga`, and Valve's |
| `..\OG-Steam\OG-Steam\graphics\browserbuttons\` | 8 `icon_button_{back,forward}_{,over,down,disabled}_sm.tga` | No — `.tga`, and Valve's |
| `..\OG-Steam\OG-Steam\resource\` | `icon_steam{,_disabled}.tga`, `icon_{away,busy,blocked,message,…}.tga`, `steam_logo*.tga`, `valve_logo.tga`, and the source `styles/`, `layout/`, `menus/` | No — `.tga`, and Valve's |
| `..\vgui.css\styles\greensteam\` | 16 **PNG** files — `checkmark`, `scroll_{up,down,left,right}`, `close`, `close2`, `minimize`, `minimize2`, `resize`, `sliderticks`, `radio_{on,off}`, `steamico`, `download{,_pressed}` — plus that theme's `greensteam.css` | No — browser-ready, but recoloured Valve art |

Everything the implementation needs is therefore *measured* from these files
(sizes, insets, which state exists at all) and then **redrawn**, never copied.
`docs/components/*.md` records the measurements; this file records the policy.

The one place a `.tga` was genuinely absent — `icon_controller_bpm`, named by
`FullscreenButton` (`steam.styles:2770–2789`) — is noted in
`docs/components/Toolbar.md`; its glyph is a stand-in for that reason as well.

## What each component does instead

| Component | Corpus art | Shipped |
| --- | --- | --- |
| `Toolbar` | 20 `icon_button_*` sprites, 16×16, four states each | Six `mask-image` SVG stand-ins, tinted per state |
| `Window` | `Window-{Min,Max,Close,Restore}.tga`, `resizer.tga` | Four 7×7 SVG masks; the grip is a 12×12 SVG mask |
| `Spinner` | `minithrobber01..12.tga` (20×20) | A procedural 12-step `conic-gradient` ring |
| `Avatar` | — | The consumer's `src`; initials on a themed square as the fallback |
| `Checkbox`/`Radio` | `chk*`/`rad*` | A rotated bordered box with a two-border tick; `Radio` is a bordered disc |
| `Scrollbar`, `ScrollArea` | `icon_{left,right,up,down}` | `clip-path` triangles |
| `SpinBox`, `Select`, `ColorPicker` | carets, dropdown arrows | `clip-path` triangles |
| `Table`, `TreeView`, `List` | sort arrows, disclosure triangles, a folder sprite | `border`-drawn triangles; `List` traces its own |
| `Menu`, `MenuBar` | `checkmark.png` in the CSS port | `border`-drawn submenu arrows; the checked tick is the `✓` text glyph |
| `Link`, `NavBar`, `Tabs`, `Console`, `RichText`, `Textarea`, `LevelMeter`, `IconButton` | assorted | drawn, tinted, or overridable — see each component doc |

## Supplying your own art

If you own the original artwork, three components expose an override. Set the
variable on any ancestor (or on the component itself) and the procedural stand-in
is replaced:

| Component | Override | Notes |
| --- | --- | --- |
| `Toolbar` | `--vgui-toolbar-<glyph>` where `<glyph>` is `back`, `forward`, `home`, `reload`, `stop` or `controller-bpm` | Consumed as the first argument of `mask-image`, so the art is still tinted by `--vgui-toolbar-glyph{,-active,-disabled}`. Grey-with-alpha sprites reproduce the original four-state behaviour exactly. |
| `Spinner` | `--vgui-spinner-sheet` (or the `frames` prop) | The sheet is stepped with `steps(12, end)`, so it must be twelve frames left to right. |
| `Avatar` | the `src` prop | Any image URL; `onError` falls back to initials. |
| `IconButton` | the `icon` node | A caller-supplied SVG or `<img>` replaces the default glyph; `currentColor` still reaches it. |

```css
/* A consumer who converted their own icon_button_*.tga set to PNG. */
[data-vgui-theme] {
  --vgui-toolbar-back: url('/my/steam-art/icon_button_back.png');
  --vgui-toolbar-forward: url('/my/steam-art/icon_button_forward.png');
}
```

Converting `.tga` to something a browser reads is a consumer-side step — Pillow
(`Image.open('x.tga').save('x.png')`) or ImageMagick (`magick x.tga x.png`) both
handle Valve's uncompressed and RLE sprites.
