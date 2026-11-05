/* Header search. Pagefind's interface loads only after the box is used. */
(function(){
  var input=document.getElementById('mys-search');
  if(!input||input.dataset.mysSearch==='1')return;
  input.dataset.mysSearch='1';
  var form=input.form;
  var panel=document.createElement('div');
  panel.id='mys-search-panel';
  panel.className='site-search-ui';
  panel.hidden=true;
  form.appendChild(panel);
  var started=false;
  function boot(){
    if(started)return;
    started=true;
    var css=document.createElement('link');
    css.rel='stylesheet';
    css.href='/pagefind/pagefind-ui.css';
    document.head.appendChild(css);
    var fix=document.createElement('style');
    fix.textContent='.site-search .pagefind-ui__search-input.site-search-input{height:auto;padding:8px 10px;background:#16313b;color:#fff;border:1px solid #6a858d;border-radius:9px;font-size:14px;font-weight:700}.site-search .pagefind-ui__form:before,.site-search .pagefind-ui__search-clear{display:none}.site-search .pagefind-ui__drawer{position:absolute;z-index:40;top:calc(100% + 8px);right:0;left:auto;display:block;width:min(24rem,calc(100vw - 28px));max-height:min(70vh,28rem);overflow:auto;gap:0;background:#fffdf8;color:#10252e;border:1px solid #d9d2c4;border-radius:12px;box-shadow:0 8px 25px #0003;text-align:left;padding:8px}.site-search .pagefind-ui__results-area{min-width:0;margin-top:0}.site-search .pagefind-ui__result{padding:8px 4px;gap:8px}.site-search .pagefind-ui__result-inner{padding:0}';
    document.head.appendChild(fix);
    var script=document.createElement('script');
    script.src='/pagefind/pagefind-ui.js';
    script.onload=function(){
      var term=input.value;
      panel.hidden=false;
      new window.PagefindUI({
        element:'#mys-search-panel',
        showImages:false,
        showSubResults:false,
        autofocus:true,
        resetStyles:false
      });
      var ui=panel.querySelector('input');
      if(!ui)return;
      ui.id='mys-search-ui';
      ui.setAttribute('aria-label','Search');
      ui.setAttribute('enterkeyhint','search');
      ui.classList.add('site-search-input');
      var label=form.querySelector('label');
      if(label)label.setAttribute('for',ui.id);
      if(term){
        ui.value=term;
        ui.dispatchEvent(new Event('input',{bubbles:true}));
      }
      input.tabIndex=-1;
      input.setAttribute('aria-hidden','true');
      input.hidden=true;
      ui.focus();
    };
    script.onerror=function(){started=false;};
    document.head.appendChild(script);
  }
  input.addEventListener('focus',boot);
  input.addEventListener('click',boot);
  form.addEventListener('submit',function(event){event.preventDefault();boot();});
})();
