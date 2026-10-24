/* Homepage score cards. The live Scores sheet is the only source.
   A frozen embed must never fill these cards.
   Rows do not need a mys_page. Newest date first, then round-robin across
   sports on that day. Games older than MAX_AGE_DAYS are hidden when any
   newer approved game exists; if every approved game is older than that,
   the newest date still shows. */
(function(){'use strict';
var MAX_AGE_DAYS=14,CARD_LIMIT=3;
function sportKey(g){var group=String(g.sportGroup||'').trim();if(group)return group.toLowerCase();return String(g.sport||'').split('·')[0].replace(/^(girls|boys|women's|men's|womens|mens|coed)\s+/i,'').trim().toLowerCase();}
function addDays(iso,days){var p=String(iso||'').split('-').map(Number);var dt=new Date(Date.UTC(p[0],p[1]-1,p[2]));dt.setUTCDate(dt.getUTCDate()+days);return dt.toISOString().slice(0,10);}
function hawaiiToday(now){var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Pacific/Honolulu',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now||new Date());var map={};parts.forEach(function(part){map[part.type]=part.value;});return map.year+'-'+map.month+'-'+map.day;}
function latestCutoff(newestISO){return addDays(newestISO,-7);}
function eligible(games,today){var rows=(games||[]).filter(function(g){return g&&g.dateISO&&(/final/i.test(g.status||'')||/published-result-reviewed/i.test(g.verificationState||''));}).slice().sort(function(a,b){return b.dateISO.localeCompare(a.dateISO);});if(!rows.length)return [];var newest=rows[0].dateISO;var fresh=rows.filter(function(g){return g.dateISO>=addDays(today,-MAX_AGE_DAYS);});if(fresh.length)return fresh;return rows.filter(function(g){return g.dateISO===newest;});}
function pick(games,limit){var days=[],byDate=new Map();games.forEach(function(g){if(!byDate.has(g.dateISO)){var day={date:g.dateISO,games:[]};byDate.set(g.dateISO,day);days.push(day);}byDate.get(g.dateISO).games.push(g);});var chosen=[];for(var d=0;d<days.length;d++){if(chosen.length>=limit)break;var sports=[],queues=new Map();days[d].games.forEach(function(g){var key=sportKey(g)||'\0';if(!queues.has(key)){queues.set(key,[]);sports.push(key);}queues.get(key).push(g);});var round=0;while(chosen.length<limit){var progressed=false;for(var s=0;s<sports.length;s++){var queue=queues.get(sports[s]);if(round<queue.length){chosen.push(queue[round]);progressed=true;if(chosen.length>=limit)break;}}if(!progressed)break;round++;}}return chosen;}
function chooseHomepage(sheetGames,snapshotGames,options){void snapshotGames;var today=options&&options.today||hawaiiToday(new Date());return pick(eligible(sheetGames,today),CARD_LIMIT);}
window.MYSHomeScores={chooseHomepage:chooseHomepage,latestCutoff:latestCutoff,maxAgeDays:MAX_AGE_DAYS};
var target=document.getElementById('scores');if(!target)return;
function unavailable(){target.replaceChildren();target.textContent='Latest scores could not be loaded. Open Scores + Stats to try again.';}
function render(games){var finals=chooseHomepage(games,null);target.replaceChildren();if(!finals.length){target.textContent='No verified results available yet.';return;}finals.forEach(function(g){var a=document.createElement('a');a.className='scorecard game-scorecard';a.href=g.urlOnMYS||g.href||'/scores/';var head=document.createElement('div');head.className='scorehead';var pill=document.createElement('span');pill.className='pill';pill.textContent=g.sport||'Sports';var date=document.createElement('span');date.className='scoredate';date.textContent=g.dateISO+' · FINAL';head.append(pill,date);a.append(head);[[g.away,g.awayScore],[g.home,g.homeScore]].forEach(function(pair){var line=document.createElement('div');line.className='scoreline';var name=document.createElement('span');name.textContent=pair[0]||'';var pts=document.createElement('strong');pts.textContent=pair[1]??'';line.append(name,pts);a.append(line);});target.append(a);});}
var loader=window.MYSScores&&window.MYSScores.load?window.MYSScores.load():Promise.resolve(null);
loader.then(function(data){if(!data||!data.length)unavailable();else render(data);}).catch(unavailable);
})();
