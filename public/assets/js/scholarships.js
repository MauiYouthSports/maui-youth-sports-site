(function(root){
'use strict';
const sports=['Baseball','Basketball','Bowling','Canoe Paddling','Cheerleading','Cross Country','Dance','Flag Football','Football','Golf','Gymnastics','Inline Hockey','Martial Arts','Rugby','Skateboarding','Soccer','Softball','Surfing','Swimming & Diving','Tennis','Track & Field','Volleyball','Water Polo','Wrestling'];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hawaiiDate(now){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Pacific/Honolulu',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now||new Date()).map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day;}
function status(x,now){now=now||new Date();const today=hawaiiDate(now),windows=x.applicationWindows||[];
 if(windows.length&&x.applicationWindowAuthority==='primary'){
  for(const w of [...windows].sort((a,b)=>(a.start||'').localeCompare(b.start||''))){
   const passed=w.endAt?now>new Date(w.endAt):w.end<today;
   if(w.start&&w.start<=today&&!passed)return 'Within published application window · '+w.label;
   if(w.start&&w.start>today)return 'Next published window: '+w.start+' — '+w.end+' · '+w.label;
   if(!w.start&&!passed)return 'Published deadline: '+w.end+' · opening/status not confirmed';
  }
  return 'This year\u2019s deadline has passed. Check back for next year\u2019s dates.';
 }
 return x.status;
}
function matches(x,filters){return(!filters.region||x.region===filters.region)&&(!filters.type||x.type===filters.type)&&(!filters.sport||x.sports.split('; ').includes(filters.sport)||x.sports.split('; ').includes('All Sports'))&&(!filters.query||[x.name,x.organization,x.description,x.eligibility,x.amount,x.status,x.instructions,x.sports].filter(Boolean).join(' ').toLowerCase().includes(filters.query.toLowerCase()));}
function card(x,now){const internal=x.urlOnMYS;return '<article class="card">'+[x.region,x.type,...x.sports.split('; ')].map(z=>'<span class="tag">'+esc(z)+'</span>').join('')+'<h3>'+(internal?'<a href="'+esc(internal)+'">'+esc(x.name)+'</a>':esc(x.name))+'</h3><div class="amount">'+esc(x.amount)+'</div><div class="status">'+esc(status(x,now))+'</div><p class="muted">'+esc(x.eligibility)+'</p>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+(x.windowText?'<p>'+esc(x.windowText)+'</p>':'')+(!internal&&x.contact?Object.entries(x.contact).map(([k,v])=>'<p><b>'+esc(k[0].toUpperCase()+k.slice(1))+':</b> '+(k==='email'?'<a href="mailto:'+esc(v)+'">'+esc(v)+'</a>':esc(v))+'</p>').join(''):'')+(internal?'<p><a href="'+esc(internal)+'"><b>Requirements & details on MYS →</b></a></p>':'')+'<p><a href="'+esc(x.url)+'" target="_blank" rel="noopener">Official website →</a></p><p class="verified">'+(x.verificationState==='verified-published-information'?'Published facts checked: ':'Review attempted · some details unconfirmed: ')+esc(x.lastChecked)+'</p></article>';}
root.MYSScholarships={sports,status,matches,card,hawaiiDate};
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id);let records=[];
function options(id,values){for(const v of [...new Set(values)].sort()){const option=document.createElement('option');option.value=v;option.textContent=v;$(id).append(option);}}
function draw(){if(!records.length||!$('out'))return;const filters={query:$('q').value,region:$('r').value,sport:$('s').value,type:$('t').value},filtered=records.filter(x=>matches(x,filters));$('out').innerHTML=[['Maui County','Maui County Opportunities'],['Hawaiʻi','Hawaiʻi Opportunities'],['National','National Opportunities Maui Students Can Apply For']].map(([region,title])=>{const list=filtered.filter(x=>x.region===region);return list.length?'<section class="sec"><h2>'+title+'</h2><div class="grid">'+list.map(x=>card(x)).join('')+'</div></section>':'';}).join('')||'<p>No matching opportunities.</p>';}
fetch('/assets/scholarships.json').then(r=>{if(!r.ok)throw Error('scholarships');return r.json();}).then(data=>{records=data;
 if($('out')){options('r',data.map(x=>x.region));options('t',data.map(x=>x.type));options('s',sports);draw();['q','r','s','t'].forEach(id=>$(id).addEventListener(id==='q'?'input':'change',draw));}
 document.querySelectorAll('[data-scholarship-status]').forEach(el=>{const record=data.find(x=>x.slug===el.dataset.scholarshipStatus);if(record)el.textContent=status(record);});
}).catch(()=>{const target=$('out');if(target){const p=document.createElement('p');p.className='notice';p.textContent='Interactive filters unavailable. All reviewed opportunities remain below; confirm current deadlines with the sponsor.';target.prepend(p);}});
})(typeof window==='undefined'?globalThis:window);
