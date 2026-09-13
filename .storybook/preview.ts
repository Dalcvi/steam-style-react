import type { Preview } from '@storybook/react-vite'

// The global theme is not bundled into the components, so Storybook opts in to
// it here the same way an application would.
import '../src/styles/theme.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
