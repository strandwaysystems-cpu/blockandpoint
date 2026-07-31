// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeAffiliateRel from './src/lib/rehype-affiliate-rel.mjs';

// Block & Point — Scandinavian footwear affiliate content engine.
//
// Markdown content in src/pages/** uses a `layout` + `pageType` frontmatter
// contract (see docs/affiliate-engine/ in strandway-ventures). BlogLayout
// switches presentation and schema.org output based on pageType.
//
// One canonical URL form site-wide: no trailing slash, extensionless. Aligns
// served URL == canonical tag == sitemap == internal links, so Google never has
// to reconcile two forms of the same page.
//
// `build.format: 'file'` emits /edit/foo.html. Cloudflare Pages serves that
// extensionless for free; Apache/Hostinger needs the rewrite in public/.htaccess.
// Both are shipped so the site stays host-portable per STRANDWAY-WEB-STANDARD §5.
export default defineConfig({
  site: 'https://blockandpoint.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  // /go/* are noindex affiliate interstitials — keep them out of the sitemap.
  integrations: [sitemap({ filter: (page) => !/\/go\//.test(page) })],
  markdown: {
    gfm: true,
    smartypants: true,
    // Stamps rel="sponsored nofollow" onto every commercial link in the served
    // HTML, rather than leaving it to client-side JS where crawlers never see it.
    rehypePlugins: [rehypeAffiliateRel],
  },
});
