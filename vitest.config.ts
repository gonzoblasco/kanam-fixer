import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // The virtual screen reader walks a real DOM, so tests need a DOM
    // implementation. jsdom is that implementation here.
    environment: 'jsdom',
  },
});
