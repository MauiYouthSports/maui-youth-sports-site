(function () {
  'use strict';
  var form = document.getElementById('scoreSubmitForm');
  if (!form) return;
  var status = document.getElementById('scoreSubmitStatus');
  var button = document.getElementById('scoreSubmitButton');
  var widgetId = null;
  var sitekey = (form.getAttribute('data-turnstile-sitekey') || '').trim();
  var slot = document.getElementById('score-turnstile');
  if (!sitekey) {
    if (slot) slot.remove();
  } else {
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'score-turnstile';
      form.insertBefore(slot, document.getElementById('scoreSubmitButton'));
    }
    var script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = function () {
      if (!window.turnstile) return;
      widgetId = window.turnstile.render(slot, { sitekey: sitekey, action: 'score' });
    };
    document.head.appendChild(script);
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    status.className = 'submitstatus';
    status.textContent = 'Sending…';
    button.disabled = true;
    var data = new FormData(form);
    fetch('/api/score', { method: 'POST', headers: { Accept: 'application/json' }, body: data })
      .then(function (response) {
        return response.json().catch(function () { return null; }).then(function (body) {
          if (!response.ok || !body || body.ok !== true) throw Error((body && body.error) || 'Your score didn’t send.');
          status.className = 'submitstatus success';
          status.textContent = "Mahalo! We'll check it and post it soon.";
          form.reset();
          if (window.turnstile && widgetId != null) window.turnstile.reset(widgetId);
          button.disabled = false;
        });
      })
      .catch(function (error) {
        status.className = 'submitstatus error';
        status.textContent = (error.message || 'Your score didn’t send.') + ' Please try again.';
        button.disabled = false;
        if (window.turnstile && widgetId != null) window.turnstile.reset(widgetId);
      });
  });
})();
