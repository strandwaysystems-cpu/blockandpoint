# Block & Point — Monetization Runbook

> How this site earns money, what still has to happen before it does, and the exact
> procedure for switching a partner live.
>
> Last updated: 2026-07-30

---

## Current state, in one line

**The site is fully wired for affiliate revenue and earns nothing yet, because no
network has approved it.** Every commercial CTA already routes through `/go/{slug}`,
resolved from a single file. Switching a partner live is a one-file edit — no page
changes, no hunting through markup.

---

## Why it was built this way

The chicken-and-egg problem is real: networks want traffic before they approve you, and
you want approval before you build. The resolution is to build the site so that it is
**approvable and indexable now**, and **monetizable the day approval lands**.

That means the work splits into two phases, and only the second one depends on anyone
else saying yes.

| | What it needs | Blocked on approval? |
|---|---|---|
| **Phase 1 — get traffic** | Real content, clean SEO, working links, legal pages, analytics | No — done |
| **Phase 2 — earn** | Network approval, then paste tracked URLs into one file | Yes |

---

## What was wrong before

Worth recording, because these are the specific things that made the site un-approvable
and un-earning:

1. **The "affiliate" links paid nothing.** Outbound links carried
   `utm_source=blockandpoint&utm_medium=affiliate` query strings. UTM parameters are
   analytics labels — they carry no affiliate ID and no network sees them. Every click
   was worth exactly zero.
2. **They were tagged `rel="nofollow"`, not `rel="sponsored"`.** The portfolio tracker
   distinguishes `affiliate_click` from `outbound_click` on the `sponsored` token, so
   even the click data was mis-filed.
3. **The blog was a facade.** Six article cards on `/blog`, every one linking back to
   `/blog`. One real article existed. Thin/placeholder content is a stated rejection
   reason at Awin and Rakuten, and it meant nothing could rank.
4. **No legal pages.** Privacy and Affiliate Disclosure were `href="#"`. Networks check
   these first — a dead disclosure link is close to an automatic rejection.
5. **No analytics.** No way to prove traffic in an application, which is the one thing
   applications are judged on.
6. **The newsletter was fake.** The form showed "Subscribed" and stored nothing.
7. **Links were hardcoded in markup.** Adding real IDs later would have meant editing
   every `.astro` file by hand and missing some.

All seven are fixed. See the commit for specifics.

---

## Phase 1 — traffic (in progress, not blocked)

### Done

- 22 indexable pages on the page-type engine (was: 4, of which 1 was real).
- Money pages: 3 ranked roundups, 2 head-to-head comparisons.
- Top-of-funnel: 3 guides (sizing, heel height, leather care).
- Bottom-of-funnel: 2 brand reviews with `Review` + `Rating` schema.
- Brand hubs for the three anchor brands, plus the full directory.
- Full SEO plumbing: canonical URLs, sitemap, `robots.txt`, per-type JSON-LD,
  Open Graph, favicon set, 301s for every URL that moved.
- Legal: privacy, cookie policy, affiliate disclosure, about.
- Analytics: Plausible (cookieless) + the Strandway universal click tracker.
- `npm run check:links` fails the build on a dead internal link, an unknown affiliate
  slug, a missing `rel="sponsored"`, or an indexable `/go/` page.

### Still to do — these need you, not a network

| # | Task | Why it matters |
|---|---|---|
| 1 | **Add `blockandpoint.com` to Plausible** | The tracking script is live in `BaseLayout.astro` with `data-domain="blockandpoint.com"`. Until the site exists in the Plausible account, it records nothing — and traffic data is the single thing every application is judged on. Do this first; the clock on "90 days of traffic" starts when tracking does. |
| 2 | **Verify Google Search Console** | Paste the HTML-tag token into `gscVerification` in `src/layouts/BaseLayout.astro` (currently `''`, which renders nothing). Then submit `sitemap-index.xml`. |
| 3 | **Create the MailerLite form** | Set `newsletter.endpoint` in `src/data/site_architecture.json`. Until then the form honestly says "Opening soon" rather than faking a confirmation. An email list is the asset that survives an algorithm update. |
| 4 | **Publish more money pages** | 5 commercial pages is a thin catalogue. The template set in `strandway-ventures/docs/affiliate-engine/templates/` is the fastest route to more. |
| 5 | **Add `favicon.ico`** | The full icon set ships except the legacy `.ico` — the build environment had no ICO encoder. Minor; modern browsers use the SVG. |

### Realistic timeline

Networks generally want to see a site that is indexed, has real content, and has some
traffic history. From a standing start that is typically **60–90 days** of indexing and
content before an application is worth making. Applying too early and getting rejected
is worse than waiting, because reapplication is slower than first application.

**Apply to Awin first.** It is the most forgiving on traffic thresholds and covers the
most brands in this niche. A single approval also makes later applications easier,
because you can point to an existing publisher relationship.

---

## Phase 2 — the switch-live procedure

When a network approves the site, this is the entire process.

### 1. Record the network

In `src/data/affiliate_links.json`, update the `networks` block:

```jsonc
"awin": {
  "status": "approved",        // was "not_applied"
  "publisher_id": "123456",    // your real publisher ID
  "covers": ["atp-atelier", "zalando", "asos"],
  "notes": "Approved 2026-10-01."
}
```

### 2. Paste the tracked URLs

For each link that network covers, replace `url` with the network's tracked deep link
and flip `monetized` to `true`:

```jsonc
"flattered": {
  "label": "Flattered",
  "partner": "flattered",
  "vertical": "footwear-brand-direct",
  "url": "https://www.awin1.com/cread.php?awinmid=XXXX&awinaffid=123456&ued=https%3A%2F%2Fflattered.com%2Fcollections%2Fall-shoes",
  "network": "awin",
  "monetized": true
}
```

**That is the whole change.** Every CTA across every page picks it up automatically,
because nothing anywhere hardcodes a retailer URL.

### 3. Update the disclosure

In `src/pages/affiliate-disclosure.md`, add the partner to the "Current partners" table
with its category and start date, and delete the "no affiliate relationships active"
row. Do the same in the "Affiliate and newsletter" table in
`src/pages/cookie-policy.md` if the partner sets cookies.

**Do not skip this.** The disclosure currently states plainly that the site earns
nothing. Leaving that live once it does is a false statement to readers and a
compliance problem under the FTC guides and the EU Omnibus Directive.

### 4. Verify

```bash
npm run build && npm run check:links
```

The check reports how many links are monetized. Confirm the number matches what you
just switched, then spot-check one `/go/` page in `dist/` to make sure it redirects to
the tracked URL.

### 5. Confirm tracking

New partner hostname? Add one line to `partnerFromUrl()` and, if it is a new category,
one case to `verticalFromPartner()` — both in `public/script.js`. The footwear partners
are already there. Per the portfolio standard those lines should also be back-ported to
the other Strandway sites to keep the tracker identical everywhere.

---

## Which programmes to target

Verify current terms before applying — commission rates move.

| Priority | Programme | Network | Why |
|---|---|---|---|
| 1 | **Awin** | — | Covers ATP Atelier, Zalando and ASOS. Most forgiving approval and the best single fit for this niche. Apply here first. |
| 2 | **Nordstrom** | Rakuten | Highest-value US retailer for these brands, and reportedly the best commission of the large retailers in this space. Stricter on traffic. |
| 3 | **Farfetch** | Rakuten/Awin | Carries ATP Atelier, Aeyde and Sania d'Mina — the three hardest brands to buy elsewhere. |
| 4 | **Direct brand programmes** | In-house / Shopify Collabs | Flattered, Roccamore, Aeyde, Vagabond. Smaller brands, but the audience match is exact, so they convert best. Email them once you have traffic to show. |
| 5 | **NET-A-PORTER** | Impact | Only relevant for Aeyde. Low priority. |

Every one of these already has `/go/` slugs and live pages pointing at it. Nothing new
needs building for any of them.

---

## What every application will ask for

Have these ready:

- **Site URL** — blockandpoint.com
- **Monthly traffic** — from Plausible. Task 1 above is why this needs doing now.
- **Traffic sources** — organic search, once indexing is established.
- **How you promote** — content/SEO publisher, no paid search on brand terms.
- **Disclosure** — link them straight to `/affiliate-disclosure`. It is written to be
  read by exactly this reviewer.

---

## The rules this site is held to

These are not aspirational — they are enforced in the build and stated on the site.

- **Real IDs only, never placeholders.** `.github/workflows/affiliate-id-guard.yml`
  fails the build on any placeholder, and `check:links` fails on a non-https or
  malformed affiliate URL.
- **Every commercial link declares itself.** `rel="sponsored"` is stamped into the HTML
  at build time by `src/lib/rehype-affiliate-rel.mjs` — never left to client-side JS,
  where a crawler would never see it. `check:links` fails if one is missing.
- **`/go/` is noindex and out of the sitemap.** Enforced by the check script.
- **Commission never influences a ranking.** Stated on `/affiliate-disclosure` and
  `/about`, and the content is written to honour it — several pages recommend a cheaper
  brand or recommend against buying.
- **No invented test data.** The site is research-led and says so on every commercial
  page. Longevity figures are labelled as judgements from construction type, not
  measurements. This is both an honesty commitment and an FTC exposure the portfolio
  should not take on.

---

## Reference

- Build & hosting: `strandway-ventures/STRANDWAY-WEB-STANDARD.md`
- Page-type system: `strandway-ventures/docs/affiliate-engine/`
- Analytics, consent, disclosure: `strandway-ventures/docs/analytics-privacy-standard.md`
- Reference implementation: `stay-albanian-riviera`
