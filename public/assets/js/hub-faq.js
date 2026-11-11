/* Emits FAQPage JSON-LD only when a hub has visible FAQ questions. */
(function () {
  'use strict';
  var root = document.querySelector('[data-faq]');
  if (!root || root.hidden) return;
  var questions = [].slice.call(root.querySelectorAll('[data-faq-q]')).filter(function (el) {
    return el.offsetParent !== null || root.offsetParent !== null;
  });
  var entities = questions.map(function (q) {
    var id = q.getAttribute('data-faq-a');
    var answer = id ? document.getElementById(id) : q.nextElementSibling;
    var name = (q.textContent || '').replace(/\s+/g, ' ').trim();
    var text = answer ? (answer.textContent || '').replace(/\s+/g, ' ').trim() : '';
    if (!name || !text) return null;
    return { '@type': 'Question', name: name, acceptedAnswer: { '@type': 'Answer', text: text } };
  }).filter(Boolean);
  if (!entities.length) return;
  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: entities });
  document.head.appendChild(script);
})();
