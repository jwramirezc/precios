<?php
/**
 * Clase para manejar los shortcodes del plugin
 *
 * @package SAIA_Configurator
 */

if (!defined('ABSPATH')) {
    exit;
}

class SAIA_Shortcode {

    /**
     * Constructor
     */
    public function __construct() {
        // Constructor vacío
    }

    /**
     * Registrar shortcodes
     */
    public function register() {
        add_shortcode('saia_configurator', array($this, 'render_configurator'));
        add_shortcode('saia_plans', array($this, 'render_plans'));
        add_shortcode('saia_comparison', array($this, 'render_comparison'));
    }

    /**
     * Renderizar el configurador personalizado
     *
     * @param array $atts Atributos del shortcode
     * @return string HTML del configurador
     */
    public function render_configurator($atts) {
        // Extraer atributos con valores por defecto
        $atts = shortcode_atts(array(
            'currency' => 'COP',
            'billing' => 'monthly',
            'theme' => 'default'
        ), $atts, 'saia_configurator');

        // Sanitizar atributos
        $atts['currency'] = sanitize_text_field($atts['currency']);
        $atts['billing'] = sanitize_text_field($atts['billing']);
        $atts['theme'] = sanitize_text_field($atts['theme']);

        // Buffer de salida
        ob_start();
        include SAIA_CONFIGURATOR_PLUGIN_DIR . 'templates/configurator-template.php';
        return ob_get_clean();
    }

    /**
     * Renderizar los planes predefinidos
     *
     * @param array $atts Atributos del shortcode
     * @return string HTML de los planes
     */
    public function render_plans($atts) {
        $atts = shortcode_atts(array(
            'currency' => 'COP',
            'billing' => 'monthly',
            'show_reasons' => 'true'
        ), $atts, 'saia_plans');

        $atts['currency'] = sanitize_text_field($atts['currency']);
        $atts['billing'] = sanitize_text_field($atts['billing']);
        $atts['show_reasons'] = filter_var($atts['show_reasons'], FILTER_VALIDATE_BOOLEAN);

        ob_start();
        include SAIA_CONFIGURATOR_PLUGIN_DIR . 'templates/plans-template.php';
        return ob_get_clean();
    }

    /**
     * Renderizar tabla de comparación
     *
     * @param array $atts Atributos del shortcode
     * @return string HTML de la comparación
     */
    public function render_comparison($atts) {
        $atts = shortcode_atts(array(
            'show_header' => 'true'
        ), $atts, 'saia_comparison');

        $atts['show_header'] = filter_var($atts['show_header'], FILTER_VALIDATE_BOOLEAN);

        ob_start();
        include SAIA_CONFIGURATOR_PLUGIN_DIR . 'templates/comparison-template.php';
        return ob_get_clean();
    }
}
