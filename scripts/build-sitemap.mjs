import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../public/', import.meta.url);
const ORIGIN = 'https://mauiyouthsports.com';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'pagefind' || name.startsWith('.')) continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, out);
    else if (name.endsWith('.html') && !name.includes('404')) out.push(path);
  }
  return out;
}

function lastmod(file, html) {
  const dates = [];
  for (const match of html.matchAll(/(?:datetime="|datePublished"\s*:\s*"|dateModified"\s*:\s*")(\d{4}-\d{2}-\d{2})/g)) {
    dates.push(match[1]);
  }
  if (dates.length) return dates.sort().at(-1);
  return statSync(file).mtime.toISOString().slice(0, 10);
}

function locFor(file) {
  let rel = relative(ROOT.pathname, file).replaceAll('\\', '/');
  if (rel === 'index.html') return ORIGIN + '/';
  if (rel.endsWith('/index.html')) return ORIGIN + '/' + rel.slice(0, -'index.html'.length);
  return ORIGIN + '/' + rel;
}

const urls = walk(ROOT.pathname).map((file) => {
  const html = readFileSync(file, 'utf8');
  return { loc: locFor(file), lastmod: lastmod(file, html) };
}).sort((a, b) => a.loc.localeCompare(b.loc));

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.map((u) => `  <url><loc>${u.loc.replaceAll('&', '&amp;')}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')
  + '\n</urlset>\n';

writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml);
console.log('sitemap', urls.length, 'urls');
