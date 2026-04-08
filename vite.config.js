const { defineConfig } = require('vite');

module.exports = defineConfig({
  optimizeDeps: {
    entries: ['index.html'],
    exclude: ['@xenova/transformers']
  },
  build: {
    rollupOptions: {
      external: ['three', /^three\/addons\//]
    }
  },
  base: './'
});
