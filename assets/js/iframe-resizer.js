/**
 * iframe-resizer.js
 * Envía la altura del documento al parent (WordPress) por postMessage para evitar doble scroll.
 * Cada página (index, comparison, configurator) calcula y envía solo la altura de su propio contenido.
 * Solo se ejecuta cuando la página está dentro de un iframe.
 */
(function () {
  'use strict';

  if (window.self === window.top) {
    return;
  }

  document.documentElement.classList.add('inside-iframe');

  var DEBOUNCE_MS = 200;
  var MESSAGE_TYPE = 'iframe-resize';
  var resizeTimer = null;
  var lastSentHeight = 0;

  /** Identificador de esta página para que el parent sepa qué URL envió la altura */
  function getPageSource() {
    return (typeof window.location !== 'undefined' && window.location.pathname)
      ? window.location.pathname.replace(/^\//, '') || window.location.href
      : '';
  }

  /**
   * Calcula la altura del contenido de *esta* página.
   * - index.html: scrollHeight del documento.
   * - configurator.html: hasta el final de #faq (evita hueco por grid + sticky).
   * - comparison.html: hasta el final de #faq por consistencia.
   */
  function getHeight() {
    var doc = document.documentElement;
    var body = document.body;
    var scrollHeight = Math.max(
      doc.scrollHeight,
      body ? body.scrollHeight : 0
    );

    var faq = document.getElementById('faq');
    var scrollTop = window.pageYOffset || doc.scrollTop || 0;
    var buffer = 24;

    /* configurator.html: limitar al final real del contenido */
    if (document.getElementById('configurator-container') && faq) {
      var contentBottom = Math.ceil(faq.getBoundingClientRect().bottom + scrollTop);
      return Math.min(scrollHeight, contentBottom + buffer);
    }

    /* comparison.html: igual, usar final de #faq por si hay desfase */
    if (document.getElementById('comparison-container') && faq) {
      var bottom = Math.ceil(faq.getBoundingClientRect().bottom + scrollTop);
      return Math.min(scrollHeight, bottom + buffer);
    }

    /* index.html y resto: altura total del documento */
    return scrollHeight;
  }

  function sendHeight() {
    var height = getHeight();
    if (height === lastSentHeight) return;
    lastSentHeight = height;
    try {
      window.parent.postMessage({
        type: MESSAGE_TYPE,
        height: height,
        source: getPageSource()
      }, '*');
    } catch (e) {}
  }

  function onResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(sendHeight, DEBOUNCE_MS);
  }

  /** Varios envíos en el tiempo para que cada HTML reporte su propia altura tras contenido dinámico */
  function scheduleRecalcForThisPage() {
    sendHeight();
    setTimeout(sendHeight, 100);
    setTimeout(sendHeight, 400);
    setTimeout(sendHeight, 800);
    setTimeout(sendHeight, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleRecalcForThisPage);
  } else {
    scheduleRecalcForThisPage();
  }
  window.addEventListener('load', scheduleRecalcForThisPage);

  /* configurator: los módulos se pintan después de configLoaded */
  document.addEventListener('configLoaded', function () {
    setTimeout(sendHeight, 0);
    setTimeout(sendHeight, 300);
  });

  window.addEventListener('resize', onResize);

  if (typeof MutationObserver !== 'undefined' && document.body) {
    var observer = new MutationObserver(onResize);
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
