/* =============================================================
   theme.js
   Two small UI behaviours that ship on every page:
     1. Theme toggle  — light/dark switch, persisted in localStorage.
        Initial theme is already set by the inline <head> script
        before paint, so there is no FOUC. This script only handles
        the click-to-toggle behaviour.
     2. Mobile nav    — hamburger open/close, with escape key,
        link-click auto-close, and outside-click auto-close.

   Despite the filename, this is essentially "nav chrome JS". Kept
   together because (a) both are tiny, (b) both run on every page,
   (c) one file means one HTTP request.
   ============================================================= */

(function () {
  'use strict';

  /* -----------------------------------------------------------
     SECTION 1 — THEME TOGGLE
     ----------------------------------------------------------- */

  var THEME_KEY = 'theme';
  var root = document.documentElement;

  /**
   * What is the effectively-active theme right now?
   *   - If data-theme is set on <html>, return that.
   *   - Otherwise, ask the OS via prefers-color-scheme.
   */
  function currentTheme() {
    var attr = root.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  /**
   * Apply a theme: set the attribute, save the choice, refresh
   * the toggle's aria-label so screen readers announce what
   * clicking will do next ("Switch to light theme" / "Switch to
   * dark theme").
   */
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* localStorage may be blocked (private mode, strict cookie
         settings). The toggle still works for this session; it
         just won't persist on next load. Silently ignore. */
    }
    updateToggleLabel(theme);
  }

  function updateToggleLabel(theme) {
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    var next = theme === 'dark' ? 'light' : 'dark';
    toggle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
  }

  var themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    // Set the initial aria-label to match the effective theme.
    updateToggleLabel(currentTheme());

    themeToggle.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  // If the user has NO saved choice and changes their OS theme
  // mid-session, follow along. Only watch when no explicit choice
  // exists — otherwise the user has chosen and we respect that.
  var hasStoredChoice = false;
  try {
    var stored = localStorage.getItem(THEME_KEY);
    hasStoredChoice = stored === 'light' || stored === 'dark';
  } catch (e) {}

  if (!hasStoredChoice && window.matchMedia) {
    var osDark = window.matchMedia('(prefers-color-scheme: dark)');
    var osListener = function () {
      // Only act if the user STILL has no explicit choice.
      try {
        var s = localStorage.getItem(THEME_KEY);
        if (s === 'light' || s === 'dark') return;
      } catch (e) { /* ignore */ }
      updateToggleLabel(currentTheme());
    };
    // addEventListener is the modern API; addListener is the fallback.
    if (osDark.addEventListener) {
      osDark.addEventListener('change', osListener);
    } else if (osDark.addListener) {
      osDark.addListener(osListener);
    }
  }


  /* -----------------------------------------------------------
     SECTION 2 — MOBILE NAV
     ----------------------------------------------------------- */

  var nav    = document.querySelector('.site-nav');
  var toggle = document.querySelector('.site-nav__toggle');
  var menu   = document.querySelector('.site-nav__menu');

  if (nav && toggle && menu) {

    function openNav() {
      nav.classList.add('site-nav--open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
    }

    function closeNav() {
      nav.classList.remove('site-nav--open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }

    function isOpen() {
      return nav.classList.contains('site-nav--open');
    }

    // Hamburger click — toggle.
    toggle.addEventListener('click', function () {
      isOpen() ? closeNav() : openNav();
    });

    // Close on link click — so tapping a nav link feels like a
    // proper navigation rather than leaving the menu hanging open.
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    // Close on Escape — and return focus to the hamburger button,
    // which is what keyboard users expect.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        closeNav();
        toggle.focus();
      }
    });

    // Close on outside click. Helps on tablet where the menu
    // panel takes up some space but doesn't dim the page.
    document.addEventListener('click', function (e) {
      if (!isOpen()) return;
      if (nav.contains(e.target)) return;
      closeNav();
    });

    // If the viewport grows back to desktop while the menu is open
    // (e.g. orientation change), close it so the desktop layout
    // doesn't show the absolute-positioned panel.
    var mobileQuery = window.matchMedia('(min-width: 721px)');
    var mobileListener = function (e) {
      if (e.matches && isOpen()) closeNav();
    };
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', mobileListener);
    } else if (mobileQuery.addListener) {
      mobileQuery.addListener(mobileListener);
    }
  }

})();
