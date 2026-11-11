import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC = new URL('../public/', import.meta.url).pathname;
const ALIASES = {
  'flag-football': 'flag-football',
  flagfootball: 'flag-football',
  paddling: 'canoe-paddling',
  outrigger: 'canoe-paddling',
  cheer: 'cheerleading',
  swimming: 'swimming-diving',
  diving: 'swimming-diving',
  track: 'track-field',
  'track-and-field': 'track-field'
};
const PHRASE = {
  'air-riflery': 'air riflery',
  archery: 'archery',
  baseball: 'baseball',
  basketball: 'basketball',
  bowling: 'bowling',
  boxing: 'boxing',
  'canoe-paddling': 'canoe paddling',
  cheerleading: 'cheerleading',
  'cross-country': 'cross country',
  dance: 'dance',
  'flag-football': 'flag football',
  football: 'football',
  golf: 'golf',
  gymnastics: 'gymnastics',
  'inline-hockey': 'inline hockey',
  'martial-arts': 'martial arts',
  rugby: 'rugby',
  skateboarding: 'skateboarding',
  soccer: 'soccer',
  softball: 'softball',
  surfing: 'surfing',
  'swimming-diving': 'swimming and diving',
  tennis: 'tennis',
  'track-field': 'track and field',
  volleyball: 'volleyball',
  'water-polo': 'water polo',
  wrestling: 'wrestling'
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function norm(tag) {
  const key = String(tag || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
  return ALIASES[key] || key;
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function decode(s) {
  return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}
function hubExists(slug) {
  return existsSync(join(PUBLIC, 'sports', slug, 'index.html'));
}
function checkedMarkup(date) {
  const month = /^(\d{4})-(\d{2})$/.exec(date || '');
  if (month) {
    const label = `Last checked ${MONTHS[Number(month[2]) - 1].slice(0, 3)} ${month[1]}`;
    return `<p class="hub-checked" data-checked="${date}">${esc(label)}</p>`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '<p class="hub-checked" data-checked="" hidden></p>';
  const [y, m, d] = date.split('-').map(Number);
  const label = `Last checked ${MONTHS[m - 1]} ${d}, ${y}`;
  return `<p class="hub-checked" data-checked="${date}">${esc(label)}</p>`;
}
function programs(html) {
  const items = [];
  const seen = new Set();
  const articles = html.matchAll(/<article class="[^"]*\bp-(?:club|school)\b[^"]*">([\s\S]*?)<\/article>/g);
  for (const match of articles) {
    const block = match[1];
    const head = block.match(/<h[34]>([\s\S]*?)<\/h[34]>/);
    if (!head) continue;
    const name = decode(head[1]);
    if (!name) continue;
    const link = block.match(/href="(\/sports-directory\/[^"?#]+)"/);
    let href = link ? link[1] : '';
    if (href && !href.endsWith('/')) href += '/';
    const key = href || name;
    if (seen.has(key)) continue;
    seen.add(key);
    const item = { '@type': 'ListItem', position: items.length + 1, name };
    if (href) item.url = 'https://mauiyouthsports.com' + href;
    else item.item = { '@type': 'SportsTeam', name };
    items.push(item);
  }
  return items;
}
function listedPlaces(html) {
  const items = [];
  const seen = new Set();
  for (const row of html.matchAll(/<tr\b([^>]*)>/g)) {
    const attrs = row[1];
    const name = decode((attrs.match(/data-list-name="([^"]*)"/) || [])[1] || '');
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const url = (attrs.match(/data-list-url="([^"]*)"/) || [])[1] || '';
    const item = { '@type': 'ListItem', name };
    if (url) item.url = url.startsWith('http') ? url : `https://mauiyouthsports.com${url}`;
    items.push(item);
  }
  return items;
}
function withItemList(html, slug) {
  const items = programs(html);
  const seen = new Set(items.map((item) => item.name));
  for (const place of listedPlaces(html)) {
    if (seen.has(place.name)) continue;
    seen.add(place.name);
    items.push(place);
  }
  items.forEach((item, index) => { item.position = index + 1; });
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
  const name = h1 ? decode(h1) : slug;
  const checked = (html.match(/data-checked="([^"]*)"/) || [])[1] || '';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: `https://mauiyouthsports.com/sports/${slug}/`,
    mainEntity: { '@type': 'ItemList', itemListElement: items }
  };
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(checked)) data.dateModified = checked;
  const tag = `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  let replaced = false;
  const next = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (whole, json) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed['@type'] === 'CollectionPage' || (parsed.mainEntity && parsed.mainEntity['@type'] === 'ItemList')) {
        replaced = true;
        return items.length ? tag : '';
      }
    } catch {
      /* leave unrelated scripts alone */
    }
    return whole;
  });
  if (!items.length) return next;
  if (replaced) return next;
  return next.replace('</head>', tag + '</head>');
}
function highlightMarkup(items) {
  if (!items.length) return '<p class="sport-highlights-empty">No highlights for this sport yet. Have one to share? <a href="/submit/?type=highlight">Send it to us</a>.</p>';
  return items.map((e) => {
    const href = '/highlights/2026/' + encodeURIComponent(e.slug).replace(/%2D/g, '-') + '/';
    const date = e.published || '';
    return '<article class="row"><time datetime="' + esc(date) + '">' + esc(date) + '</time><h3><a href="' + href + '">' + esc(e.title) + '</a></h3><p>' + esc(e.excerpt || '') + '</p></article>';
  }).join('') + '<p><a class="morelink" href="/highlights/">See all highlights</a></p>';
}
function fillHighlights(html, slug, stories) {
  const items = stories.filter((e) => e && e.slug && (e.sports || []).some((tag) => norm(tag) === slug))
    .sort((a, b) => String(b.published || '').localeCompare(String(a.published || '')))
    .slice(0, 5);
  const inner = highlightMarkup(items);
  const sig = items.map((e) => e.slug).join('|');
  return html.replace(/<div\b([^>]*\bid="sport-highlights"[^>]*)>[\s\S]*?<\/div>/, (_m, attrs) => {
    let next = attrs;
    if (/data-rendered="/.test(next)) next = next.replace(/data-rendered="[^"]*"/, `data-rendered="${esc(sig)}"`);
    else next += ` data-rendered="${esc(sig)}"`;
    return `<div${next}>${inner}</div>`;
  });
}
function hubLinks(html, sports) {
  const without = html.replace(/<p class="sport-hub-links">[\s\S]*?<\/p>/g, '');
  const needed = [];
  for (const slug of sports) {
    if (!hubExists(slug) || !PHRASE[slug]) continue;
    if (without.includes(`href="/sports/${slug}/`) || without.includes(`href="/sports/${slug}"`)) continue;
    if (!needed.includes(slug)) needed.push(slug);
  }
  if (!needed.length) return without;
  const box = '<p class="sport-hub-links">' + needed.map((slug) => `<a href="/sports/${slug}/">More ${PHRASE[slug]} on Maui</a>`).join(' ') + '</p>';
  if (without.includes('</article>')) return without.replace('</article>', box + '</article>');
  if (without.includes('</main>')) return without.replace('</main>', box + '</main>');
  return without;
}
function ensureSlots(html) {
  let next = html.replace(/<p class="hub-checked"[^>]*>[\s\S]*?<\/p>/, (el) => {
    const date = (el.match(/data-checked="([^"]*)"/) || [])[1] || '';
    return checkedMarkup(date);
  });
  if (!next.includes('hub-checked')) {
    if (next.includes('hub-intro')) next = next.replace(/<p class="hub-intro"><\/p>/, '<p class="hub-intro"></p>' + checkedMarkup(''));
    else next = next.replace('</h1>', '</h1>' + checkedMarkup(''));
  }
  if (!next.includes('hub-faq.js')) next = next.replace('</body>', '<script defer src="/assets/js/hub-faq.js"></script></body>');
  return next;
}

const stories = JSON.parse(readFileSync(join(PUBLIC, 'assets/data/highlights.json'), 'utf8'));
const events = JSON.parse(readFileSync(join(PUBLIC, 'assets/data/events.json'), 'utf8'));
const eventSports = new Map(events.map((e) => [e.slug, (e.sports || []).map(norm)]));

for (const slug of readdirSync(join(PUBLIC, 'sports'))) {
  const file = join(PUBLIC, 'sports', slug, 'index.html');
  if (!existsSync(file)) continue;
  let html = readFileSync(file, 'utf8');
  html = withItemList(html, slug);
  html = fillHighlights(html, slug, stories);
  html = ensureSlots(html);
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
  const hasFaqSchema = html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"');
  if (hasFaqSchema && !html.includes('data-faq')) throw new Error('FAQPage emitted on ' + slug);
  writeFileSync(file, html);
}

function sportsForHighlight(slug) {
  const rec = stories.find((e) => e.slug === slug);
  return (rec?.sports || []).map(norm).filter((s) => s !== 'health');
}
function sportsForEvent(slug) {
  if (eventSports.has(slug) && eventSports.get(slug).length) return eventSports.get(slug);
  if (slug.includes('paddling') || slug.includes('canoe') || slug.includes('outrigger')) return ['canoe-paddling'];
  return [];
}
function linkPages(dir, sportsOf) {
  const parent = join(PUBLIC, dir);
  for (const yearOrSlug of readdirSync(parent)) {
    const file = join(parent, yearOrSlug, 'index.html');
    const nested = join(parent, yearOrSlug);
    if (existsSync(file)) {
      const html = hubLinks(readFileSync(file, 'utf8'), sportsOf(yearOrSlug));
      writeFileSync(file, html);
    } else if (yearOrSlug !== 'index.html') {
      const inner = join(nested);
      if (!existsSync(inner)) continue;
      try {
        for (const slug of readdirSync(inner)) {
          const page = join(inner, slug, 'index.html');
          if (!existsSync(page)) continue;
          writeFileSync(page, hubLinks(readFileSync(page, 'utf8'), sportsOf(slug)));
        }
      } catch {
        /* not a directory */
      }
    }
  }
}
linkPages('highlights', sportsForHighlight);
linkPages('events', sportsForEvent);
console.log('seo pages updated');
