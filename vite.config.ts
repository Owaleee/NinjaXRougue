import { defineConfig } from 'vitest/config';

// Neste plano o Vite só serve de configuração para o Vitest.
// O Plano 2 acrescenta a configuração do jogo (Phaser + DOM).
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
