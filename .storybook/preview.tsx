import { useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Preview } from '@storybook/react-vite'

// The global theme is not bundled into the components, so Storybook opts in to
// it here the same way an application would.
import '../src/styles/theme.css'

/**
 * Every token is declared on `[data-vgui-theme]` rather than `:root`, so the
 * preview has to opt in to a variant for stories to be themed at all. The
 * attribute goes on `<html>` so the document-level rules in `theme.css`
 * (body background, headings, selection colour) resolve too.
 */
function ThemeProvider({ theme, children }: { theme: string; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.vguiTheme = theme
  }, [theme])

  return <>{children}</>
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Green Steam theme variant',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: ['green', 'vgui1', 'black', 'warm', 'clay'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'green',
  },
  decorators: [
    (Story, context) => (
      <ThemeProvider theme={(context.globals.theme as string | undefined) ?? 'green'}>
        <Story />
      </ThemeProvider>
    ),
  ],
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
