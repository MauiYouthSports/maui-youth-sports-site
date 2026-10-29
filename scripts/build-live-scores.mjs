import { unlinkSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSftDZ9GZFkqnYw2edu_nu-eRFUeDInqEhqVnFjoogW6Uea8tK3S_S-ywdQYZlhCvpN5mW3ow9qh9cp/pub?gid=825218774&single=true&output=csv';

export function parseCSV(t){var rows=[],row=[],f='',q=false;for(var i=0;i<t.length;i++){var c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}else if(c==='"')q=true;else if(c===','){row.push(f);f='';}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(f);rows.push(row);row=[];f='';}else f+=c;}if(f!==''||row.length){row.push(f);rows.push(row);}return rows;}

function label(r){var a=[r.gender,r.sport].filter(Boolean).join(' '),b=[r.level,r.division].filter(Boolean).join(' ');return b?a+' · '+b:a;}

export function gamesFromCsv(text) {
  var rows = parseCSV(text).filter(function (r) { return r.some(function (x) { return x.trim(); }); });
  if (rows.length < 2) throw new Error('Scores CSV has no data rows');
  var h = rows[0].map(function (x) { return x.trim().toLowerCase(); });
  if (h.indexOf('review_status') < 0 || h.indexOf('home_team') < 0) throw new Error('Scores CSV is missing review_status or home_team');
  var out = rows.slice(1).map(function (r) { var o = {}; h.forEach(function (k, i) { o[k] = (r[i] || '').trim(); }); return o; }).filter(function (o) { return o.review_status.toLowerCase() === 'approved' && /^\d{4}-\d{2}-\d{2}$/.test(o.date) && o.away_team && o.home_team; }).map(function (o) { return { id: o.id, dateISO: o.date, sportGroup: o.sport, sport: label(o), away: o.away_team, awayScore: o.away_score, home: o.home_team, homeScore: o.home_score, status: (o.status || 'final').toUpperCase(), href: o.source_url, urlOnMYS: o.mys_page, notes: o.notes || '', sourceName: o.source_name || '' }; });
  out.sort(function (a, b) { return b.dateISO.localeCompare(a.dateISO); });
  return out;
}

async function main() {
  const dest = join(dirname(fileURLToPath(import.meta.url)), '../public/assets/data/live-scores.json');
  const res = await fetch(SHEET_CSV_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('Scores sheet HTTP ' + res.status);
  const rows = gamesFromCsv(await res.text());
  const body = JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: 'MYS Scores sheet (approved rows)',
    rows
  }, null, 2) + '\n';
  const tmp = dest + '.tmp';
  try {
    writeFileSync(tmp, body);
    renameSync(tmp, dest);
  } catch (err) {
    try { unlinkSync(tmp); } catch (e) { /* leave the published file untouched */ }
    throw err;
  }
  console.log('Wrote ' + rows.length + ' approved rows');
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((err) => {
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  });
}
