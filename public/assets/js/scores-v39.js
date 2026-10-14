(function(){'use strict';const tabs=[...document.querySelectorAll('button[data-score-view]')],list=document.getElementById('mys-score-list'),sport=document.getElementById('score-sport'),query=document.getElementById('score-query'),status=document.getElementById('score-filter-status'),empty=document.getElementById('score-empty'),heading=document.getElementById('score-results-title');let view='latest';
function draw(){let n=0;const q=query.value.trim().toLocaleLowerCase();for(const c of list.querySelectorAll('.game-scorecard')){const ok=c.dataset.scoreView===view&&(!sport.value||c.dataset.sport===sport.value)&&(!q||c.textContent.toLocaleLowerCase().includes(q));c.hidden=!ok;if(ok)n++;}heading.textContent=view==='latest'?'Latest Scores':'Past Results';status.textContent=n===0?'No results match these filters.':n===1?'Showing 1 result':'Showing '+n+' results';if(empty)empty.hidden=n!==0;}
const D=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];function nice(iso){const d=new Date(iso+'T12:00:00Z');return D[d.getUTCDay()]+' '+M[d.getUTCMonth()]+' '+d.getUTCDate();}
function el(t,c,x){const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
function render(games){const newest=games[0].dateISO,cut=new Date(Date.parse(newest+'T00:00:00Z')-7*864e5).toISOString().slice(0,10);const frag=document.createDocumentFragment();for(const g of games){const local=g.urlOnMYS&&g.urlOnMYS.startsWith('/');const card=el(local?'a':'article','scorecard game-scorecard');if(local){card.href=g.urlOnMYS;card.setAttribute('aria-label',g.away+' '+g.awayScore+', '+g.home+' '+g.homeScore+' — '+g.sport+', '+g.dateISO+' '+g.status.toLowerCase());}card.dataset.gameDate=g.dateISO;card.dataset.scoreView=g.dateISO>=cut?'latest':'archive';card.dataset.sport=g.sportGroup||'';const head=el('div','scorehead');head.append(el('span','pill',g.sport),el('span','scoredate',nice(g.dateISO)+' · '+g.status));card.append(head);for(const [t,s] of [[g.away,g.awayScore],[g.home,g.homeScore]]){const l=el('div','scoreline');l.append(el('span','',t),el('strong','',s));card.append(l);}if(!local&&/^https?:/.test(g.href||'')){const p=el('p'),a=el('a','game-source','Final score ↗');a.href=g.href;a.target='_blank';a.rel='noopener noreferrer';p.append(a);card.append(p);}frag.append(card);}list.replaceChildren(frag);
const have=new Set([...sport.options].map(o=>o.value));for(const g of games)if(g.sportGroup&&!have.has(g.sportGroup)){have.add(g.sportGroup);sport.append(new Option(g.sportGroup,g.sportGroup));}draw();}
for(const t of tabs)t.addEventListener('click',()=>{view=t.dataset.scoreView;for(const b of tabs)b.setAttribute('aria-pressed',String(b===t));draw();});sport.addEventListener('change',draw);query.addEventListener('input',draw);draw();
if(window.MYSScores&&window.MYSScores.configured)window.MYSScores.load().then(g=>{if(g&&g.length)render(g);});
(function hideStalePending(){
  const section=document.querySelector('[data-score-pending]');
  if(!section)return;
  let applying=false;
  function today(){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Pacific/Honolulu',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
    return p.year+'-'+p.month+'-'+p.day;
  }
  function cutoff(){
    const [y,m,d]=today().split('-').map(Number);
    const dt=new Date(Date.UTC(y,m-1,d));
    dt.setUTCDate(dt.getUTCDate()-3);
    return dt.toISOString().slice(0,10);
  }
  function apply(){
    if(applying)return;
    applying=true;
    const cut=cutoff();
    let any=false;
    section.querySelectorAll('[data-pending-date]').forEach(row=>{
      const stale=row.getAttribute('data-pending-date')<cut;
      if(row.hidden!==stale)row.hidden=stale;
      if(!stale){
        any=true;
        const pill=row.querySelector('[data-event-status]');
        if(pill&&pill.textContent!=='Score not reported yet.')pill.textContent='Score not reported yet.';
      }
    });
    if(section.hidden!==!any)section.hidden=!any;
    applying=false;
  }
  apply();
  new MutationObserver(apply).observe(section,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
})();
})();
