const { defineConfig } = require('vite');

module.exports = defineConfig({
  build: {
    rollupOptions: {
      external: ['three', /^three\/addons\//]
    }
  },
  base: './'
});
