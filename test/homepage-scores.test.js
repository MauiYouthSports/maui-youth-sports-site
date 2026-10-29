const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('homepage score cards stay final scores only', () => {
  const script = fs.readFileSync('public/assets/js/home-scores.js', 'utf8');
  const page = fs.readFileSync('public/index.html', 'utf8');
  assert.equal(script.includes('notes'), false);
  assert.equal(script.includes('score-stats'), false);
  assert.match(page, /Scores \+ Stats →/);
  assert.doesNotMatch(page, /id="scores"[\s\S]*score-stats/);
  const scoresPage = fs.readFileSync('public/scores/index.html', 'utf8');
  assert.match(scoresPage, /<h1>Scores \+ Stats<\/h1>/);
  assert.match(scoresPage, /score-stats\.js/);
});

function createEl() {
  return {
    className: '',
    textContent: '',
    href: '',
    children: [],
    append() {
      for (const child of arguments) this.children.push(child);
    }
  };
}

function makeTarget() {
  const el = createEl();
  el.replaceChildren = function () {
    this.children = [];
    this.textContent = '';
  };
  return el;
}

function visibleText(el) {
  const own = el.textContent || '';
  const kids = (el.children || []).map(visibleText).filter(Boolean).join(' ');
  return [own, kids].filter(Boolean).join(' ');
}

function liveGame(partial) {
  return {
    id: partial.id,
    dateISO: partial.dateISO || '2026-10-28',
    sportGroup: partial.sportGroup || 'Volleyball',
    sport: partial.sport || 'Girls Volleyball',
    away: partial.away,
    awayScore: partial.awayScore || '0',
    home: partial.home,
    homeScore: partial.homeScore || '1',
    status: 'FINAL',
    href: 'https://example.test/score',
    urlOnMYS: '',
    review_status: partial.review_status
  };
}

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function bootHomepage({ live, sheet }) {
  const target = makeTarget();
  let idle = null;
  let sheetCalls = 0;
  const sandbox = {
    window: {
      MYSScores: {
        load() {
          sheetCalls += 1;
          return Promise.resolve(sheet);
        }
      }
    },
    document: {
      getElementById(id) {
        return id === 'scores' ? target : null;
      },
      createElement() {
        return createEl();
      }
    },
    fetch: async (url) => {
      if (!String(url).includes('/assets/data/live-scores.json')) {
        throw new Error('unexpected fetch ' + url);
      }
      if (live === 'missing') return { ok: false, json: async () => null };
      return { ok: true, json: async () => live };
    },
    requestIdleCallback(cb) {
      idle = cb;
    },
    setTimeout
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('public/assets/js/home-scores.js', 'utf8'), sandbox);
  for (let i = 0; i < 8; i++) await flush();
  return {
    target,
    sheetCalls: () => sheetCalls,
    idle: () => {
      if (typeof idle !== 'function') throw new Error('revalidation was not scheduled');
      idle();
    }
  };
}

test('live-scores rows render before the sheet is consulted', async () => {
  const page = await bootHomepage({
    live: {
      generatedAt: new Date().toISOString(),
      source: 'MYS Scores sheet (approved rows)',
      rows: [liveGame({ id: 'LIVE-1', away: 'Hāna', awayScore: '1', home: 'Molokaʻi', homeScore: '3' })]
    },
    sheet: [liveGame({ id: 'SHEET-1', away: 'Baldwin', home: 'Lahainaluna' })]
  });
  const text = visibleText(page.target);
  assert.match(text, /Hāna/);
  assert.match(text, /Molokaʻi/);
  assert.equal(text.includes('Baldwin'), false);
  assert.equal(page.sheetCalls(), 0);
});

test('the sheet result replaces live-scores rows', async () => {
  const page = await bootHomepage({
    live: {
      generatedAt: new Date().toISOString(),
      rows: [liveGame({ id: 'LIVE-1', away: 'Hāna', home: 'Molokaʻi' })]
    },
    sheet: [liveGame({ id: 'SHEET-9', away: 'King Kekaulike', awayScore: '3', home: 'Kamehameha Maui', homeScore: '1', dateISO: '2026-10-29' })]
  });
  page.idle();
  for (let i = 0; i < 8; i++) await flush();
  const text = visibleText(page.target);
  assert.match(text, /King Kekaulike/);
  assert.match(text, /Kamehameha Maui/);
  assert.equal(text.includes('Hāna'), false);
});

test('stale generatedAt with a failed sheet gives unavailable', async () => {
  const page = await bootHomepage({
    live: {
      generatedAt: new Date(Date.now() - 73 * 60 * 60 * 1000).toISOString(),
      rows: [liveGame({ id: 'LIVE-1', away: 'Hāna', home: 'Molokaʻi' })]
    },
    sheet: null
  });
  page.idle();
  for (let i = 0; i < 8; i++) await flush();
  assert.match(visibleText(page.target), /Latest scores could not be loaded/);
  assert.equal(visibleText(page.target).includes('Hāna'), false);
});

test('a missing live-scores file with a failed sheet gives unavailable', async () => {
  const page = await bootHomepage({ live: 'missing', sheet: null });
  page.idle();
  for (let i = 0; i < 8; i++) await flush();
  assert.match(visibleText(page.target), /Latest scores could not be loaded/);
});

test('non-approved rows never show up', async () => {
  const page = await bootHomepage({
    live: {
      generatedAt: new Date().toISOString(),
      rows: [
        liveGame({ id: 'OK-1', away: 'Seabury Hall', home: 'Maui Prep', review_status: 'approved' }),
        liveGame({ id: 'NO-1', away: 'Hidden Away', home: 'Hidden Home', review_status: 'needs_research' })
      ]
    },
    sheet: [
      liveGame({ id: 'OK-2', away: 'Lahainaluna', home: 'Baldwin', review_status: 'approved', dateISO: '2026-10-29' }),
      liveGame({ id: 'NO-2', away: 'Secret Away', home: 'Secret Home', review_status: 'draft' })
    ]
  });
  assert.equal(visibleText(page.target).includes('Hidden Home'), false);
  assert.match(visibleText(page.target), /Seabury Hall/);
  page.idle();
  for (let i = 0; i < 8; i++) await flush();
  const text = visibleText(page.target);
  assert.match(text, /Lahainaluna/);
  assert.equal(text.includes('Hidden Home'), false);
  assert.equal(text.includes('Secret Home'), false);

  const { gamesFromCsv } = await import('../scripts/build-live-scores.mjs');
  const csv = [
    'id,date,sport,level,division,gender,away_team,away_score,home_team,home_score,status,source_url,mys_page,review_status,notes,source_name',
    'MYS-OK,2026-10-28,Volleyball,Varsity,DII,Girls,Seabury Hall,3,Maui Prep,0,final,https://example.test/ok,/games/ok/,approved,Kept,MaxPreps',
    'MYS-NO,2026-10-28,Volleyball,Varsity,DII,Girls,Hidden Away,1,Hidden Home,3,final,https://example.test/no,,needs_research,Dropped,Somewhere'
  ].join('\n');
  const rows = gamesFromCsv(csv);
  assert.deepEqual(rows.map((row) => row.id), ['MYS-OK']);
  assert.equal(JSON.stringify(rows).includes('Hidden Home'), false);

  const sandbox = { window: {}, fetch: async () => ({ ok: true, text: async () => csv }) };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('public/assets/js/scores-source.js', 'utf8'), sandbox);
  const loaded = await sandbox.window.MYSScores.load();
  assert.deepEqual(JSON.parse(JSON.stringify(loaded)), rows);
});
