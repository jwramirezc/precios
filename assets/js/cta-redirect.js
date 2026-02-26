/**
 * SAIA CTA Redirect
 * Intercepts clicks on .saia-cta (plans/home) and .saia-cta-config (configurator),
 * builds a redirect URL with querystring params for /registro/.
 */
(function () {
  'use strict';

  var REGISTRO_URL = 'https://www.saiasoftware.com/registro/';

  /** Strip everything except digits */
  function sanitizeNumber(str) {
    if (str == null) return '';
    return String(str).replace(/\D/g, '');
  }

  /** Build destination URL; omit params that are null/undefined/empty string */
  function buildUrl(params) {
    var url = new URL(REGISTRO_URL);
    Object.entries(params).forEach(function (entry) {
      var key = entry[0], val = entry[1];
      if (val !== null && val !== undefined && val !== '') {
        url.searchParams.set(key, val);
      }
    });
    return url.toString();
  }

  /** Plans / Home CTA — event delegation (capture phase) */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.saia-cta');
    if (!btn) return;

    e.preventDefault();

    // Plan: from button itself or closest ancestor with data-plan
    var planEl = btn.dataset.plan ? btn : btn.closest('[data-plan]');
    var plan = planEl ? planEl.dataset.plan : '';

    var params = {
      origin:   btn.dataset.origin || '',
      cta:      btn.dataset.cta    || '',
      plan:     plan               || undefined,
      page_url: window.location.href,
      ts:       new Date().toISOString()
    };

    window.location.href = buildUrl(params);
  }, true);

  /** Configurator CTA — event delegation (capture phase) */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.saia-cta-config');
    if (!btn) return;

    e.preventDefault();

    var rawUsers   = (document.getElementById('saia-users')            || {}).value || '';
    var rawStorage = (document.getElementById('saia-storage-gb')       || {}).value || '';
    var rawPrice   = (document.getElementById('saia-price-estimated')  || {}).value || '';
    var currency   = (document.getElementById('saia-currency')         || {}).value || '';
    var modules    = (document.getElementById('saia-selected-modules') || {}).value || '';

    var params = {
      origin:           btn.dataset.origin || 'configurador',
      cta:              btn.dataset.cta    || 'cotizacion_24h',
      users:            sanitizeNumber(rawUsers)   || undefined,
      storage_gb:       sanitizeNumber(rawStorage) || undefined,
      currency:         currency                   || undefined,
      price_estimated:  sanitizeNumber(rawPrice)   || undefined,
      selected_modules: modules                    || undefined,
      page_url:         window.location.href,
      ts:               new Date().toISOString()
    };

    window.location.href = buildUrl(params);
  }, true);

})();
