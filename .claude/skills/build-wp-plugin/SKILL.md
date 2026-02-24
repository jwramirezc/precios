---
name: build-wp-plugin
description: Sincroniza los archivos del proyecto al plugin de WordPress, incrementa la versión, valida la integridad, genera el ZIP e imprime el checklist QA. Usar cuando se quiera empaquetar una nueva versión del plugin.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
argument-hint: "[version]  — opcional, ej: 3.6.6. Si se omite, se incrementa el patch automáticamente."
---

# Build WordPress Plugin — SAIA Pricing Configurator

Eres el ingeniero de release de este proyecto. Tu objetivo es empaquetar el plugin de WordPress
con la versión correcta, sin romper nada, listo para instalar en un tema de WordPress.

## Contexto del proyecto

- Directorio raíz: detectar con `git rev-parse --show-toplevel`
- Carpeta del plugin: `<raíz>/saia-pricing-configurator/`
- Archivos exclusivos del plugin (NO sobreescribir desde el proyecto raíz):
  - `assets/js/saia-wp-bridge.js`
  - `assets/css/wp-scoped.css`
  - `saia-pricing-configurator.php` (solo actualizar la versión)
- Fuente de verdad siempre es el proyecto raíz (`assets/`, `*.html`)

## Pasos obligatorios — ejecutar en orden

### 1. Detectar la raíz del proyecto
```bash
ROOT=$(git rev-parse --show-toplevel)
PLUGIN="$ROOT/saia-pricing-configurator"
```

### 2. Detectar qué archivos cambiaron desde el último sync del plugin

Buscar el último commit de tipo `chore: sincronizar plugin` con:
```bash
LAST_SYNC=$(git log --oneline | grep "sincronizar plugin" | head -1 | awk '{print $1}')
git diff $LAST_SYNC HEAD --name-only | grep "^assets/\|^configurator\|^index\|^comparison" | grep -v "saia-pricing-configurator/"
```

Mostrar al usuario la lista de archivos a sincronizar antes de continuar.

### 3. Calcular la nueva versión

Si el usuario pasó un argumento (`$ARGUMENTS`), usarlo como nueva versión.
Si no, leer la versión actual del PHP y hacer **patch bump** automático:
```bash
CURRENT=$(grep "define('SAIA_VER'" "$PLUGIN/saia-pricing-configurator.php" | grep -o "'[0-9.]*'" | tr -d "'")
# Incrementar el último número: 3.6.5 → 3.6.6
NEW_VER=$(echo "$CURRENT" | awk -F. '{print $1"."$2"."$3+1}')
```

Mostrar al usuario: "Versión actual: X.X.X → Nueva versión: X.X.X" y confirmar antes de continuar.

### 4. Sincronizar archivos del proyecto raíz al plugin

Copiar SOLO los archivos que cambiaron (detectados en el paso 2), excluyendo siempre:
- `saia-wp-bridge.js`
- `wp-scoped.css`
- `saia-pricing-configurator.php`

Ejemplo de copia segura:
```bash
# CSS
cp "$ROOT/assets/css/styles.css" "$PLUGIN/assets/css/styles.css"
# JS (nunca sobreescribir saia-wp-bridge.js)
for f in "$ROOT/assets/js/"*.js; do
  fname=$(basename "$f")
  [ "$fname" = "saia-wp-bridge.js" ] && continue
  cp "$f" "$PLUGIN/assets/js/$fname"
done
# Data
cp "$ROOT/assets/data/"*.json "$PLUGIN/assets/data/"
# HTML
for page in index configurator comparison; do
  [ -f "$ROOT/$page.html" ] && cp "$ROOT/$page.html" "$PLUGIN/$page.html"
done
```

### 5. Actualizar la versión en el PHP

Actualizar ambas ocurrencias: el header del plugin y la constante `SAIA_VER`:
```bash
sed -i '' "s/ \* Version: .*/ * Version: $NEW_VER/" "$PLUGIN/saia-pricing-configurator.php"
sed -i '' "s/define('SAIA_VER', '.*')/define('SAIA_VER', '$NEW_VER')/" "$PLUGIN/saia-pricing-configurator.php"
```

Verificar con `grep "Version\|SAIA_VER" ...`.

### 6. Validar integridad completa del plugin

Ejecutar todas las validaciones y mostrar los resultados:

**6a. Todos los JSON son válidos:**
```bash
for f in "$PLUGIN/assets/data/"*.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" && echo "  ✓ $(basename $f)" || echo "  ✗ ERROR: $(basename $f)"
done
```

**6b. Archivos exclusivos del plugin intactos:**
```bash
[ -f "$PLUGIN/assets/js/saia-wp-bridge.js" ] && echo "  ✓ saia-wp-bridge.js" || echo "  ✗ FALTA saia-wp-bridge.js"
[ -f "$PLUGIN/assets/css/wp-scoped.css" ]    && echo "  ✓ wp-scoped.css"      || echo "  ✗ FALTA wp-scoped.css"
```

**6c. Los 3 HTML están presentes:**
```bash
for page in index configurator comparison; do
  [ -f "$PLUGIN/$page.html" ] && echo "  ✓ $page.html" || echo "  ✗ FALTA $page.html"
done
```

**6d. Verificar quantity_config y bloques (feature clave v3.6.5+):**
```bash
node -e "
const m = JSON.parse(require('fs').readFileSync('$PLUGIN/assets/data/modules-data.json','utf8'));
const qty = m.filter(x=>x.quantity_config);
qty.length > 0 ? qty.forEach(x=>console.log('  ✓ quantity_config:', x.id)) : console.log('  ✗ Sin módulos con quantity_config');
const p = JSON.parse(require('fs').readFileSync('$PLUGIN/assets/data/module-pricing.json','utf8'));
['firma_certificada_blocks','email_certificado_blocks'].forEach(k=>
  p[k] ? console.log('  ✓ bloque:', k, p[k].blocks.length, 'rangos') : console.log('  ✗ FALTA bloque:', k)
);
"
```

**6e. Verificar includedQuantities en presets:**
```bash
node -e "
const c = JSON.parse(require('fs').readFileSync('$PLUGIN/assets/data/pricing-config.json','utf8'));
c.configurationPresets.forEach(p=>console.log('  ✓', p.id, '→ includedQuantities:', JSON.stringify(p.includedQuantities || {})));
"
```

Si alguna validación falla con ✗, **detener el proceso** y reportar el problema al usuario.

### 7. Generar el ZIP

```bash
ZIP_NAME="saia-pricing-configurator-v${NEW_VER}.zip"
cd "$ROOT"
zip -r "$ZIP_NAME" "saia-pricing-configurator/" \
  --exclude "*/.DS_Store" \
  --exclude "__MACOSX/*"
ls -lh "$ZIP_NAME"
```

### 8. Commit con todos los cambios

```bash
git add "$PLUGIN/" "$ROOT/$ZIP_NAME"
git commit -m "chore: sincronizar plugin y generar ZIP v${NEW_VER}

[listar aquí los cambios incluidos en esta versión]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

El mensaje del commit debe listar brevemente los cambios reales incluidos
(leer los commits del proyecto desde $LAST_SYNC para construirlo).

### 9. Mostrar resumen final

Imprimir un resumen en formato tabla:

```
✅ Plugin v{NEW_VER} generado exitosamente

Archivo : saia-pricing-configurator-v{NEW_VER}.zip
Tamaño  : {size}
Commit  : {hash}

Archivos sincronizados:
  • {lista de archivos copiados}

Shortcodes disponibles:
  [saia_planes]       → página de planes
  [saia_configurator] → configurador
  [saia_comparison]   → tabla comparativa

Instalación: WordPress → Plugins → Añadir nuevo → Subir plugin → Activar
```

## Reglas de seguridad

- NUNCA sobreescribir `saia-wp-bridge.js` ni `wp-scoped.css`
- NUNCA generar el ZIP si alguna validación del paso 6 falló
- NUNCA hacer commit si el ZIP no se generó correctamente
- Si el usuario pasa una versión menor a la actual, advertir y pedir confirmación
- Si hay cambios sin commitear en el proyecto raíz, advertir antes de sincronizar
