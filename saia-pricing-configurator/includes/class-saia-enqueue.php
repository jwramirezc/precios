<?php
/**
 * Clase para encolar estilos y scripts
 *
 * @package SAIA_Configurator
 */

if (!defined('ABSPATH')) {
    exit;
}

class SAIA_Enqueue {

    /**
     * Versión del plugin
     *
     * @var string
     */
    private $version;

    /**
     * Constructor
     *
     * @param string $version Versión del plugin
     */
    public function __construct($version) {
        $this->version = $version;
    }

    /**
     * Encolar estilos CSS
     */
    public function enqueue_styles() {
        // Solo cargar en páginas que tengan el shortcode
        // TEMPORAL: Deshabilitado para debugging - siempre carga en frontend
        // if (!$this->has_shortcode()) {
        //     return;
        // }

        // Bootstrap 5 (opcional - comentar si el tema ya lo incluye)
        wp_enqueue_style(
            'bootstrap',
            'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
            array(),
            '5.3.0'
        );

        // Font Awesome
        wp_enqueue_style(
            'font-awesome',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
            array(),
            '6.4.0'
        );

        // Google Fonts - Outfit
        wp_enqueue_style(
            'google-fonts-outfit',
            'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap',
            array(),
            null
        );

        // Estilos principales del plugin
        wp_enqueue_style(
            'saia-configurator-styles',
            SAIA_CONFIGURATOR_PLUGIN_URL . 'assets/css/styles.css',
            array(),
            $this->version
        );
    }

    /**
     * Encolar scripts JavaScript
     */
    public function enqueue_scripts() {
        // TEMPORAL: Deshabilitado para debugging - siempre carga en frontend
        // if (!$this->has_shortcode()) {
        //     return;
        // }

        // Bootstrap JS (opcional - comentar si el tema ya lo incluye)
        wp_enqueue_script(
            'bootstrap',
            'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
            array(),
            '5.3.0',
            true
        );

        // Scripts del plugin en orden de dependencia
        $scripts = array(
            'saia-config' => array(
                'file' => 'config.js',
                'deps' => array()
            ),
            'saia-general-config' => array(
                'file' => 'general-config.js',
                'deps' => array('saia-config')
            ),
            'saia-plans-config' => array(
                'file' => 'plans-config.js',
                'deps' => array('saia-config')
            ),
            'saia-comparison-config' => array(
                'file' => 'comparison-config.js',
                'deps' => array('saia-config')
            ),
            'saia-calculator' => array(
                'file' => 'calculator.js',
                'deps' => array('saia-config', 'saia-general-config')
            ),
            'saia-configurator' => array(
                'file' => 'configurator.js',
                'deps' => array('saia-config', 'saia-calculator')
            ),
            'saia-plans-renderer' => array(
                'file' => 'plans-renderer.js',
                'deps' => array('saia-config', 'saia-plans-config')
            ),
            'saia-comparison-renderer' => array(
                'file' => 'comparison-renderer.js',
                'deps' => array('saia-config', 'saia-comparison-config')
            ),
            'saia-faq' => array(
                'file' => 'faq.js',
                'deps' => array('saia-config')
            ),
            'saia-tooltips' => array(
                'file' => 'tooltips.js',
                'deps' => array('bootstrap')
            ),
            'saia-proposal-benefits' => array(
                'file' => 'proposal-benefits.js',
                'deps' => array('saia-config')
            ),
            'saia-iframe-resizer' => array(
                'file' => 'iframe-resizer.js',
                'deps' => array()
            ),
            'saia-main' => array(
                'file' => 'main.js',
                'deps' => array('saia-config')
            )
        );

        foreach ($scripts as $handle => $script) {
            wp_enqueue_script(
                $handle,
                SAIA_CONFIGURATOR_PLUGIN_URL . 'assets/js/' . $script['file'],
                $script['deps'],
                $this->version,
                true
            );
        }

        // Pasar datos de PHP a JavaScript
        wp_localize_script('saia-config', 'saiaData', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('saia_nonce'),
            'pluginUrl' => SAIA_CONFIGURATOR_PLUGIN_URL,
            'dataUrl' => SAIA_CONFIGURATOR_PLUGIN_URL . 'assets/data/',
            'version' => $this->version,
            'settings' => get_option('saia_configurator_settings', array())
        ));
    }

    /**
     * Verificar si la página actual tiene algún shortcode del plugin
     *
     * @return bool
     */
    private function has_shortcode() {
        // Verificar si estamos en el frontend
        if (is_admin()) {
            return false;
        }

        global $post;
        $shortcodes = array('saia_configurator', 'saia_plans', 'saia_comparison');

        // Verificar en el post actual
        if (is_a($post, 'WP_Post')) {
            foreach ($shortcodes as $shortcode) {
                if (has_shortcode($post->post_content, $shortcode)) {
                    return true;
                }
            }
        }

        // Verificar en todos los posts de la consulta actual (para constructores de páginas)
        global $wp_query;
        if (isset($wp_query->posts)) {
            foreach ($wp_query->posts as $query_post) {
                foreach ($shortcodes as $shortcode) {
                    if (has_shortcode($query_post->post_content, $shortcode)) {
                        return true;
                    }
                }
            }
        }

        // TEMPORAL: Cargar siempre en frontend para debugging
        // Puedes comentar esta línea después de que funcione
        return true;
    }
}
