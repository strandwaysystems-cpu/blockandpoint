/**
 * Rehype plugin: declare affiliate relationships in the HTML itself.
 *
 * Markdown authors write plain links — `[👉 Shop Flattered](/go/flattered)`.
 * Without this, the `rel` attribute was only applied by client-side JS after
 * hydration, which means crawlers and the FTC's "clear and conspicuous"
 * expectation both saw an unmarked commercial link. Google's own guidance is
 * that qualifying attributes must be in the served markup.
 *
 * So the rel is set at build time instead:
 *   /go/*   → rel="sponsored nofollow"  (internal router, same tab)
 *   external → rel="noopener sponsored nofollow" target="_blank"
 *
 * Written without unist-util-visit so it carries no dependency of its own.
 */
const SITE_HOST = 'blockandpoint.com';

function isExternal(href) {
  if (!/^https?:/i.test(href)) return false;
  try {
    return !new URL(href).hostname.endsWith(SITE_HOST);
  } catch {
    return false;
  }
}

function visit(node, fn) {
  if (!node || typeof node !== 'object') return;
  fn(node);
  const children = node.children;
  if (Array.isArray(children)) {
    for (const child of children) visit(child, fn);
  }
}

export default function rehypeAffiliateRel() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== 'element' || node.tagName !== 'a') return;

      const props = (node.properties ??= {});
      const href = String(props.href ?? '');
      if (!href) return;

      if (href.startsWith('/go/')) {
        props.rel = ['sponsored', 'nofollow'];
        return;
      }

      if (isExternal(href)) {
        // Editorial outbound links (sources, brand references) get nofollow and
        // sponsored so they are never mistaken for unpaid editorial endorsement
        // once the site is monetised.
        props.rel = ['noopener', 'sponsored', 'nofollow'];
        props.target = '_blank';
      }
    });
  };
}
