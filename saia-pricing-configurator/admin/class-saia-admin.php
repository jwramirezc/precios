<?php
/**
 * SAIA Admin — Gestión de precios y configuración.
 *
 * Página de administración para editar los archivos JSON
 * de configuración del pricing configurator.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class SAIA_Admin {

    /** @var string Ruta absoluta al directorio de datos JSON */
    private $data_dir;

    /** @var string Ruta al directorio de backups */
    private $backup_dir;

    /** Whitelist: file_key → ruta relativa desde el plugin */
    private static $allowed_files = [
        'pricing-config'    => 'assets/data/pricing-config.json',
        'module-pricing'    => 'assets/data/module-pricing.json',
        'plans-config'      => 'assets/data/plans-config.json',
        'modules-data'      => 'assets/data/modules-data.json',
        'general-config'    => 'assets/data/general-config.json',
        'faq'               => 'assets/data/faq.json',
        'tooltips-config'   => 'assets/data/tooltips-config.json',
        'proposal-benefits' => 'assets/data/proposal-benefits.json',
        'categories-config' => 'assets/data/categories-config.json',
        'configurator-texts'=> 'assets/data/configurator-texts.json',
        'comparison-config' => 'assets/data/comparison-config.json',
        'reasons-data'      => 'assets/data/reasons-data.json',
    ];

    public function __construct() {
        $this->data_dir   = SAIA_DIR . 'assets/data/';
        $this->backup_dir = wp_upload_dir()['basedir'] . '/saia-backups/';

        add_action( 'admin_menu', [ $this, 'register_menu' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
        add_action( 'wp_ajax_saia_save_config', [ $this, 'ajax_save' ] );
    }

    /* ───────────────────────────────────────────
     * Menú
     * ─────────────────────────────────────────── */

    public function register_menu() {
        add_menu_page(
            'SAIA Precios',
            'SAIA Precios',
            'manage_options',
            'saia-pricing',
            [ $this, 'render_page' ],
            'dashicons-money-alt',
            80
        );
    }

    /* ───────────────────────────────────────────
     * Assets (solo en nuestra página)
     * ─────────────────────────────────────────── */

    public function enqueue_assets( $hook ) {
        if ( 'toplevel_page_saia-pricing' !== $hook ) {
            return;
        }

        $ver = SAIA_VER;

        wp_enqueue_style(
            'saia-admin',
            SAIA_URL . 'admin/css/saia-admin.css',
            [],
            $ver
        );

        wp_enqueue_script(
            'saia-admin',
            SAIA_URL . 'admin/js/saia-admin.js',
            [],
            $ver,
            true
        );

        // Cargar TODOS los JSON del tab actual + módulos (para validación cruzada)
        $files_data = [];
        foreach ( self::$allowed_files as $key => $rel ) {
            $path = SAIA_DIR . $rel;
            if ( file_exists( $path ) ) {
                $content = file_get_contents( $path );
                $decoded = json_decode( $content, true );
                if ( null !== $decoded ) {
                    $files_data[ $key ] = $decoded;
                }
            }
        }

        wp_localize_script( 'saia-admin', 'saiaAdmin', [
            'ajaxUrl'   => admin_url( 'admin-ajax.php' ),
            'nonce'     => wp_create_nonce( 'saia_save_config' ),
            'files'     => $files_data,
            'writable'  => is_writable( $this->data_dir ),
        ] );
    }

    /* ───────────────────────────────────────────
     * Render
     * ─────────────────────────────────────────── */

    public function render_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'No tienes permiso para acceder a esta página.' );
        }
        include SAIA_DIR . 'admin/views/admin-page.php';
    }

    public function writable_check() {
        return is_writable( $this->data_dir );
    }

    /* ───────────────────────────────────────────
     * AJAX Save
     * ─────────────────────────────────────────── */

    public function ajax_save() {
        // 1. Nonce
        check_ajax_referer( 'saia_save_config', 'nonce' );

        // 2. Capability
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( [ 'message' => 'Permisos insuficientes.' ], 403 );
        }

        // 3. File key whitelist
        $file_key = isset( $_POST['file_key'] ) ? sanitize_text_field( $_POST['file_key'] ) : '';
        if ( ! isset( self::$allowed_files[ $file_key ] ) ) {
            wp_send_json_error( [ 'message' => 'Archivo no permitido: ' . $file_key ], 400 );
        }

        // 4. Throttle (5 segundos)
        $throttle_key = 'saia_save_throttle_' . $file_key;
        if ( get_transient( $throttle_key ) ) {
            wp_send_json_error( [ 'message' => 'Esperá unos segundos antes de guardar de nuevo.' ], 429 );
        }

        // 5. Decode JSON
        $raw_json = isset( $_POST['json_data'] ) ? wp_unslash( $_POST['json_data'] ) : '';
        $data = json_decode( $raw_json, true );
        if ( null === $data && 'null' !== strtolower( trim( $raw_json ) ) ) {
            wp_send_json_error( [ 'message' => 'JSON inválido.' ], 400 );
        }

        // 6. Validate
        $validation = $this->validate_json( $file_key, $data );
        if ( ! $validation['valid'] ) {
            wp_send_json_error( [
                'message' => 'Errores de validación.',
                'errors'  => $validation['errors'],
            ], 400 );
        }

        // 7. Concurrency check
        $file_path = SAIA_DIR . self::$allowed_files[ $file_key ];
        $client_mtime = isset( $_POST['file_mtime'] ) ? intval( $_POST['file_mtime'] ) : 0;
        if ( $client_mtime > 0 && file_exists( $file_path ) ) {
            $server_mtime = filemtime( $file_path );
            if ( $server_mtime > $client_mtime ) {
                wp_send_json_error( [
                    'message' => 'El archivo fue modificado por otro usuario. Recargá la página para ver los cambios actuales.',
                ], 409 );
            }
        }

        // 8. Backup
        $this->create_backup( $file_key, $file_path );

        // 9. Atomic write
        $json_output = json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
        $tmp_path    = $file_path . '.tmp';

        if ( false === file_put_contents( $tmp_path, $json_output . "\n" ) ) {
            wp_send_json_error( [ 'message' => 'Error al escribir archivo temporal.' ], 500 );
        }

        if ( ! rename( $tmp_path, $file_path ) ) {
            @unlink( $tmp_path );
            wp_send_json_error( [ 'message' => 'Error al reemplazar archivo.' ], 500 );
        }

        // 10. Verify
        $verify = json_decode( file_get_contents( $file_path ), true );
        if ( null === $verify ) {
            wp_send_json_error( [ 'message' => 'El archivo se escribió pero el JSON no es válido. Restaurá desde backup.' ], 500 );
        }

        // 11. Set throttle
        set_transient( $throttle_key, true, 5 );

        wp_send_json_success( [
            'message' => 'Guardado correctamente.',
            'mtime'   => filemtime( $file_path ),
        ] );
    }

    /* ───────────────────────────────────────────
     * Backup
     * ─────────────────────────────────────────── */

    private function create_backup( $file_key, $file_path ) {
        if ( ! file_exists( $file_path ) ) {
            return;
        }

        $dir = $this->backup_dir . $file_key . '/';
        if ( ! is_dir( $dir ) ) {
            wp_mkdir_p( $dir );
            // Proteger directorio
            file_put_contents( $this->backup_dir . '.htaccess', "Deny from all\n" );
            file_put_contents( $dir . 'index.php', '<?php // Silence is golden.' );
        }

        $timestamp = gmdate( 'Y-m-d_H-i-s' );
        copy( $file_path, $dir . $file_key . '-' . $timestamp . '.json' );

        // Retención: máximo 10 backups por archivo
        $backups = glob( $dir . $file_key . '-*.json' );
        if ( $backups && count( $backups ) > 10 ) {
            sort( $backups ); // Orden cronológico por nombre
            $to_delete = array_slice( $backups, 0, count( $backups ) - 10 );
            foreach ( $to_delete as $old ) {
                @unlink( $old );
            }
        }
    }

    /* ───────────────────────────────────────────
     * Validación JSON
     * ─────────────────────────────────────────── */

    private function validate_json( $file_key, $data ) {
        $errors = [];

        switch ( $file_key ) {
            case 'pricing-config':
                $errors = $this->validate_pricing_config( $data );
                break;
            case 'module-pricing':
                $errors = $this->validate_module_pricing( $data );
                break;
            case 'plans-config':
                $errors = $this->validate_plans_config( $data );
                break;
            default:
                // Validación genérica: solo que sea array u object válido
                if ( ! is_array( $data ) ) {
                    $errors[] = 'Los datos deben ser un array u objeto válido.';
                }
                break;
        }

        return [ 'valid' => empty( $errors ), 'errors' => $errors ];
    }

    private function validate_pricing_config( $data ) {
        $errors = [];

        if ( ! is_array( $data ) ) {
            return [ 'Los datos deben ser un objeto.' ];
        }

        // Exchange rate
        if ( ! isset( $data['exchangeRate'] ) || ! is_numeric( $data['exchangeRate'] ) || $data['exchangeRate'] <= 0 ) {
            $errors[] = 'exchangeRate debe ser un número mayor a 0.';
        }

        // Platform fee
        if ( isset( $data['platformFee'] ) && ( ! is_numeric( $data['platformFee'] ) || $data['platformFee'] < 0 ) ) {
            $errors[] = 'platformFee debe ser un número >= 0.';
        }

        // Annual discount
        if ( isset( $data['annualDiscountPercent'] ) ) {
            $v = $data['annualDiscountPercent'];
            if ( ! is_numeric( $v ) || $v < 0 || $v > 100 ) {
                $errors[] = 'annualDiscountPercent debe estar entre 0 y 100.';
            }
        }

        // Users pricing tiers
        if ( isset( $data['usersPricing'] ) && is_array( $data['usersPricing'] ) ) {
            $prev = 0;
            foreach ( $data['usersPricing'] as $i => $tier ) {
                if ( ! isset( $tier['upTo'] ) || ! is_numeric( $tier['upTo'] ) || $tier['upTo'] <= 0 ) {
                    $errors[] = "usersPricing[$i].upTo debe ser > 0.";
                }
                if ( ! isset( $tier['pricePerUser'] ) || ! is_numeric( $tier['pricePerUser'] ) || $tier['pricePerUser'] < 0 ) {
                    $errors[] = "usersPricing[$i].pricePerUser debe ser >= 0.";
                }
                if ( isset( $tier['upTo'] ) && $tier['upTo'] <= $prev ) {
                    $errors[] = "usersPricing[$i].upTo debe ser mayor que el tier anterior ($prev).";
                }
                $prev = isset( $tier['upTo'] ) ? $tier['upTo'] : $prev;
            }
        }

        // Storage pricing
        if ( isset( $data['storagePricing'] ) && is_array( $data['storagePricing'] ) ) {
            $sp = $data['storagePricing'];
            if ( isset( $sp['includedGB'] ) && ( ! is_numeric( $sp['includedGB'] ) || $sp['includedGB'] < 0 ) ) {
                $errors[] = 'storagePricing.includedGB debe ser >= 0.';
            }
            if ( isset( $sp['tiers'] ) && is_array( $sp['tiers'] ) ) {
                $prev = 0;
                foreach ( $sp['tiers'] as $i => $tier ) {
                    if ( ! isset( $tier['upTo'] ) || ! is_numeric( $tier['upTo'] ) || $tier['upTo'] <= 0 ) {
                        $errors[] = "storagePricing.tiers[$i].upTo debe ser > 0.";
                    }
                    if ( ! isset( $tier['pricePerGB'] ) || ! is_numeric( $tier['pricePerGB'] ) || $tier['pricePerGB'] < 0 ) {
                        $errors[] = "storagePricing.tiers[$i].pricePerGB debe ser >= 0.";
                    }
                    if ( isset( $tier['upTo'] ) && $tier['upTo'] <= $prev ) {
                        $errors[] = "storagePricing.tiers[$i].upTo debe ser mayor que el tier anterior.";
                    }
                    $prev = isset( $tier['upTo'] ) ? $tier['upTo'] : $prev;
                }
            }
        }

        // Sliders
        foreach ( [ 'userSlider', 'storageSlider' ] as $slider ) {
            if ( isset( $data[ $slider ] ) && is_array( $data[ $slider ] ) ) {
                $s = $data[ $slider ];
                if ( isset( $s['min'], $s['max'] ) && $s['min'] >= $s['max'] ) {
                    $errors[] = "$slider.min debe ser menor que max.";
                }
                if ( isset( $s['default'], $s['min'], $s['max'] ) ) {
                    if ( $s['default'] < $s['min'] || $s['default'] > $s['max'] ) {
                        $errors[] = "$slider.default debe estar entre min y max.";
                    }
                }
                if ( isset( $s['step'] ) && ( ! is_numeric( $s['step'] ) || $s['step'] <= 0 ) ) {
                    $errors[] = "$slider.step debe ser > 0.";
                }
            }
        }

        return $errors;
    }

    private function validate_module_pricing( $data ) {
        $errors = [];

        if ( ! is_array( $data ) ) {
            return [ 'Los datos deben ser un objeto.' ];
        }

        // Tier base prices
        foreach ( [ 'core', 'advanced', 'enterprise' ] as $tier ) {
            if ( isset( $data[ $tier ] ) && ( ! is_numeric( $data[ $tier ] ) || $data[ $tier ] < 0 ) ) {
                $errors[] = "$tier debe ser un número >= 0.";
            }
        }

        // Block pricing
        foreach ( [ 'firma_certificada_blocks', 'email_certificado_blocks' ] as $block_key ) {
            if ( isset( $data[ $block_key ]['blocks'] ) && is_array( $data[ $block_key ]['blocks'] ) ) {
                $prev_qty = 0;
                foreach ( $data[ $block_key ]['blocks'] as $i => $block ) {
                    if ( ! isset( $block['qty'] ) || ! is_numeric( $block['qty'] ) || $block['qty'] <= 0 ) {
                        $errors[] = "$block_key.blocks[$i].qty debe ser > 0.";
                    }
                    if ( ! isset( $block['priceUSD'] ) || ! is_numeric( $block['priceUSD'] ) || $block['priceUSD'] < 0 ) {
                        $errors[] = "$block_key.blocks[$i].priceUSD debe ser >= 0.";
                    }
                    if ( ! isset( $block['label'] ) || '' === trim( $block['label'] ) ) {
                        $errors[] = "$block_key.blocks[$i].label no puede estar vacío.";
                    }
                    if ( isset( $block['qty'] ) && $block['qty'] <= $prev_qty ) {
                        $errors[] = "$block_key.blocks[$i].qty debe ser mayor que el bloque anterior.";
                    }
                    $prev_qty = isset( $block['qty'] ) ? $block['qty'] : $prev_qty;
                }
            }
        }

        return $errors;
    }

    private function validate_plans_config( $data ) {
        $errors = [];

        if ( ! is_array( $data ) ) {
            return [ 'Los datos deben ser un array de planes.' ];
        }

        // Load modules for cross-validation
        $modules_path = SAIA_DIR . self::$allowed_files['modules-data'];
        $valid_module_ids = [];
        if ( file_exists( $modules_path ) ) {
            $modules = json_decode( file_get_contents( $modules_path ), true );
            if ( is_array( $modules ) ) {
                $valid_module_ids = array_column( $modules, 'id' );
            }
        }

        foreach ( $data as $i => $plan ) {
            $label = isset( $plan['id'] ) ? $plan['id'] : "plan[$i]";

            if ( ! isset( $plan['id'] ) || '' === trim( $plan['id'] ) ) {
                $errors[] = "$label: id no puede estar vacío.";
            }
            if ( ! isset( $plan['name'] ) || '' === trim( $plan['name'] ) ) {
                $errors[] = "$label: name no puede estar vacío.";
            }

            // Price: numeric >= 0, empty string, or null (enterprise/custom plans)
            if ( isset( $plan['price'] ) && '' !== $plan['price'] && null !== $plan['price'] ) {
                if ( ! is_numeric( $plan['price'] ) || $plan['price'] < 0 ) {
                    $errors[] = "$label: price debe ser un número >= 0, vacío o null.";
                }
            }

            // Cross-validate includedModules
            if ( ! empty( $plan['includedModules'] ) && is_array( $plan['includedModules'] ) && ! empty( $valid_module_ids ) ) {
                foreach ( $plan['includedModules'] as $mod_id ) {
                    if ( ! in_array( $mod_id, $valid_module_ids, true ) ) {
                        $errors[] = "$label: módulo '$mod_id' no existe en modules-data.json.";
                    }
                }
            }
        }

        return $errors;
    }
}
