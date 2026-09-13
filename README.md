# @dalcvil/steam-green-react

React components for the classic Green Steam (VGUI) look, ported from
[VGUI.css](https://github.com/AlpyneDreams/vgui.css).

- **Tree-shakable ESM build** — the output mirrors `src/`, so importing one
  component never pulls in the others.
- **Per-component CSS** — each component imports its own stylesheet; the global
  theme is opt-in.
- **Storybook** — every component ships with stories, published to GitHub Pages.

## Installation

```bash
pnpm add @dalcvil/steam-green-react
# or: npm install @dalcvil/steam-green-react
```

`react` and `react-dom` (`^18` or `^19`) are peer dependencies.

## Usage

```tsx
import { GreenButton } from '@dalcvil/steam-green-react'

// Optional: the global Green Steam theme (background, typography, links…)
import '@dalcvil/steam-green-react/styles/theme.css'

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
pnpm changeset          # describe a change for the next release
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
| `.github/workflows/release.yml` | push to `main` | Opens/updates the *“chore: version packages”* PR, then publishes to npm **with provenance** and creates the GitHub release once that PR is merged. |

### Releasing

Releases are managed by [Changesets](https://changesets.dev) — the version in
`package.json` is only ever changed by CI.

1. Add a changeset to your PR describing the change and the bump it needs:

   ```bash
   pnpm changeset
   ```

   This writes a Markdown file into `.changeset/`; commit it with your code.
2. When that PR lands on `main`, the release workflow opens (or updates) the
   **“chore: version packages”** pull request, which applies the bumps,
   regenerates `CHANGELOG.md` and deletes the consumed changeset files.
3. Merge that pull request. The next release run finds no pending changesets, so
   it publishes to npm, pushes the `@dalcvil/steam-green-react@<version>` tag and
   creates a GitHub release.

Nothing is published while no changeset exists, so `main` can sit unreleased
indefinitely — with one exception: `@dalcvil/steam-green-react` is not on the
registry yet, so the first release run publishes the current `0.1.0` directly.

### First-time setup

1. **GitHub Pages** — set **Settings → Pages → Source** to **GitHub Actions**.
   This cannot be automated: `GITHUB_TOKEN` is denied the Pages-creation API
   (*Resource not accessible by integration*), and the *Deploy from a branch*
   default runs a Jekyll build that serves the README instead. Once the source
   is set, the Pages workflow publishes Storybook to
   `https://<owner>.github.io/<repo>/`.
2. **npm publishing** — create an npm **Automation** token for the `@dalcvil`
   scope and store it as the repository secret `NPM_TOKEN`
   (**Settings → Secrets and variables → Actions**). The release workflow
   exports it as `NODE_AUTH_TOKEN`, which `actions/setup-node` picks up.
3. **Allow the version PR** — enable **Settings → Actions → General →
   *Allow GitHub Actions to create and approve pull requests***, otherwise the
   workflow cannot open the “chore: version packages” pull request.

> **Note:** commits and pull requests created with the default `GITHUB_TOKEN`
> do not trigger other workflows, so the “chore: version packages” PR shows no
> CI checks. If CI is a required status check on `main`, pass a personal access
> token to the action's `github-token` input so that PR triggers CI.

## Credits

Styles are derived from [VGUI.css](https://github.com/AlpyneDreams/vgui.css) by
Jeffrey Ellison (MIT). See [LICENSE](./LICENSE).

## License

MIT © Dalcvi
