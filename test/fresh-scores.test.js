const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const TODAY = '2026-10-24';

function game(partial) {
  return {
    id: partial.id,
    dateISO: partial.dateISO,
    sportGroup: partial.sportGroup,
    sport: partial.sport || partial.sportGroup,
    away: partial.away || 'Away',
    awayScore: partial.awayScore || '0',
    home: partial.home || 'Home',
    homeScore: partial.homeScore || '1',
    status: 'FINAL',
    href: partial.href || 'https://example.test/score',
    urlOnMYS: partial.urlOnMYS || ''
  };
}

const snapshot = [
  game({ id: 'MYS-0007', dateISO: '2026-10-02', sportGroup: 'Football', away: 'Kūlanihākoʻi', awayScore: '0', home: 'KS Maui', homeScore: '59', urlOnMYS: '/games/2026-10-02-football-varsity-ks-maui-kulanihakoi/' }),
  game({ id: 'MYS-0008', dateISO: '2026-10-02', sportGroup: 'Volleyball', away: 'Seabury Hall', awayScore: '3', home: 'Maui Prep', homeScore: '0', urlOnMYS: '/games/oct2-seabury/' }),
  game({ id: 'MYS-0009', dateISO: '2026-10-02', sportGroup: 'Volleyball', away: 'Hāna', awayScore: '1', home: 'Molokaʻi', homeScore: '3', urlOnMYS: '/games/oct2-hana/' })
];

const sheet = [
  ...snapshot,
  game({ id: 'MYS-0012', dateISO: '2026-10-09', sportGroup: 'Football', away: 'Kūlanihākoʻi', awayScore: '0', home: 'King Kekaulike', homeScore: '53' }),
  game({ id: 'MYS-0016', dateISO: '2026-10-10', sportGroup: 'Football', away: 'Maui High', awayScore: '12', home: 'Lahainaluna', homeScore: '15' }),
  game({ id: 'MYS-0027', dateISO: '2026-10-17', sportGroup: 'Football', away: 'Kamehameha Maui', awayScore: '27', home: 'King Kekaulike', homeScore: '14' }),
  game({ id: 'MYS-0032', dateISO: '2026-10-19', sportGroup: 'Volleyball', away: 'Maui High', awayScore: '0', home: 'Kamehameha Maui', homeScore: '3' }),
  game({ id: 'MYS-0034', dateISO: '2026-10-19', sportGroup: 'Volleyball', away: 'Lahainaluna', awayScore: '0', home: 'King Kekaulike', homeScore: '3' }),
  game({ id: 'MYS-0035', dateISO: '2026-10-20', sportGroup: 'Volleyball', away: 'King Kekaulike', awayScore: '3', home: 'Kamehameha Maui', homeScore: '1' })
];

function ids(games) {
  return Array.from(games, (game) => String(game.id));
}

function loadHomeScores() {
  const sandbox = { window: {}, document: { getElementById() { return null; } } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('public/assets/js/home-scores.js', 'utf8'), sandbox);
  return sandbox.window.MYSHomeScores;
}

test('homepage cards are the newest approved games, with or without a game page', () => {
  const api = loadHomeScores();
  const chosen = api.chooseHomepage(sheet, snapshot, { today: TODAY });
  assert.deepEqual(ids(chosen), ['MYS-0035', 'MYS-0032', 'MYS-0034']);
  assert.equal(Array.from(chosen).every((g) => !g.urlOnMYS), true);
  const newestChosen = ids(chosen).length ? Array.from(chosen).map((g) => g.dateISO).sort().at(-1) : '';
  const chosenIds = new Set(ids(chosen));
  const leftOutNewer = sheet.filter((row) => row.dateISO > newestChosen && !chosenIds.has(row.id));
  assert.deepEqual(leftOutNewer, []);
});

test('same-day cards rotate across sports and newer days push older ones out', () => {
  const api = loadHomeScores();
  const day = [
    game({ id: 'F1', dateISO: '2026-10-20', sportGroup: 'Football' }),
    game({ id: 'F2', dateISO: '2026-10-20', sportGroup: 'Football' }),
    game({ id: 'F3', dateISO: '2026-10-20', sportGroup: 'Football' }),
    game({ id: 'V1', dateISO: '2026-10-20', sportGroup: 'Volleyball' }),
    game({ id: 'OLD', dateISO: '2026-10-02', sportGroup: 'Football', urlOnMYS: '/games/old/' })
  ];
  assert.deepEqual(ids(api.chooseHomepage(day, snapshot, { today: TODAY })), ['F1', 'V1', 'F2']);
});

test('a frozen snapshot is not shown when the sheet is missing or empty', () => {
  const api = loadHomeScores();
  assert.deepEqual(ids(api.chooseHomepage(null, snapshot, { today: TODAY })), []);
  assert.deepEqual(ids(api.chooseHomepage([], snapshot, { today: TODAY })), []);
});

test('weeks-old games still show when they are truly the newest approved rows', () => {
  const api = loadHomeScores();
  const onlyOld = [
    game({ id: 'A', dateISO: '2026-09-18', sportGroup: 'Football', urlOnMYS: '/games/a/' }),
    game({ id: 'B', dateISO: '2026-09-18', sportGroup: 'Volleyball' })
  ];
  assert.deepEqual(ids(api.chooseHomepage(onlyOld, [], { today: TODAY })), ['A', 'B']);
});

test('homepage does not paint the frozen Oct 2 snapshot', () => {
  const site = fs.readFileSync('public/assets/js/site.js', 'utf8');
  const home = fs.readFileSync('public/assets/js/home-scores.js', 'utf8');
  const page = fs.readFileSync('public/index.html', 'utf8');
  assert.equal(site.includes('homepageScores'), false);
  assert.equal(site.includes("put('scores'"), false);
  assert.equal(home.includes('/assets/data/scores.json'), false);
  assert.match(page, /id="scores">Loading recent results/);
  assert.doesNotMatch(page, /Kūlanihākoʻi 0/);
});

test('Scores + Stats does not keep a baked list that stops before newer sheet rows', () => {
  const page = fs.readFileSync('public/scores/index.html', 'utf8');
  const script = fs.readFileSync('public/assets/js/scores-v39.js', 'utf8');
  assert.equal(page.includes('data-game-date='), false);
  assert.match(page, /Loading latest scores/);
  assert.match(script, /could not be loaded/);
  const api = loadHomeScores();
  const cutoff = api.latestCutoff('2026-10-20');
  assert.equal(cutoff, '2026-10-13');
  const latest = sheet.filter((g) => g.dateISO >= cutoff).map((g) => g.id);
  assert.equal(latest.includes('MYS-0035'), true);
  assert.equal(latest.includes('MYS-0027'), true);
  assert.equal(latest.includes('MYS-0016'), false);
  assert.equal(latest.includes('MYS-0012'), false);
  assert.equal(latest.includes('MYS-0007'), false);
});
