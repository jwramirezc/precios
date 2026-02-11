<?php
/**
 * Uninstall script for SAIA Pricing Configurator
 *
 * @package SAIA_Configurator
 */

// Si no se llama desde WordPress, salir
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Eliminar opciones del plugin
delete_option('saia_configurator_settings');

// Eliminar opciones con prefijo saia_ (por si hay más)
global $wpdb;
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE 'saia_%'");

// Limpiar caché si existe
if (function_exists('wp_cache_flush')) {
    wp_cache_flush();
}

// Nota: No eliminamos los archivos JSON ya que pueden contener
// configuraciones personalizadas del usuario
