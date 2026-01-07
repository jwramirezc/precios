// State
let currentCurrency = 'COP'; 
let billingCycle = 'monthly'; // monthly | annual

/**
 * Plans Renderer
 * Generates HTML for the pricing cards based on PLANS_CONFIG.
 */

function toggleCurrency(isUsd) {
    currentCurrency = isUsd ? 'USD' : 'COP';
    updateLabels();
    renderPlans('plans-container-dynamic', PLANS_CONFIG);
}

function toggleBilling(isAnnual) {
    billingCycle = isAnnual ? 'annual' : 'monthly';
    updateLabels();
    renderPlans('plans-container-dynamic', PLANS_CONFIG);
}

function updateLabels() {
    // Currency Labels
    document.getElementById('label-cop').className = `fw-bold ${currentCurrency === 'COP' ? 'text-primary' : 'text-muted'}`;
    document.getElementById('label-usd').className = `fw-bold ${currentCurrency === 'USD' ? 'text-primary' : 'text-muted'}`;

    // Billing Labels
    const annualBadge = '<span class="badge bg-success small rounded-pill ms-1">-15%</span>';
    document.getElementById('label-monthly').className = `fw-bold ${billingCycle === 'monthly' ? 'text-primary' : 'text-muted'}`;
    const lblAnnual = document.getElementById('label-annual');
    lblAnnual.className = `fw-bold ${billingCycle === 'annual' ? 'text-primary' : 'text-muted'}`;
    lblAnnual.innerHTML = `Anual ${annualBadge}`;
}

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
            cardClass = `card h-100 shadow-sm rounded-4 pricing-card`; 
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
    
    // Config Check
    if (typeof PRICING_CONFIG === 'undefined') {
        console.error('PRICING_CONFIG not found.');
        return `<h4 class="text-center fw-bold mb-4 text-danger">Error Config</h4>`;
    }

    // Base Price (Monthly USD)
    let finalPrice = plan.price;
    let periodLabel = '/mes';

    // Apply Annual Logic
    if (billingCycle === 'annual') {
        finalPrice = finalPrice * 12 * PRICING_CONFIG.annualSaaSMultiplier;
        periodLabel = '/año';
    }

    // Apply Currency Logic
    let currencyLabel = 'USD';
    if (currentCurrency === 'COP') {
        finalPrice = finalPrice * PRICING_CONFIG.exchangeRate;
        currencyLabel = 'COP';
    }

    // Format Price
    const formattedPrice = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: currentCurrency === 'COP' ? 'COP' : 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(finalPrice);
    
    return `
        <h4 class="text-center fw-bold mb-4 ${textColor}">Desde ${formattedPrice} ${currencyLabel}<small class="text-muted fw-normal">${periodLabel}</small></h4>
    `;
}

function renderFeatureList(plan, iconColor) {
    if (plan.style === 'dashed' || (!plan.features.length && !plan.userLimit)) return '';
    
    let html = `<ul class="list-unstyled flex-grow-1 small">`;
    
    // User Limit Item
    if (plan.userLimit) {
        let text = typeof plan.userLimit === 'number' ? `Hasta ${plan.userLimit} usuarios` : `${plan.userLimit}`;
        if(typeof plan.userLimit === 'string' && plan.userLimit.includes('Más')) text = `${plan.userLimit} usuarios`; 
        
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
        // Bind Currency Switch (Checked = USD, Unchecked = COP)
        const currencySwitch = document.getElementById('currencySwitch');
        if(currencySwitch) currencySwitch.checked = (currentCurrency === 'USD');

        // Bind Billing Switch (Checked = Annual, Unchecked = Monthly)
        const billingSwitch = document.getElementById('billingSwitch');
        if(billingSwitch) billingSwitch.checked = (billingCycle === 'annual');

        renderPlans('plans-container-dynamic', PLANS_CONFIG);
    }
});
