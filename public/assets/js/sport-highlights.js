/* Sport-page highlights. The list is prebuilt in the HTML. This refreshes it
   from /assets/data/highlights.json so a new story appears without editing
   the sport page. It leaves the prebuilt list alone when nothing changed. */
(function(){
'use strict';
const root=document.getElementById('sport-highlights');
if(!root)return;
const pageSlug=root.dataset.sport||((location.pathname.match(/\/sports\/([^/]+)/)||[])[1]||'');
if(!pageSlug)return;
const ALIASES={
  'flag-football':'flag-football',
  flagfootball:'flag-football',
  paddling:'canoe-paddling',
  outrigger:'canoe-paddling',
  cheer:'cheerleading',
  swimming:'swimming-diving',
  diving:'swimming-diving',
  track:'track-field',
  'track-and-field':'track-field'
};
function norm(tag){
  const key=String(tag||'').trim().toLowerCase().replace(/[\s_]+/g,'-');
  return ALIASES[key]||key;
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function markup(items){
  if(!items.length)return '<p class="sport-highlights-empty">No highlights for this sport yet. Have one to share? <a href="/submit/?type=highlight">Send it to us</a>.</p>';
  return items.map(function(e){
    const href='/highlights/2026/'+encodeURIComponent(e.slug).replace(/%2D/g,'-')+'/';
    const date=e.published||'';
    return '<article class="row"><time datetime="'+esc(date)+'">'+esc(date)+'</time><h3><a href="'+href+'">'+esc(e.title)+'</a></h3><p>'+esc(e.excerpt||'')+'</p></article>';
  }).join('')+'<p><a class="morelink" href="/highlights/">See all highlights</a></p>';
}
fetch('/assets/data/highlights.json').then(function(r){if(!r.ok)throw Error('highlights');return r.json();}).then(function(list){
  if(!Array.isArray(list))return;
  const items=list.filter(function(e){return e&&e.slug&&(e.sports||[]).some(function(tag){return norm(tag)===pageSlug;});})
    .sort(function(a,b){return String(b.published||'').localeCompare(String(a.published||''));})
    .slice(0,5);
  const sig=items.map(function(e){return e.slug;}).join('|');
  if((root.dataset.rendered||'')===sig)return;
  root.innerHTML=markup(items);
  root.dataset.rendered=sig;
}).catch(function(){});
})();
