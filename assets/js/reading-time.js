/* =============================================================
   reading-time.js
   Counts words in [data-prose] and writes "N min read" into
   every [data-reading-time] element on the page.

   Average adult reading speed for non-technical prose is ~225 WPM;
   technical/dense prose runs slower (~180 WPM). 225 is a reasonable
   middle. Adjust WPM below if your writing skews dense or breezy.
   ============================================================= */

(function () {
  'use strict';

  var WPM = 225;

  var prose   = document.querySelector('[data-prose]');
  var targets = document.querySelectorAll('[data-reading-time]');

  if (!prose || targets.length === 0) return;

  // textContent ignores HTML tags, so links/code/etc. don't inflate
  // the count. Split on any whitespace; filter empties to handle
  // multiple spaces and leading/trailing whitespace cleanly.
  var words = prose.textContent
    .trim()
    .split(/\s+/)
    .filter(function (w) { return w.length > 0; })
    .length;

  // Round up so a 30-second read still shows "1 min" rather than
  // "0 min". Clamp to a minimum of 1 to avoid weird edge cases.
  var minutes = Math.max(1, Math.round(words / WPM));

  targets.forEach(function (el) {
    el.textContent = minutes + ' min read';
  });

})();
