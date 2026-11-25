// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';
import { copyFileSync } from 'node:fs';

// the live 404 is Apache's grey page that says an ErrorDocument failed, so
// cPanel already points 404s at a file we never shipped. cPanel's default is
// /404.shtml, so ship our 404 page under that name. a guess, check the live
// response after a deploy and delete this if it still comes back grey
const copy404 = {
  name: 'copy-404-shtml',
  hooks: {
    'astro:build:done': ({ dir }) =>
      copyFileSync(new URL('404.html', dir), new URL('404.shtml', dir)),
  },
};

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

  integrations: [sitemap(), copy404]
});