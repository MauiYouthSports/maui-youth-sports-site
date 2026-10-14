document.getElementById('mysContactForm')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,st=document.getElementById('contactStatus'),btn=f.querySelector('button[type=submit]');btn.disabled=true;st.textContent='Sending…';try{await window.MYSForms.send(f,'contact');st.textContent='Mahalo. Your message was received by our form service.';f.reset();}catch(err){st.textContent=err.message;}finally{btn.disabled=false;}});

/* Contact mobile navigation */

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
