<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
<div class="wrap saia-admin-wrap">
    <h1>
        <span class="dashicons dashicons-money-alt"></span>
        SAIA — Configurador de Precios
    </h1>

    <?php if ( ! $this->writable_check() ) : ?>
        <div class="notice notice-error">
            <p><strong>Error:</strong> El directorio <code>assets/data/</code> no tiene permisos de escritura.
            Los cambios no se podrán guardar hasta que se corrijan los permisos del servidor.</p>
        </div>
    <?php endif; ?>

    <div id="saia-admin-notices"></div>

    <nav class="nav-tab-wrapper saia-tabs">
        <a href="#precios" class="nav-tab nav-tab-active" data-tab="precios">Precios</a>
        <a href="#contenido" class="nav-tab" data-tab="contenido">Contenido</a>
        <a href="#general" class="nav-tab" data-tab="general">General</a>
    </nav>

    <!-- TAB: Precios -->
    <div id="tab-precios" class="saia-tab-panel active">

        <!-- Sección 1: pricing-config.json -->
        <div class="saia-section" data-file="pricing-config">
            <div class="saia-section-header" data-toggle="pricing-config-body">
                <h2>Configuración Base de Precios</h2>
                <span class="dashicons dashicons-arrow-down-alt2"></span>
            </div>
            <div id="pricing-config-body" class="saia-section-body">
                <div class="saia-help-box">
                    <span class="dashicons dashicons-info-outline"></span>
                    <div>
                        <strong>Configuración global del motor de precios.</strong>
                        Estos valores afectan el cálculo de TODOS los planes y el configurador personalizado.
                        La <em>tasa de cambio</em> convierte los precios USD a la moneda local.
                        El <em>descuento anual</em> se aplica automáticamente cuando el usuario elige facturación anual.
                    </div>
                </div>
                <!-- Moneda y Exchange -->
                <div class="saia-field-row">
                    <div class="saia-field">
                        <label>Moneda</label>
                        <select data-path="currency">
                            <option value="COP">COP</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                    <div class="saia-field">
                        <label>Tasa de Cambio (1 USD =)</label>
                        <input type="number" data-path="exchangeRate" min="1" step="1">
                    </div>
                    <div class="saia-field">
                        <label>Platform Fee (USD)</label>
                        <input type="number" data-path="platformFee" min="0" step="1">
                    </div>
                    <div class="saia-field">
                        <label>Descuento Anual (%)</label>
                        <input type="number" data-path="annualDiscountPercent" min="0" max="100" step="1">
                    </div>
                </div>

                <!-- Users Pricing Tiers -->
                <h3>Tiers de Precio por Usuario</h3>
                <p class="saia-help-text">Define el precio mensual por usuario en USD, escalonado por volumen. El sistema aplica el precio del tier correspondiente a la cantidad de usuarios seleccionada. Los tiers deben estar ordenados de menor a mayor en la columna "Hasta". Ejemplo: hasta 10 usuarios = $7.50/usuario, hasta 50 = $5.00/usuario.</p>
                <table class="widefat saia-tier-table" data-path="usersPricing">
                    <thead>
                        <tr>
                            <th>Hasta (usuarios)</th>
                            <th>Precio por Usuario (USD)</th>
                        </tr>
                    </thead>
                    <tbody id="usersPricing-tbody"></tbody>
                </table>

                <!-- Storage Pricing -->
                <h3>Almacenamiento</h3>
                <p class="saia-help-text">Los primeros GB son gratuitos para todos los planes. El almacenamiento adicional se cobra por GB/mes en tiers escalonados. El valor "GB Incluidos" es la cantidad que viene sin costo en cualquier plan base.</p>
                <div class="saia-field-row">
                    <div class="saia-field">
                        <label>GB Incluidos (gratis)</label>
                        <input type="number" data-path="storagePricing.includedGB" min="0" step="1">
                    </div>
                </div>
                <table class="widefat saia-tier-table" data-path="storagePricing.tiers">
                    <thead>
                        <tr>
                            <th>Hasta (GB)</th>
                            <th>Precio por GB (USD)</th>
                        </tr>
                    </thead>
                    <tbody id="storageTiers-tbody"></tbody>
                </table>

                <!-- Sliders -->
                <h3>Configuración de Sliders</h3>
                <p class="saia-help-text">Controlan los rangos de los sliders de usuarios y almacenamiento en el configurador personalizado. <strong>Min/Max</strong> = límites del slider, <strong>Default</strong> = valor inicial al cargar la página, <strong>Step</strong> = incremento por cada movimiento del slider.</p>
                <div class="saia-field-row">
                    <div class="saia-field"><label>Usuarios Min</label><input type="number" data-path="userSlider.min" min="1"></div>
                    <div class="saia-field"><label>Usuarios Max</label><input type="number" data-path="userSlider.max" min="1"></div>
                    <div class="saia-field"><label>Usuarios Default</label><input type="number" data-path="userSlider.default" min="1"></div>
                    <div class="saia-field"><label>Usuarios Step</label><input type="number" data-path="userSlider.step" min="1"></div>
                </div>
                <div class="saia-field-row">
                    <div class="saia-field"><label>Storage Min (GB)</label><input type="number" data-path="storageSlider.min" min="1"></div>
                    <div class="saia-field"><label>Storage Max (GB)</label><input type="number" data-path="storageSlider.max" min="1"></div>
                    <div class="saia-field"><label>Storage Default (GB)</label><input type="number" data-path="storageSlider.default" min="1"></div>
                    <div class="saia-field"><label>Storage Step (GB)</label><input type="number" data-path="storageSlider.step" min="1"></div>
                </div>

                <div class="saia-section-actions">
                    <button type="button" class="button button-primary saia-save-btn" data-file="pricing-config" disabled>
                        Guardar Configuración Base
                    </button>
                    <button type="button" class="button saia-restore-btn" data-file="pricing-config" style="margin-left:8px;">
                        Restaurar Defaults
                    </button>
                    <span class="saia-save-status"></span>
                </div>
            </div>
        </div>

        <!-- Sección 2: module-pricing.json -->
        <div class="saia-section" data-file="module-pricing">
            <div class="saia-section-header" data-toggle="module-pricing-body">
                <h2>Precios por Módulo</h2>
                <span class="dashicons dashicons-arrow-down-alt2"></span>
            </div>
            <div id="module-pricing-body" class="saia-section-body">
                <div class="saia-help-box">
                    <span class="dashicons dashicons-info-outline"></span>
                    <div>
                        <strong>Precios individuales de los módulos.</strong>
                        Cada módulo pertenece a un tier (Core, Advanced, Enterprise) y su precio mensual se define aquí.
                        Los módulos de Firma y Email Certificado usan <em>bloques de cantidad</em>: el cliente elige cuántas firmas/emails necesita por mes y paga el bloque correspondiente.
                    </div>
                </div>
                <h3>Precios Base por Tier (USD/mes)</h3>
                <p class="saia-help-text">Precio mensual que se cobra por cada módulo según su tier. Ejemplo: un módulo "Core" como Correspondencia cuesta el valor definido aquí. Módulos como ISO 9001 usan el tier "Enterprise".</p>
                <div class="saia-field-row">
                    <div class="saia-field">
                        <label>Core</label>
                        <input type="number" data-path="core" min="0" step="1">
                    </div>
                    <div class="saia-field">
                        <label>Advanced</label>
                        <input type="number" data-path="advanced" min="0" step="1">
                    </div>
                    <div class="saia-field">
                        <label>Enterprise</label>
                        <input type="number" data-path="enterprise" min="0" step="1">
                    </div>
                </div>

                <!-- Firma Certificada Blocks -->
                <h3>Bloques de Firma Certificada</h3>
                <p class="saia-help-text">Paquetes de firmas electrónicas certificadas por mes. El cliente selecciona el bloque que necesita y paga el precio indicado. <strong>Cantidad</strong> = firmas incluidas/mes, <strong>Precio</strong> = costo mensual del bloque en USD, <strong>Etiqueta</strong> = texto que ve el cliente (ej: "50 firmas/mes"). Los módulos de firma en los planes preset pueden ser deseleccionados por el usuario, descontando este costo del plan.</p>
                <table class="widefat saia-tier-table" data-path="firma_certificada_blocks.blocks">
                    <thead>
                        <tr>
                            <th>Cantidad</th>
                            <th>Precio (USD)</th>
                            <th>Etiqueta</th>
                        </tr>
                    </thead>
                    <tbody id="firmaBlocks-tbody"></tbody>
                </table>

                <!-- Email Certificado Blocks -->
                <h3>Bloques de Email Certificado</h3>
                <p class="saia-help-text">Paquetes de emails certificados con valor probatorio por mes. Misma lógica que los bloques de firma: el cliente elige el bloque y paga el precio mensual. Al igual que las firmas, estos módulos pueden ser removidos de un plan preset por el usuario.</p>
                <table class="widefat saia-tier-table" data-path="email_certificado_blocks.blocks">
                    <thead>
                        <tr>
                            <th>Cantidad</th>
                            <th>Precio (USD)</th>
                            <th>Etiqueta</th>
                        </tr>
                    </thead>
                    <tbody id="emailBlocks-tbody"></tbody>
                </table>

                <div class="saia-section-actions">
                    <button type="button" class="button button-primary saia-save-btn" data-file="module-pricing" disabled>
                        Guardar Precios de Módulos
                    </button>
                    <button type="button" class="button saia-restore-btn" data-file="module-pricing" style="margin-left:8px;">
                        Restaurar Defaults
                    </button>
                    <span class="saia-save-status"></span>
                </div>
            </div>
        </div>

        <!-- Sección 3: plans-config.json -->
        <div class="saia-section" data-file="plans-config">
            <div class="saia-section-header" data-toggle="plans-config-body">
                <h2>Planes Predefinidos</h2>
                <span class="dashicons dashicons-arrow-down-alt2"></span>
            </div>
            <div id="plans-config-body" class="saia-section-body">
                <div class="saia-help-box">
                    <span class="dashicons dashicons-info-outline"></span>
                    <div>
                        <strong>Planes que se muestran en la página pública de precios.</strong>
                        Cada plan tiene un precio fijo en USD, una cantidad de usuarios y almacenamiento incluidos, y un conjunto de módulos.
                        Los primeros 3 planes (Esencial, Operativo, Avanzado) son los principales con precios visibles.
                        Enterprise, Procesos a Medida y Diseña tu Plan son de tipo "contactar" sin precio público.
                        <br><br>
                        <strong>Firma y Email Certificado:</strong> en los planes que incluyen estos módulos, el usuario puede quitarlos opcionalmente desde el configurador. Al hacerlo, el precio del plan se reduce automáticamente descontando el costo del módulo y su bloque de cantidad incluido. Las "Cantidades Incluidas" definen cuántas firmas/emails vienen en el plan base.
                    </div>
                </div>
                <div id="plans-accordion"></div>

                <div class="saia-section-actions">
                    <button type="button" class="button button-primary saia-save-btn" data-file="plans-config" disabled>
                        Guardar Planes
                    </button>
                    <button type="button" class="button saia-restore-btn" data-file="plans-config" style="margin-left:8px;">
                        Restaurar Defaults
                    </button>
                    <span class="saia-save-status"></span>
                </div>
            </div>
        </div>
    </div>

    <!-- TAB: Contenido (placeholder) -->
    <div id="tab-contenido" class="saia-tab-panel">
        <div class="saia-placeholder-notice">
            <span class="dashicons dashicons-info-outline"></span>
            <p>La gestión de contenido (módulos, FAQ, comparación, textos) estará disponible próximamente.</p>
        </div>
    </div>

    <!-- TAB: General (placeholder) -->
    <div id="tab-general" class="saia-tab-panel">
        <div class="saia-placeholder-notice">
            <span class="dashicons dashicons-info-outline"></span>
            <p>La gestión de links y URLs estará disponible próximamente.</p>
        </div>
    </div>

    <!-- Modal de Diff / Confirmación -->
    <div id="saia-diff-modal" class="saia-modal" style="display:none;">
        <div class="saia-modal-backdrop"></div>
        <div class="saia-modal-content">
            <div class="saia-modal-header">
                <h3>Confirmar Cambios</h3>
                <button type="button" class="saia-modal-close">&times;</button>
            </div>
            <div class="saia-modal-body" id="saia-diff-body"></div>
            <div class="saia-modal-footer">
                <button type="button" class="button saia-modal-cancel">Cancelar</button>
                <button type="button" class="button button-primary saia-modal-confirm">Guardar</button>
            </div>
        </div>
    </div>
</div>

