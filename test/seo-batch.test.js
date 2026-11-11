const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const HUBS = {
  'inline-hockey': ['Maui Youth Inline Hockey: Kalama Park League Guide | MYS', 'Maui Youth Inline Hockey'],
  football: ['Maui Youth Football: Pop Warner, MIL & Schedules | MYS', 'Maui Youth Football'],
  'air-riflery': ['Maui Air Riflery: MIL High School Teams & Results | MYS', 'Maui High School Air Riflery'],
  'canoe-paddling': ['Maui Youth Canoe Paddling: Keiki Clubs & Regattas | MYS', 'Maui Youth Outrigger Canoe Paddling']
};

test('sport hubs use the planned title and H1, with an ItemList and no empty FAQ', () => {
  for (const [slug, [title, h1]] of Object.entries(HUBS)) {
    const html = fs.readFileSync(`public/sports/${slug}/index.html`, 'utf8');
    assert.match(html, new RegExp(`<title>${title.replace(/&/g, '&amp;')}</title>`));
    assert.match(html, new RegExp(`<h1[^>]*>${h1}</h1>`));
    assert.equal(title.length <= 60, true, title);
    const meta = html.match(/<meta content="([^"]*)" name="description"\/>/)[1].replaceAll('&amp;', '&');
    assert.equal(meta.length <= 155, true, meta);
    assert.match(html, /<p class="hub-intro"><\/p>/);
    assert.match(html, /class="hub-checked"/);
    assert.doesNotMatch(html, /Last checked/);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    assert.equal(blocks.some((b) => b['@type'] === 'FAQPage'), false);
    const list = blocks.find((b) => b.mainEntity && b.mainEntity['@type'] === 'ItemList');
    assert.ok(list, slug);
    assert.ok(list.mainEntity.itemListElement.length > 0, slug);
  }
});

test('sitemap lists the recent highlights and points robots at the apex sitemap', () => {
  const xml = fs.readFileSync('public/sitemap.xml', 'utf8');
  for (const url of [
    'https://mauiyouthsports.com/highlights/2026/youth-sports-hydration-heat-safety-maui-keiki-parents-guide/',
    'https://mauiyouthsports.com/highlights/2026/keilana-maldonado-kamehameha-maui-cross-country-student-athlete-profile/',
    'https://mauiyouthsports.com/highlights/2026/mil-football-schedule-2026/',
    'https://mauiyouthsports.com/highlights/2026/baldwin-edges-lahainaluna-football-november-7/',
    'https://mauiyouthsports.com/events/kihei-keiki-paddling-2026-10-10/'
  ]) assert.equal(xml.includes(`<loc>${url}</loc>`), true, url);
  assert.match(fs.readFileSync('public/robots.txt', 'utf8'), /Sitemap: https:\/\/mauiyouthsports\.com\/sitemap\.xml/);
});

test('a highlight links to its sport hub without changing the story', () => {
  const html = fs.readFileSync('public/highlights/2026/keilana-maldonado-kamehameha-maui-cross-country-student-athlete-profile/index.html', 'utf8');
  assert.match(html, /href="\/sports\/cross-country\/">More cross country on Maui/);
  assert.match(html, /Every Wednesday, we shine a light/);
});
