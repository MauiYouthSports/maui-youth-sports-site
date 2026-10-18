/* Homepage news cards. The four newest stories are prebuilt in the HTML.
   This refreshes them from highlights.json and leaves the paint alone when
   the same stories are already showing. */
(function(){
'use strict';
var root=document.getElementById('news');
if(!root)return;
function esc(s){return String(s??'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function markup(items){
  return items.map(function(e){
    var href='/highlights/2026/'+encodeURIComponent(e.slug).replace(/%2D/g,'-')+'/';
    return '<article class="card"><span class="pill">'+esc(e.published||'')+'</span><h3><a href="'+esc(href)+'">'+esc(e.title)+'</a></h3><p>'+esc(e.excerpt||'')+'</p></article>';
  }).join('');
}
fetch('/assets/data/highlights.json').then(function(r){if(!r.ok)throw Error('highlights');return r.json();}).then(function(list){
  if(!Array.isArray(list))return;
  var items=list.filter(function(e){return e&&e.slug;}).sort(function(a,b){return String(b.published||'').localeCompare(String(a.published||''));}).slice(0,4);
  var sig=items.map(function(e){return e.slug;}).join('|');
  if((root.dataset.rendered||'')===sig)return;
  root.innerHTML=markup(items);
  root.dataset.rendered=sig;
}).catch(function(){});
})();
