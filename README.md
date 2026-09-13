# @dalcvi/steam-green-react

React components for the classic Green Steam (VGUI) look, ported from
[VGUI.css](https://github.com/AlpyneDreams/vgui.css).

- **Tree-shakable ESM build** — the output mirrors `src/`, so importing one
  component never pulls in the others.
- **Per-component CSS** — each component imports its own stylesheet; the global
  theme is opt-in.
- **Storybook** — every component ships with stories, published to GitHub Pages.

## Installation

```bash
pnpm add @dalcvi/steam-green-react
# or: npm install @dalcvi/steam-green-react
```

`react` and `react-dom` (`^18` or `^19`) are peer dependencies.

## Usage

```tsx
import { GreenButton } from '@dalcvi/steam-green-react'

// Optional: the global Green Steam theme (background, typography, links…)
import '@dalcvi/steam-green-react/styles/theme.css'

export function App() {
  return <GreenButton onClick={() => alert('Hello')}>Click me</GreenButton>
}
```

Component styles come along with the component — there is nothing else to
import.

> The package is **ESM-only**. CJS output cannot be tree-shaken and would
> duplicate the colocated CSS, so it is intentionally not published. Use a
> bundler (Vite, webpack, Rollup, esbuild) or Node's native ESM.

## Components

| Component | Description |
| --- | --- |
| `GreenButton` | Classic VGUI push button. Supports `fullWidth` on top of all `<button>` props. |

More components are on the way; each one will get its own CSS file plus a
Storybook story.

## Development

Node 24 is required. `.nvmrc` pins the exact version and is also what the
workflows read via `node-version-file`, so the local toolchain and CI cannot
drift apart. pnpm 12 is pinned through the `packageManager` field.

```bash
pnpm install
pnpm storybook          # Storybook on http://localhost:6006
pnpm run build          # library -> dist/
pnpm run build-storybook  # static Storybook -> storybook-static/
pnpm run typecheck      # tsc --noEmit
```

### How the build works

`pnpm run build` runs two steps:

1. **`vite build`** bundles the components in library mode. Stylesheets are
   declared `external` so that `import './X.css'` survives in the emitted
   JavaScript, then copied into `dist/` beside their component — Vite's library
   mode would otherwise extract them into anonymous hashed assets and drop the
   import. A bare `.css.d.ts` is written next to each one, because TypeScript
   keeps the stylesheet import in the declarations it emits and a consumer
   compiling with `skipLibCheck: false` needs that import to resolve.
2. **`tsc -p tsconfig.build.json`** emits the `.d.ts` declarations using
   TypeScript's own output — no third-party declaration bundler. The base
   `tsconfig.json` stays `noEmit` for typechecking; `tsconfig.build.json`
   extends it with `emitDeclarationOnly` and `outDir: dist`, and excludes
   stories.

### Project layout

```
src/
  index.ts                    # public entry point
  styles/theme.css            # global theme (opt-in)
  components/
    GreenButton/
      GreenButton.tsx
      GreenButton.css         # colocated styles, imported by the component
      GreenButton.stories.tsx
      index.ts
```

To add a component: create a folder under `src/components/`, export it from its
own `index.ts` **and** from `src/index.ts`, and add a story next to it.

## CI/CD

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `.github/workflows/ci.yml` | push to `main`, PRs | Typechecks, builds the library and Storybook, uploads `dist` as an artifact. |
| `.github/workflows/pages.yml` | push to `main` | Builds Storybook and deploys it to GitHub Pages. |
| `.github/workflows/release.yml` | tag `v*.*.*` | Publishes the package to npm with provenance. |

### First-time setup

1. **GitHub Pages** — set **Settings → Pages → Source** to **GitHub Actions**.
   The default *Deploy from a branch* source runs a Jekyll build that serves the
   README, and an Actions artifact cannot be published to a branch-configured
   site. Once the source is set, the Pages workflow publishes Storybook to
   `https://<owner>.github.io/<repo>/`.
2. **npm publishing** — create an npm **Automation** token for the
   `@dalcvi` scope and store it as the repository secret `NPM_TOKEN`.
3. **Release** — bump and tag, then push:

   ```bash
   pnpm version patch   # or minor / major
   git push --follow-tags
   ```

## Credits

Styles are derived from [VGUI.css](https://github.com/AlpyneDreams/vgui.css) by
Jeffrey Ellison (MIT). See [LICENSE](./LICENSE).

## License

MIT © Dalcvi
