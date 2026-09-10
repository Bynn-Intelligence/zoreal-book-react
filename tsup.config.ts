import { defineConfig } from 'tsup';

// React and the core stay external: the app brings its own React, and the core
// is a normal dependency rather than a copy bundled into this package.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@zoreal/book-js'],
});
