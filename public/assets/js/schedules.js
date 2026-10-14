(function(){
  var table=document.querySelector('.fixture-table');
  if(!table)return;
  var heads=[].map.call(table.querySelectorAll('thead th'),function(th){return th.textContent.trim();});
  [].forEach.call(table.querySelectorAll('tbody tr'),function(tr){
    [].forEach.call(tr.children,function(td,i){if(heads[i])td.setAttribute('data-label',heads[i]);});
    var status=tr.lastElementChild;
    if(status)status.innerHTML=status.innerHTML.replace(/\bfinal\b/g,'Final');
  });
  function hstToday(){
    var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Pacific/Honolulu',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    var p={};
    parts.forEach(function(x){p[x.type]=x.value;});
    return p.year+'-'+p.month+'-'+p.day;
  }
  var today=hstToday();
  var past=[].filter.call(table.querySelectorAll('tbody tr[data-fixture-date]'),function(tr){
    return tr.getAttribute('data-fixture-date')<today;
  });
  var showPast=false;
  var btn=document.createElement('button');
  btn.type='button';
  btn.className='schedule-toggle';
  function paint(){
    past.forEach(function(tr){tr.hidden=!showPast;});
    btn.textContent=showPast?'Hide past results':'Show past results';
    btn.setAttribute('aria-pressed',String(showPast));
  }
  btn.addEventListener('click',function(){showPast=!showPast;paint();});
  var scroll=table.closest('.fixture-scroll')||table;
  scroll.parentNode.insertBefore(btn,scroll);
  paint();
})();
