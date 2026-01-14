/**
 * Configurator Page Logic
 * Handles the interaction between the UI and the PricingCalculator
 */

const app = {
    calculator: null,
    
    init() {
        // Wait for configs to be loaded
        if (!PRICING_CONFIG || !MODULES_DATA) {
            console.warn('Waiting for configuration to load...');
            return;
        }
        
        this.calculator = new PricingCalculator(PRICING_CONFIG);
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
            card.onclick = (e) => {
                // Don't toggle if clicking on the info link
                if (!e.target.closest('.module-info-link')) {
                    this.toggleModuleUI(module.id);
                }
            };

            card.innerHTML = `
                <div class="module-icon">${module.icon}</div>
                <div class="module-name">${module.name}</div>
                <div class="module-desc">${module.description}</div>
                <a href="${module.url}" target="_blank" rel="noopener noreferrer" class="module-info-link" title="Más información sobre ${module.name}">
                    <i class="fa-solid fa-circle-info"></i> Más info
                </a>
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
        const originalPriceContainer = document.getElementById('original-price-container');
        const originalPriceEl = document.getElementById('original-price');

        if (!totalPriceEl) return;

        // Update Label
        const isAnnual = this.calculator.licenseType === 'saas' && this.calculator.billingCycle === 'annual';
        if (isAnnual) {
            labelEl.textContent = 'Precio Estimado Anual';
        } else {
            labelEl.textContent = 'Precio Estimado Mensual';
        }

        // Calculate and show original price if annual
        if (isAnnual && originalPriceContainer && originalPriceEl) {
            // Calculate original price (without discount)
            const originalTotal = this.calculateOriginalAnnualPrice();
            const currency = this.calculator.config.currency || 'COP';
            
            const options = {
                style: 'currency',
                currency: currency === 'COP' ? 'COP' : 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            };

            if (currency === 'USD') {
                options.minimumFractionDigits = 2;
                options.maximumFractionDigits = 2;
            }

            const formattedOriginalPrice = new Intl.NumberFormat('es-CO', options).format(originalTotal);
            originalPriceEl.textContent = formattedOriginalPrice;
            originalPriceContainer.style.display = 'block';
        } else if (originalPriceContainer) {
            originalPriceContainer.style.display = 'none';
        }

        // Update Price
        totalPriceEl.textContent = this.calculator.getFormattedTotal();
    },

    calculateOriginalAnnualPrice() {
        // Calculate the total without applying the annual discount
        const selectedModulesCount = this.calculator.modules.filter(m => m.selected).length;
        
        if (selectedModulesCount === 0) return 0;

        let multiplier = this.calculator.licenseType === 'saas' 
            ? this.calculator.config.saasMultiplier 
            : this.calculator.config.onPremiseMultiplier;

        // Calculations in Base Currency (USD)
        const modulesCost = selectedModulesCount * this.calculator.config.moduleBasePrice;
        const userCost = (this.calculator.config.basePricePerUser * this.calculator.userCount) * multiplier;
        const storageCost = this.calculator.storageGB * this.calculator.config.storagePricePerGB;

        // Monthly total
        let monthlyTotalUSD = modulesCost + userCost + storageCost + this.calculator.additionalServices;
        
        // Annual total without discount (just multiply by 12)
        let annualTotalUSD = monthlyTotalUSD * 12;

        // Convert if Currency is COP
        if (this.calculator.config.currency === 'COP') {
            return annualTotalUSD * this.calculator.config.exchangeRate;
        }

        return annualTotalUSD;
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

// Initialize when configs are loaded
function initializeConfigurator() {
    if (PRICING_CONFIG && MODULES_DATA) {
        app.init();
    }
}

// Wait for config to load
document.addEventListener('configLoaded', initializeConfigurator);

// Also try on DOMContentLoaded in case configs are already loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeConfigurator();
});
