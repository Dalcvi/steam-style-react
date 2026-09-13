/**
 * @dalcvil/steam-green-react
 *
 * Public entry point. Every component is re-exported from here, but the build
 * preserves the module graph so importing one component never pulls in the
 * rest:
 *
 * ```tsx
 * import { GreenButton } from '@dalcvil/steam-green-react'
 * ```
 *
 * The global theme (`@dalcvil/steam-green-react/styles/theme.css`) is opt-in;
 * per-component styles ship with their component.
 */
export { GreenButton } from './components/GreenButton'
export type { GreenButtonProps } from './components/GreenButton'
