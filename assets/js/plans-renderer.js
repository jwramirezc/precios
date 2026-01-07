/**
 * Plans Renderer
 * Generates HTML for the pricing cards based on PLANS_CONFIG.
 */

function renderPlans(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container #${containerId} not found.`);
        return;
    }

    container.innerHTML = ''; // Clear existing content

    data.forEach(plan => {
        const col = document.createElement('div');
        col.className = 'col';
        
        // --- Card Styles & Badge ---
        let cardClass = 'card h-100 shadow-sm rounded-4 pricing-card';
        let badgeHTML = '';
        let borderStyle = 'border-0';
        let iconColor = 'text-primary';
        let textColor = ''; // Default
        
        if (plan.highlight) {
            borderStyle = 'border-primary shadow position-relative overflow-hidden';
            badgeHTML = `<div class="position-absolute top-0 start-50 translate-middle-x bg-primary text-white px-3 py-1 rounded-bottom small fw-bold">Más Popular</div>`;
        }
        
        if (plan.style === 'white') {
            cardClass += ' bg-white';
            iconColor = 'text-dark';
            textColor = 'text-dark';
        } else if (plan.style === 'dashed') {
            borderStyle = 'border-2 border-dashed';
            cardClass = `card h-100 shadow-sm rounded-4 pricing-card`; // Re-declare to avoid defaults if needed, or append
            // We'll apply inline style for specific border color/bg as per original design
        }

        col.innerHTML = `
            <div class="${cardClass} ${borderStyle}" style="${plan.style === 'dashed' ? 'border-color: var(--primary) !important; background-color: #f8f9fa;' : ''}">
                ${badgeHTML}
                <div class="card-body p-4 d-flex flex-column ${plan.highlight ? 'mt-3' : ''} ${plan.style === 'dashed' ? 'justify-content-center text-center' : ''}">
                    
                    <!-- Icon -->
                    <div class="mb-3 text-center">
                        <i class="fa-solid ${plan.icon} ${plan.style === 'dashed' ? 'fa-4x opacity-50' : 'fa-3x'} ${iconColor}"></i>
                    </div>
                    
                    <!-- Title -->
                    <h3 class="card-title ${plan.style === 'dashed' ? '' : 'text-center'} fw-bold mb-3 ${textColor}">${plan.name}</h3>
                    
                    <!-- Description -->
                    <p class="card-text ${plan.style === 'dashed' ? '' : 'text-center'} text-muted small mb-4">${plan.description}</p>
                    
                    ${renderPriceSection(plan, textColor)}
                    
                    <!-- Button -->
                    <div class="d-grid mb-4 ${plan.style === 'dashed' ? 'mt-auto' : ''}">
                        <button onclick="${getButtonAction(plan)}" class="btn ${getBtnClass(plan)} rounded-pill py-2 ${plan.style === 'dashed' ? 'fw-bold' : ''}">
                            ${plan.buttonText} ${plan.style === 'dashed' ? '<i class="fa-solid fa-arrow-right ms-2"></i>' : ''}
                        </button>
                    </div>

                    <!-- Features -->
                    ${renderFeatureList(plan, iconColor)}
                    
                </div>
            </div>
        `;
        
        container.appendChild(col);
    });
}

function renderPriceSection(plan, textColor) {
    if (plan.style === 'dashed') return '';
    
    if (typeof plan.price === 'string') {
         // Case: "Contactar"
         return `<h4 class="text-center fw-bold mb-4 ${textColor}">${plan.price}</h4>
                 <div class="mb-4 invisible"><label class="form-label small fw-bold">&nbsp;</label><input class="form-control invisible"></div>`;
    }
    
    // Standard Price
    return `
        <h4 class="text-center fw-bold mb-4 ${textColor}">Desde $${plan.price} USD<small class="text-muted fw-normal">/mes</small></h4>
    `;
}

function renderFeatureList(plan, iconColor) {
    if (plan.style === 'dashed' || (!plan.features.length && !plan.userLimit)) return '';
    
    let html = `<ul class="list-unstyled flex-grow-1 small">`;
    
    // User Limit Item
    if (plan.userLimit) {
        let text = typeof plan.userLimit === 'number' ? `Hasta ${plan.userLimit} usuarios` : `${plan.userLimit}`;
        if(typeof plan.userLimit === 'string' && plan.userLimit.includes('Más')) text = `${plan.userLimit} usuarios`; // Fix for Enterprise wording
        
        html += `<li class="mb-2 fw-bold"><i class="fa-solid fa-users ${iconColor} me-2"></i>${text}</li>`;
    }
    
    // Other Features
    plan.features.forEach(feat => {
        html += `<li class="mb-2"><i class="fa-solid fa-check ${iconColor === 'text-dark' ? 'text-dark' : 'text-success'} me-2"></i>${feat}</li>`;
    });
    
    html += `</ul>`;
    return html;
}

function getButtonAction(plan) {
    if (plan.buttonAction === 'custom') {
        return "window.location.href='configurator.html'";
    }
    return ""; // Add sales link later if needed
}

function getBtnClass(plan) {
    if (plan.style === 'white') return 'btn-dark';
    if (plan.style === 'dashed') return 'btn-outline-primary';
    return 'btn-primary';
}

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    // Only render if container exists
    if(document.getElementById('plans-container-dynamic')) {
        renderPlans('plans-container-dynamic', PLANS_CONFIG);
    }
});
