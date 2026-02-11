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

                <!-- CTA Secondary - Solicitar Demo -->
                <div class="mt-4 mb-5">
                    <a href="#" data-link="requestDemo" class="btn-demo-secondary rounded-pill px-5 py-3 fw-bold">
                        <?php esc_html_e('Solicitar Demo', 'saia-configurator'); ?>
                    </a>
                </div>

                <!-- Controls -->
                <div class="d-flex flex-wrap justify-content-center align-items-center mt-4 gap-4">
                    <!-- Currency Toggle -->
                    <div class="d-flex align-items-center gap-3">
                        <span id="label-cop" class="fw-bold text-primary">COP</span>
                        <div class="form-check form-switch fs-4 mb-0">
                            <input class="form-check-input" type="checkbox" role="switch" id="currencySwitch"
                                onchange="toggleCurrency(this.checked)">
                        </div>
                        <span id="label-usd" class="fw-bold text-muted">USD</span>
                    </div>

                    <div class="vr d-none d-md-block"></div>

                    <!-- Billing Toggle -->
                    <div class="d-flex align-items-center gap-3">
                        <span id="label-monthly" class="fw-bold text-primary"><?php esc_html_e('Mensual', 'saia-configurator'); ?></span>
                        <div class="form-check form-switch fs-4 mb-0">
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

            <!-- Comparison Link -->
            <div class="text-center mt-5">
                <p class="text-muted mb-3">
                    <?php esc_html_e('¿Necesitas ver qué incluye cada plan en detalle?', 'saia-configurator'); ?>
                </p>
                <?php
                // Buscar página de comparación de manera más robusta
                $all_pages = get_pages(array('post_status' => 'publish'));
                $comparacion_url = '';
                foreach ($all_pages as $page) {
                    if (has_shortcode($page->post_content, 'saia_comparison')) {
                        $comparacion_url = get_permalink($page->ID);
                        break;
                    }
                }
                if (!empty($comparacion_url)) :
                ?>
                <a href="<?php echo esc_url($comparacion_url); ?>" class="btn-outline-primary-custom rounded-pill px-4">
                    <?php esc_html_e('Ver Comparativo Completo', 'saia-configurator'); ?>
                    <i class="fa-solid fa-table-list ms-2"></i>
                </a>
                <?php else: ?>
                <!-- Fallback button if page not found (for debugging) -->
                <a href="#" class="btn-outline-primary-custom rounded-pill px-4" onclick="alert('Por favor, crea una página con el shortcode [saia_comparison]'); return false;">
                    <?php esc_html_e('Ver Comparativo Completo', 'saia-configurator'); ?>
                    <i class="fa-solid fa-table-list ms-2"></i>
                </a>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="pricing-faq">
        <div class="container">
            <h2 class="faq-title"><?php esc_html_e('Preguntas Frecuentes', 'saia-configurator'); ?></h2>
            <div id="faq-container" class="faq-accordion">
                <!-- FAQ items will be rendered here by JavaScript -->
            </div>

            <!-- Final CTA Section -->
            <div class="text-center py-4 my-4">
                <p class="lead mb-3" style="color: var(--dark);">
                    <?php esc_html_e('¿Listo para optimizar tu operación? Configura tu plan y recibe tu propuesta en minutos.', 'saia-configurator'); ?>
                </p>
                <?php
                // Buscar página de configurador de manera más robusta
                $all_pages_config = get_pages(array('post_status' => 'publish'));
                $configurador_url = '';
                foreach ($all_pages_config as $page) {
                    if (has_shortcode($page->post_content, 'saia_configurator')) {
                        $configurador_url = get_permalink($page->ID);
                        break;
                    }
                }
                if (!empty($configurador_url)) :
                ?>
                <a href="<?php echo esc_url($configurador_url); ?>" class="btn-outline-primary-custom rounded-pill px-4 py-2">
                    <?php esc_html_e('Configurar mi plan ahora', 'saia-configurator'); ?>
                </a>
                <?php else: ?>
                <!-- Fallback button if page not found (for debugging) -->
                <a href="#" class="btn-outline-primary-custom rounded-pill px-4 py-2" onclick="alert('Por favor, crea una página con el shortcode [saia_configurator]'); return false;">
                    <?php esc_html_e('Configurar mi plan ahora', 'saia-configurator'); ?>
                </a>
                <?php endif; ?>
            </div>

            <div class="faq-cta">
                <p><?php esc_html_e('¿No encuentras lo que buscas?', 'saia-configurator'); ?>
                    <a href="#" data-link="contactUs"><?php esc_html_e('Contáctanos', 'saia-configurator'); ?></a>
                </p>
            </div>
        </div>
    </section>
</div>
