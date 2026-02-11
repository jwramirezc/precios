<?php
/**
 * Clase principal del plugin SAIA Configurator
 *
 * @package SAIA_Configurator
 */

if (!defined('ABSPATH')) {
    exit;
}

class SAIA_Configurator {

    /**
     * Versión del plugin
     *
     * @var string
     */
    private $version;

    /**
     * Instancia de enqueue
     *
     * @var SAIA_Enqueue
     */
    private $enqueue;

    /**
     * Instancia de shortcode
     *
     * @var SAIA_Shortcode
     */
    private $shortcode;

    /**
     * Constructor
     */
    public function __construct() {
        $this->version = SAIA_CONFIGURATOR_VERSION;
        $this->load_dependencies();
    }

    /**
     * Cargar dependencias del plugin
     */
    private function load_dependencies() {
        require_once SAIA_CONFIGURATOR_PLUGIN_DIR . 'includes/class-saia-enqueue.php';
        require_once SAIA_CONFIGURATOR_PLUGIN_DIR . 'includes/class-saia-shortcode.php';

        $this->enqueue = new SAIA_Enqueue($this->version);
        $this->shortcode = new SAIA_Shortcode();
    }

    /**
     * Ejecutar el plugin
     */
    public function run() {
        // Registrar hooks de enqueue
        add_action('wp_enqueue_scripts', array($this->enqueue, 'enqueue_styles'));
        add_action('wp_enqueue_scripts', array($this->enqueue, 'enqueue_scripts'));

        // Registrar shortcodes
        $this->shortcode->register();

        // Cargar textos de traducción
        add_action('init', array($this, 'load_plugin_textdomain'));
    }

    /**
     * Cargar dominio de texto del plugin
     */
    public function load_plugin_textdomain() {
        load_plugin_textdomain(
            'saia-configurator',
            false,
            dirname(SAIA_CONFIGURATOR_PLUGIN_BASENAME) . '/languages/'
        );
    }

    /**
     * Obtener versión del plugin
     *
     * @return string
     */
    public function get_version() {
        return $this->version;
    }
}
