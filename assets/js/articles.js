/* =============================================================
   articles.js
   Renders article lists from /data/articles.json into any
   [data-list] container on the page.

   Each container is configured by data-* attributes:
     data-list                    — marker, presence is enough
     data-list-variant="row"      — with thumbnail (home page)
                    | "list"      — compact, no thumbnail (articles page)
     data-list-skip="N"           — skip the first N entries (used on
                                    home to skip the featured hero)
     data-list-limit="N"          — render at most N entries
                                    (omit for "show everything")

   When done, dispatches an 'articles-rendered' event on document
   so other scripts (filters.js) can act on the rendered DOM.
   ============================================================= */

(function () {
  'use strict';

  var ARTICLES_URL = '/data/articles.json';

  // ----- Helpers ------------------------------------------

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /**
   * "2026-05-12" → "12 May 2026"
   * Uses local-time parsing (T00:00:00) so the day doesn't shift
   * by one in negative-UTC-offset timezones.
   */
  function formatDate(iso) {
    var d = new Date(iso + 'T00:00:00');
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  /**
   * Escape HTML so a title containing < or & can't break the page.
   * Only used for fields that flow through innerHTML.
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ----- Row templates ------------------------------------
  //
  // Each takes an article object and returns an HTML string.
  // data-tag is duplicated on the row root so filters.js can hide
  // rows by tag without re-rendering.

  function rowMarkup(article) {
    return (
      '<a href="/articles/' + escapeHtml(article.slug) + '.html" ' +
         'class="article-row" data-tag="' + escapeHtml(article.tag) + '">' +
        '<img class="article-row__thumb" ' +
             'src="' + escapeHtml(article.thumb) + '" ' +
             'alt="" loading="lazy" decoding="async">' +
        '<div class="article-row__body">' +
          '<h3 class="article-row__title">' +
            escapeHtml(article.title) +
            ' <span class="tag">' + escapeHtml(article.tag) + '</span>' +
          '</h3>' +
          '<div class="article-row__meta">' + formatDate(article.date) + '</div>' +
        '</div>' +
      '</a>'
    );
  }

  function listMarkup(article) {
    return (
      '<a href="/articles/' + escapeHtml(article.slug) + '.html" ' +
         'class="list-row" data-tag="' + escapeHtml(article.tag) + '">' +
        '<div class="list-row__date">' + formatDate(article.date) + '</div>' +
        '<h3 class="list-row__title">' + escapeHtml(article.title) + '</h3>' +
        '<span class="tag list-row__tag">' + escapeHtml(article.tag) + '</span>' +
      '</a>'
    );
  }

  // ----- Render a single container ------------------------

  function renderContainer(container, articles) {
    var variant = container.dataset.listVariant || 'row';
    var skip    = parseInt(container.dataset.listSkip,  10) || 0;
    var limit   = parseInt(container.dataset.listLimit, 10);

    var slice = articles.slice(skip);
    if (!isNaN(limit) && limit > 0) slice = slice.slice(0, limit);

    var renderer = variant === 'list' ? listMarkup : rowMarkup;
    container.innerHTML = slice.map(renderer).join('');
  }

  // ----- Fetch + render all containers --------------------

  var containers = document.querySelectorAll('[data-list]');
  if (containers.length === 0) return;

  fetch(ARTICLES_URL, { cache: 'no-cache' })
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load articles (' + res.status + ')');
      return res.json();
    })
    .then(function (articles) {
      containers.forEach(function (c) { renderContainer(c, articles); });

      // Notify other scripts that the list DOM is now populated.
      document.dispatchEvent(new CustomEvent('articles-rendered', {
        detail: { count: articles.length }
      }));
    })
    .catch(function (err) {
      // Graceful fallback: show a small notice in each container.
      console.error('[articles.js]', err);
      containers.forEach(function (c) {
        c.innerHTML =
          '<p class="bio">Couldn\'t load the article list. ' +
          '<a href="/articles.html">Try the full archive</a>.</p>';
      });
    });

})();
