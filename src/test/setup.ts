import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// React Testing Library only registers its automatic cleanup when the test
// globals are enabled. These tests import from `vitest` explicitly instead, so
// cleanup is wired up by hand.
afterEach(cleanup)

// jsdom implements no layout and no observer APIs. Components that measure or
// observe their container would throw on mount without these stubs; the stubs
// are deliberately inert so a test that depends on real geometry has to mock
// the geometry itself.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

globalThis.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver
globalThis.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver

Element.prototype.scrollIntoView ??= function scrollIntoView() {}
