// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://lumixsolutions.org',

  // /hardware was pulled (2026-11-24). people have it bookmarked and it's in
  // old search results, so send them somewhere useful instead of a 404
  redirects: { '/hardware': '/regions/' },

  vite: {
    plugins: [tailwindcss()],
    // cobe is a dynamic import so vite only finds it on first scroll, re-opts
    // mid session, and every open tab gets "504 Outdated Optimize Dep" until a
    // hard reload. globe "vanished" twice because of this. pre-bundle it
    optimizeDeps: { include: ["cobe"] },
  },

  integrations: [sitemap()]
});