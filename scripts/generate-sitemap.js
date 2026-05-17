#!/usr/bin/env node
/* =============================================================
   generate-sitemap.js
   Reads data/articles.json, writes sitemap.xml + robots.txt at
   the project root. Run before deploying:

       npm run build

   Adds three top-level pages (home, articles, about) plus one
   entry per article. The 404 page is intentionally excluded —
   sitemaps should not list non-canonical URLs.
   ============================================================= */

const fs   = require('node:fs');
const path = require('node:path');

const ROOT     = path.resolve(__dirname, '..');
const SITE_URL = 'https://daniel-spies.com';

// ----- Read articles ------------------------------------

const articlesPath = path.join(ROOT, 'data', 'articles.json');
let articles;
try {
  articles = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));
} catch (err) {
  console.error('Could not read data/articles.json:', err.message);
  process.exit(1);
}

// ----- Build the URL list -------------------------------

const today = new Date().toISOString().split('T')[0];

const topLevel = [
  { loc: '/',              lastmod: today, changefreq: 'weekly',  priority: '1.0' },
  { loc: '/articles.html', lastmod: today, changefreq: 'weekly',  priority: '0.9' },
  { loc: '/about.html',    lastmod: today, changefreq: 'monthly', priority: '0.7' }
];

const articleEntries = articles.map(a => ({
  loc:        `/articles/${a.slug}.html`,
  lastmod:    a.date,
  changefreq: 'yearly',
  priority:   '0.8'
}));

const entries = topLevel.concat(articleEntries);

// ----- Render XML ---------------------------------------

const urlBlocks = entries.map(e => (
  '  <url>\n' +
  `    <loc>${SITE_URL}${e.loc}</loc>\n` +
  `    <lastmod>${e.lastmod}</lastmod>\n` +
  `    <changefreq>${e.changefreq}</changefreq>\n` +
  `    <priority>${e.priority}</priority>\n` +
  '  </url>'
)).join('\n');

const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urlBlocks + '\n' +
  '</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

// ----- robots.txt ---------------------------------------

const robots =
  'User-agent: *\n' +
  'Allow: /\n' +
  '\n' +
  `Sitemap: ${SITE_URL}/sitemap.xml\n`;

fs.writeFileSync(path.join(ROOT, 'robots.txt'), robots);

// ----- Done ---------------------------------------------

console.log(`✓ Wrote sitemap.xml  (${entries.length} URLs)`);
console.log(`✓ Wrote robots.txt`);
