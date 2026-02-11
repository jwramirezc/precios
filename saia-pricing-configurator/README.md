# SAIA Pricing Configurator - Plugin de WordPress

Configurador de precios interactivo para SAIA Software con módulos personalizables, planes predefinidos y tabla de comparación.

## 📋 Descripción

Este plugin permite a los usuarios de WordPress integrar fácilmente el configurador de precios de SAIA Software en cualquier página o entrada mediante shortcodes. El configurador es completamente funcional, basado en datos JSON configurables, y diseñado siguiendo las mejores prácticas de WordPress.

## ✨ Características

- ✅ **3 Shortcodes disponibles**: Configurador personalizado, Planes predefinidos, Tabla de comparación
- ✅ **100% Configurable con JSON**: Todos los precios, módulos y textos en archivos JSON editables
- ✅ **Programación Orientada a Objetos**: PHP y JavaScript organizados en clases
- ✅ **Compatible con WordPress**: Sin conflictos globales, carga condicional
- ✅ **Responsive**: Diseño adaptable a móviles y tablets
- ✅ **Multilenguaje**: Preparado para traducciones con .po/.mo
- ✅ **Bootstrap 5 y Font Awesome**: Incluidos automáticamente

## 📦 Instalación

### Método 1: Desde el panel de WordPress

1. Descarga el archivo `saia-pricing-configurator.zip`
2. Ve a **Plugins → Añadir nuevo** en tu panel de WordPress
3. Haz clic en **Subir plugin**
4. Selecciona el archivo ZIP y haz clic en **Instalar ahora**
5. Activa el plugin

### Método 2: Instalación manual (FTP)

1. Descomprime el archivo `saia-pricing-configurator.zip`
2. Sube la carpeta `saia-pricing-configurator` a `/wp-content/plugins/`
3. Activa el plugin desde el panel de WordPress

## 🚀 Uso

### Shortcodes disponibles

#### 1. Configurador Personalizado
```
[saia_configurator]
```

Atributos opcionales:
```
[saia_configurator currency="COP" billing="monthly"]
```

- `currency`: "COP" o "USD" (por defecto: "COP")
- `billing`: "monthly" o "annual" (por defecto: "monthly")

#### 2. Planes Predefinidos
```
[saia_plans]
```

Atributos opcionales:
```
[saia_plans currency="USD" show_reasons="true"]
```

- `show_reasons`: "true" o "false" - Mostrar sección de beneficios (por defecto: "true")

#### 3. Tabla de Comparación
```
[saia_comparison]
```

Atributos opcionales:
```
[saia_comparison show_header="true"]
```

- `show_header`: "true" o "false" - Mostrar encabezado de sección

### Ejemplos de uso

**En una página:**
```
<h1>Nuestros Planes</h1>
[saia_plans]

<h2>O configura tu plan personalizado</h2>
[saia_configurator]
```

**En Gutenberg:**
- Agrega un bloque de "Shortcode"
- Pega el shortcode deseado

## ⚙️ Configuración

### Archivos JSON configurables

Todos los archivos de configuración están en `assets/data/`:

| Archivo | Descripción |
|---------|-------------|
| `pricing-config.json` | Precios base, tarifas por usuario, almacenamiento |
| `modules-data.json` | Definición de módulos disponibles |
| `plans-config.json` | Planes predefinidos (Básico, Profesional, Empresarial) |
| `categories-config.json` | Categorías de módulos |
| `general-config.json` | Enlaces externos (demos, contacto) |
| `configurator-texts.json` | Textos de interfaz del configurador |
| `faq.json` | Preguntas frecuentes |
| `tooltips-config.json` | Textos de ayuda |
| `comparison-config.json` | Datos de tabla de comparación |

### Editar precios

1. Accede a `/wp-content/plugins/saia-pricing-configurator/assets/data/`
2. Edita `pricing-config.json` con tu editor favorito
3. Guarda los cambios
4. Recarga la página para ver los cambios

### Agregar módulos

1. Edita `modules-data.json`
2. Agrega un nuevo objeto con la estructura:
```json
{
  "id": "mi_modulo",
  "name": "Mi Módulo",
  "description": "Descripción del módulo",
  "icon": "fa-icon-name",
  "calculable": true,
  "pricing_tier": "tier_standard",
  "category": "gestion_documental"
}
```

## 🎨 Personalización de estilos

El plugin usa variables CSS que puedes sobrescribir en tu tema:

```css
:root {
  --primary: #0d85e8;        /* Color principal */
  --primary-hover: #0a6bc1;  /* Color hover */
  --accent: #10b981;         /* Color de acento */
}
```

Agrega esto en **Apariencia → Personalizar → CSS Adicional**

## 🔧 Requisitos

- WordPress 5.0 o superior
- PHP 7.2 o superior
- Navegadores modernos (Chrome, Firefox, Safari, Edge)

## 📝 Compatibilidad

- ✅ Compatible con cualquier tema de WordPress
- ✅ Compatible con Gutenberg y editores clásicos
- ✅ Compatible con WooCommerce
- ✅ Compatible con WPML/Polylang (multilenguaje)
- ✅ No usa jQuery (vanilla JavaScript)

## 🐛 Solución de problemas

### El configurador no se muestra

1. Verifica que el shortcode esté escrito correctamente
2. Asegúrate de que el plugin esté activado
3. Revisa la consola del navegador (F12) para errores JavaScript

### Los estilos se ven mal

1. Verifica que Bootstrap 5 no esté en conflicto con tu tema
2. Puedes comentar la línea de Bootstrap en `includes/class-saia-enqueue.php` si tu tema ya lo incluye

### Los archivos JSON no se cargan

1. Verifica los permisos de la carpeta `assets/data/`
2. Asegúrate de que el JSON sea válido (usa un validador online)

## 📚 Estructura de archivos

```
saia-pricing-configurator/
├── saia-pricing-configurator.php  # Archivo principal
├── uninstall.php                  # Desinstalación
├── README.md                      # Este archivo
├── includes/                      # Clases PHP
│   ├── class-saia-configurator.php
│   ├── class-saia-shortcode.php
│   └── class-saia-enqueue.php
├── templates/                     # Templates de shortcodes
│   ├── configurator-template.php
│   ├── plans-template.php
│   └── comparison-template.php
└── assets/                        # CSS, JS y datos
    ├── css/styles.css
    ├── js/*.js
    └── data/*.json
```

## 🤝 Soporte

Para soporte técnico, visita:
- **Sitio web**: https://www.saiasoftware.com
- **Contacto**: https://www.saiasoftware.com/soporte-en-linea/

## 📄 Licencia

GPL-2.0+ - Este plugin es software libre; puedes redistribuirlo y/o modificarlo bajo los términos de la GNU General Public License.

## 👨‍💻 Desarrollado por

**SAIA Software**
Soluciones de gestión documental empresarial

---

**Versión**: 1.0.0
**Última actualización**: Febrero 2026
