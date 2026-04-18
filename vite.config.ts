import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  base: '/',

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

  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        play: resolve(__dirname, 'play/index.html'),
      },
    },
  },

  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.ogg', '**/*.mp3', '**/*.wasm'],

  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
}));
