<?php
/**
 * Template de tabla de comparación
 *
 * @package SAIA_Configurator
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="saia-comparison-wrapper" id="saia-comparison-<?php echo esc_attr(uniqid()); ?>">

    <?php if ($atts['show_header']) : ?>
    <!-- Header Section -->
    <section class="py-5 bg-light">
        <div class="container">
            <div class="text-center mb-4">
                <h2 class="display-4 fw-bold" style="color: var(--primary);">
                    <?php esc_html_e('Comparación de Planes', 'saia-configurator'); ?>
                </h2>
                <p class="lead text-muted">
                    <?php esc_html_e('Compara características y encuentra el plan perfecto para tu organización', 'saia-configurator'); ?>
                </p>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <!-- Comparison Table Section -->
    <section class="py-5">
        <div class="container">
            <div id="comparison-table-container">
                <!-- Comparison table will be rendered here by JS -->
            </div>

            <!-- Botones de navegación -->
            <div class="text-center mt-5">
                <?php
                $planes_page = get_posts(array(
                    'post_type' => 'page',
                    'posts_per_page' => 1,
                    's' => '[saia_plans]'
                ));
                $configurador_page = get_posts(array(
                    'post_type' => 'page',
                    'posts_per_page' => 1,
                    's' => '[saia_configurator]'
                ));

                if (!empty($planes_page)) :
                    $planes_url = get_permalink($planes_page[0]->ID);
                ?>
                <a href="<?php echo esc_url($planes_url); ?>" class="btn btn-outline-secondary btn-lg me-3">
                    <i class="fa-solid fa-arrow-left me-2"></i>
                    <?php esc_html_e('Ver Planes', 'saia-configurator'); ?>
                </a>
                <?php endif; ?>

                <?php if (!empty($configurador_page)) :
                    $configurador_url = get_permalink($configurador_page[0]->ID);
                ?>
                <a href="<?php echo esc_url($configurador_url); ?>" class="btn btn-primary btn-lg">
                    <i class="fa-solid fa-sliders me-2"></i>
                    <?php esc_html_e('Crear Plan Personalizado', 'saia-configurator'); ?>
                </a>
                <?php endif; ?>
            </div>
        </div>
    </section>
</div>
