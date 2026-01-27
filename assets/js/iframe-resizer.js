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

  var DEBOUNCE_MS = 150;
  var MESSAGE_TYPE = 'iframe-resize';
  var resizeTimer = null;

  function getHeight() {
    return Math.max(
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
      document.body ? document.body.scrollHeight : 0,
      document.body ? document.body.offsetHeight : 0
    );
  }

  function sendHeight() {
    var height = getHeight();
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
  window.addEventListener('load', sendHeight);

  /* resize: reenviar altura cuando cambie el tamaño (debounce) */
  window.addEventListener('resize', onResize);

  /* Recalcular cuando el DOM cambie (contenido dinámico / SPA-like) */
  if (typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(onResize);
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
})();
