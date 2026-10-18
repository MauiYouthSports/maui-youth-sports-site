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
function exempt(date,text){
  if(date!=='2026-10-09')return false;
  var n=fold(text);
  return n.indexOf('lanai')>=0&&n.indexOf('seabury')>=0;
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
  var list=map[pairKey(date,sport,a,b)];
  if(!list||!list.length)return null;
  var sig=list.map(function(g){return g.awayScore+'|'+g.homeScore+'|'+fold(g.away)+'|'+fold(g.home);});
  var unique=sig.filter(function(s,idx){return sig.indexOf(s)===idx;});
  return unique.length===1?list[0]:null;
}
function textOf(el){return (el.textContent||'').replace(/\s+/g,' ').trim();}
function setText(el,value){if(el&&el.textContent!==value)el.textContent=value;}
function apply(map,authoritative){
  var today=hawaiiToday();
  TABLES.forEach(function(table){
    table.querySelectorAll('tbody tr[data-fixture-date]').forEach(function(tr){
      var date=tr.getAttribute('data-fixture-date')||'';
      var cells=[].slice.call(tr.children);
      if(cells.length<2)return;
      var matchup=cells.length>2?cells[2]:cells[0];
      var division=cells.length>1?cells[1]:cells[0];
      var status=tr.lastElementChild;
      var matchupText=textOf(matchup);
      if(exempt(date,matchupText))return;
      var current=textOf(status);
      if(/canceled/i.test(current)||/check schedule details/i.test(current))return;
      var bits=matchupText.split(/\s+[–—]\s+/);
      var found=bits.length>=2?lookup(map,date,sportOf(textOf(division)),bits[0],bits[1]):null;
      if(found){
        setText(status,line(found));
        status.setAttribute('data-mys-score','1');
        return;
      }
      if(date<today&&(/upcoming/i.test(current)||/coming soon/i.test(current)||/score not reported/i.test(current)||(authoritative&&status.getAttribute('data-mys-score')==='1'))){
        setText(status,'Score not reported yet');
        status.removeAttribute('data-mys-score');
      }
    });
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
    if(exempt(date,left+' '+right))return;
    var sport=sportOf(title);
    var found=lookup(map,date,sport,left,right);
    if(found){
      var value=line(found);
      label.setAttribute('data-final-score',value);
      if(date<=hawaiiToday())setText(label,value);
    }
  });
}
function fallback(){
  return fetch('/assets/data/scores.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('scores');return r.json();}).then(function(rows){if(Array.isArray(rows))apply(indexScores(rows),false);}).catch(function(){});
}
var loader=window.MYSScores&&window.MYSScores.load?window.MYSScores.load():Promise.resolve(null);
Promise.resolve(loader).then(function(rows){
  if(Array.isArray(rows)&&rows.length)apply(indexScores(rows),true);
  else return fallback();
}).catch(function(){return fallback();});
})();
