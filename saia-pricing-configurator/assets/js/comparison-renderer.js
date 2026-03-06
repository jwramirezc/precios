/**
 * Comparison Renderer
 * Generates the feature comparison table.
 */

function renderComparisonSummary(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const cards = data.map(item => `
        <div class="col-md-3 col-sm-6">
            <div class="p-3 rounded-3 border bg-white h-100">
                <strong class="d-block mb-1" style="color: var(--primary);">${item.name}</strong>
                <small class="text-muted">${item.description}</small>
            </div>
        </div>
    `).join('');
    container.innerHTML = `<div class="row g-3">${cards}</div>`;
}

function renderComparisonTable(containerId, data, summary) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const planNames = (summary || []).map(p => p.name);
    const headers = planNames.map((name, i) =>
        `<th scope="col" class="py-3${i === 1 ? ' text-primary' : ''}" style="min-width: 120px;">${name}</th>`
    ).join('');

    let html = `
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light text-center sticky-top" style="z-index: 10;">
                    <tr>
                        <th scope="col" class="text-start py-3 ps-4" style="min-width: 200px;">Funcionalidad</th>
                        ${headers}
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
        renderComparisonTable('comparison-container', COMPARISON_ITEMS, COMPARISON_SUMMARY);
    }
    if (COMPARISON_SUMMARY) {
        renderComparisonSummary('comparison-summary', COMPARISON_SUMMARY);
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
