/* Stats blurbs for the Scores + Stats page.
   Scores Bot puts set scores and player lines in the sheet's notes field.
   Clean notes are shown as written. Review notes are not public copy, so only
   the sentences that already state set scores or player lines are shown. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MYSScoreStats = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var INTERNAL = /\bpublished score retained\b|\blink mismatch\b|\bhome\/away\b|\bunverified\b|\bawaiting\b|\bgap fill\b|\bduplicate\b|\bbruce\b|\bcorrected\b|\bonly in scores page\b|\bverified:|\bdate inferred\b|\brechecked\b|\bnot confirmed\b|\bone source only\b|\bscore corrected\b|\bneeds_research\b|\bconflict\b|\bnot in prior\b/i;
  var SKIP_SENTENCE = /\b(dropped set|different sets?|conflict|unverified|corrected|duplicate|mismatch|not published|not given|not available|no verified|awaiting|bruce)\b/i;
  var NO_STATS = /\bset scores? not (published|given|available|reported)\b|\bno set scores\b|\bsets? not (published|given|available)\b|\bno verified set scores\b/i;

  function normalize(notes) {
    return String(notes == null ? '' : notes).replace(/\s+/g, ' ').trim();
  }

  function hasSetScores(sentence) {
    return /\bsets?\b[^.]{0,40}\d{1,2}\s*[-–—]\s*\d{1,2}/i.test(sentence) || /\d{1,2}\s*[-–—]\s*\d{1,2}[^.]{0,12}\bsets?\b/i.test(sentence);
  }

  function hasPlayerLine(sentence) {
    return /\bplayer lines?\s*:/i.test(sentence) || /\b\d+\s+(rushing\s+|passing\s+)?(touchdowns?|tds?|yards|kills|aces|digs|assists|rebounds|goals)\b/i.test(sentence);
  }

  function isPublicStatSentence(sentence) {
    if (SKIP_SENTENCE.test(sentence)) return false;
    if (NO_STATS.test(sentence) && !hasSetScores(sentence)) return false;
    return hasSetScores(sentence) || hasPlayerLine(sentence);
  }

  function statsBlurb(notes) {
    var text = normalize(notes);
    if (!text) return '';
    if (!INTERNAL.test(text)) {
      if (NO_STATS.test(text) && !hasSetScores(text) && !hasPlayerLine(text)) return '';
      return text;
    }
    return text.split(/(?<=[.!])\s+/).filter(isPublicStatSentence).join(' ');
  }

  function sourceLabel(game) {
    var name = String((game && game.sourceName) || '').trim();
    var href = String((game && game.href) || '');
    if (/maxpreps/i.test(name) || /maxpreps\.com/i.test(href)) return 'MaxPreps';
    if (name) return name;
    return 'Final score';
  }

  function localHref(game) {
    var href = String((game && game.urlOnMYS) || '');
    return href.charAt(0) === '/' ? href : '';
  }

  function shouldShowSource(game, blurb) {
    var href = String((game && game.href) || '');
    if (!/^https?:\/\//i.test(href)) return false;
    if (!localHref(game)) return true;
    return Boolean(blurb);
  }

  function scoreCardSpec(game) {
    var stats = statsBlurb(game && game.notes);
    var showSource = shouldShowSource(game, stats);
    var local = localHref(game);
    return {
      tag: local && !stats && !showSource ? 'a' : 'article',
      stats: stats,
      showSource: showSource,
      sourceLabel: sourceLabel(game),
      sourceHref: showSource ? String(game.href || '') : '',
      localHref: local
    };
  }

  return { statsBlurb: statsBlurb, sourceLabel: sourceLabel, scoreCardSpec: scoreCardSpec };
});
