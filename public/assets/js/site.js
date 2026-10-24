const d=window.MYS_DATA||{};
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function infoRows(items){return (items||[]).map(x=>`<div class="row"><span class="pill">${esc(x.tag||x.sport)}</span><b class="rowtitle">${esc(x.title)}</b><div class="rowtext">${esc(x.text)}</div>${x.href?`<a class="sourcebtn" href="${esc(x.href)}" ${x.internal?'':'target="_blank" rel="noopener"'}>${x.internal?'Read on MYS →':'Details →'}</a>`:''}</div>`).join('')}
function scoreRows(items){return (items||[]).map(x=>`<a class="scorecard game-scorecard" href="${esc(x.urlOnMYS)}" aria-label="${esc(x.away+' '+x.awayScore+', '+x.home+' '+x.homeScore+' — '+x.sport+', '+x.dateISO+' final')}"><div class="scorehead"><span class="pill">${esc(x.sport)}</span><span class="scoredate">${esc(x.date)} · ${esc(x.status)}</span></div><div class="scoreline"><span>${esc(x.away)}</span><strong>${esc(x.awayScore)}</strong></div><div class="scoreline"><span>${esc(x.home)}</span><strong>${esc(x.homeScore)}</strong></div></a>`).join('')}
function playRows(items){return (items||[]).map(x=>`<a class="playitem pictocard" href="${esc(x.href)}" aria-label="${esc(x.sport)}">${x.icon?`<img src="/assets/pictographs/${esc(x.icon)}.webp" alt="${esc(x.sport)}" width="240" height="240" loading="lazy" decoding="async">`:`<span class="sport-text-tile">${esc(x.sport)}</span>`}</a>`).join('')}
const put=(id,html)=>{const el=document.getElementById(id);if(el)el.innerHTML=html};
put('play',playRows(d.play));

// Sponsors sit below the main content on sport, directory, and schedule pages.
// Other interior pages keep one rotating sponsor.
(function(){
  function normPath(){
    var p=location.pathname;
    if(/\/index\.html$/.test(p))p=p.slice(0,-10);
    if(p.charAt(p.length-1)!=='/')p+='/';
    return p;
  }
  var path=normPath();
  if(path==='/')return;
  var main=document.querySelector('main');
  if(!main)return;
  var listed=path==='/schedules/'||path.indexOf('/sports/')===0||path.indexOf('/sports-directory/')===0;
  if(listed){
    if(path.indexOf('/sports/')===0||path.indexOf('/sports-directory/')===0){
      var actions=document.createElement('div');
      actions.className='page-actions';
      actions.innerHTML='<a class="action-btn" href="/submit/?type=organization">List your program</a><a class="action-btn" href="/submit/?type=score">Send a score</a>';
      var spot=main.querySelector('.sportnav')||main.querySelector('.p-detail-intro')||main.querySelector('h1');
      if(spot)spot.insertAdjacentElement('afterend',actions);
      else main.insertBefore(actions,main.firstChild);
    }
    var row=document.createElement('section');
    row.className='sponsor-row';
    row.setAttribute('aria-label','Sponsors');
    [{name:'Honey & Me Baking',copy:'Made with aloha on Maui · @honeyandmebaking',url:'https://www.instagram.com/honeyandmebaking/',cls:'honey',img:'/assets/brand/honey-me-mochi-2x.webp',alt:'Brownie-stuffed mochi from Honey & Me Baking'},{name:'Alakaʻina Consulting',copy:'Culturally grounded leadership, growth & community impact across Hawaiʻi.',url:'https://www.alakainaconsulting.com/',cls:'alakaina',img:'/assets/brand/alakaina-consulting-2x.webp',alt:'Alakaʻina Consulting Hawaiʻi'}].forEach(function(a){
      var link=document.createElement('a');
      link.className='sponsor-mini '+a.cls;
      link.href=a.url;link.target='_blank';link.rel='noopener';
      var img=document.createElement('img');img.src=a.img;img.alt=a.alt;img.width=72;img.height=48;img.loading='lazy';img.decoding='async';
      var text=document.createElement('span');
      var b=document.createElement('b');b.textContent=a.name;
      var c=document.createElement('span');c.textContent=a.copy;
      text.append(b,c);link.append(img,text);row.append(link);
    });
    main.appendChild(row);
    return;
  }
  var hero=document.querySelector('.sport-hero')||document.querySelector('.submitintro')||document.querySelector('main .section');
  if(!hero)return;
  var ads=[{name:'Honey & Me Baking',copy:'Made with aloha on Maui · @honeyandmebaking',url:'https://www.instagram.com/honeyandmebaking/',cls:'honey'},{name:'Alakaʻina Consulting',copy:'Culturally grounded leadership, growth & community impact across Hawaiʻi.',url:'https://www.alakainaconsulting.com/',cls:'alakaina'}];
  var a=ads[Math.floor(Date.now()/10000)%ads.length],el=document.createElement('a');
  el.className='sitewide-ad adcard '+a.cls;el.href=a.url;el.target='_blank';el.rel='noopener';
  el.innerHTML='<span class="adlabel">MYS Sponsor</span><div><b>'+a.name+'</b><span>'+a.copy+'</span></div><strong>Learn more →</strong>';
  hero.insertAdjacentElement('afterend',el);
})();

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
