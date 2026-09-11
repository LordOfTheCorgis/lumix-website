// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://lumixsolutions.org',

  vite: {
    plugins: [tailwindcss()],
    // cobe is only ever loaded through a dynamic import() when the globe
    // scrolls into view. Vite doesn't see it at startup, discovers it on the
    // first request, re-optimises the dep bundle mid-session, and every tab
    // that already has the old module URL gets "504 Outdated Optimize Dep"
    // until a hard reload. Twice now the globe "vanished" in dev for exactly
    // this reason. Pre-bundling it up front is the fix.
    optimizeDeps: { include: ["cobe"] },
  },

  integrations: [sitemap()]
});