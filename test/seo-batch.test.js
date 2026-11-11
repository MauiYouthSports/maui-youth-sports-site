const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const HUBS = {
  'inline-hockey': ['Maui Youth Inline Hockey: Kalama Park League Guide | MYS', 'Maui Youth Inline Hockey'],
  football: ['Maui Youth Football: Pop Warner, MIL & Schedules | MYS', 'Maui Youth Football'],
  'air-riflery': ['Maui Air Riflery: MIL High School Teams & Results | MYS', 'Maui Youth Air Riflery'],
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
    assert.match(html, /class="hub-checked"/);
    if (slug === 'football' || slug === 'canoe-paddling') assert.doesNotMatch(html, /Last checked/);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const expectFaq = slug === 'inline-hockey' || slug === 'air-riflery';
    assert.equal(blocks.some((b) => b['@type'] === 'FAQPage'), expectFaq);
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

test('the five rewritten hubs show the approved copy, FAQ, and last-checked date', () => {
  const pages = {
    'inline-hockey': ['Maui Youth Inline Hockey', 'How keiki join youth inline hockey at Kalama Park in Kīhei:'],
    boxing: ['Maui Youth Boxing', 'Youth boxing on Maui: two nonprofit clubs in Kahului and Kīhei'],
    'air-riflery': ['Maui Youth Air Riflery', 'High school air riflery in Maui County:'],
    gymnastics: ['Maui Youth Gymnastics', 'Kids gymnastics on Maui: parent-and-tot'],
    skateboarding: ['Maui Youth Skateboarding', 'Where Maui keiki can skate:']
  };
  for (const [slug, [h1, metaStart]] of Object.entries(pages)) {
    const html = fs.readFileSync(`public/sports/${slug}/index.html`, 'utf8');
    assert.match(html, new RegExp(`<h1>${h1}</h1>`));
    assert.match(html, /Last checked Nov 2026/);
    assert.equal(html.includes('$'), false, slug);
    assert.equal(/Notes for Bob|Sources checked|H1 note/.test(html), false, slug);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const faq = blocks.find((b) => b['@type'] === 'FAQPage');
    const visible = [...html.matchAll(/<h3 data-faq-q>(.*?)<\/h3><p id="faq-a-\d+">(.*?)<\/p>/g)];
    assert.equal(faq.mainEntity.length, visible.length, slug);
    visible.forEach(([ , q, a], i) => {
      const text = a.replace(/<[^>]+>/g, '').replaceAll('&amp;', '&').replaceAll('&#39;', "'");
      assert.equal(faq.mainEntity[i].name, q);
      assert.equal(faq.mainEntity[i].acceptedAnswer.text, text);
    });
    const list = blocks.find((b) => b['@type'] === 'CollectionPage');
    assert.equal(list.dateModified, '2026-11');
    assert.equal(list.name, h1);
    assert.match(html, new RegExp(metaStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  const boxing = fs.readFileSync('public/sports/boxing/index.html', 'utf8');
  assert.match(boxing, /Chazz Moleta/);
  assert.match(boxing, /808-276-2362/);
  assert.equal(boxing.includes('268-6109'), false);
  assert.match(fs.readFileSync('public/sitemap.xml', 'utf8'), /pukalani-skate-jam-2026-11-28/);
});

test('a highlight links to its sport hub without changing the story', () => {
  const html = fs.readFileSync('public/highlights/2026/keilana-maldonado-kamehameha-maui-cross-country-student-athlete-profile/index.html', 'utf8');
  assert.match(html, /href="\/sports\/cross-country\/">More cross country on Maui/);
  assert.match(html, /Every Wednesday, we shine a light/);
});
