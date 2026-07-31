import affiliates from '../data/affiliate_links.json';

/**
 * Resolve an affiliate slug to its /go/ router URL.
 *
 * Always use this instead of writing "/go/foo" by hand. An unknown slug throws
 * at build time, so a typo fails `npm run build` loudly rather than shipping a
 * CTA that 404s — a dead money link is the most expensive bug on the site.
 *
 * @param {string} slug key in src/data/affiliate_links.json → links
 * @returns {string} e.g. "/go/atp-atelier"
 */
export function go(slug) {
  if (!Object.prototype.hasOwnProperty.call(affiliates.links, slug)) {
    const known = Object.keys(affiliates.links).join(', ');
    throw new Error(
      `Unknown affiliate slug "${slug}". Add it to src/data/affiliate_links.json or fix the typo. Known slugs: ${known}`,
    );
  }
  return `/go/${slug}`;
}

/** The full link record, for labels/partner names in markup. */
export function link(slug) {
  go(slug);
  return affiliates.links[slug];
}

/** Attributes every outbound commercial link must carry. */
export const sponsoredAttrs = {
  target: '_blank',
  rel: 'noopener sponsored nofollow',
};

export const links = affiliates.links;
export const networks = affiliates.networks;
