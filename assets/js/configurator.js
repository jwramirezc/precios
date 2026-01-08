/**
 * Configurator Page Logic
 * Handles the interaction between the UI and the PricingCalculator
 */

const app = {
    calculator: new PricingCalculator(PRICING_CONFIG),
    
    init() {
        this.calculator.setModules(MODULES_DATA);
        console.log('Pricing App Initialized');
        this.renderModules();
        this.updatePriceUI();
    },

    renderModules() {
        const modulesContainer = document.getElementById('modules-container');
        if (!modulesContainer) return;

        modulesContainer.innerHTML = '';
        this.calculator.modules.forEach(module => {
            const card = document.createElement('div');
            card.className = `module-card ${module.selected ? 'selected' : ''}`;
            card.onclick = () => this.toggleModuleUI(module.id);

            card.innerHTML = `
                <div class="module-icon">${module.icon}</div>
                <div class="module-name">${module.name}</div>
                <div class="module-desc">${module.description}</div>
            `;
            modulesContainer.appendChild(card);
        });
    },

    toggleModuleUI(id) {
        this.calculator.toggleModule(id);
        this.renderModules();
        this.updatePriceUI();
    },

    updatePriceUI() {
        const totalPriceEl = document.getElementById('total-price');
        const userCountDisplay = document.getElementById('user-count-display');
        const labelEl = document.getElementById('price-label');

        if (!totalPriceEl) return;

        // Update Label
        if (this.calculator.licenseType === 'saas' && this.calculator.billingCycle === 'annual') {
            labelEl.textContent = 'Precio Estimado Anual';
        } else {
            labelEl.textContent = 'Precio Estimado Mensual';
        }

        // Update Price
        totalPriceEl.textContent = this.calculator.getFormattedTotal();
    }
};

// --- Globals (Window) for HTML attributes ---
// In a stricter setup, we'd use EventListeners, but keeping inline compatibility
window.setCurrency = function (curr) {
    app.calculator.updateConfig('currency', curr);
    
    // UI Toggle Logic
    document.getElementById('btn-cop').className = `radio-card ${curr === 'COP' ? 'active' : ''}`;
    document.getElementById('btn-usd').className = `radio-card ${curr === 'USD' ? 'active' : ''}`;
    
    app.updatePriceUI();
}

window.setBilling = function (cycle) {
    app.calculator.updateConfig('billingCycle', cycle);
    
    // UI Toggle Logic
    document.getElementById('btn-monthly').className = `radio-card ${cycle === 'monthly' ? 'active' : ''}`;
    document.getElementById('btn-annual').className = `radio-card ${cycle === 'annual' ? 'active' : ''}`;
    
    app.updatePriceUI();
}

// License toggle removed as per requirement (SaaS only)

window.updateUsers = function (val) {
    app.calculator.updateConfig('userCount', parseInt(val));
    const userCountDisplay = document.getElementById('user-count-display');
    if(userCountDisplay) userCountDisplay.textContent = val;
    app.updatePriceUI();
}

window.updateStorage = function (val) {
    app.calculator.updateConfig('storageGB', parseInt(val));
    app.updatePriceUI();
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
