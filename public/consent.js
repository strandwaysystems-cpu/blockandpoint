// =============================================================================
// Strandway universal consent manager  (GDPR / ePrivacy compliant)
// -----------------------------------------------------------------------------
// One shared implementation across every Strandway travel site. The ONLY thing
// that differs per site is the CONFIG block below — everything else is identical
// so the sites read the same and the process for adding pages/partners matches.
//
// Behaviour:
//   * Fail-closed: if storage is unavailable or no choice recorded, NO
//     non-essential script loads (Crazy Egg, Travelpayouts, MailerLite).
//   * Two categories: "analytics" (Crazy Egg) and "marketing"
//     (Travelpayouts affiliate cookies + MailerLite newsletter).
//   * Reject-all is exactly as easy as accept-all (CNIL / EDPB / Garante).
//   * Consent stored in a single first-party cookie (works inside preview
//     iframes where web-storage is blocked); legacy stores are migrated.
//   * Traffic analytics is handled by Plausible (cookieless, loaded
//     unconditionally in <head> — no consent required).
// =============================================================================
(function () {
  'use strict';

  // ---- Per-site config (the ONLY part that differs between sites) ----------
  var CONFIG = {
    brand: 'Block & Point',
    crazyEggSrc: 'https://script.crazyegg.com/pages/scripts/0133/2861.js',
    travelpayoutsSrc: '',                 // travel-only network; not used on this site
    mailerliteAccount: '',                // '' disables the newsletter until a Block & Point form exists
    privacyUrl: '/privacy',
    cookiePolicyUrl: '/cookie-policy',
    cookieName: 'sw_consent_v1',          // unified name across the portfolio — do not rename
    consentVersion: 1,
    legacyCookieNames: [],                // no legacy consent store on this site
    legacyStorageKeys: []
  };

  var COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // ~180 days

  // ---- Cookie helpers (fail closed) ----------------------------------------
  function rawCookie() {
    try { return document.cookie || ''; } catch (e) { return null; }
  }
  function setCookie(name, value) {
    var secure = false;
    try { secure = window.location.protocol === 'https:'; } catch (e) { secure = false; }
    var parts = [
      name + '=' + encodeURIComponent(value),
      'path=/', 'max-age=' + COOKIE_MAX_AGE, 'SameSite=Lax'
    ];
    if (secure) parts.push('Secure');
    try { document.cookie = parts.join('; '); return true; } catch (e) { return false; }
  }
  function getCookie(name) {
    var all = rawCookie();
    if (all === null || all === '') return null;
    var pairs = all.split(';');
    var prefix = name + '=';
    for (var i = 0; i < pairs.length; i++) {
      var c = pairs[i].replace(/^\s+/, '');
      if (c.indexOf(prefix) === 0) return c.substring(prefix.length);
    }
    return null;
  }
  function delCookie(name) {
    try { document.cookie = name + '=; path=/; max-age=0; SameSite=Lax'; } catch (e) {}
  }
  function cookieAvailable() {
    if (rawCookie() === null) return false;
    var probe = '__sw_probe__';
    if (!setCookie(probe, '1')) return false;
    var ok = getCookie(probe) === '1';
    delCookie(probe);
    return ok;
  }

  var hasStorage = cookieAvailable();

  // Normalise any stored shape to { analytics, marketing }.
  function normalise(obj) {
    if (!obj || typeof obj !== 'object') return null;
    return { analytics: !!obj.analytics, marketing: !!obj.marketing };
  }

  function readConsent() {
    if (!hasStorage) return null;
    var raw = getCookie(CONFIG.cookieName);
    if (raw) {
      try {
        var parsed = JSON.parse(decodeURIComponent(raw));
        if (parsed && parsed.version === CONFIG.consentVersion) return normalise(parsed);
      } catch (e) {}
    }
    // Migrate legacy first-party cookies (kotor/chania lineage).
    for (var i = 0; i < CONFIG.legacyCookieNames.length; i++) {
      var lv = getCookie(CONFIG.legacyCookieNames[i]);
      if (lv) {
        try {
          var seed = normalise(JSON.parse(decodeURIComponent(lv)));
          if (seed) { writeConsent(seed.analytics, seed.marketing); delCookie(CONFIG.legacyCookieNames[i]); return seed; }
        } catch (e) {}
      }
    }
    // Migrate legacy localStorage choices (SAR lineage).
    for (var j = 0; j < CONFIG.legacyStorageKeys.length; j++) {
      try {
        var sv = localStorage.getItem(CONFIG.legacyStorageKeys[j]);
        if (sv) {
          var s2 = normalise(JSON.parse(sv));
          if (s2) { writeConsent(s2.analytics, s2.marketing); localStorage.removeItem(CONFIG.legacyStorageKeys[j]); return s2; }
        }
      } catch (e) {}
    }
    return null;
  }

  function writeConsent(analytics, marketing) {
    if (!hasStorage) return null;
    var record = {
      version: CONFIG.consentVersion,
      analytics: !!analytics,
      marketing: !!marketing,
      timestamp: new Date().toISOString()
    };
    if (!setCookie(CONFIG.cookieName, JSON.stringify(record))) return null;
    return { analytics: record.analytics, marketing: record.marketing };
  }

  // ---- Script loaders ------------------------------------------------------
  var ceLoaded = false, tpLoaded = false, mlLoaded = false;

  // Crazy Egg (heatmaps / session recording) — analytics category.
  function loadCrazyEgg() {
    if (ceLoaded || !CONFIG.crazyEggSrc) return;
    ceLoaded = true;
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = CONFIG.crazyEggSrc;
    document.head.appendChild(s);
  }

  function loadTravelpayouts() {
    if (tpLoaded || !CONFIG.travelpayoutsSrc) return;
    tpLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = CONFIG.travelpayoutsSrc;
    document.head.appendChild(s);
  }

  // MailerLite universal script — powers the newsletter forms. Marketing category.
  function loadMailerLite() {
    if (mlLoaded || !CONFIG.mailerliteAccount) return;
    mlLoaded = true;
    (function (w, d, e, u, f, l, n) {
      w[f] = w[f] || function () { (w[f].q = w[f].q || []).push(arguments); };
      l = d.createElement(e); l.async = 1; l.src = u; l.id = 'ml-universal';
      n = d.getElementsByTagName(e)[0]; n.parentNode.insertBefore(l, n);
    })(window, document, 'script', 'https://assets.mailerlite.com/js/universal.js', 'ml');
    window.ml('account', CONFIG.mailerliteAccount);
  }

  // ---- Apply consent -------------------------------------------------------
  function applyConsent(record) {
    if (!record) return;
    if (record.analytics) {
      loadCrazyEgg();
    }
    if (record.marketing) {
      loadTravelpayouts();
      loadMailerLite();
    }
  }

  // ---- Banner / preferences UI ---------------------------------------------
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  var bannerEl = null, prefsEl = null, lastFocus = null;

  function removeBanner() {
    if (bannerEl && bannerEl.parentNode) bannerEl.parentNode.removeChild(bannerEl);
    bannerEl = null;
    if (document.body) document.body.classList.remove('cc-banner-open');
  }

  function buildBanner() {
    var wrap = el('div', {
      'class': 'cc-banner', role: 'dialog', 'aria-modal': 'false',
      'aria-label': 'Cookie consent', 'aria-describedby': 'cc-banner-text'
    });
    var inner = el('div', { 'class': 'cc-banner__inner' });
    var icon = el('span', {
      'class': 'cc-banner__icon', 'aria-hidden': 'true',
      html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" ' +
            'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="9"></circle><circle cx="9" cy="10" r="1"></circle>' +
            '<circle cx="14" cy="9" r="1"></circle><circle cx="13" cy="14" r="1"></circle></svg>'
    });
    var heading = el('span', { 'class': 'cc-banner__heading', text: 'Cookies on ' + CONFIG.brand });
    var head = el('div', { 'class': 'cc-banner__head' }, [icon, heading]);
    var text = el('p', {
      'class': 'cc-banner__text', id: 'cc-banner-text',
      html: 'We keep this guide free. With your OK we power our booking links and run our ' +
            'optional newsletter — at no extra cost to you. Essential cookies always stay on, ' +
            'and our traffic stats are privacy-friendly (no cookies). See our ' +
            '<a href="' + CONFIG.privacyUrl + '">Privacy Policy</a> and ' +
            '<a href="' + CONFIG.cookiePolicyUrl + '">Cookie Policy</a>.'
    });
    var btnAccept = el('button', { 'class': 'cc-btn cc-btn--primary', type: 'button', text: 'Accept all' });
    var btnReject = el('button', { 'class': 'cc-btn cc-btn--ghost', type: 'button', text: 'Reject non-essential' });
    var btnManage = el('button', { 'class': 'cc-btn cc-btn--link', type: 'button', text: 'Manage choices' });

    btnAccept.addEventListener('click', function () {
      applyConsent(writeConsent(true, true) || { analytics: true, marketing: true });
      removeBanner();
    });
    btnReject.addEventListener('click', function () {
      writeConsent(false, false);
      removeBanner();
    });
    btnManage.addEventListener('click', function () { removeBanner(); openPreferences(); });

    var actions = el('div', { 'class': 'cc-banner__actions' }, [btnAccept, btnReject, btnManage]);
    var copy = el('div', { 'class': 'cc-banner__copy' }, [head, text]);
    inner.appendChild(copy);
    inner.appendChild(actions);
    wrap.appendChild(inner);
    return wrap;
  }

  function showBanner() {
    if (bannerEl) return;
    bannerEl = buildBanner();
    document.body.appendChild(bannerEl);
    document.body.classList.add('cc-banner-open');
  }

  function closePreferences() {
    if (prefsEl && prefsEl.parentNode) prefsEl.parentNode.removeChild(prefsEl);
    prefsEl = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function openPreferences() {
    if (prefsEl) return;
    lastFocus = document.activeElement;
    var current = readConsent() || { analytics: false, marketing: false };

    var overlay = el('div', { 'class': 'cc-overlay' });
    var modal = el('div', {
      'class': 'cc-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'cc-modal-title'
    });
    var title = el('h2', { 'class': 'cc-modal__title', id: 'cc-modal-title', text: 'Cookie preferences' });
    var intro = el('p', {
      'class': 'cc-modal__intro',
      text: 'Pick what you are happy with. Both options are off until you switch them on, and you can change your mind any time from the footer.'
    });

    var essRow = el('div', { 'class': 'cc-row' }, [
      el('div', { 'class': 'cc-row__head' }, [
        el('span', { 'class': 'cc-row__name', text: 'Strictly necessary' }),
        el('span', { 'class': 'cc-row__state', text: 'Always on' })
      ]),
      el('p', { 'class': 'cc-row__desc', text: 'Keeps the site working — navigation and remembering your cookie choice. No tracking, and these can’t be turned off.' })
    ]);

    var analyticsCb = el('input', { type: 'checkbox', id: 'cc-analytics', 'class': 'cc-toggle' });
    if (current.analytics) analyticsCb.checked = true;
    var analyticsRow = el('div', { 'class': 'cc-row' }, [
      el('label', { 'class': 'cc-row__head', 'for': 'cc-analytics' }, [
        el('span', { 'class': 'cc-row__name', text: 'Heatmaps' }),
        analyticsCb
      ]),
      el('p', { 'class': 'cc-row__desc', text: 'Helps us understand how visitors use each page so we can improve them. Uses Crazy Egg for anonymised heatmaps of page usage. Traffic stats are collected cookie-free via Plausible and do not require this setting.' })
    ]);

    var marketingCb = el('input', { type: 'checkbox', id: 'cc-marketing', 'class': 'cc-toggle' });
    if (current.marketing) marketingCb.checked = true;
    var marketingRow = el('div', { 'class': 'cc-row' }, [
      el('label', { 'class': 'cc-row__head', 'for': 'cc-marketing' }, [
        el('span', { 'class': 'cc-row__name', text: 'Affiliate & newsletter' }),
        marketingCb
      ]),
      el('p', { 'class': 'cc-row__desc', text: 'Enables partner booking tools (Travelpayouts) so we get credited when you book, plus our optional MailerLite newsletter signup. Booking links always work either way — you pay the same price.' })
    ]);

    var btnSave = el('button', { 'class': 'cc-btn cc-btn--primary', type: 'button', text: 'Save choices' });
    var btnAcceptAll = el('button', { 'class': 'cc-btn cc-btn--ghost', type: 'button', text: 'Accept all' });
    var btnClose = el('button', { 'class': 'cc-btn cc-btn--link', type: 'button', text: 'Close' });

    btnSave.addEventListener('click', function () {
      applyConsent(writeConsent(analyticsCb.checked, marketingCb.checked) ||
        { analytics: analyticsCb.checked, marketing: marketingCb.checked });
      closePreferences();
    });
    btnAcceptAll.addEventListener('click', function () {
      applyConsent(writeConsent(true, true) || { analytics: true, marketing: true });
      closePreferences();
    });
    btnClose.addEventListener('click', closePreferences);
    overlay.addEventListener('click', closePreferences);

    var actions = el('div', { 'class': 'cc-modal__actions' }, [btnSave, btnAcceptAll, btnClose]);
    modal.appendChild(title);
    modal.appendChild(intro);
    modal.appendChild(essRow);
    modal.appendChild(analyticsRow);
    modal.appendChild(marketingRow);
    modal.appendChild(actions);

    prefsEl = el('div', { 'class': 'cc-modal-root' }, [overlay, modal]);
    document.body.appendChild(prefsEl);

    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape' && prefsEl) {
        closePreferences();
        document.removeEventListener('keydown', escHandler);
      }
    });
    btnSave.focus();
  }

  // ---- Public API (footer "Cookie settings" link) --------------------------
  window.SWConsent = {
    open: openPreferences,
    reset: function () { delCookie(CONFIG.cookieName); showBanner(); },
    get: function () { return readConsent(); }
  };
  // Back-compat alias for existing footer hooks.
  window.kcOpenCookiePreferences = openPreferences;

  // ---- Init ----------------------------------------------------------------
  function init() {
    var record = hasStorage ? readConsent() : null;
    if (record) applyConsent(record);
    else showBanner();

    // Wire up static footer triggers.
    document.querySelectorAll('[data-cc-open]').forEach(function (node) {
      node.addEventListener('click', function (e) { e.preventDefault(); openPreferences(); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
