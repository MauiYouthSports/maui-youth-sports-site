const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');

async function load() {
  return import(pathToFileURL(path.resolve('src/score-submit.js')).href);
}

function sample(extra = {}) {
  return {
    sport: 'Football',
    home_team: 'Baldwin',
    away_team: 'Lahainaluna',
    final_score: '7-6',
    event_date: '2026-11-07',
    division: 'Varsity',
    highlights: 'TEST',
    name: 'A Coach',
    email: 'coach@example.com',
    website: '',
    ...extra
  };
}

function request(fields, headers = {}) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  return new Request('https://mauiyouthsports.com/api/score', {
    method: 'POST',
    headers: { Accept: 'application/json', Origin: 'https://mauiyouthsports.com', ...headers },
    body
  });
}

test('score subject keeps the MYS Score prefix and adds the matchup', async () => {
  const { validateScore, SUBJECT_PREFIX } = await load();
  const result = validateScore(sample(), '2026-11-11');
  assert.equal(result.ok, true);
  assert.equal(result.subject, `${SUBJECT_PREFIX}: Football Baldwin vs Lahainaluna`);
  assert.equal(result.subject.startsWith('MYS Score'), true);
});

test('score form rejects a future date, a bad sport, and a filled honeypot without sending', async () => {
  const { validateScore, handleScore } = await load();
  assert.equal(validateScore(sample({ event_date: '2026-12-01' }), '2026-11-11').ok, false);
  assert.equal(validateScore(sample({ sport: 'Curling' }), '2026-11-11').ok, false);
  let called = false;
  const response = await handleScore(request(sample({ website: 'https://spam.example' })), {}, async () => { called = true; return new Response('{}'); });
  assert.equal(response.status, 200);
  assert.equal(called, false);
});

function mailEnv(sent) {
  return {
    SCORE_EMAIL: {
      testMode: true,
      send: async (raw) => { sent.push(raw); }
    }
  };
}

test('score form emails the verified Gmail address and does not publish', async () => {
  const { handleScore, MAIL_TO } = await load();
  const sent = [];
  const response = await handleScore(request(sample()), mailEnv(sent));
  const out = await response.json();
  assert.equal(out.ok, true);
  assert.match(out.message, /Mahalo/);
  assert.equal(sent.length, 1);
  assert.match(sent[0], new RegExp(`^To: ${MAIL_TO}`, 'm'));
  assert.match(sent[0], /^Subject: MYS Score: Football Baldwin vs Lahainaluna/m);
  assert.match(sent[0], /Highlights: TEST/);
  assert.equal(sent[0].includes('formspree'), false);
});

test('turnstile siteverify runs only when a secret is configured', async () => {
  const { handleScore } = await load();
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    if (String(url).includes('siteverify')) {
      return new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  const sent = [];
  const open = await handleScore(request(sample()), { ...mailEnv(sent) }, fetchImpl);
  assert.equal((await open.json()).ok, true);
  assert.equal(sent.length, 1);
  assert.deepEqual(calls, []);
  calls.length = 0;
  sent.length = 0;
  const blocked = await handleScore(request(sample({ 'cf-turnstile-response': 'token' })), { ...mailEnv(sent), TURNSTILE_SECRET: 'secret' }, fetchImpl);
  assert.equal(blocked.status, 403);
  assert.equal(sent.length, 0);
  assert.equal(calls.some((url) => url.includes('siteverify')), true);
});

test('workers.dev redirects and the scores page does not print the public email', async () => {
  const worker = await import(pathToFileURL(path.resolve('src/index.js')).href);
  const redirected = await worker.default.fetch(new Request('https://maui-youth-sports.workers.dev/scores/?q=1'), {});
  assert.equal(redirected.status, 301);
  assert.equal(redirected.headers.get('location'), 'https://mauiyouthsports.com/scores/?q=1');
  let assetUrl = '';
  const passed = await worker.default.fetch(new Request('https://mauiyouthsports.com/scores/'), {
    ASSETS: { fetch(request) { assetUrl = request.url; return new Response('ok'); } }
  });
  assert.equal(await passed.text(), 'ok');
  assert.equal(assetUrl, 'https://mauiyouthsports.com/scores/');
  const html = fs.readFileSync('public/scores/index.html', 'utf8');
  assert.equal(html.includes('aloha@mauiyouthsports.com'), false);
  assert.equal(html.includes('Got a score? Send it in.'), true);
  assert.equal((html.match(/Got a score\? Send it in\./g) || []).length, 2);
  assert.equal(html.includes('challenges.cloudflare.com'), false);
  const { SPORTS } = await load();
  for (const sport of SPORTS) assert.equal(html.includes(`<option>${sport}</option>`), true, sport);
});
