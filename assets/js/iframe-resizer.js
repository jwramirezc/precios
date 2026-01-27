/**
 * iframe-resizer.js
 * Envía la altura del documento al parent (WordPress) por postMessage para evitar doble scroll.
 * Solo se ejecuta cuando la página está dentro de un iframe.
 * Uso: cargar como último script antes de </body>.
 */
(function () {
  'use strict';

  if (window.self === window.top) {
    return; /* No estamos en un iframe: no hacer nada */
  }

  document.documentElement.classList.add('inside-iframe');

  var DEBOUNCE_MS = 200;
  var MESSAGE_TYPE = 'iframe-resize';
  var resizeTimer = null;
  var lastSentHeight = 0;

  /**
   * Usar solo scrollHeight (altura real del contenido).
   * Evitar offsetHeight para que el tamaño del iframe no influya en el cálculo
   * y no se produzca bucle: iframe crece → body/html se estiran → reportamos más → iframe crece...
   * En configurator el grid + sticky sidebar pueden inflar scrollHeight; usamos el final de #faq.
   */
  function getHeight() {
    var doc = document.documentElement;
    var body = document.body;
    var scrollHeight = Math.max(
      doc.scrollHeight,
      body ? body.scrollHeight : 0
    );

    /* configurator.html: limitar a la base real del contenido para evitar espacio en blanco.
       El grid + aside sticky a veces hace que scrollHeight sea mayor que lo visible. */
    var configurator = document.getElementById('configurator-container');
    var faq = document.getElementById('faq');
    if (configurator && faq) {
      var scrollTop = window.pageYOffset || doc.scrollTop || 0;
      var contentBottom = Math.ceil(faq.getBoundingClientRect().bottom + scrollTop);
      var buffer = 24;
      return Math.min(scrollHeight, contentBottom + buffer);
    }

    return scrollHeight;
  }

  function sendHeight() {
    var height = getHeight();
    if (height === lastSentHeight) return;
    lastSentHeight = height;
    try {
      window.parent.postMessage({ type: MESSAGE_TYPE, height: height }, '*');
    } catch (e) {
      /* postMessage fallido (ej. cross-origin): ignorar sin romper la página */
    }
  }

  function onResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(sendHeight, DEBOUNCE_MS);
  }

  /* load: enviar altura al cargar la página */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sendHeight);
  } else {
    sendHeight();
  }
  window.addEventListener('load', function () {
    sendHeight();
    /* En configurator los módulos se inyectan tras el fetch (configLoaded).
       Recálculos retardados para capturar contenido que se renderiza después. */
    setTimeout(sendHeight, 400);
    setTimeout(sendHeight, 1000);
  });

  /* configurator.html: los módulos y el resto del contenido se dibujan después de configLoaded.
     Recalcular en el siguiente tick para que el DOM ya esté actualizado. */
  document.addEventListener('configLoaded', function () {
    setTimeout(sendHeight, 0);
    setTimeout(sendHeight, 300);
  });

  /* resize: reenviar altura cuando cambie el tamaño (debounce) */
  window.addEventListener('resize', onResize);

  /* Recalcular cuando se añadan/quiten nodos (contenido dinámico). Sin attributes
     para evitar que cambios de estilo al redimensionar generen bucles. */
  if (typeof MutationObserver !== 'undefined' && document.body) {
    var observer = new MutationObserver(onResize);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
