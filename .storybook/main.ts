import type { StorybookConfig } from '@storybook/react-vite'

/**
 * GitHub Pages serves the built Storybook from a sub-path
 * (`/<repo-name>/`), so the CI workflow passes that in through
 * `STORYBOOK_BASE_PATH` and we forward it to Vite.
 */
const base = process.env.STORYBOOK_BASE_PATH

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(viteConfig) {
    if (base) {
      viteConfig.base = base
    }
    return viteConfig
  },
}

export default config
