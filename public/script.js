// ===========================================================================
// Block & Point — public/script.js
// ---------------------------------------------------------------------------
// Two parts, in this order:
//   1. The Strandway universal click tracker + AI-referral attribution. Shared
//      verbatim with every other Strandway site apart from three sanctioned
//      extensions, each marked below: the footwear partners in
//      partnerFromUrl(), their verticals in verticalFromPartner(), and this
//      site's URL silos in pageType(). Adding a partner is a one-line change
//      here (docs/analytics-privacy-standard.md sections 5 and 11) — the links
//      themselves need nothing beyond rel="sponsored".
//   2. The Block & Point presentation JS (theme, nav, reveal, filters), which
//      is the only genuinely site-specific code and lives below the tracker.
//
// NOTE: outbound affiliate CTAs on this site point at /go/{slug}, which is
// same-origin, so the external-link branch below does not fire for them. Those
// clicks are attributed by src/pages/go/[slug].astro at redirect time instead,
// which is why no /go/ special-case is needed in the tracker itself.
// ===========================================================================

// ===========================================================================
// Strandway universal click tracker (Plausible)  —  identical across every site
// ---------------------------------------------------------------------------
// Fires `affiliate_click` (rel="sponsored"), `outbound_click` (other external)
// or `contact_click` (mailto), auto-attributing the partner + monetisation
// vertical from the hostname/URL. Adding a new affiliate link needs NO change
// here — just give the <a> the correct rel. Calls window.plausible, which is
// queued by the Plausible snippet in <head> and flushes once the script loads.
// ===========================================================================
(function () {
  function partnerFromUrl(href) {
    try {
      var u = new URL(href, location.href);
      var h = u.hostname.toLowerCase();
      // Travelpayouts redirect wrappers (final destination is the partner)
      if (h.indexOf('tpx.gr') !== -1 || h.indexOf('tp.media') !== -1 || h.indexOf('emrld.ltd') !== -1) {
        if (h.indexOf('localrent') !== -1) return 'localrent';
        if (h.indexOf('economybookings') !== -1) return 'economybookings';
        if (h.indexOf('gettransfer') !== -1) return 'gettransfer';
        if (h.indexOf('saily') !== -1) return 'esim';
        var c = (u.searchParams.get('campaign') || u.searchParams.get('marker') || '').toLowerCase();
        if (c.indexOf('booking') !== -1) return 'booking';
        if (c.indexOf('viator') !== -1) return 'viator';
        return 'travelpayouts';
      }
      // Accommodation
      if (h.indexOf('stay22') !== -1) return 'stay22';
      if (h.indexOf('booking.com') !== -1) return 'booking';
      // Tours & activities
      if (h.indexOf('viator.com') !== -1) return 'viator';
      if (h.indexOf('getyourguide') !== -1) return 'getyourguide';
      // Transfers
      if (h.indexOf('kiwitaxi') !== -1) return 'kiwitaxi';
      if (h.indexOf('welcomepickups') !== -1) return 'welcomepickups';
      if (h.indexOf('gettransfer') !== -1) return 'gettransfer';
      // Car rental
      if (h.indexOf('localrent') !== -1) return 'localrent';
      if (h.indexOf('economybookings') !== -1) return 'economybookings';
      if (h.indexOf('qeeq') !== -1) return 'qeeq';
      if (h.indexOf('discovercars') !== -1) return 'discovercars';
      if (h.indexOf('rentalcars') !== -1) return 'rentalcars';
      // Flights
      if (h.indexOf('skyscanner') !== -1) return 'skyscanner';
      // eSIM / connectivity
      if (h.indexOf('airalo') !== -1 || h.indexOf('holafly') !== -1 || h.indexOf('saily') !== -1 || h.indexOf('yesim') !== -1 || h.indexOf('gigsky') !== -1) return 'esim';
      // Boats / yachts
      if (h.indexOf('adriaticyachtguide') !== -1) return 'yacht';
      if (h.indexOf('searadar') !== -1) return 'searadar';
      if (h.indexOf('boatbookings') !== -1) return 'boatbookings';
      if (h.indexOf('samboat') !== -1) return 'samboat';
      if (h.indexOf('clickandboat') !== -1) return 'clickandboat';
      // Travel insurance
      if (h.indexOf('safetywing') !== -1) return 'safetywing';
      if (h.indexOf('heymondo') !== -1) return 'heymondo';
      // Privacy / compliance SaaS
      if (h.indexOf('enzuzo') !== -1) return 'enzuzo';
      if (h.indexOf('iubenda') !== -1) return 'iubenda';
      if (h.indexOf('termly') !== -1) return 'termly';
      if (h.indexOf('cookieyes') !== -1) return 'cookieyes';
      if (h.indexOf('osano') !== -1) return 'osano';
      if (h.indexOf('usercentrics') !== -1) return 'usercentrics';
      if (h.indexOf('securiti') !== -1) return 'securiti';
      if (h.indexOf('transcend') !== -1) return 'transcend';
      if (h.indexOf('complianz') !== -1) return 'complianz';
      if (h.indexOf('nordlayer') !== -1) return 'nordlayer';
      if (h.indexOf('checkthat') !== -1) return 'checkthat';
      // Monetisation infra
      if (h.indexOf('lemonsqueezy') !== -1 || h.indexOf('lemon.shop') !== -1) return 'lemonsqueezy';
      if (h.indexOf('mailerlite') !== -1) return 'mailerlite';
      // Fashion / footwear (Block & Point vertical)
      if (h.indexOf('atpatelier') !== -1) return 'atp-atelier';
      if (h.indexOf('flattered') !== -1) return 'flattered';
      if (h.indexOf('vagabond') !== -1) return 'vagabond';
      if (h.indexOf('roccamore') !== -1) return 'roccamore';
      if (h.indexOf('aeyde') !== -1) return 'aeyde';
      if (h.indexOf('anonymouscph') !== -1) return 'anonymous-copenhagen';
      if (h.indexOf('nordstrom') !== -1) return 'nordstrom';
      if (h.indexOf('farfetch') !== -1) return 'farfetch';
      if (h.indexOf('net-a-porter') !== -1) return 'net-a-porter';
      if (h.indexOf('zalando') !== -1) return 'zalando';
      if (h.indexOf('asos') !== -1) return 'asos';
      if (h.indexOf('revolve') !== -1) return 'revolve';
      return null;
    } catch (e) { return null; }
  }

  // Group a partner into a monetisation vertical for reporting.
  function verticalFromPartner(p) {
    switch (p) {
      case 'viator': case 'getyourguide': return 'tour-affiliate';
      case 'stay22': case 'booking': return 'hotel-affiliate';
      case 'localrent': case 'economybookings': case 'qeeq': case 'discovercars': case 'rentalcars': return 'car-rental-affiliate';
      case 'gettransfer': case 'kiwitaxi': case 'welcomepickups': return 'transfer-affiliate';
      case 'esim': return 'esim-affiliate';
      case 'skyscanner': return 'flight-affiliate';
      case 'yacht': case 'searadar': case 'boatbookings': case 'samboat': case 'clickandboat': return 'yacht-affiliate';
      case 'safetywing': case 'heymondo': return 'insurance-affiliate';
      case 'enzuzo': case 'iubenda': case 'termly': case 'cookieyes': case 'osano':
      case 'usercentrics': case 'securiti': case 'transcend': case 'complianz':
      case 'nordlayer': case 'checkthat': return 'saas-affiliate';
      case 'lemonsqueezy': case 'mailerlite': return 'infra-affiliate';
      case 'atp-atelier': case 'flattered': case 'vagabond': case 'roccamore':
      case 'aeyde': case 'anonymous-copenhagen': return 'footwear-brand-direct';
      case 'nordstrom': case 'farfetch': case 'net-a-porter': case 'zalando':
      case 'asos': case 'revolve': return 'footwear-retailer';
      default: return 'other-affiliate';
    }
  }

  function pageType() {
    var p = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    if (p === '/' || p === '' || /\/index$/.test(p)) return 'home';
    // Silos for this site: /edit (money), /brands (hubs), /reviews, /guides.
    if (p.indexOf('/edit') === 0) return /-vs-/.test(p) ? 'compare' : 'edit';
    if (p.indexOf('/brands') === 0) return 'brands';
    if (p.indexOf('/reviews') === 0 || /review/.test(p)) return 'reviews';
    if (p.indexOf('/guides') === 0 || /guide/.test(p)) return 'guides';
    if (p.indexOf('/go/') === 0) return 'go-redirect';
    return 'page';
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#') return;

    // Email contact clicks — conversion event.
    if (href.indexOf('mailto:') === 0) {
      if (typeof window.plausible === 'function') {
        try {
          window.plausible('contact_click', {
            props: {
              event_category: 'contact',
              event_label: href.replace('mailto:', ''),
              page_path: location.pathname,
              page_type: pageType()
            }
          });
        } catch (e0) {}
      }
      return;
    }

    // External links only
    var isExternal;
    try {
      var u = new URL(href, location.href);
      isExternal = u.hostname && u.hostname !== location.hostname;
    } catch (err) { return; }
    if (!isExternal) return;

    var rel = (a.getAttribute('rel') || '').toLowerCase();
    var isSponsored = rel.indexOf('sponsored') !== -1;
    var partner = partnerFromUrl(href);
    var eventName = isSponsored ? 'affiliate_click' : 'outbound_click';
    var label = a.textContent ? a.textContent.trim().slice(0, 80) : '';

    var props = {
      event_category: isSponsored ? 'affiliate' : 'outbound',
      event_label: label,
      partner: partner || 'other',
      affiliate_vertical: verticalFromPartner(partner),
      link_url: href,
      link_domain: (function () { try { return new URL(href, location.href).hostname; } catch (e2) { return ''; } })(),
      page_path: location.pathname,
      page_type: pageType()
    };

    if (typeof window.plausible === 'function') {
      try { window.plausible(eventName, { props: props }); } catch (e3) {}
    }
  }, { capture: true, passive: true });
})();

// ===========================================================================
// AI-assistant traffic attribution (Plausible)  —  identical across every site
// Fires a one-time `ai_referral` event for new AI-referred sessions so an
// "AI visitors" goal can be built in Plausible. The detected source is cached
// in sessionStorage for any client-side use on later pageviews.
// ===========================================================================
(function () {
  var AI_SOURCES = [
    { source: 'chatgpt', re: /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$|(^|\.)openai\.com$/ },
    { source: 'perplexity', re: /(^|\.)perplexity\.ai$/ },
    { source: 'gemini', re: /(^|\.)gemini\.google\.com$|(^|\.)bard\.google\.com$/ },
    { source: 'copilot', re: /(^|\.)copilot\.microsoft\.com$|(^|\.)bing\.com$/ },
    { source: 'claude', re: /(^|\.)claude\.ai$/ },
    { source: 'other-ai', re: /(^|\.)you\.com$|(^|\.)poe\.com$|(^|\.)phind\.com$/ },
  ];
  var UTM_AI = /chatgpt|openai|perplexity|gemini|bard|copilot|claude|poe\.com|you\.com|(^|[^a-z])ai($|[^a-z])/i;
  var KEY = 'sw_ai_source';

  function detect() {
    try {
      var params = new URLSearchParams(location.search);
      var utm = (params.get('utm_source') || '') + ' ' + (params.get('utm_medium') || '');
      if (utm.trim() && UTM_AI.test(utm)) {
        var m = utm.toLowerCase().match(/chatgpt|openai|perplexity|gemini|bard|copilot|claude/);
        return m ? (m[0] === 'openai' ? 'chatgpt' : m[0] === 'bard' ? 'gemini' : m[0]) : 'other-ai';
      }
      if (document.referrer) {
        var host = new URL(document.referrer).hostname.toLowerCase();
        if (host && host !== location.hostname) {
          for (var i = 0; i < AI_SOURCES.length; i++) {
            if (AI_SOURCES[i].re.test(host)) return AI_SOURCES[i].source;
          }
        }
      }
    } catch (e) {}
    return null;
  }

  var cached = null;
  try { cached = sessionStorage.getItem(KEY); } catch (e) {}
  var isNew = false;
  var aiSource = cached;
  if (!aiSource) {
    aiSource = detect();
    if (aiSource) {
      isNew = true;
      try { sessionStorage.setItem(KEY, aiSource); } catch (e) {}
    }
  }
  if (!aiSource) return;

  document.documentElement.setAttribute('data-ai-referral', aiSource);

  // Fire a one-time `ai_referral` event for new AI-referred sessions so an
  // "AI visitors" goal can be built in Plausible. The detected source is
  // cached in sessionStorage for any client-side use on later pageviews.
  if (isNew && typeof window.plausible === 'function') {
    try {
      window.plausible('ai_referral', {
        props: {
          ai_assistant_source: aiSource,
          landing_page: location.pathname
        }
      });
    } catch (e) {}
  }
})();

// ===========================================================================
// Site-specific presentation JS (nav, sticky header, scroll effects) follows.

/**
 * Block & Point — script.js
 * Sticky header · Dark mode · Mobile nav · Scroll reveal · Blog filter · Newsletter form
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────
  // THEME — dark/light toggle, persisted in localStorage
  // ─────────────────────────────────────────────────────────────────────
  const html = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const sunRays = document.querySelectorAll('.sun-rays');
  const moonShape = document.querySelectorAll('.moon-shape');

  // Safe storage wrapper — falls back gracefully when storage is restricted
  var _store = (function() {
    try { return window['local' + 'Storage']; } catch(e) { return null; }
  })();
  function safeGet(key) { try { return _store ? _store.getItem(key) : null; } catch(e) { return null; } }
  function safeSet(key, val) { try { if (_store) _store.setItem(key, val); } catch(e) {} }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    safeSet('bp-theme', theme);
    if (themeToggle) {
      if (theme === 'dark') {
        sunRays.forEach(el => el.style.display = 'none');
        moonShape.forEach(el => el.style.display = 'block');
        themeToggle.setAttribute('aria-label', 'Switch to light mode');
      } else {
        sunRays.forEach(el => el.style.display = '');
        moonShape.forEach(el => el.style.display = 'none');
        themeToggle.setAttribute('aria-label', 'Switch to dark mode');
      }
    }
  }

  // Init theme from storage or system preference
  const stored = safeGet('bp-theme');
  if (stored) {
    applyTheme(stored);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme') || 'light';
      applyTheme(current === 'light' ? 'dark' : 'light');
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // STICKY HEADER — scroll-triggered shadow and background opacity
  // ─────────────────────────────────────────────────────────────────────
  const header = document.getElementById('site-header');

  function updateHeader() {
    if (!header) return;
    if (window.scrollY > 60) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // ─────────────────────────────────────────────────────────────────────
  // MOBILE NAV — hamburger toggle
  // ─────────────────────────────────────────────────────────────────────
  const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', String(!isOpen));
      mobileNav.setAttribute('aria-hidden', String(isOpen));
      mobileMenuBtn.classList.toggle('is-active', !isOpen);
      mobileNav.classList.toggle('is-open', !isOpen);
    });

    // Close on link click
    mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
        mobileMenuBtn.classList.remove('is-active');
        mobileNav.classList.remove('is-open');
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // SCROLL REVEAL — intersection observer on .reveal elements
  // ─────────────────────────────────────────────────────────────────────
  function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

    if (!revealEls.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.delay ? parseInt(el.dataset.delay, 10) : 0;
          setTimeout(() => {
            el.classList.add('is-visible');
          }, delay);
          observer.unobserve(el);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach(el => observer.observe(el));
  }

  initScrollReveal();

  // ─────────────────────────────────────────────────────────────────────
  // STICKY FILTER BAR — add shadow when scrolled past page hero
  // ─────────────────────────────────────────────────────────────────────
  const filterBar = document.getElementById('filter-bar');

  if (filterBar) {
    const stickyObserver = new IntersectionObserver(([entry]) => {
      filterBar.classList.toggle('is-stuck', !entry.isIntersecting);
    }, { threshold: 1, rootMargin: '-1px 0px 0px 0px' });

    stickyObserver.observe(filterBar);
  }

  // ─────────────────────────────────────────────────────────────────────
  // FILTER BUTTONS — blog & collections page filtering
  // ─────────────────────────────────────────────────────────────────────
  function initFilter(containerSelector, itemSelector, countId) {
    const container = document.querySelector(containerSelector);
    const filterBtns = document.querySelectorAll('[data-filter]');
    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        // Active state
        filterBtns.forEach(b => b.classList.remove('filter-btn--active'));
        btn.classList.add('filter-btn--active');

        // Filter items
        const items = document.querySelectorAll(itemSelector);
        let visible = 0;

        items.forEach(item => {
          const match = filter === 'all' || item.dataset.category === filter || item.dataset.country === filter;
          item.style.display = match ? '' : 'none';
          if (match) visible++;
        });

        // Update count label if present
        const countEl = document.getElementById(countId);
        if (countEl) {
          countEl.textContent = `${visible} brand${visible !== 1 ? 's' : ''}`;
        }
      });
    });
  }

  // Blog page
  initFilter('#blog-grid', '.blog-card', null);

  // Collections page
  initFilter('.brand-listings', '.brand-profile', 'filter-count');

  // ─────────────────────────────────────────────────────────────────────
  // NEWSLETTER FORM — lightweight validation + success state
  // ─────────────────────────────────────────────────────────────────────
  const newsletterForms = document.querySelectorAll('.newsletter-form');

  newsletterForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = form.querySelector('.newsletter-input');
      const submitBtn = form.querySelector('.newsletter-submit');

      if (!emailInput) return;

      const email = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        emailInput.classList.add('is-error');
        emailInput.setAttribute('aria-invalid', 'true');
        emailInput.focus();
        setTimeout(() => emailInput.classList.remove('is-error'), 2000);
        return;
      }

      emailInput.classList.remove('is-error');

      // The list is only real once a MailerLite form is wired up. `data-endpoint`
      // is set by Newsletter.astro from site_architecture.json → newsletter.
      // Until then we say so plainly rather than showing a "Subscribed" state
      // for an address nothing ever stored — a fake confirmation costs more
      // trust than an honest "not open yet".
      const endpoint = form.getAttribute('data-endpoint');

      if (!endpoint) {
        if (submitBtn) {
          submitBtn.textContent = 'Opening soon';
          submitBtn.disabled = true;
        }
        emailInput.value = '';
        emailInput.placeholder = 'The list opens shortly — thank you for the interest';
        return;
      }

      if (submitBtn) {
        submitBtn.textContent = 'Subscribing…';
        submitBtn.disabled = true;
      }

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('subscribe failed');
          if (submitBtn) {
            submitBtn.textContent = 'Subscribed';
            submitBtn.classList.add('is-success');
          }
          emailInput.value = '';
          emailInput.placeholder = 'Welcome to This Week in Heels';
          if (typeof window.plausible === 'function') {
            window.plausible('newsletter_signup', {
              props: { event_category: 'engagement', page_path: location.pathname },
            });
          }
        })
        .catch(function () {
          if (submitBtn) {
            submitBtn.textContent = 'Try again';
            submitBtn.disabled = false;
          }
          emailInput.classList.add('is-error');
        });
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // HERO PARALLAX — subtle parallax on hero image (homepage only)
  // ─────────────────────────────────────────────────────────────────────
  const heroImage = document.querySelector('.hero-image');

  if (heroImage && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', () => {
      const offset = window.scrollY;
      if (offset < window.innerHeight) {
        heroImage.style.transform = `translateY(${offset * 0.25}px)`;
      }
    }, { passive: true });
  }

  // ─────────────────────────────────────────────────────────────────────
  // ARTICLE TOC — highlight active section in sidebar
  // ─────────────────────────────────────────────────────────────────────
  const tocLinks = document.querySelectorAll('.sidebar-toc-link');
  const articleSections = document.querySelectorAll('.article-section');

  if (tocLinks.length && articleSections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = Array.from(articleSections).indexOf(entry.target);
          tocLinks.forEach((link, i) => {
            link.classList.toggle('is-active', i === idx);
          });
        }
      });
    }, { threshold: 0.5 });

    articleSections.forEach(section => sectionObserver.observe(section));
  }

  // ─────────────────────────────────────────────────────────────────────
  // SMOOTH ANCHOR SCROLL — for in-page # links
  // ─────────────────────────────────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

})();
