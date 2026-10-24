const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

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
