// @ts-check
import { defineConfig } from 'astro/config';
import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';
import { spotlight } from './src/data/site.ts';

import tailwindcss from '@tailwindcss/vite';

function copySitemapAlias() {
  return {
    name: 'copy-sitemap-alias',
    hooks: {
      'astro:build:done': async (context) => {
        /** @type {{ dir: URL }} */
        const buildContext = context;
        const sitemapIndexPath = fileURLToPath(new URL('sitemap-index.xml', buildContext.dir));
        const sitemapAliasPath = fileURLToPath(new URL('sitemap.xml', buildContext.dir));
        await copyFile(sitemapIndexPath, sitemapAliasPath);
      }
    }
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://lumixsolutions.org',
  integrations: [
    // no spotlight running means no /spotlight in the sitemap, the page itself
    // goes noindex at the same time
    sitemap({ filter: (page) => spotlight.enabled || !page.endsWith('/spotlight/') }),
    copySitemapAlias()
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});