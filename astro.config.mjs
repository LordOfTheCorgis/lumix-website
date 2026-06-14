// @ts-check
import { defineConfig } from 'astro/config';
import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

function copySitemapAlias() {
  return {
    name: 'copy-sitemap-alias',
    hooks: {
      'astro:build:done': async (context) => {
        /** @type {{ dir: URL }} */
        const buildContext = context;
        const outputDir = fileURLToPath(buildContext.dir);
        await copyFile(`${outputDir}\\sitemap-index.xml`, `${outputDir}\\sitemap.xml`);
      }
    }
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://lumixsolutions.org',
  integrations: [sitemap(), copySitemapAlias()],
  vite: {
    plugins: [tailwindcss()]
  }
});