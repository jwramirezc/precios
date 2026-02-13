/**
 * Proposal Benefits Renderer
 * Renders the "What's included in your formal proposal" section dynamically
 */

function renderProposalBenefits(containerId, isConfigurator = false) {
    const container = document.getElementById(containerId);
    if (!container || !PROPOSAL_BENEFITS) {
        console.warn('Proposal benefits container or data not found');
        return;
    }

    const title = PROPOSAL_BENEFITS.title;
    const items = PROPOSAL_BENEFITS.items;

    // Determine CSS classes based on context
    const titleClass = isConfigurator
        ? 'section-title small mb-3 text-center'
        : 'fw-bold mb-3 text-center';
    const listClass = isConfigurator
        ? 'list-unstyled mb-0 small'
        : 'list-unstyled mb-0';

    const html = `
        <div class="alert alert-light border shadow-sm ${isConfigurator ? 'mt-3 mb-4' : 'mb-4'}" role="alert">
            <h3 class="${titleClass}" style="color: var(--primary);">${title}</h3>
            <ul class="${listClass}">
                ${items.map(item => `
                    <li class="mb-2">
                        <i class="fa-solid fa-check text-success me-2"></i>${item}
                    </li>
                `).join('')}
            </ul>
        </div>
    `;

    container.innerHTML = html;
}

// Initialize when config is loaded
document.addEventListener('configLoaded', () => {
    // Render in index.html
    const indexContainer = document.getElementById('proposal-benefits-container');
    if (indexContainer) {
        renderProposalBenefits('proposal-benefits-container', false);
    }

    // Render in configurator.html
    const configuratorContainer = document.getElementById('proposal-benefits-container-configurator');
    if (configuratorContainer) {
        renderProposalBenefits('proposal-benefits-container-configurator', true);
    }
});

// Also try on DOMContentLoaded in case config is already loaded
document.addEventListener('DOMContentLoaded', () => {
    if (PROPOSAL_BENEFITS) {
        const indexContainer = document.getElementById('proposal-benefits-container');
        if (indexContainer) {
            renderProposalBenefits('proposal-benefits-container', false);
        }

        const configuratorContainer = document.getElementById('proposal-benefits-container-configurator');
        if (configuratorContainer) {
            renderProposalBenefits('proposal-benefits-container-configurator', true);
        }
    }
});
