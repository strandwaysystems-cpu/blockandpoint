# Block & Point

An independent, research-led edit of Scandinavian heel design — [blockandpoint.com](https://blockandpoint.com).

Part of the Strandway Ventures affiliate portfolio (Pillar 1). Built on the shared
Astro page-type engine: **[`strandway-ventures/docs/affiliate-engine/`](https://github.com/strandwaysystems-cpu/strandway-ventures/tree/main/docs/affiliate-engine)**.

## Quick start

```bash
npm ci
npm run dev            # local dev server
npm run build          # static build → dist/
npm run check:links    # post-build integrity check (run after build)
```

Node 20+ (`.nvmrc` pins 20).

## How the site is organised

Every content page declares a `pageType` in frontmatter, which drives its template,
accent colour, affiliate chrome and schema.org output. Folders are URL silos:

| Silo | pageType | Job |
|---|---|---|
| `/edit` | `commercial_listicle`, `commercial_versus` | Money pages — ranked roundups and head-to-heads |
| `/brands` | `hub` | Per-brand home base, routes down to reviews and edits |
| `/reviews` | `transactional_review` | Single-brand verdicts, bottom of funnel |
| `/guides` | `informational` | Sizing, height, care — top of funnel |
| root | `page` | About and legal |

Adding a page = drop a `.md` in the right folder with the frontmatter contract. It
appears in that silo's index automatically.

## Monetization

**Read [`docs/MONETIZATION.md`](docs/MONETIZATION.md) before touching an affiliate link.**

Short version: no retailer URL is ever hardcoded in a page. Commercial CTAs point at
`/go/{slug}`, resolved from [`src/data/affiliate_links.json`](src/data/affiliate_links.json).
Switching a partner live is an edit to that one file.

No network has approved the site yet, so every link currently resolves to the plain
retailer URL and earns nothing. That is stated openly on `/affiliate-disclosure`.

## Guardrails

Both run in CI and should be run locally before pushing:

- `affiliate-id-guard` — fails on any placeholder affiliate ID.
- `npm run check:links` — fails on a dead internal link, an unknown `/go/` slug, an
  affiliate link missing `rel="sponsored"`, an indexable `/go/` page, or a `/go/` URL
  leaking into the sitemap.

## Key files

| Path | What it is |
|---|---|
| `src/data/affiliate_links.json` | Every outbound commercial link. The monetization switch. |
| `src/data/site_architecture.json` | Nav, footer, page-type definitions, newsletter config. |
| `src/data/brands.json` | The brand directory content. |
| `src/layouts/BlogLayout.astro` | The page-type engine. |
| `src/lib/rehype-affiliate-rel.mjs` | Stamps `rel="sponsored"` into the built HTML. |
| `public/script.js` | Strandway universal tracker + site presentation JS. |
| `public/consent.js` | Shared consent manager (per-site `CONFIG` only). |

## Hosting

Static output, host-portable per the Strandway web standard. `public/_redirects`
covers Cloudflare Pages; `public/.htaccess` covers Apache/Hostinger, including the
extensionless-URL rewrite that `build.format: 'file'` requires.

Build command `npm run build`, output directory `dist`, `NODE_VERSION=20`.
