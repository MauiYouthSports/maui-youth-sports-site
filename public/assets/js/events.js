/* Date-based presentation only. No updates, fetching of external sources or publishing. */
(function(root){
'use strict';
function hawaiiDate(now){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Pacific/Honolulu',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now||new Date());const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day;}
function status(e,today){
 if(e.currentStatus==='canceled')return 'Canceled · school announcement';
 if(e.currentStatus==='final')return e.resultSummary||'Final';
 if(e.verificationState==='official-source-conflict')return 'Check schedule details';
 if(e.kind==='season')return 'Season schedule available';
 if(e.end&&e.end<today)return e.kind==='notice'?'Past announcement':e.kind==='program'?'This program date has passed':'This date has passed';
 if(e.start&&e.start>today)return 'Upcoming';
 if(e.start===today&&e.end===today)return 'Today';
 if(e.start&&e.end&&e.start<=today&&e.end>=today)return 'During the program season';
 return 'See the listing for details';
}
function registrationStatus(e,today){if(!e.registrationEnd)return 'Ask the organizer about registration';if(e.registrationEnd<today)return 'Published registration window passed';if(e.registrationStart&&e.registrationStart>today)return 'Published registration opens '+e.registrationStart;return 'Registration open';}
function active(e,today){return !e.end||e.end>=today;}
function todayEvent(e,today){return e.start===today&&e.end===today&&e.kind!=='program'&&e.kind!=='season';}
root.MYSContent={hawaiiDate,status,active,todayEvent,registrationStatus};
if(typeof document==='undefined')return;
fetch('/assets/data/events.json').then(r=>{if(!r.ok)throw Error('events');return r.json();}).then(events=>{
 const today=hawaiiDate(),by=Object.fromEntries(events.map(e=>[e.slug,e]));
 document.querySelectorAll('[data-score-day]').forEach(el=>{const day=el.dataset.scoreDay,yesterday=new Date(Date.parse(today+'T00:00:00Z')-86400000).toISOString().slice(0,10);el.textContent=(day===today?'Today · ':day===yesterday?'Yesterday · ':'Recorded fixtures · ')+day;});
 document.querySelectorAll('[data-today-label]').forEach(el=>el.textContent=today+' · Hawaiʻi time');
 document.querySelectorAll('[data-event]').forEach(el=>{const e=by[el.dataset.event];if(!e)return;const label=el.querySelector('[data-event-status]');if(label){const base=status(e,today);const score=label.getAttribute('data-final-score');const protect=/Canceled|Check schedule|Season schedule/.test(base);const happened=e.start&&e.start<=today&&(!e.end||e.end<=today);label.textContent=score&&!protect&&happened?score:base;}const reg=el.querySelector('[data-registration-status]');if(reg)reg.textContent=registrationStatus(e,today);});
 document.querySelectorAll('[data-event-view]').forEach(view=>{
  const mode=view.dataset.eventView,rows=[...view.querySelectorAll('[data-event]')];
  if(mode==='coming')rows.sort((a,b)=>{const x=by[a.dataset.event],y=by[b.dataset.event];return (x.start<today?today:x.start).localeCompare(y.start<today?today:y.start)||x.slug.localeCompare(y.slug);}).forEach(el=>view.append(el));
  let shown=0;const limit=Number(view.dataset.limit)||Infinity;
  rows.forEach(el=>{const e=by[el.dataset.event];if(!e)return;const eligible=mode!=='coming'||e.listingCategory==='community';const visible=eligible&&(mode==='today'?todayEvent(e,today):mode==='past'?!active(e,today):active(e,today));el.hidden=!visible||shown>=limit;if(!el.hidden)shown++;});
  const message=view.querySelector('[data-empty-message]');if(message){message.hidden=shown>0;message.textContent=mode==='today'?'No single-day event is listed for '+today+'. See Schedules for programs and upcoming games.':'Nothing else is scheduled right now. Check Schedules for upcoming games.';}
 });
}).catch(()=>{document.querySelectorAll('[data-event-view]').forEach(v=>{const note=document.createElement('p');note.className='notice';note.textContent='Dates could not be refreshed. Check each listing for the latest details.';v.append(note);});});
})(typeof window==='undefined'?globalThis:window);
