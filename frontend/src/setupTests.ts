// frontend/src/setupTests.ts

// Extends Vitest / Jest DOM assertions
import "@testing-library/jest-dom";

// (Optional) You can add global mocks or utilities here
// Example: mocking matchMedia to avoid errors in jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Example: suppress console.error warnings in test logs
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  (console.error as any).mockRestore?.();
});
