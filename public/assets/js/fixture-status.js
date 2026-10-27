/* Fixture and event-page scores. Prebuilt HTML is the first paint.
   Approved rows from the published Scores sheet replace that paint, and
   scores.json is only a fallback when the sheet cannot be read. */
(function(){
'use strict';
var TABLES=document.querySelectorAll('.fixture-table');
var EVENTS=document.querySelectorAll('[data-event] [data-event-status], [data-event][data-event-status]');
if(!TABLES.length&&!document.querySelector('[data-final-score]')&&!document.querySelector('.fixture-table')&&!document.querySelector('main h1')){
  /* Still run on event detail pages that only have a status pill. */
}
function hawaiiToday(){
  var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Pacific/Honolulu',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  var p={};
  parts.forEach(function(x){p[x.type]=x.value;});
  return p.year+'-'+p.month+'-'+p.day;
}
function fold(s){
  s=String(s||'').replace(/[ʻ'’‘]/g,'');
  s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  s=s.toLowerCase().replace(/&/g,' and ');
  s=s.replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  if(s==='kamehameha maui'||s==='kamehameha schools maui'||s==='ks maui')return 'ks maui';
  if(s==='maui'||s==='maui high'||s==='maui high school')return 'maui high';
  return s;
}
function spell(s){
  return String(s||'').replace(/\bKulanihakoʻi\b/g,'Kūlanihākoʻi').replace(/\bKulanihakoi\b/g,'Kūlanihākoʻi').replace(/\bHaleakala\b/g,'Haleakalā').replace(/\bMolokai\b/g,'Molokaʻi').replace(/\bLanai\b/g,'Lānaʻi').replace(/\bKihei\b/g,'Kīhei').replace(/\bHana\b/g,'Hāna');
}
function sportOf(text){
  var t=String(text||'').toLowerCase();
  if(t.indexOf('football')>=0)return 'football';
  if(t.indexOf('volleyball')>=0)return 'volleyball';
  if(t.indexOf('bowling')>=0)return 'bowling';
  if(t.indexOf('cross country')>=0||t.indexOf('cross-country')>=0)return 'cross country';
  return '';
}
function pairKey(date,sport,a,b){
  var x=fold(a),y=fold(b);
  if(!x||!y)return '';
  if(x>y){var t=x;x=y;y=t;}
  return date+'|'+sport+'|'+x+'|'+y;
}
function seedSide(s){
  return /^(?:\d+(?:st|nd|rd|th)|g\d+ winner)\b/.test(fold(s));
}
function divisionOf(text){
  var t=fold(text);
  if(/\bdii\b/.test(t))return 'dii';
  if(/\b8 man\b/.test(t))return '8-man';
  if(/\bdi\b/.test(t))return 'di';
  return '';
}
function sameSlot(g,date,sport,division){
  return !!g&&g.dateISO===date&&sportOf(g.sport||g.sportGroup||'')===sport&&divisionOf(g.sport||'')===division;
}
function uniqueGame(list){
  if(!list||!list.length)return null;
  var sig=list.map(function(g){return g.awayScore+'|'+g.homeScore+'|'+fold(g.away)+'|'+fold(g.home);});
  var unique=sig.filter(function(s,idx){return sig.indexOf(s)===idx;});
  return unique.length===1?list[0]:null;
}
function line(g){
  return 'Final · '+spell(g.away)+' '+g.awayScore+' – '+spell(g.home)+' '+g.homeScore;
}
function indexScores(rows){
  var map={};
  rows.forEach(function(g){
    if(!g||!g.dateISO||!g.away||!g.home)return;
    if(g.status&&!/final/i.test(g.status)&&!/published-result-reviewed/i.test(g.verificationState||''))return;
    var key=pairKey(g.dateISO,sportOf(g.sport||g.sportGroup||''),g.away,g.home);
    if(!key)return;
    if(!map[key])map[key]=[];
    map[key].push(g);
  });
  return map;
}
function lookup(map,date,sport,a,b){
  return uniqueGame(map[pairKey(date,sport,a,b)]);
}
function textOf(el){return (el.textContent||'').replace(/\s+/g,' ').trim();}
function setText(el,value){if(el&&el.textContent!==value)el.textContent=value;}
function paint(status,found){
  setText(status,line(found));
  status.setAttribute('data-mys-score','1');
}
function apply(map,authoritative,rows){
  rows=rows||[];
  var today=hawaiiToday();
  var pending=[];
  TABLES.forEach(function(table){
    table.querySelectorAll('tbody tr[data-fixture-date]').forEach(function(tr){
      var date=tr.getAttribute('data-fixture-date')||'';
      var cells=[].slice.call(tr.children);
      if(cells.length<2)return;
      var matchup=cells.length>2?cells[2]:cells[0];
      var division=cells.length>1?cells[1]:cells[0];
      var status=tr.lastElementChild;
      var matchupText=textOf(matchup);
      var current=textOf(status);
      if(/canceled/i.test(current)||/check schedule details/i.test(current))return;
      var sport=sportOf(textOf(division));
      var bits=matchupText.split(/\s+[–—]\s+/);
      var found=bits.length>=2?lookup(map,date,sport,bits[0],bits[1]):null;
      if(found){
        paint(status,found);
        (map[pairKey(date,sport,bits[0],bits[1])]||[]).forEach(function(g){g._consumed=true;});
        return;
      }
      pending.push({date:date,status:status,bits:bits,sport:sport,div:divisionOf(textOf(division))});
    });
  });
  var groups={};
  var namedLeft={};
  pending.forEach(function(row){
    if(!row.sport||!row.div)return;
    var key=row.date+'|'+row.sport+'|'+row.div;
    if(!(row.bits.length>=2&&seedSide(row.bits[0])&&seedSide(row.bits[1]))){namedLeft[key]=true;return;}
    if(!groups[key])groups[key]=[];
    groups[key].push(row);
  });
  Object.keys(groups).forEach(function(key){
    var group=groups[key];
    if(namedLeft[key]||group.length!==1)return;
    var row=group[0];
    var candidates=rows.filter(function(g){return !g._consumed&&sameSlot(g,row.date,row.sport,row.div);});
    var found=uniqueGame(candidates);
    if(!found)return;
    paint(row.status,found);
    candidates.forEach(function(g){g._consumed=true;});
    row.painted=true;
  });
  pending.forEach(function(row){
    if(row.painted)return;
    var current=textOf(row.status);
    if(row.date<today&&(/upcoming/i.test(current)||/coming soon/i.test(current)||/score not reported/i.test(current)||(authoritative&&row.status.getAttribute('data-mys-score')==='1'))){
      setText(row.status,'Score not reported yet');
      row.status.removeAttribute('data-mys-score');
    }
  });
  document.querySelectorAll('[data-event]').forEach(function(el){
    var label=el.querySelector('[data-event-status]');
    if(!label)return;
    var heading=el.querySelector('h1,h2,h3');
    var pageHeading=document.querySelector('main h1');
    var title=textOf(heading&&el.contains(heading)?heading:pageHeading||el);
    var dateMatch=title.match(/\d{4}-\d{2}-\d{2}/);
    var date=dateMatch?dateMatch[0]:'';
    var vs=title.split(/\s+vs\s+/i);
    if(!date||vs.length<2){
      var preset=label.getAttribute('data-final-score');
      if(preset&&date&&date<hawaiiToday())setText(label,preset);
      return;
    }
    var left=vs[0].split('—').pop().split('·')[0];
    var right=vs[1].split('·')[0];
    var sport=sportOf(title);
    var found=lookup(map,date,sport,left,right);
    if(!found&&seedSide(left)&&seedSide(right)){
      var div=divisionOf(title);
      if(sport&&div)found=uniqueGame(rows.filter(function(g){return sameSlot(g,date,sport,div);}));
    }
    if(found){
      var value=line(found);
      label.setAttribute('data-final-score',value);
      if(date<=hawaiiToday())setText(label,value);
    }
  });
}
function fallback(){
  return fetch('/assets/data/scores.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('scores');return r.json();}).then(function(rows){if(Array.isArray(rows))apply(indexScores(rows),false,rows);}).catch(function(){});
}
var loader=window.MYSScores&&window.MYSScores.load?window.MYSScores.load():Promise.resolve(null);
Promise.resolve(loader).then(function(rows){
  if(Array.isArray(rows)&&rows.length)apply(indexScores(rows),true,rows);
  else return fallback();
}).catch(function(){return fallback();});
})();
