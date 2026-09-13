# Copilot instructions

`@dalcvil/steam-green-react` is a tree-shakable React component library that
reproduces the Steam/VGUI "Green Steam" look.

## Pull request titles

**Pull request titles must always be semantic.** Every PR title follows
[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <description>
```

Use one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore` or `revert`. Write the description in the imperative
mood, lowercase, with no trailing full stop — for example
`feat(GreenButton): add a fullWidth prop` or `ci: gate release on a green CI run`.
The scope is optional but should name the component or area that changed.
Breaking changes are marked with `!` before the colon (`feat!: drop React 18`).

The same rule applies to squash-merge commit subjects, so the generated
changelog stays readable.

## Releasing

Releases are automated with [Changesets](https://changesets.dev). Add a
changeset to any PR that changes the published package:

```
pnpm changeset
```

Pick the bump type (`patch` for fixes, `minor` for new components or props) and
describe the change — that description becomes the changelog entry. Do not edit
`version` in `package.json` or `CHANGELOG.md` by hand; the
`chore: version packages` pull request does that.

## Components

- One directory per component under `src/components/<Name>/` containing
  `<Name>.tsx`, `index.ts`, `<Name>.css` and `<Name>.stories.tsx`.
- Every component is re-exported (value and props type) from `src/index.ts`,
  which is the only public entry point.
- Import the component stylesheet from the component itself so per-component CSS
  travels with the component. Never add a global stylesheet import.
- Component styles are scoped with a `greensteam-<name>` class and BEM-style
  modifiers (`greensteam-<name>--<modifier>`), matching the existing
  `greensteam-button`.
- Keep components tree-shakable: no side effects other than the CSS import, no
  barrel file that re-exports an unrelated module, and leave `react` /
  `react-dom` as externals.
- Public props carry a one-line doc comment (`/** ... */`) so Storybook's
  autodocs table is filled in.
- Validate with `pnpm run typecheck`, `pnpm run build` and
  `pnpm run build-storybook`.
