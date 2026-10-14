function openSubmit(){document.getElementById('submitModal').classList.add('open')}function closeSubmit(){document.getElementById('submitModal').classList.remove('open')}
const d=window.MYS_DATA||{};
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function infoRows(items){return (items||[]).map(x=>`<div class="row"><span class="pill">${esc(x.tag||x.sport)}</span><b class="rowtitle">${esc(x.title)}</b><div class="rowtext">${esc(x.text)}</div>${x.href?`<a class="sourcebtn" href="${esc(x.href)}" ${x.internal?'':'target="_blank" rel="noopener"'}>${x.internal?'Read on MYS →':'Details →'}</a>`:''}</div>`).join('')}
function scoreRows(items){return (items||[]).map(x=>`<a class="scorecard game-scorecard" href="${esc(x.urlOnMYS)}" aria-label="${esc(x.away+' '+x.awayScore+', '+x.home+' '+x.homeScore+' — '+x.sport+', '+x.dateISO+' final')}"><div class="scorehead"><span class="pill">${esc(x.sport)}</span><span class="scoredate">${esc(x.date)} · ${esc(x.status)}</span></div><div class="scoreline"><span>${esc(x.away)}</span><strong>${esc(x.awayScore)}</strong></div><div class="scoreline"><span>${esc(x.home)}</span><strong>${esc(x.homeScore)}</strong></div></a>`).join('')}
function playRows(items){return (items||[]).map(x=>`<a class="playitem pictocard" href="${esc(x.href)}" aria-label="${esc(x.sport)}">${x.icon?`<img src="/assets/pictographs/${esc(x.icon)}.png" alt="${esc(x.sport)}">`:`<span class="sport-text-tile">${esc(x.sport)}</span>`}</a>`).join('')}
const put=(id,html)=>{const el=document.getElementById(id);if(el)el.innerHTML=html};
put('scores',scoreRows(d.homepageScores||(d.scores||[]).slice(0,4)));put('play',playRows(d.play));

// One rotating sponsor position on interior pages.
(function(){if(location.pathname==='/'||/index\.html$/.test(location.pathname))return;const hero=document.querySelector('.sport-hero')||document.querySelector('.submitintro')||document.querySelector('main .section');if(!hero)return;const ads=[{name:'Honey & Me Baking',copy:'Made with aloha on Maui · @honeyandmebaking',url:'https://www.instagram.com/honeyandmebaking/',cls:'honey'},{name:'Alakaʻina Consulting',copy:'Culturally grounded leadership, growth & community impact across Hawaiʻi.',url:'https://www.alakainaconsulting.com/',cls:'alakaina'}];let i=Math.floor(Date.now()/10000)%ads.length;const a=ads[i],el=document.createElement('a');el.className='sitewide-ad adcard '+a.cls;el.href=a.url;el.target='_blank';el.rel='noopener';el.innerHTML='<span class="adlabel">MYS Sponsor</span><div><b>'+a.name+'</b><span>'+a.copy+'</span></div><strong>Learn more →</strong>';hero.insertAdjacentElement('afterend',el)})();

/* v35 accessible mobile navigation */
(function(){
  function initMobileNavigation(){
    const button=document.querySelector('.mobile-menu-toggle');
    const nav=document.getElementById('main-site-navigation');
    if(!button||!nav||button.dataset.mysMenuReady==='1')return;
    button.dataset.mysMenuReady='1';
    function setOpen(open){
      nav.classList.toggle('is-open',open);
      button.setAttribute('aria-expanded',String(open));
      button.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu');
    }
    button.addEventListener('click',function(event){event.preventDefault();setOpen(!nav.classList.contains('is-open'));});
    nav.addEventListener('click',function(event){if(event.target.closest('a'))setOpen(false);});
    document.addEventListener('keydown',function(event){if(event.key==='Escape')setOpen(false);});
    window.addEventListener('resize',function(){if(window.innerWidth>850)setOpen(false);});
    window.addEventListener('pageshow',function(){setOpen(false);});
    setOpen(false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMobileNavigation);
  else initMobileNavigation();
})();
