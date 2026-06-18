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

      // Success state
      emailInput.classList.remove('is-error');
      if (submitBtn) {
        submitBtn.textContent = 'Subscribed';
        submitBtn.disabled = true;
        submitBtn.classList.add('is-success');
      }
      emailInput.value = '';
      emailInput.placeholder = 'Welcome to This Week in Heels';

      // Optionally: fire a pixel / analytics event here
      if (typeof gtag !== 'undefined') {
        gtag('event', 'newsletter_signup', { 'event_category': 'engagement' });
      }
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
