<?php
/**
 * Template del configurador personalizado
 *
 * @package SAIA_Configurator
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="saia-configurator-wrapper" id="saia-configurator-<?php echo esc_attr(uniqid()); ?>">

    <!-- Botón volver -->
    <div class="container py-3">
        <div class="text-center">
            <?php
            // Buscar página con el shortcode de planes
            $planes_page = get_posts(array(
                'post_type' => 'page',
                'posts_per_page' => 1,
                's' => '[saia_plans]'
            ));

            if (!empty($planes_page)) :
                $planes_url = get_permalink($planes_page[0]->ID);
            ?>
            <a href="<?php echo esc_url($planes_url); ?>" class="btn btn-outline-secondary rounded-pill">
                <i class="fa-solid fa-arrow-left me-2"></i>
                <?php esc_html_e('Volver a Planes', 'saia-configurator'); ?>
            </a>
            <?php endif; ?>
        </div>
    </div>

    <!-- Main Header -->
    <div class="container py-4">
        <div class="text-center mb-5">
            <h2 class="display-6 fw-bold mb-3" style="color: var(--primary);">
                <!-- Texto cargado dinámicamente desde configurator-texts.json -->
            </h2>

            <p class="lead text-muted">
                <!-- Texto cargado dinámicamente desde configurator-texts.json -->
            </p>
            <p class="small text-muted mt-3 mb-0">
                <!-- Texto cargado dinámicamente desde configurator-texts.json -->
            </p>
        </div>
    </div>

    <div class="container" id="configurator-container">
        <!-- Main Content: Modules -->
        <main>
            <div id="modules-container" class="modules-grid">
                <!-- Modules will be injected here by JS -->
            </div>
        </main>

        <!-- Sidebar: Configuration & Price -->
        <aside>
            <div class="configurator-panel">
                <h2 class="section-title"><?php esc_html_e('Configuración', 'saia-configurator'); ?></h2>

                <!-- SaaS Info Card -->
                <div class="alert alert-light border shadow-sm mb-4" role="alert">
                    <ul class="list-unstyled mb-0 small">
                        <li class="mb-2">
                            <i class="fa-solid fa-check text-success me-2"></i>
                            <?php esc_html_e('Modelo SaaS 100% en la nube', 'saia-configurator'); ?>
                        </li>
                        <li class="mb-2">
                            <i class="fa-solid fa-check text-success me-2"></i>
                            <?php esc_html_e('Acceso 24/7 desde cualquier lugar', 'saia-configurator'); ?>
                        </li>
                        <li class="mb-2">
                            <i class="fa-solid fa-check text-success me-2"></i>
                            <?php esc_html_e('Actualizaciones automáticas incluidas', 'saia-configurator'); ?>
                        </li>
                        <li class="mb-2">
                            <i class="fa-solid fa-check text-success me-2"></i>
                            <?php esc_html_e('Respaldo y protección de la información', 'saia-configurator'); ?>
                        </li>
                        <li class="mb-2">
                            <i class="fa-solid fa-check text-success me-2"></i>
                            <?php esc_html_e('Escalable según usuarios y módulos', 'saia-configurator'); ?>
                        </li>
                        <li>
                            <i class="fa-solid fa-check text-success me-2"></i>
                            <?php esc_html_e('Soporte técnico especializado', 'saia-configurator'); ?>
                        </li>
                    </ul>
                </div>

                <!-- Billing Frequency (SaaS Only) -->
                <div class="control-group" id="billing-frequency-group">
                    <label><?php esc_html_e('Frecuencia de Pago', 'saia-configurator'); ?></label>
                    <div class="license-options">
                        <div class="radio-card active" id="btn-monthly" onclick="setBilling('monthly')">
                            <?php esc_html_e('Mensual', 'saia-configurator'); ?>
                        </div>
                        <div class="radio-card" id="btn-annual" onclick="setBilling('annual')">
                            <?php esc_html_e('Anual', 'saia-configurator'); ?> (<span id="annual-discount-label">-15%</span>)
                        </div>
                    </div>
                </div>

                <!-- Users Slider -->
                <div class="control-group">
                    <label>
                        <?php esc_html_e('Número de Usuarios:', 'saia-configurator'); ?> <span id="user-count-display">10</span>
                        <i class="fa-solid fa-circle-info text-primary ms-1" style="cursor: pointer;"
                            data-tooltip-id="numero_usuarios" aria-label="<?php esc_attr_e('Ayuda sobre número de usuarios', 'saia-configurator'); ?>"></i>
                    </label>
                    <div class="range-wrap">
                        <input type="range" id="users-input" min="5" max="500" value="10" step="5"
                            oninput="updateUsers(this.value)">
                    </div>
                </div>

                <!-- Storage Slider -->
                <div class="control-group">
                    <label>
                        <?php esc_html_e('Almacenamiento (GB):', 'saia-configurator'); ?> <span id="storage-count-display">100</span>
                        <i class="fa-solid fa-circle-info text-primary ms-1" style="cursor: pointer;"
                            data-tooltip-id="almacenamiento_gb" aria-label="<?php esc_attr_e('Ayuda sobre almacenamiento', 'saia-configurator'); ?>"></i>
                    </label>
                    <div class="range-wrap">
                        <input type="range" id="storage-input" min="10" max="1000" value="100" step="10"
                            oninput="updateStorage(this.value)">
                    </div>
                    <div class="d-flex justify-content-between mt-1 text-muted" style="font-size: 0.75rem;">
                        <span><?php esc_html_e('Incluye 100 GB sin costo', 'saia-configurator'); ?></span>
                        <span><?php esc_html_e('Descuentos por volumen', 'saia-configurator'); ?></span>
                    </div>
                </div>

                <!-- Currency Selector -->
                <div class="control-group">
                    <label><?php esc_html_e('Moneda', 'saia-configurator'); ?></label>
                    <div class="license-options">
                        <div class="radio-card active" id="btn-cop" onclick="setCurrency('COP')">
                            COP (<?php esc_html_e('Pesos', 'saia-configurator'); ?>)
                        </div>
                        <div class="radio-card" id="btn-usd" onclick="setCurrency('USD')">
                            USD (<?php esc_html_e('Dólares', 'saia-configurator'); ?>)
                        </div>
                    </div>
                </div>

                <!-- Custom Services Summary -->
                <div id="custom-services-summary" class="custom-services-summary" style="display: none;">
                    <h3 class="section-title small mb-2"><?php esc_html_e('Servicio Adicional', 'saia-configurator'); ?></h3>
                    <div id="custom-services-list"></div>
                </div>

                <!-- Total -->
                <div class="price-display">
                    <span class="price-label" id="price-label"><?php esc_html_e('Precio Estimado (Mensual)', 'saia-configurator'); ?></span>
                    <div id="original-price-container" style="display: none;" class="mb-2">
                        <span class="text-muted text-decoration-line-through small" id="original-price">$0</span>
                    </div>
                    <span class="total-price" id="total-price">$0</span>
                </div>

                <a href="#" class="btn-cta" id="contact-cta" data-link="personalizedQuote">
                    <?php esc_html_e('Obtener Cotización Formal Exacta', 'saia-configurator'); ?><br>
                    <?php esc_html_e('en 24 Horas', 'saia-configurator'); ?>
                </a>

                <a href="#" data-link="requestDemo" class="btn-demo rounded-pill mt-3" style="width: 100%;">
                    <i class="fa-solid fa-play-circle me-2"></i>
                    <?php esc_html_e('Solicitar Demo', 'saia-configurator'); ?>
                </a>
            </div>
        </aside>
    </div>
</div>
