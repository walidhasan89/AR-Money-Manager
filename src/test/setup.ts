import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement matchMedia; ThemeProvider's 'system' preference
// needs it to resolve prefers-color-scheme and subscribe to OS changes.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
