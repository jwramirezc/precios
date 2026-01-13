/**
 * Comparison Renderer
 * Generates the feature comparison table.
 */

function renderComparisonTable(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = `
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light text-center sticky-top" style="z-index: 10;">
                    <tr>
                        <th scope="col" class="text-start py-3 ps-4" style="min-width: 200px;">Funcionalidad</th>
                        <th scope="col" class="py-3" style="min-width: 120px;">Basic</th>
                        <th scope="col" class="py-3 text-primary" style="min-width: 120px;">Standard</th>
                        <th scope="col" class="py-3" style="min-width: 120px;">Professional</th>
                        <th scope="col" class="py-3" style="min-width: 120px;">Enterprise</th>
                    </tr>
                </thead>
                <tbody>
    `;

    data.forEach(category => {
        // Category Header
        html += `
            <tr class="table-group-divider bg-light">
                <td colspan="5" class="py-3 ps-4 fw-bold text-uppercase small text-muted bg-light">
                    ${category.category}
                </td>
            </tr>
        `;

        // Features
        category.features.forEach(feat => {
            html += `
                <tr>
                    <td class="ps-4 py-3 fw-medium">${feat.name}</td>
                    <td class="text-center py-3">${renderCell(feat.basic)}</td>
                    <td class="text-center py-3 bg-primary-subtle">${renderCell(feat.standard)}</td>
                    <td class="text-center py-3">${renderCell(feat.pro)}</td>
                    <td class="text-center py-3">${renderCell(feat.enterprise)}</td>
                </tr>
            `;
        });
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

function renderCell(value) {
    if (value === true) {
        return '<i class="fa-solid fa-check text-success fs-5"></i>';
    }
    if (value === false) {
        return '<i class="fa-solid fa-xmark text-muted opacity-25 fs-5"></i>';
    }
    return `<span class="fw-bold small text-dark">${value}</span>`;
}

// Initialize - Wait for comparison config to load
function initializeComparisonRenderer() {
    if (COMPARISON_ITEMS) {
        renderComparisonTable('comparison-container', COMPARISON_ITEMS);
    }
}

// Wait for comparison config to load
document.addEventListener('comparisonConfigLoaded', initializeComparisonRenderer);

// Also try on DOMContentLoaded in case config is already loaded
document.addEventListener('DOMContentLoaded', () => {
    if (COMPARISON_ITEMS) {
        initializeComparisonRenderer();
    }
});
