# Integración en WordPress vía iframe

Esta app ya incluye el script **iframe-resizer.js**, que envía la altura del documento al padre con `postMessage`. Para evitar doble scroll y que solo se vea la barra de scroll de WordPress, integra así en la página de WordPress.

---

## 1. En la página WordPress (parent)

### HTML del iframe

Usa un contenedor y el iframe con **sin scroll interno** y **100% de ancho**:

```html
<div class="precios-iframe-wrapper" style="width: 100%; overflow: hidden;">
  <iframe
    id="precios-iframe"
    src="https://tu-dominio.com/ruta-a/index.html"
    title="Planes y Precios"
    scrolling="no"
    style="width: 100%; height: 800px; border: 0; display: block;"
  ></iframe>
</div>
```

- `scrolling="no"`: evita la barra de scroll dentro del iframe.
- `width: 100%`: el iframe ocupa todo el ancho del contenedor.
- La altura inicial (`800px` o la que quieras) se irá actualizando por JavaScript.

### JavaScript en WordPress (recibir altura y posicionar al inicio)

Cada página (index.html, comparison.html, configurator.html) calcula y envía **solo la altura de su propio contenido**. Al cargar o al navegar a otra de esas páginas, la app pide al parent que **muestre el inicio del iframe** (`iframe-scroll-to-top`) para no quedar “en la mitad”.

```javascript
(function () {
  var iframe = document.getElementById('precios-iframe');
  if (!iframe) return;

  function onMessage(event) {
    var d = event.data;
    if (!d) return;

    if (d.type === 'iframe-resize' && typeof d.height === 'number') {
      iframe.style.height = d.height + 'px';
    }
    if (d.type === 'iframe-scroll-to-top') {
      iframe.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  window.addEventListener('message', onMessage);
})();
```

Para más seguridad, comprueba el origen antes de aplicar altura o scroll:

```javascript
var ALLOWED_ORIGIN = 'https://tu-dominio.com'; // Origen donde está la app

function onMessage(event) {
  if (event.origin !== ALLOWED_ORIGIN) return;
  var d = event.data;
  if (!d) return;
  if (d.type === 'iframe-resize' && typeof d.height === 'number') {
    iframe.style.height = d.height + 'px';
  }
  if (d.type === 'iframe-scroll-to-top') {
    iframe.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
```

Así solo se aceptan mensajes del mismo dominio que sirve la app.

---

## 2. CSS opcional (WordPress)

Para que el contenedor sea responsive y el iframe siga ocupando el 100% del ancho en móviles:

```css
.precios-iframe-wrapper {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  margin: 0 auto;
}

.precios-iframe-wrapper iframe {
  width: 100% !important;
  min-height: 400px;
  border: 0;
  display: block;
}
```

Puedes añadir esta clase al contenedor y usar el ID/class del iframe que prefieras.

---

## 3. Contenido de la app (este proyecto)

- **Script hijo**: en `index.html`, `configurator.html` y `comparison.html` ya se carga `assets/js/iframe-resizer.js` como último script.
- Ese script solo actúa cuando la página se ve dentro de un iframe (`window.self !== window.top`).
- Envía mensajes con `type: 'iframe-resize'` y `height` (número) en los eventos **load** y **resize**, y cuando cambia el DOM (MutationObserver), con un pequeño debounce en resize para no saturar.

No hace falta ningún cambio de CSP ni cargar librerías externas; todo es JS y `postMessage` estándar.

---

## 4. CSS opcional en este proyecto (responsive / full width dentro del iframe)

Cuando la app se carga dentro de un iframe, el script añade la clase `inside-iframe` al `<html>`. En `assets/css/styles.css` hay un bloque al final que evita scroll horizontal y ajusta el body dentro del iframe:

```css
.inside-iframe { overflow-x: hidden; }
.inside-iframe body { overflow-x: hidden; min-height: 100%; }
```

Si quieres que el contenido use todo el ancho del iframe (sin márgenes del contenedor), puedes ampliar ese bloque, por ejemplo:

```css
.inside-iframe .container { max-width: 100%; }
```
