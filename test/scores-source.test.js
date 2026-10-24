const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const csv = [
  'id,date,sport,level,division,gender,away_team,away_score,home_team,home_score,status,venue,neutral_site,source_name,source_url,supporting_source_urls,mys_page,source_type,review_status,submitted_at,updated_at,last_checked,notes',
  'MYS-1,2026-10-20,Volleyball,Varsity,DI,Girls,King Kekaulike,3,Kamehameha Maui,1,final,,no,MaxPreps,https://www.maxpreps.com/hi/volleyball/match/example,,/games/example/,scraped,approved,,,,"Sets: 25-20, 21-25, 18-25, 21-25."',
  'MYS-2,2026-10-18,Football,Varsity,DI,,Baldwin,13,Lahainaluna,3,final,,no,KHON2,https://www.khon2.com/example,,,scraped,approved,,,',
  'MYS-3,2026-10-17,Volleyball,Varsity,,Girls,A,3,B,1,final,,no,MaxPreps,https://www.maxpreps.com/hidden,,,scraped,needs_research,,,"Sets: 25-10, 25-10, 25-10."',
  'MYS-4,2026-09-18,Football,Varsity,,,Baldwin,27,Lahainaluna,19,final,,no,Maui News,https://www.mauinews.com/example,,/games/old/,manual,approved,,,,"Published score retained from the existing MYS verified result record."'
].join('\n');

test('approved sheet rows keep notes and source name', async () => {
  const sandbox = {
    window: {},
    fetch: async () => ({ ok: true, text: async () => csv })
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('public/assets/js/scores-source.js', 'utf8'), sandbox);
  const games = Array.from(await sandbox.window.MYSScores.load());
  assert.deepEqual(games.map((game) => game.id), ['MYS-1', 'MYS-2', 'MYS-4']);
  assert.equal(games[0].notes, 'Sets: 25-20, 21-25, 18-25, 21-25.');
  assert.equal(games[0].sourceName, 'MaxPreps');
  assert.equal(games[0].href, 'https://www.maxpreps.com/hi/volleyball/match/example');
  assert.equal(games[0].away, 'King Kekaulike');
  assert.equal(games[0].homeScore, '1');
  assert.equal(games[1].notes, '');
  assert.equal(games[1].sourceName, 'KHON2');
  assert.equal(games[2].notes, 'Published score retained from the existing MYS verified result record.');
  assert.equal(games[2].sourceName, 'Maui News');
});
