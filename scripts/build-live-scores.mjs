import { unlinkSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSftDZ9GZFkqnYw2edu_nu-eRFUeDInqEhqVnFjoogW6Uea8tK3S_S-ywdQYZlhCvpN5mW3ow9qh9cp/pub?gid=825218774&single=true&output=csv';

export function parseCSV(t){var rows=[],row=[],f='',q=false;for(var i=0;i<t.length;i++){var c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}else if(c==='"')q=true;else if(c===','){row.push(f);f='';}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(f);rows.push(row);row=[];f='';}else f+=c;}if(f!==''||row.length){row.push(f);rows.push(row);}return rows;}

function label(r){var a=[r.gender,r.sport].filter(Boolean).join(' '),b=[r.level,r.division].filter(Boolean).join(' ');return b?a+' · '+b:a;}
function foldName(s){s=String(s||'').replace(/[ʻ'’‘]/g,'');s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');s=s.toLowerCase().replace(/&/g,' and ');s=s.replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();if(s==='kamehameha maui'||s==='kamehameha schools maui'||s==='ks maui')return 'ks maui';if(s==='maui'||s==='maui high'||s==='maui high school')return 'maui high';return s;}
function titleSport(sport){var s=String(sport||'').trim();if(/cross[\s-]*country/i.test(s))return 'XC';if(/^cheer$/i.test(s))return 'Cheerleading';return s;}
function leagueOf(row){var named=String(row.league||row.event||'').trim();if(named)return named;var src=String(row.source_name||'').trim();if(/^hhsaa$/i.test(src))return 'HHSAA';if(/^mil$/i.test(src))return 'MIL';var lead=String(row.notes||'').match(/^\s*(HHSAA|MIL)\b/i);return lead?lead[1].toUpperCase():'';}
function meetTitle(row){var league=leagueOf(row);var division=String(row.division||'').trim();var gender=String(row.gender||'').trim();var sport=titleSport(row.sport);var genderTitle='';if(!/girl|boy/i.test(division)){if(/^boys?$/i.test(gender))genderTitle='Boys';else if(/^girls?$/i.test(gender))genderTitle='Girls';}if(/^HHSAA$/i.test(league))return ['HHSAA',division,genderTitle,sport].filter(Boolean).join(' ');if(/^MIL$/i.test(league))return sport==='XC'?'MIL XC':(sport?'MIL '+sport:'MIL');var plain=[row.gender,row.sport].filter(Boolean).join(' ').trim();return plain||'Meet';}
function meetSummary(row){var notes=String(row.notes||'');var team=String(row.home_team||'').trim();var pts=String(row.home_score||'').trim();var gender=/^boys?$/i.test(row.gender)?'boys':/^girls?$/i.test(row.gender)?'girls':(/\bboys\b/i.test(String(row.sport||''))?'boys':(/\bgirls\b/i.test(String(row.sport||''))?'girls':(/\bboys\b/i.test(notes)&&!/\bgirls\b/i.test(notes)?'boys':(/\bgirls\b/i.test(notes)&&!/\bboys\b/i.test(notes)?'girls':''))));var meet=meetTitle(row);var place='';var esc=team.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');if(team){var pm=notes.match(new RegExp(esc+'\\s+(\\d+(?:st|nd|rd|th))\\b','i'));if(pm)place=pm[1].toLowerCase();}var champ=!!team&&new RegExp('(?:^|[.;]\\s*|Team:\\s*)1\\.\\s+'+esc+'\\b','i').test(notes);var indiv='';var im=notes.match(/Individual champion\s+(.+?)\s+\(([^)]+)\)\s+(\d{1,2}:\d{2})/i)||notes.match(/Individual:\s*1\.\s+(.+?)\s+\(([^)]+)\)\s+(\d{1,2}:\d{2})/i);if(im&&foldName(im[2])===foldName(team))indiv='individual winner '+im[1].trim()+' '+im[3];var body;if(champ&&!place)body=team+(gender?' '+gender:'')+' champions'+(pts?' ('+pts+' pts)':'');else if(place)body=team+' '+place+(pts?' ('+pts+' pts)':'');else body=team+(pts?' ('+pts+' pts)':'');return indiv?meet+': '+body+'; '+indiv:meet+': '+body;}

export function gamesFromCsv(text) {
  var rows = parseCSV(text).filter(function (r) { return r.some(function (x) { return x.trim(); }); });
  if (rows.length < 2) throw new Error('Scores CSV has no data rows');
  var h = rows[0].map(function (x) { return x.trim().toLowerCase(); });
  if (h.indexOf('review_status') < 0 || h.indexOf('home_team') < 0) throw new Error('Scores CSV is missing review_status or home_team');
  var out = rows.slice(1).map(function (r) { var o = {}; h.forEach(function (k, i) { o[k] = (r[i] || '').trim(); }); return o; }).filter(function (o) { return o.review_status.toLowerCase() === 'approved' && /^\d{4}-\d{2}-\d{2}$/.test(o.date) && o.home_team; }).map(function (o) { var sport = label(o), meet = !o.away_team; return { id: o.id, dateISO: o.date, sportGroup: o.sport, sport: sport, away: o.away_team, awayScore: o.away_score, home: o.home_team, homeScore: o.home_score, status: (o.status || 'final').toUpperCase(), href: o.source_url, urlOnMYS: o.mys_page, notes: o.notes || '', sourceName: o.source_name || '', meet: meet, meetLine: meet ? meetSummary(o) : '' }; });
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
