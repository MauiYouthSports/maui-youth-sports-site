const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const HEADER = 'id,date,sport,level,division,gender,away_team,away_score,home_team,home_score,status,venue,neutral_site,source_name,source_url,supporting_source_urls,mys_page,source_type,review_status,submitted_at,updated_at,last_checked,notes';

function row(fields) {
  return [
    fields.id, fields.date, fields.sport, fields.level || 'Varsity', fields.division || '',
    fields.gender || '', fields.away, fields.awayScore, fields.home, fields.homeScore,
    'final', fields.venue || '', 'no', 'MaxPreps', 'https://example.com/source', '', '',
    'scraped', fields.review || 'approved', '', '', ''
  ].join(',');
}

const csv = [
  HEADER,
  row({ id: 'MYS-0041', date: '2026-10-01', sport: 'Volleyball', division: 'DI', gender: 'Girls', away: 'Maui High', awayScore: '2', home: 'King Kekaulike', homeScore: '3' }),
  row({ id: 'MYS-0042', date: '2026-10-01', sport: 'Volleyball', division: 'DI', gender: 'Girls', away: 'Lahainaluna', awayScore: '0', home: 'Kamehameha Maui', homeScore: '3' }),
  row({ id: 'MYS-0043', date: '2026-10-03', sport: 'Football', division: 'DI', gender: 'Boys', away: 'Maui High', awayScore: '7', home: 'Baldwin', homeScore: '20' }),
  row({ id: 'MYS-0038', date: '2026-10-07', sport: 'Volleyball', division: 'DII', gender: 'Girls', away: 'Kīhei Charter', awayScore: '0', home: 'Maui Prep', homeScore: '3' }),
  row({ id: 'MYS-0015', date: '2026-10-09', sport: 'Volleyball', division: 'DII', gender: 'Girls', away: 'Seabury Hall', awayScore: '3', home: 'Lānaʻi', homeScore: '0' }),
  row({ id: 'MYS-0033', date: '2026-10-17', sport: 'Volleyball', division: 'DI', gender: 'Girls', away: 'Baldwin', awayScore: '1', home: 'Lahainaluna', homeScore: '3', venue: 'Lahainaluna High School Gym' }),
  row({ id: 'MYS-0030', date: '2026-10-17', sport: 'Volleyball', division: 'DII', gender: 'Girls', away: 'Lānaʻi', awayScore: '1', home: 'Hāna', homeScore: '3', review: 'needs_research' }),
  row({ id: 'MYS-0034', date: '2026-10-19', sport: 'Volleyball', division: 'DI', gender: 'Girls', away: 'Lahainaluna', awayScore: '0', home: 'King Kekaulike', homeScore: '3' }),
  row({ id: 'MYS-0032', date: '2026-10-19', sport: 'Volleyball', division: 'DI', gender: 'Girls', away: 'Maui High', awayScore: '0', home: 'Kamehameha Maui', homeScore: '3' }),
  row({ id: 'MYS-0039', date: '2026-10-23', sport: 'Football', division: 'DI', gender: 'Boys', away: 'Maui High', awayScore: '31', home: 'Baldwin', homeScore: '48' }),
  row({ id: 'MYS-0040', date: '2026-10-24', sport: 'Football', division: 'DI', gender: 'Boys', away: 'Kūlanihākoʻi', awayScore: '0', home: 'Kamehameha Maui', homeScore: '38' }),
  row({ id: 'MYS-C1', date: '2026-10-05', sport: 'Football', division: 'DI', gender: 'Boys', away: 'Maui High', awayScore: '7', home: 'Baldwin', homeScore: '20' }),
  row({ id: 'MYS-C2', date: '2026-10-05', sport: 'Football', division: 'DI', gender: 'Boys', away: 'Maui High', awayScore: '10', home: 'Baldwin', homeScore: '14' })
].join('\n');

function createElement(tag) {
  return {
    tag,
    attrs: {},
    children: [],
    parent: null,
    _text: '',
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null; },
    setAttribute(name, value) { this.attrs[name] = String(value); },
    removeAttribute(name) { delete this.attrs[name]; },
    append(child) { child.parent = this; this.children.push(child); return child; },
    get lastElementChild() { return this.children[this.children.length - 1] || null; },
    contains(other) {
      let node = other;
      while (node) {
        if (node === this) return true;
        node = node.parent;
      }
      return false;
    },
    get textContent() {
      if (!this.children.length) return this._text;
      return this.children.map((child) => child.textContent).join('');
    },
    set textContent(value) {
      this.children = [];
      this._text = String(value);
    },
    querySelector(selector) { return queryAll(this, selector)[0] || null; },
    querySelectorAll(selector) { return queryAll(this, selector); }
  };
}

function matchSimple(el, token) {
  let attr = null;
  const attrMatch = token.match(/\[([^\]]+)\]/);
  if (attrMatch) {
    attr = attrMatch[1];
    token = token.replace(attrMatch[0], '');
  }
  let cls = null;
  if (token.startsWith('.')) {
    cls = token.slice(1);
    token = '';
  }
  if (token && el.tag !== token) return false;
  if (cls && !(el.attrs.class || '').split(/\s+/).includes(cls)) return false;
  if (attr && !Object.prototype.hasOwnProperty.call(el.attrs, attr)) return false;
  return true;
}

function descendants(el, out) {
  el.children.forEach((child) => {
    out.push(child);
    descendants(child, out);
  });
  return out;
}

function queryAll(root, selector) {
  if (selector.includes(',')) {
    const seen = new Set();
    const out = [];
    selector.split(',').forEach((part) => {
      queryAll(root, part.trim()).forEach((node) => {
        if (!seen.has(node)) {
          seen.add(node);
          out.push(node);
        }
      });
    });
    return out;
  }
  let current = [root];
  selector.trim().split(/\s+/).forEach((token) => {
    const next = [];
    current.forEach((node) => {
      descendants(node, []).forEach((child) => {
        if (matchSimple(child, token)) next.push(child);
      });
    });
    current = next;
  });
  return current;
}

function cell(text) {
  const td = createElement('td');
  td.textContent = text;
  return td;
}

function fixture(date, division, matchup, status) {
  const tr = createElement('tr');
  tr.setAttribute('data-fixture-date', date);
  [date, division, matchup, '6:00 PM', 'Venue', status].forEach((text) => tr.append(cell(text)));
  return tr;
}

function buildDocument() {
  const document = createElement('document');
  const table = createElement('table');
  table.setAttribute('class', 'fixture-table');
  const tbody = createElement('tbody');
  [
    fixture('2026-10-01', 'DI Girls Volleyball', 'King Kekaulike – Maui', 'Score not reported yet'),
    fixture('2026-10-01', 'DI Girls Volleyball', 'KS Maui – Lahainaluna', 'Score not reported yet'),
    fixture('2026-10-03', 'DI Football', 'Maui – Baldwin', 'Score not reported yet'),
    fixture('2026-10-07', 'DII Girls Volleyball', 'Kīhei Charter – Maui Prep', 'Score not reported yet'),
    fixture('2026-10-09', 'DII Girls Volleyball', 'Lānaʻi – Seabury Hall', 'Upcoming'),
    fixture('2026-10-17', 'DI Girls Volleyball', '4th – 5th', 'Score not reported yet'),
    fixture('2026-10-17', 'DII Girls Volleyball', 'Hāna – Lānaʻi', 'Score not reported yet'),
    fixture('2026-10-19', 'DI Girls Volleyball', '2nd – 3rd', 'Score not reported yet'),
    fixture('2026-10-19', 'DI Girls Volleyball', '1st – G1 Winner', 'Score not reported yet'),
    fixture('2026-10-23', 'DI Football', 'Baldwin – Maui', 'Upcoming'),
    fixture('2026-10-24', 'DI Football', 'KS - Maui – Kūlanihākoʻi', 'Upcoming'),
    fixture('2026-10-05', 'DI Football', 'Maui – Baldwin', 'Score not reported yet'),
    fixture('2026-12-01', 'DI Football', 'Baldwin – Lahainaluna', 'Upcoming')
  ].forEach((tr) => tbody.append(tr));
  table.append(tbody);
  document.append(table);

  const main = createElement('main');
  const h1 = createElement('h1');
  h1.textContent = 'DI Girls Volleyball — 4th vs 5th · 2026-10-17';
  main.append(h1);
  const event = createElement('section');
  event.setAttribute('data-event', 'mil-di-girls-volleyball-2026-10-17-g1');
  const pill = createElement('span');
  pill.setAttribute('data-event-status', '');
  pill.textContent = 'Upcoming';
  event.append(pill);
  main.append(event);
  document.append(main);
  return document;
}

function statusMap(document) {
  const map = {};
  document.querySelectorAll('tbody tr[data-fixture-date]').forEach((tr) => {
    const cells = [].slice.call(tr.children);
    const key = tr.getAttribute('data-fixture-date') + '|' + cells[2].textContent;
    map[key] = cells[5].textContent;
  });
  map.event = document.querySelector('[data-event-status]').textContent;
  return map;
}

async function render() {
  const document = buildDocument();
  const sandbox = {
    window: {},
    document,
    fetch: async () => ({ ok: true, text: async () => csv }),
    console
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('public/assets/js/scores-source.js', 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync('public/assets/js/fixture-status.js', 'utf8'), sandbox);
  for (let i = 0; i < 8; i += 1) await new Promise((resolve) => setImmediate(resolve));
  return statusMap(document);
}

test('known venues replace TBD and the November 7 football site stays TBD', () => {
  const schedules = fs.readFileSync('public/schedules/index.html', 'utf8');
  const volleyball = fs.readFileSync('public/sports/volleyball/index.html', 'utf8');
  const crossCountry = fs.readFileSync('public/sports/cross-country/index.html', 'utf8');
  const playIn = fs.readFileSync('public/events/mil-di-girls-volleyball-2026-10-17-g1/index.html', 'utf8');
  const hhsaa = fs.readFileSync('public/events/mil-cross-country-2026-10-31-hhsaa-championships-hhsaa/index.html', 'utf8');
  const today = fs.readFileSync('public/today/index.html', 'utf8');
  const events = fs.readFileSync('public/assets/data/events.json', 'utf8');
  const playInVenue = '/events/mil-di-girls-volleyball-2026-10-17-g1/">4th – 5th</a></td><td>6:00 PM</td><td>Lahainaluna</td>';
  const hhsaaVenue = '/events/mil-cross-country-2026-10-31-hhsaa-championships-hhsaa/">HHSAA Championships</a></td><td>8:00 AM</td><td>Hawaii Preparatory Academy (Waimea)</td>';
  assert.ok(schedules.includes(playInVenue));
  assert.ok(volleyball.includes(playInVenue));
  assert.ok(schedules.includes(hhsaaVenue));
  assert.ok(crossCountry.includes(hhsaaVenue));
  assert.ok(schedules.includes('data-fixture-date="2026-11-07"') && /data-fixture-date="2026-11-07">[\s\S]*?<td>TBD<\/td>/.test(schedules));
  assert.ok(playIn.includes('<dd>Lahainaluna</dd>'));
  assert.equal(playIn.includes('location to be announced'), false);
  assert.ok(hhsaa.includes('<dd>Hawaii Preparatory Academy (Waimea)</dd>'));
  assert.equal(hhsaa.includes('location to be announced'), false);
  assert.ok(today.includes('2026-10-17 at 6:00 PM HST at Lahainaluna'));
  assert.ok(today.includes('2026-10-31 at 8:00 AM HST at Hawaii Preparatory Academy (Waimea)'));
  assert.ok(today.includes('2026-11-07 at 7:00 PM HST, location to be announced'));
  assert.ok(events.includes('"slug": "mil-di-girls-volleyball-2026-10-17-g1"'));
  assert.ok(/"slug": "mil-di-girls-volleyball-2026-10-17-g1"[\s\S]{0,800}"location": "Lahainaluna"/.test(events));
  assert.ok(/"slug": "mil-cross-country-2026-10-31-hhsaa-championships-hhsaa"[\s\S]{0,800}"location": "Hawaii Preparatory Academy \(Waimea\)"/.test(events));
});

test('approved sheet scores overlay schedule rows, including aliases and seed matchups', async () => {
  const status = await render();
  assert.equal(status['2026-10-01|King Kekaulike – Maui'], 'Final · Maui High 2 – King Kekaulike 3');
  assert.equal(status['2026-10-01|KS Maui – Lahainaluna'], 'Final · Lahainaluna 0 – Kamehameha Maui 3');
  assert.equal(status['2026-10-03|Maui – Baldwin'], 'Final · Maui High 7 – Baldwin 20');
  assert.equal(status['2026-10-07|Kīhei Charter – Maui Prep'], 'Final · Kīhei Charter 0 – Maui Prep 3');
  assert.equal(status['2026-10-23|Baldwin – Maui'], 'Final · Maui High 31 – Baldwin 48');
  assert.equal(status['2026-10-24|KS - Maui – Kūlanihākoʻi'], 'Final · Kūlanihākoʻi 0 – Kamehameha Maui 38');
  assert.equal(status['2026-10-09|Lānaʻi – Seabury Hall'], 'Final · Seabury Hall 3 – Lānaʻi 0');
  assert.equal(status['2026-10-17|4th – 5th'], 'Final · Baldwin 1 – Lahainaluna 3');
  assert.equal(status.event, 'Final · Baldwin 1 – Lahainaluna 3');
  assert.equal(status['2026-10-17|Hāna – Lānaʻi'], 'Score not reported yet');
  assert.equal(status['2026-10-19|2nd – 3rd'], 'Score not reported yet');
  assert.equal(status['2026-10-19|1st – G1 Winner'], 'Score not reported yet');
  assert.equal(status['2026-10-05|Maui – Baldwin'], 'Score not reported yet');
  assert.equal(status['2026-12-01|Baldwin – Lahainaluna'], 'Upcoming');
});
