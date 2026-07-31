#!/usr/bin/env node
/**
 * Post-build integrity check for dist/.
 *
 * A dead link is the most expensive bug on an affiliate site: a broken money
 * CTA earns nothing, and broken links are a documented cause of affiliate
 * network rejection. This runs after `astro build` and fails loudly on:
 *
 *   1. Placeholder affiliate IDs in the link data (belt-and-braces alongside
 *      .github/workflows/affiliate-id-guard.yml).
 *   2. Affiliate records with a missing, non-https or malformed URL.
 *   3. A /go/{slug} referenced anywhere in the built HTML with no matching
 *      entry in affiliate_links.json — i.e. a CTA that would 404.
 *   4. A /go/ page that exists but is not marked noindex.
 *   5. Any internal href in the built HTML that does not resolve to a file.
 *   6. Affiliate links rendered without rel="sponsored".
 *
 * Usage: node scripts/check-affiliate-links.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const errors = [];
const warnings = [];

if (!existsSync(dist)) {
  console.error('dist/ not found — run `npm run build` first.');
process.exit(1);
}

const affiliates = JSON.parse(
  readFileSync(join(root, 'src/data/affiliate_links.json'), 'utf8'),
);
const slugs = new Set(Object.keys(affiliates.links));

// --- 1 & 2: the link data itself --------------------------------------------
const PLACEHOLDER =
  /YOUR_AID|AFFILIATE_ID_HERE|YOUR_AFFILIATE_ID|REPLACE_ME|TODO_AFFILIATE|XXXX-XXXX|your-affiliate-id|INSERT_ID/i;

for (const [slug, link] of Object.entries(affiliates.links)) {
  if (!link.url) {
    errors.push(`affiliate_links.json: "${slug}" has no url`);
    continue;
  }
  if (PLACEHOLDER.test(link.url)) {
    errors.push(`affiliate_links.json: "${slug}" contains a placeholder ID — ${link.url}`);
  }
  if (!/^https:\/\//.test(link.url)) {
    errors.push(`affiliate_links.json: "${slug}" url must be https — ${link.url}`);
  }
  try {
    new URL(link.url);
  } catch {
    errors.push(`affiliate_links.json: "${slug}" url is malformed — ${link.url}`);
  }
  for (const field of ['label', 'partner', 'vertical']) {
    if (!link[field]) errors.push(`affiliate_links.json: "${slug}" is missing "${field}"`);
  }
}

// --- Walk dist/ --------------------------------------------------------------
function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const allFiles = walk(dist);
const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));

/** Does an internal path resolve to something we actually built? */
function resolves(pathname) {
  const clean = pathname.replace(/[?#].*$/, '').replace(/\/$/, '') || '/index';
  const candidates = [
    join(dist, `${clean}.html`),
    join(dist, clean, 'index.html'),
    join(dist, clean),
  ];
  return candidates.some((c) => existsSync(c));
}

const linkRe = /<a\b[^>]*?href=["']([^"']+)["'][^>]*>/gi;
const goRefs = new Set();

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const page = '/' + relative(dist, file).replace(/\.html$/, '').replace(/\/index$/, '');

  for (const match of html.matchAll(linkRe)) {
    const [tag, href] = match;

    // Skip protocol/external/anchor/mail links for the resolution check.
    if (/^(https?:|mailto:|tel:|#|data:)/i.test(href)) continue;
    if (!href.startsWith('/')) continue;

    if (href.startsWith('/go/')) {
      const slug = href.replace(/^\/go\//, '').replace(/[?#].*$/, '');
      goRefs.add(slug);
      if (!slugs.has(slug)) {
        errors.push(`${page}: links to /go/${slug}, which is not in affiliate_links.json`);
      }
      // --- 6: every affiliate link must declare the relationship.
      if (!/\brel=["'][^"']*sponsored/i.test(tag)) {
        errors.push(`${page}: /go/${slug} link is missing rel="sponsored" — ${tag.slice(0, 120)}`);
      }
      continue;
    }

    if (!resolves(href)) {
      errors.push(`${page}: dead internal link → ${href}`);
    }
  }
}

// --- 4: /go/ pages must be noindex ------------------------------------------
for (const file of htmlFiles.filter((f) => f.includes(`${dist}/go/`))) {
  const html = readFileSync(file, 'utf8');
  if (!/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)) {
    errors.push(`${relative(dist, file)}: /go/ interstitial is not marked noindex`);
  }
}

// --- Sitemap must not contain /go/ ------------------------------------------
const sitemaps = allFiles.filter((f) => /sitemap.*\.xml$/.test(f));
for (const sm of sitemaps) {
  if (readFileSync(sm, 'utf8').includes('/go/')) {
    errors.push(`${relative(dist, sm)}: contains /go/ URLs, which must stay out of the sitemap`);
  }
}

// --- Unused slugs are a warning, not a failure ------------------------------
for (const slug of slugs) {
  if (!goRefs.has(slug)) {
    warnings.push(`affiliate slug "${slug}" is defined but never linked from any page`);
  }
}

// --- Report ------------------------------------------------------------------
const monetized = Object.values(affiliates.links).filter((l) => l.monetized).length;
console.log(
  `Checked ${htmlFiles.length} pages · ${slugs.size} affiliate links (${monetized} monetized, ${slugs.size - monetized} awaiting network approval)`,
);

for (const w of warnings) console.warn(`  warning: ${w}`);

if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

console.log('✓ All internal links resolve, all affiliate slugs valid, no placeholder IDs.');
