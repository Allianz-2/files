#!/usr/bin/env node
/* =============================================================
   generate-placeholders.js
   Generates editorial-feel placeholder SVGs (gradient + vignette)
   for every article in data/articles.json, plus three page-level
   placeholders (about, articles, 404).

   Run when seeding the project, or whenever you want to refresh
   the placeholders before real photography is added:

       npm run placeholders

   Each article gets a gradient deterministically chosen from its
   slug, so the same article keeps the same placeholder across
   regenerations. Replace any individual SVG with a real photo
   any time — this script never overwrites files it shouldn't,
   it just writes to whatever paths data/articles.json declares.
   ============================================================= */

const fs   = require('node:fs');
const path = require('node:path');

const ROOT             = path.resolve(__dirname, '..');
const PLACEHOLDERS_DIR = path.join(ROOT, 'assets', 'images', 'placeholders');

// ----- Palette ------------------------------------------
// Eight warm/editorial gradients. Tuned to feel cohesive when
// shown side-by-side on the articles index — none too saturated,
// all rooted in the same warm-neutral family.

const PALETTES = [
  { from: '#8E6A4A', to: '#2D2520' },  // amber → coffee
  { from: '#5B7A8E', to: '#1F2A33' },  // slate → ink
  { from: '#7A8E6A', to: '#2A3324' },  // sage → forest
  { from: '#A8744A', to: '#3D2618' },  // terracotta → mahogany
  { from: '#C4A87A', to: '#5C4524' },  // cream → bronze
  { from: '#9C928A', to: '#403832' },  // stone → charcoal
  { from: '#B89060', to: '#4D3818' },  // ochre → umber
  { from: '#8A6A7A', to: '#332433' }   // plum → wine
];

/** Cheap string hash → non-negative integer. */
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;     // force 32-bit int
  }
  return Math.abs(h);
}

function paletteFor(key) {
  return PALETTES[hash(key) % PALETTES.length];
}

/** Build the SVG markup for a gradient + soft vignette. */
function svgFor(key) {
  const p = paletteFor(key);
  return (
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.from}"/>
      <stop offset="100%" stop-color="${p.to}"/>
    </linearGradient>
    <radialGradient id="v" cx="50%" cy="50%" r="65%">
      <stop offset="0%"   stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.28)"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#g)"/>
  <rect width="1600" height="900" fill="url(#v)"/>
</svg>
`);
}

/** Write `content` to `target`, creating parent dirs if needed. */
function writeSvg(target, content) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

/** Resolve a /-prefixed site path against ROOT. */
function resolveSitePath(p) {
  return path.join(ROOT, p.replace(/^\//, ''));
}

// ----- Per-article placeholders -------------------------

const articles = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'articles.json'), 'utf-8')
);

let written = 0;

articles.forEach(article => {
  const svg = svgFor(article.slug);
  // Hero and thumb may point at the same file or different ones;
  // either way, write whatever's declared. Same content for both
  // until real photography is in place.
  const targets = new Set([article.hero, article.thumb].filter(Boolean));
  targets.forEach(t => {
    writeSvg(resolveSitePath(t), svg);
    written++;
  });
});

// ----- Page-level placeholders --------------------------

const pages = ['about', 'articles', '404'];
pages.forEach(slug => {
  const target = path.join(PLACEHOLDERS_DIR, `hero-${slug}.svg`);
  writeSvg(target, svgFor('page-' + slug));
  written++;
});

console.log(`✓ Wrote ${written} placeholder SVGs to assets/images/placeholders/`);
