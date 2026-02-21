<?php
/**
 * Plugin Name: SAIA Pricing Configurator
 * Plugin URI: https://www.saiasoftware.com
 * Description: Carga las paginas HTML existentes (index, configurador, comparacion) como shortcodes WordPress sin alterar su contenido.
 * Version: 3.2.2
 * Author: SAIA Software
 * Author URI: https://www.saiasoftware.com
 * License: GPL-2.0+
 * Requires at least: 5.0
 * Requires PHP: 7.2
 *
 * Estructura esperada del plugin:
 *
 *   saia-pricing-configurator/
 *   ├── saia-pricing-configurator.php   (este archivo)
 *   ├── index.html                      (copia del HTML original)
 *   ├── configurator.html               (copia del HTML original)
 *   ├── comparison.html                 (copia del HTML original)
 *   └── assets/
 *       ├── css/
 *       │   ├── styles.css              (estilos originales, sin modificar)
 *       │   └── wp-scoped.css           (resets y overrides scoped a #saia-app-root)
 *       ├── js/
 *       │   ├── saia-wp-bridge.js       (define getDataUrl() global, se carga primero)
 *       │   └── ...                     (JS del proyecto con getDataUrl())
 *       └── data/                       (JSON de configuracion)
 *
 * Shortcodes:
 *   [saia_planes]       → index.html
 *   [saia_configurator] → configurator.html
 *   [saia_comparison]   → comparison.html
 */

if (!defined('ABSPATH')) {
    exit;
}

define('SAIA_DIR', plugin_dir_path(__FILE__));
define('SAIA_URL', plugin_dir_url(__FILE__));
define('SAIA_VER', '3.2.2');

final class SAIA_Loader {

    /**
     * Mapa de shortcodes → archivos HTML y scripts necesarios.
     * El orden de scripts respeta las dependencias de cada pagina.
     * Nota: 'saia-wp-bridge' se agrega automaticamente como primera dependencia.
     */
    private static $pages = [
        'saia_planes' => [
            'file'    => 'index.html',
            'scripts' => [
                'general-config',
                'config',
                'plans-config',
                'plans-renderer',
                'proposal-benefits',
                'faq',
                'main',
                'iframe-resizer',
            ],
        ],
        'saia_configurator' => [
            'file'    => 'configurator.html',
            'scripts' => [
                'general-config',
                'config',
                'calculator',
                'configurator',
                'proposal-benefits',
                'tooltips',
                'faq',
                'main',
                'iframe-resizer',
            ],
        ],
        'saia_comparison' => [
            'file'    => 'comparison.html',
            'scripts' => [
                'general-config',
                'config',
                'comparison-config',
                'comparison-renderer',
                'faq',
                'iframe-resizer',
            ],
        ],
    ];

    /** @var string|null Tag del shortcode detectado en la pagina actual */
    private $detected = null;

    public function __construct() {
        add_action('init', [$this, 'register_shortcodes']);
        add_action('wp', [$this, 'early_detect']);
    }

    /* ------------------------------------------------------------------ */
    /*  Registro de shortcodes                                            */
    /* ------------------------------------------------------------------ */

    public function register_shortcodes() {
        foreach (array_keys(self::$pages) as $tag) {
            add_shortcode($tag, [$this, 'render']);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Deteccion temprana (hook wp) para CSS en <head> y desactivar       */
    /*  wpautop/wptexturize que alterarian el HTML inyectado.             */
    /* ------------------------------------------------------------------ */

    public function early_detect() {
        if (is_admin()) {
            return;
        }

        global $post;
        if (!is_a($post, 'WP_Post')) {
            return;
        }

        foreach (array_keys(self::$pages) as $tag) {
            if (has_shortcode($post->post_content, $tag)) {
                $this->detected = $tag;

                // Evitar que WordPress modifique el HTML del shortcode
                remove_filter('the_content', 'wpautop');
                remove_filter('the_content', 'wptexturize');

                // Encolar CSS antes de wp_head
                add_action('wp_enqueue_scripts', [$this, 'enqueue_styles']);
                break;
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Enqueue de CSS                                                    */
    /*                                                                    */
    /*  Bootstrap, Font Awesome y styles.css se cargan dentro de          */
    /*  @layer(saia) → menor prioridad que los estilos del tema WP.      */
    /*                                                                    */
    /*  wp-scoped.css se carga SIN layer → maxima prioridad, pero solo   */
    /*  aplica dentro de #saia-app-root.                                 */
    /* ------------------------------------------------------------------ */

    public function enqueue_styles() {
        $css_url = esc_url(SAIA_URL . 'assets/css/styles.css?ver=' . SAIA_VER);

        // 1. Inline @imports dentro de @layer(saia) — baja prioridad, no afectan al tema
        wp_register_style('saia-layered', false);
        wp_enqueue_style('saia-layered');
        wp_add_inline_style('saia-layered', implode("\n", [
            '@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap") layer(saia);',
            '@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css") layer(saia);',
            '@import url("https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css") layer(saia);',
            '@import url("' . $css_url . '") layer(saia);',
        ]));

        // 2. wp-scoped.css — sin layer, scoped a #saia-app-root
        wp_enqueue_style(
            'saia-scoped',
            SAIA_URL . 'assets/css/wp-scoped.css',
            ['saia-layered'],
            SAIA_VER
        );
    }

    /* ------------------------------------------------------------------ */
    /*  Enqueue de JS (footer)                                            */
    /*                                                                    */
    /*  saia-wp-bridge.js se carga PRIMERO y recibe saiaData via          */
    /*  wp_localize_script. El resto de scripts se encadenan en orden.    */
    /* ------------------------------------------------------------------ */

    private function enqueue_scripts($tag) {
        // 1. Bridge — siempre primero
        wp_enqueue_script(
            'saia-wp-bridge',
            SAIA_URL . 'assets/js/saia-wp-bridge.js',
            [],
            SAIA_VER,
            true
        );

        // Pasar URL del plugin al JS para resolver rutas de fetch()
        // pageUrls: URLs de WordPress para navegacion interna entre paginas
        wp_localize_script('saia-wp-bridge', 'saiaData', [
            'pluginUrl' => SAIA_URL,
            'dataUrl'   => SAIA_URL . 'assets/data/',
            'pageUrls'  => [
                'planes'       => '/planes/',
                'configurador' => '/configurador/',
                'comparacion'  => '/comparacion/',
            ],
        ]);

        // 2. Scripts de la pagina — encadenados en orden
        $scripts = self::$pages[$tag]['scripts'];
        $prev = 'saia-wp-bridge';

        foreach ($scripts as $handle) {
            wp_enqueue_script(
                'saia-' . $handle,
                SAIA_URL . 'assets/js/' . $handle . '.js',
                [$prev],
                SAIA_VER,
                true
            );
            $prev = 'saia-' . $handle;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Render del shortcode                                              */
    /* ------------------------------------------------------------------ */

    public function render($atts, $content, $tag) {
        if (!isset(self::$pages[$tag])) {
            return '';
        }

        $file = SAIA_DIR . self::$pages[$tag]['file'];

        if (!file_exists($file)) {
            return '<!-- SAIA: archivo ' . esc_html(self::$pages[$tag]['file']) . ' no encontrado -->';
        }

        // Encolar JS de esta pagina (footer — aun esta a tiempo)
        $this->enqueue_scripts($tag);

        // Fallback: si CSS no se detecto en early_detect (page builders)
        if ($this->detected === null) {
            $this->enqueue_styles();
        }

        $html = file_get_contents($file);
        $body = $this->extract_body($html);

        // Envolver en #saia-app-root con contenedor de tooltips
        return '<div id="saia-app-root">'
            . $body
            . '<div class="saia-tooltip-container"></div>'
            . '</div>';
    }

    /* ------------------------------------------------------------------ */
    /*  Extraccion del contenido del body                                 */
    /*                                                                    */
    /*  Elimina DOCTYPE, <html>, <head>, <body>, <script>, <link>         */
    /*  sin alterar el contenido interno del body.                        */
    /* ------------------------------------------------------------------ */

    private function extract_body($html) {
        // DOCTYPE
        $html = preg_replace('/<!DOCTYPE[^>]*>/i', '', $html);
        // <html> y </html>
        $html = preg_replace('/<\/?html[^>]*>/i', '', $html);
        // <head>...</head> completo
        $html = preg_replace('/<head\b[^>]*>.*?<\/head>/is', '', $html);
        // <body> y </body> (conserva contenido interno)
        $html = preg_replace('/<\/?body[^>]*>/i', '', $html);
        // <script>...</script> (JS se carga via wp_enqueue_script)
        $html = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $html);
        // <link ...> (CSS se carga via wp_enqueue_style)
        $html = preg_replace('/<link\b[^>]*\/?>/i', '', $html);

        return trim($html);
    }
}

new SAIA_Loader();
