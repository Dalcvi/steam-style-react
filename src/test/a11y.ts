import axe from 'axe-core'

/**
 * Runs the accessibility rules that are meaningful without a layout engine.
 *
 * `color-contrast` is disabled because jsdom computes no styles: leaving it on
 * would report every element as incomplete rather than passing or failing.
 * Contrast for this theme is measured in `docs/foundations.md` §10 instead.
 */
const DISABLED_RULES = ['color-contrast']

/** Returns one entry per accessibility rule the container violates. */
export async function a11yViolations(container: HTMLElement): Promise<string[]> {
  const results = await axe.run(container, {
    rules: Object.fromEntries(DISABLED_RULES.map((id) => [id, { enabled: false }])),
  })

  return results.violations.map((violation) => `${violation.id} (${violation.nodes.length} nodes)`)
}
