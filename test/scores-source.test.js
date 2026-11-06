const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const csv = [
  'id,date,sport,level,division,gender,away_team,away_score,home_team,home_score,status,venue,neutral_site,source_name,source_url,supporting_source_urls,mys_page,source_type,review_status,submitted_at,updated_at,last_checked,notes',
  'MYS-1,2026-10-20,Volleyball,Varsity,DI,Girls,King Kekaulike,3,Kamehameha Maui,1,final,,no,MaxPreps,https://www.maxpreps.com/hi/volleyball/match/example,,/games/example/,scraped,approved,,,,"Sets: 25-20, 21-25, 18-25, 21-25."',
  'MYS-2,2026-10-18,Football,Varsity,DI,,Baldwin,13,Lahainaluna,3,final,,no,KHON2,https://www.khon2.com/example,,,scraped,approved,,,',
  'MYS-3,2026-10-17,Volleyball,Varsity,,Girls,A,3,B,1,final,,no,MaxPreps,https://www.maxpreps.com/hidden,,,scraped,needs_research,,,"Sets: 25-10, 25-10, 25-10."',
  'MYS-4,2026-09-18,Football,Varsity,,,Baldwin,27,Lahainaluna,19,final,,no,Maui News,https://www.mauinews.com/example,,/games/old/,manual,approved,,,,"Published score retained from the existing MYS verified result record."',
  'MYS-5,2026-10-31,Cross Country,Varsity,DII,Boys,,,Seabury Hall,44,final,,yes,HHSAA,https://example.com/xc,,,scraped,approved,,,,"HHSAA state XC, boys DII (meet result). Seabury Hall 2nd with 44 behind champion Hawaiʻi Prep 25."',
  'MYS-6,2026-10-24,Cross Country,Varsity,,Boys,,,Seabury Hall,20,final,,yes,MIL,https://example.com/mil,,,scraped,approved,,,,"MIL Cross Country Championships, boys 5K. Team: 1. Seabury Hall 20. Individual champion Silas Miller-Yoder (Seabury Hall) 17:09."',
  'MYS-7,2026-10-24,Cross Country,Varsity,,Girls,,,Hidden Home,10,final,,yes,MIL,https://example.com/hidden,,,scraped,needs_research,,,"MIL Cross Country Championships, girls 5K. Team: 1. Hidden Home 10."'
].join('\n');

test('approved sheet rows keep notes and source name', async () => {
  const sandbox = {
    window: {},
    fetch: async () => ({ ok: true, text: async () => csv })
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('public/assets/js/scores-source.js', 'utf8'), sandbox);
  const games = Array.from(await sandbox.window.MYSScores.load());
  assert.deepEqual(games.map((game) => game.id), ['MYS-5', 'MYS-6', 'MYS-1', 'MYS-2', 'MYS-4']);
  assert.equal(games[0].meet, true);
  assert.equal(games[0].away, '');
  assert.equal(games[0].meetLine, 'HHSAA DII Boys XC: Seabury Hall 2nd (44 pts)');
  assert.equal(games[1].meetLine, 'MIL XC: Seabury Hall boys champions (20 pts); individual winner Silas Miller-Yoder 17:09');
  assert.equal(games[1].meetLine.includes(' vs '), false);
  assert.equal(games[2].meet, false);
  assert.equal(games[2].meetLine, '');
  assert.equal(games[2].notes, 'Sets: 25-20, 21-25, 18-25, 21-25.');
  assert.equal(games[2].sourceName, 'MaxPreps');
  assert.equal(games[2].href, 'https://www.maxpreps.com/hi/volleyball/match/example');
  assert.equal(games[2].away, 'King Kekaulike');
  assert.equal(games[2].homeScore, '1');
  assert.equal(games[3].notes, '');
  assert.equal(games[3].sourceName, 'KHON2');
  assert.equal(games[4].notes, 'Published score retained from the existing MYS verified result record.');
  assert.equal(games[4].sourceName, 'Maui News');
});

test('meet labels use league and sport fields, not a later HHSAA mention', async () => {
  const meetCsv = [
    'id,date,sport,level,division,gender,away_team,away_score,home_team,home_score,status,venue,neutral_site,source_name,source_url,supporting_source_urls,mys_page,source_type,review_status,submitted_at,updated_at,last_checked,notes',
    'MYS-0063,2026-10-27,Cheer,Varsity,,Girls,,,Baldwin,37.43,final,Baldwin High School,no,Maui News,https://example.com/cheer,,,manual,approved,,,,"MIL Cheerleading Championship (meet result, not head-to-head). Baldwin won with 37.43. Top three advanced to HHSAA state cheer."',
    'MYS-0058,2026-10-31,Cross Country,Varsity,DII,Boys,,,Seabury Hall,44,final,,yes,HHSAA,https://example.com/xc,,,manual,approved,,,,"HHSAA state XC, boys DII (meet result). Seabury Hall 2nd with 44 behind champion Hawaiʻi Prep 25."',
    'MYS-0056,2026-10-24,Cross Country,Varsity,,Boys,,,Seabury Hall,20,final,,yes,Maui News,https://example.com/mil,,,manual,approved,,,,"MIL Cross Country Championships, boys 5K. Team: 1. Seabury Hall 20. Individual champion Silas Miller-Yoder (Seabury Hall) 17:09."'
  ].join('\n');
  const sandbox = {
    window: {},
    fetch: async () => ({ ok: true, text: async () => meetCsv })
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('public/assets/js/scores-source.js', 'utf8'), sandbox);
  const byId = Object.fromEntries((await sandbox.window.MYSScores.load()).map((game) => [game.id, game.meetLine]));
  assert.equal(byId['MYS-0063'], 'MIL Cheerleading: Baldwin (37.43 pts)');
  assert.equal(byId['MYS-0058'], 'HHSAA DII Boys XC: Seabury Hall 2nd (44 pts)');
  assert.equal(byId['MYS-0056'], 'MIL XC: Seabury Hall boys champions (20 pts); individual winner Silas Miller-Yoder 17:09');
});
