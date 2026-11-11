const FORMSPREE = 'https://formspree.io/f/xnpjbwjz';
const SUBJECT_PREFIX = 'MYS Score';
const HOSTS = new Set(['mauiyouthsports.com', 'www.mauiyouthsports.com']);
const SPORTS = [
  'Baseball', 'Basketball', 'Bowling', 'Paddling', 'Cheerleading', 'Cross Country', 'Dance',
  'Football', 'Flag Football', 'Golf', 'Gymnastics', 'Inline Hockey', 'Martial Arts', 'Rugby',
  'Skateboarding', 'Soccer', 'Softball', 'Surfing', 'Swimming & Diving', 'Tennis', 'Track & Field',
  'Volleyball', 'Water Polo', 'Wrestling', 'Air Riflery', 'Boxing', 'Archery', 'Running'
];

function clean(value, max) {
  const text = String(value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length > max) return { text: '', tooLong: true };
  return { text, tooLong: false };
}

function hstToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Honolulu', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function fieldError(message) {
  return { ok: false, status: 400, error: message };
}

export function validateScore(raw, today = hstToday()) {
  if (String(raw.website || '').trim()) return { ok: true, dropped: true };
  const sport = clean(raw.sport, 40);
  const home = clean(raw.home_team, 120);
  const away = clean(raw.away_team, 120);
  const score = clean(raw.final_score, 40);
  const date = clean(raw.event_date, 10);
  const division = clean(raw.division, 80);
  const highlights = clean(raw.highlights, 2000);
  const name = clean(raw.name, 120);
  const email = clean(raw.email, 200);
  if ([sport, home, away, score, date, division, highlights, name, email].some((item) => item.tooLong)) {
    return fieldError('One of the fields is too long. Please shorten it and try again.');
  }
  if (!sport.text || !SPORTS.includes(sport.text)) return fieldError('Choose a sport from the list.');
  if (!home.text || !away.text) return fieldError('Add the home and away teams.');
  if (!score.text) return fieldError('Add the final score.');
  if (!date.text || !/^\d{4}-\d{2}-\d{2}$/.test(date.text) || date.text > today) return fieldError('Add the date of the game.');
  if (!name.text) return fieldError('Add your name.');
  if (!email.text || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.text)) return fieldError('Add an email we can use to check the score.');
  const blob = `${home.text} ${away.text} ${score.text} ${highlights.text}`;
  if ((blob.match(/https?:\/\//gi) || []).length > 2) return fieldError('Please send the score without extra links.');
  return {
    ok: true,
    dropped: false,
    fields: {
      sport: sport.text,
      home: home.text,
      away: away.text,
      score: score.text,
      date: date.text,
      division: division.text,
      highlights: highlights.text,
      name: name.text,
      email: email.text
    },
    subject: `${SUBJECT_PREFIX}: ${sport.text} ${home.text} vs ${away.text}`.slice(0, 180)
  };
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function html(status, message) {
  const safe = message.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe}</title></head><body><p>${safe}</p><p><a href="/scores/">Back to scores</a></p></body></html>`, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function allowedHost(request) {
  const origin = request.headers.get('Origin');
  const source = origin || request.headers.get('Referer');
  if (!source) return true;
  try {
    return HOSTS.has(new URL(source).hostname);
  } catch {
    return false;
  }
}

async function checkTurnstile(request, env, token, fetchImpl) {
  const secret = env && env.TURNSTILE_SECRET;
  if (!secret) return { ok: true, skipped: true };
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return { ok: false };
  const ip = request.headers.get('CF-Connecting-IP') || '';
  let result;
  try {
    const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip })
    });
    if (!response.ok) return { ok: false };
    result = await response.json();
  } catch {
    return { ok: false };
  }
  if (!result.success || result.action !== 'score' || !HOSTS.has(result.hostname)) return { ok: false };
  return { ok: true };
}

export async function handleScore(request, env, fetchImpl = fetch) {
  const wantsJson = (request.headers.get('Accept') || '').includes('application/json');
  const reply = (status, body) => wantsJson ? json(status, body) : html(status, body.error || body.message);
  if (!allowedHost(request)) return reply(403, { ok: false, error: 'That score could not be sent from this page.' });
  let form;
  try {
    form = await request.formData();
  } catch {
    return reply(400, { ok: false, error: 'That score could not be read. Please try again.' });
  }
  for (const value of form.values()) {
    if (typeof value !== 'string') return reply(400, { ok: false, error: 'Photo uploads are not available on this form.' });
  }
  const raw = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === 'string'));
  const checked = validateScore(raw);
  if (!checked.ok) return reply(checked.status, checked);
  if (checked.dropped) return wantsJson ? json(200, { ok: true }) : html(200, "Mahalo! We'll check it and post it soon.");
  const turnstile = await checkTurnstile(request, env, raw['cf-turnstile-response'] || '', fetchImpl);
  if (!turnstile.ok) return reply(403, { ok: false, error: 'Please confirm you are a person and try again.' });
  const fields = checked.fields;
  const body = new FormData();
  body.set('type', 'score');
  body.set('submission_category', 'score');
  body.set('mys_form', 'submission');
  body.set('review_status', 'pending');
  body.set('subject', checked.subject);
  body.set('sport', fields.sport);
  body.set('home_team', fields.home);
  body.set('away_team', fields.away);
  body.set('final_score', fields.score);
  body.set('event_date', fields.date);
  body.set('division', fields.division);
  body.set('highlights', fields.highlights);
  body.set('name', fields.name);
  body.set('email', fields.email);
  let sent;
  try {
    sent = await fetchImpl(FORMSPREE, { method: 'POST', headers: { Accept: 'application/json' }, body });
  } catch {
    return reply(502, { ok: false, error: 'Your score didn’t send. Everything you typed is still here, so you can try again.' });
  }
  const out = await sent.json().catch(() => null);
  if (!sent.ok || !out || out.ok !== true) {
    return reply(502, { ok: false, error: 'Your score didn’t send. Everything you typed is still here, so you can try again.' });
  }
  if (wantsJson) return json(200, { ok: true, message: "Mahalo! We'll check it and post it soon." });
  return html(200, "Mahalo! We'll check it and post it soon.");
}

export { SPORTS, SUBJECT_PREFIX };
