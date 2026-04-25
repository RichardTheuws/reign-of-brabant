import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@ecs': resolve(__dirname, 'src/ecs'),
      '@systems': resolve(__dirname, 'src/systems'),
      '@world': resolve(__dirname, 'src/world'),
      '@entities': resolve(__dirname, 'src/entities'),
      '@factions': resolve(__dirname, 'src/factions'),
      '@combat': resolve(__dirname, 'src/combat'),
      '@ai': resolve(__dirname, 'src/ai'),
      '@pathfinding': resolve(__dirname, 'src/pathfinding'),
      '@camera': resolve(__dirname, 'src/camera'),
      '@input': resolve(__dirname, 'src/input'),
      '@rendering': resolve(__dirname, 'src/rendering'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@audio': resolve(__dirname, 'src/audio'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@types': resolve(__dirname, 'src/types'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'uat'],
  },
});
