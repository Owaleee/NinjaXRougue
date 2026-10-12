import { defineConfig } from 'vitest/config';

// base './' → o dist/ funciona aberto de qualquer pasta (spec §13: "dist/ estático").
// O Phaser sozinho passa de 1 MB; o aviso de chunk grande é esperado.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000 },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
