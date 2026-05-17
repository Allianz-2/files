/* =============================================================
   filters.js
   Chip filtering on /articles.html.

   Each filter chip has data-filter="<tag value>" matching the
   `tag` field in articles.json (or "all" as a sentinel).

   Active filter is stored in:
     1. aria-pressed on the chips      (for a11y + visual state)
     2. ?tag=Project in the URL        (for deep-linking + back-button)

   This script depends on articles.js having rendered rows with
   data-tag attributes — it listens for the 'articles-rendered'
   event before binding.
   ============================================================= */

(function () {
  'use strict';

  var chips      = document.querySelectorAll('.filter-chip');
  var list       = document.querySelector('#articles-list');
  var emptyState = document.querySelector('#articles-empty');

  if (chips.length === 0 || !list) return;

  /**
   * Apply a filter: hide non-matching rows, update chip state,
   * update the URL, and toggle the empty-state message.
   *
   * "all" matches everything; any other value matches rows whose
   * data-tag is exactly equal (case-sensitive — matches JSON).
   */
  function applyFilter(tag) {
    var rows = list.querySelectorAll('[data-tag]');
    var visible = 0;

    rows.forEach(function (row) {
      var match = (tag === 'all') || (row.dataset.tag === tag);
      row.hidden = !match;
      if (match) visible++;
    });

    chips.forEach(function (chip) {
      var active = chip.dataset.filter === tag;
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (emptyState) emptyState.hidden = (visible > 0);

    // Reflect choice in the URL without reloading. "all" → drop param.
    try {
      var url = new URL(window.location.href);
      if (tag === 'all') {
        url.searchParams.delete('tag');
      } else {
        url.searchParams.set('tag', tag);
      }
      window.history.replaceState({}, '', url);
    } catch (e) { /* old browser — silently skip */ }
  }

  /**
   * Read ?tag=... from the URL. If it matches one of our chips,
   * return that value; otherwise default to "all".
   */
  function initialFilter() {
    try {
      var params = new URLSearchParams(window.location.search);
      var tag = params.get('tag');
      if (!tag) return 'all';
      var valid = Array.prototype.some.call(chips, function (c) {
        return c.dataset.filter === tag;
      });
      return valid ? tag : 'all';
    } catch (e) {
      return 'all';
    }
  }

  // Wire up chip clicks immediately — they don't need the list
  // to be rendered yet (they'll just affect 0 rows).
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      applyFilter(chip.dataset.filter);
    });
  });

  // Apply the URL-derived filter once the list is in the DOM.
  // If articles-rendered has already fired by the time we get
  // here (race), the list is populated and we can run now.
  function init() { applyFilter(initialFilter()); }

  if (list.children.length > 0 && !list.querySelector('noscript')) {
    init();
  } else {
    document.addEventListener('articles-rendered', init, { once: true });
  }

})();
