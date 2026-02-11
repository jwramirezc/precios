<?php
/**
 * Plugin Name: SAIA Pricing Configurator
 * Plugin URI: https://www.saiasoftware.com
 * Description: Configurador de precios interactivo para SAIA Software con módulos, planes y comparación de características. Totalmente responsive y optimizado para WordPress.
 * Version: 1.0.6
 * Author: SAIA Software
 * Author URI: https://www.saiasoftware.com
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: saia-configurator
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.2
 */

// Si se accede directamente, salir
if (!defined('ABSPATH')) {
    exit;
}

// Definir constantes del plugin
define('SAIA_CONFIGURATOR_VERSION', '1.0.6');
define('SAIA_CONFIGURATOR_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SAIA_CONFIGURATOR_PLUGIN_URL', plugin_dir_url(__FILE__));
define('SAIA_CONFIGURATOR_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Autoload de clases del plugin
 */
spl_autoload_register(function ($class) {
    // Prefijo del namespace
    $prefix = 'SAIA_';

    // Solo cargar clases de este plugin
    if (strpos($class, $prefix) !== 0) {
        return;
    }

    // Convertir nombre de clase a nombre de archivo
    // SAIA_Configurator -> class-saia-configurator.php
    $class_name = strtolower(str_replace('_', '-', $class));
    $file = SAIA_CONFIGURATOR_PLUGIN_DIR . 'includes/' . $class_name . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

/**
 * Inicializar el plugin
 */
function saia_configurator_init() {
    // Cargar clase principal
    require_once SAIA_CONFIGURATOR_PLUGIN_DIR . 'includes/class-saia-configurator.php';

    // Instanciar y ejecutar
    $plugin = new SAIA_Configurator();
    $plugin->run();
}
add_action('plugins_loaded', 'saia_configurator_init');

/**
 * Activación del plugin
 */
function saia_configurator_activate() {
    // Verificar requisitos mínimos
    if (version_compare(PHP_VERSION, '7.2', '<')) {
        deactivate_plugins(plugin_basename(__FILE__));
        wp_die(__('Este plugin requiere PHP 7.2 o superior.', 'saia-configurator'));
    }

    // Crear opciones por defecto si no existen
    if (!get_option('saia_configurator_settings')) {
        add_option('saia_configurator_settings', array(
            'default_currency' => 'COP',
            'show_comparison' => true,
            'show_plans' => true
        ));
    }

    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'saia_configurator_activate');

/**
 * Desactivación del plugin
 */
function saia_configurator_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'saia_configurator_deactivate');

/**
 * Link de configuración en página de plugins
 */
function saia_configurator_settings_link($links) {
    $settings_link = '<a href="' . admin_url('options-general.php?page=saia-configurator') . '">' . __('Configuración', 'saia-configurator') . '</a>';
    array_unshift($links, $settings_link);
    return $links;
}
add_filter('plugin_action_links_' . SAIA_CONFIGURATOR_PLUGIN_BASENAME, 'saia_configurator_settings_link');
