import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import react from '@astrojs/react';
import tina from 'astro-tina';
import rehypeAlternateImages from './src/lib/rehype-alternate-images.mjs';

export default defineConfig({
  site: 'https://longlostforgotten.com',
  output: 'static',
  integrations: [react(), tina()],
  markdown: {
    processor: unified({
      rehypePlugins: [rehypeAlternateImages],
    }),
  },
});
