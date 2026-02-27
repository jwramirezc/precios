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

    // Read preset data attributes attached by plans-renderer.js
    var ctaUsers   = planEl ? (planEl.dataset.ctaUsers   || '') : '';
    var ctaStorage = planEl ? (planEl.dataset.ctaStorage || '') : '';
    var ctaModules = planEl ? (planEl.dataset.ctaModules || '') : '';
    var priceUsd   = planEl ? (planEl.dataset.ctaPriceUsd || '') : '';

    // Currency: read global from plans-renderer.js, default COP
    var currency = (typeof currentCurrency !== 'undefined' ? currentCurrency : null) || 'COP';

    // Compute display price in selected currency
    var price = '';
    if (priceUsd !== '') {
      var numPrice = parseFloat(priceUsd);
      if (!isNaN(numPrice)) {
        var rate = (typeof PRICING_CONFIG !== 'undefined' && PRICING_CONFIG && PRICING_CONFIG.exchangeRate)
          ? PRICING_CONFIG.exchangeRate : 1;
        price = currency === 'COP' ? String(Math.round(numPrice * rate)) : String(numPrice);
      }
    }

    var params = {
      origin:           btn.dataset.origin || '',
      cta:              btn.dataset.cta    || '',
      selected_plan:    plan               || undefined,
      users:            ctaUsers           || undefined,
      storage_gb:       ctaStorage         || undefined,
      currency:         currency           || undefined,
      price_estimated:  price              || undefined,
      selected_modules: ctaModules         || undefined,
      page_url:         window.location.href
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
    var selPlan    = (document.getElementById('saia-selected-plan')    || {}).value || '';

    // Validate: at least 1 module must be selected.
    // Double-check via DOM (.module-item.selected) in case the hidden input
    // was not yet synced (WordPress timing issues).
    var domSelected = document.querySelectorAll('.module-item.selected').length;
    var hasModules  = modules.length > 0 && domSelected > 0;

    var errEl = document.getElementById('cta-no-modules-error');
    if (!hasModules) {
      e.stopImmediatePropagation();
      if (errEl) errEl.style.display = 'block';
      try { btn.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
      return;
    }
    if (errEl) errEl.style.display = 'none';

    var params = {
      origin:           btn.dataset.origin || 'configurador',
      cta:              btn.dataset.cta    || 'cotizacion_24h',
      selected_plan:    selPlan            || undefined,
      users:            sanitizeNumber(rawUsers)   || undefined,
      storage_gb:       sanitizeNumber(rawStorage) || undefined,
      currency:         currency                   || undefined,
      price_estimated:  sanitizeNumber(rawPrice)   || undefined,
      selected_modules: modules                    || undefined,
      page_url:         window.location.href
    };

    window.location.href = buildUrl(params);
  }, true);

})();
