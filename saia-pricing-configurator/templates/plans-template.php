<?php
/**
 * Template de planes predefinidos
 *
 * @package SAIA_Configurator
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="saia-plans-wrapper" id="saia-plans-<?php echo esc_attr(uniqid()); ?>">

    <?php if ($atts['show_reasons']) : ?>
    <!-- 7/8 Reasons Section -->
    <div class="container py-4">
        <div id="reasons-container" class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 justify-content-center">
            <!-- Dynamic Content loaded by JS -->
        </div>
        <hr class="my-5 opacity-10">
    </div>
    <?php endif; ?>

    <!-- Value Proposition -->
    <div class="container py-4">
        <div class="text-center">
            <p class="lead fw-bold" style="color: var(--primary); font-size: 1.5rem; line-height: 1.6;">
                <?php esc_html_e('Gestiona tu organización con precisión, trazabilidad total y cero papel desde el primer día.', 'saia-configurator'); ?>
            </p>
        </div>
    </div>

    <!-- Plans & Pricing Section -->
    <section id="plans-section" class="py-5 bg-light">
        <div class="container">
            <div class="text-center mb-5">
                <h2 class="display-4 fw-bold" style="color: var(--primary);">
                    <?php esc_html_e('Planes y Precios', 'saia-configurator'); ?>
                </h2>
                <p class="lead text-muted">
                    <?php esc_html_e('Selecciona el plan ideal para escalar tu operación', 'saia-configurator'); ?>
                </p>

                <!-- CTA Secondary -->
                <div class="d-flex justify-content-center align-items-center gap-3 mt-4 flex-wrap">
                    <!-- Currency Toggle -->
                    <div class="d-flex align-items-center gap-2">
                        <span id="label-cop" class="fw-bold text-primary">COP</span>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" role="switch" id="currencySwitch"
                                onchange="toggleCurrency(this.checked)">
                        </div>
                        <span id="label-usd" class="fw-bold text-muted">USD</span>
                    </div>

                    <!-- Billing Toggle -->
                    <div class="d-flex align-items-center gap-2">
                        <span id="label-monthly" class="fw-bold text-primary"><?php esc_html_e('Mensual', 'saia-configurator'); ?></span>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" role="switch" id="billingSwitch"
                                onchange="toggleBilling(this.checked)">
                        </div>
                        <span id="label-annual" class="fw-bold text-muted">
                            <?php esc_html_e('Anual', 'saia-configurator'); ?>
                            <span class="badge bg-success small rounded-pill ms-1" id="annual-discount-badge">-15%</span>
                        </span>
                    </div>
                </div>
            </div>

            <!-- Plans Cards (Loaded Dynamically) -->
            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mb-5" id="plans-container-dynamic">
                <!-- Plans will be rendered here by JS -->
            </div>

            <!-- Botones de navegación -->
            <div class="text-center mt-5">
                <?php
                // Buscar páginas con los shortcodes
                $configurador_page = get_posts(array(
                    'post_type' => 'page',
                    'posts_per_page' => 1,
                    's' => '[saia_configurator]'
                ));
                $comparacion_page = get_posts(array(
                    'post_type' => 'page',
                    'posts_per_page' => 1,
                    's' => '[saia_comparison]'
                ));

                if (!empty($configurador_page)) :
                    $configurador_url = get_permalink($configurador_page[0]->ID);
                ?>
                <a href="<?php echo esc_url($configurador_url); ?>" class="btn btn-primary btn-lg me-3">
                    <i class="fa-solid fa-sliders me-2"></i>
                    <?php esc_html_e('Crear Plan Personalizado', 'saia-configurator'); ?>
                </a>
                <?php endif; ?>

                <?php if (!empty($comparacion_page)) :
                    $comparacion_url = get_permalink($comparacion_page[0]->ID);
                ?>
                <a href="<?php echo esc_url($comparacion_url); ?>" class="btn btn-outline-primary btn-lg">
                    <i class="fa-solid fa-table me-2"></i>
                    <?php esc_html_e('Comparar Planes', 'saia-configurator'); ?>
                </a>
                <?php endif; ?>
            </div>
        </div>
    </section>
</div>
