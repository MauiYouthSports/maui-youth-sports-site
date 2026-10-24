const test = require('node:test');
const assert = require('node:assert/strict');
const { statsBlurb, sourceLabel, scoreCardSpec } = require('../public/assets/js/score-stats.js');

function assertFromNotes(blurb, notes) {
  const normalized = String(notes || '').replace(/\s+/g, ' ').trim();
  if (!blurb) return;
  for (const sentence of blurb.split(/(?<=[.!])\s+/)) {
    assert.ok(normalized.includes(sentence), `stats text must come from notes: ${sentence}`);
  }
}

test('hides empty notes', () => {
  assert.equal(statsBlurb(''), '');
  assert.equal(statsBlurb('   \n  '), '');
  assert.equal(statsBlurb(null), '');
});

test('shows a clean stats note unchanged', () => {
  const notes = 'Sets: 25-16, 25-16, 25-19.';
  assert.equal(statsBlurb(notes), notes);
});

test('shows a clean player line unchanged', () => {
  const notes = 'Coppa 3 rushing touchdowns, 148 yards.';
  assert.equal(statsBlurb(notes), notes);
});

test('hides notes that only say stats were not published', () => {
  assert.equal(statsBlurb('Set scores not published.'), '');
  const notes = 'Oct 21: verified as a separate match, not a duplicate of MYS-0017. MIL DII schedule lists two matches. Set scores not published. Re-approved.';
  assert.equal(statsBlurb(notes), '');
});

test('hides internal review notes that have no stats', () => {
  assert.equal(statsBlurb('Published score retained from the existing MYS verified result record.'), '');
  assert.equal(statsBlurb('Confirmed by 2 sources (SI + MaxPreps recap); awaiting Bruce\'s approval.'), '');
  assert.equal(statsBlurb('Only in scores page HTML (not in scores.json). Home/away not stated; first-listed team entered as away. home/away unverified.'), '');
});

test('keeps the public stat sentence inside a review note', () => {
  const notes = 'date inferred Oct 10. Set scores 25-15, 25-8, 25-10. Checked Oct 13: probably NOT a duplicate of MYS-0014. ProspectsHI lists two wins with different set scores (25-15, 25-8, 25-10 and 25-5, 25-5, 25-6).';
  const blurb = statsBlurb(notes);
  assert.equal(blurb, 'Set scores 25-15, 25-8, 25-10.');
  assertFromNotes(blurb, notes);
});

test('drops conflicting set lines and correction notes', () => {
  const notes = 'Oct 20: score corrected 0-3 -> 1-3. KSM athletics feed (official): L 1-3, sets KSM 25-10, 22-25, 17-25, 25-27; MaxPreps recaps also say King Kekaulike won 3-1. ProspectsHI shows 3-0 with only the last three sets (22-25, 17-25, 25-27), so it appears to have dropped set 1. MaxPreps lists it as @ KS Maui (conflict on home/away only).';
  const blurb = statsBlurb(notes);
  assert.equal(blurb, 'KSM athletics feed (official): L 1-3, sets KSM 25-10, 22-25, 17-25, 25-27; MaxPreps recaps also say King Kekaulike won 3-1.');
  assertFromNotes(blurb, notes);
});

test('keeps a partial set line that names the missing set', () => {
  const notes = 'MIL DI girls volleyball championship. KSM athletics live updates give sets KSM 25-20, 21-25, (set 3 not posted), 21-25, so King Kekaulike won sets 2-4. Treated as KSM home; minor conflict.';
  const blurb = statsBlurb(notes);
  assert.equal(blurb, 'KSM athletics live updates give sets KSM 25-20, 21-25, (set 3 not posted), 21-25, so King Kekaulike won sets 2-4.');
  assertFromNotes(blurb, notes);
});

test('keeps a player line buried in a review note', () => {
  const notes = 'Published score retained from the existing record. Player lines: Coppa 3 rushing touchdowns.';
  assert.equal(statsBlurb(notes), 'Player lines: Coppa 3 rushing touchdowns.');
});

test('hides a note that says the set scores were not published', () => {
  const notes = 'MIL DI playoff semifinal (2nd vs 3rd) played at Kamehameha Maui, so neutral site; winner King Kekaulike in home slot. MaxPreps recaps (both teams): King Kekaulike won 3-0 on Monday Oct 19. Set scores not published.';
  assert.equal(statsBlurb(notes), '');
});

test('shows a clean recap note that already reads as public copy', () => {
  const notes = 'Seabury Hall won 3-0, sets 25-16, 25-16, 25-19. Posted on ProspectsHI hub night of Oct 14; Seabury and MIL schedules confirm Seabury home. Seabury now 10-0 in MIL DII.';
  assert.equal(statsBlurb(notes), notes);
});

test('names MaxPreps from the source link and keeps a plain label otherwise', () => {
  assert.equal(sourceLabel({ href: 'https://www.maxpreps.com/news/example', sourceName: '' }), 'MaxPreps');
  assert.equal(sourceLabel({ href: 'https://www.khon2.com/sports/example', sourceName: 'KHON2' }), 'KHON2');
  assert.equal(sourceLabel({ href: 'https://example.com/game', sourceName: '' }), 'Final score');
});

test('score card shows stats and a source only when they exist', () => {
  const withStats = scoreCardSpec({
    away: 'Seabury Hall',
    awayScore: '3',
    home: 'Maui Prep',
    homeScore: '0',
    notes: 'Sets: 25-16, 25-16, 25-19.',
    href: 'https://www.maxpreps.com/news/example',
    urlOnMYS: '/games/example/',
    sourceName: 'MaxPreps'
  });
  assert.equal(withStats.tag, 'article');
  assert.equal(withStats.stats, 'Sets: 25-16, 25-16, 25-19.');
  assert.equal(withStats.showSource, true);
  assert.equal(withStats.sourceLabel, 'MaxPreps');
  assert.equal(withStats.localHref, '/games/example/');

  const finalsOnly = scoreCardSpec({
    notes: '',
    href: 'https://www.maxpreps.com/game',
    urlOnMYS: '/games/example/',
    sourceName: 'MaxPreps'
  });
  assert.equal(finalsOnly.tag, 'a');
  assert.equal(finalsOnly.stats, '');
  assert.equal(finalsOnly.showSource, false);
  assert.equal(finalsOnly.localHref, '/games/example/');

  const externalOnly = scoreCardSpec({
    notes: 'Published score retained from the existing MYS verified result record.',
    href: 'https://www.khon2.com/score',
    urlOnMYS: '',
    sourceName: 'KHON2'
  });
  assert.equal(externalOnly.tag, 'article');
  assert.equal(externalOnly.stats, '');
  assert.equal(externalOnly.showSource, true);
  assert.equal(externalOnly.sourceLabel, 'KHON2');
});
