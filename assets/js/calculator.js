/**
 * Modern Pricing Page - Core Logic
 * Uses Object-Oriented Principles
 */

// --- Classes ---

class Module {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.icon = data.icon;
        this.url = data.url || 'https://www.saiasoftware.com/';
        this.calculable = data.calculable !== undefined ? data.calculable : true;
        this.type = data.type || 'module';
        this.price_behavior = data.price_behavior || 'standard';
        this.selected = false;
    }

    toggle() {
        this.selected = !this.selected;
    }
}

class PricingCalculator {
    constructor(config) {
        this.config = config;
        this.modules = [];
        this.userCount = 10; // Default
        this.licenseType = 'saas'; // 'saas' or 'on_premise'
        this.billingCycle = 'monthly'; // 'monthly' or 'annual'
        this.storageGB = 100; // Default
        this.additionalServices = 0; // Flat fee or similar
    }

    setModules(modulesData) {
        this.modules = modulesData.map(data => new Module(data));
    }

    getModuleById(id) {
        return this.modules.find(m => m.id === id);
    }

    toggleModule(id) {
        const module = this.getModuleById(id);
        if (module) {
            module.toggle();
            return true;
        }
        return false;
    }

    updateConfig(key, value) {
        if (this.hasOwnProperty(key)) {
            this[key] = value;
        } else if (this.config.hasOwnProperty(key)) {
             this.config[key] = value;
        }
    }

    calculateTotal() {
        // Filter only calculable modules (exclude custom services)
        const selectedCalculableModules = this.modules.filter(m => m.selected && m.calculable);
        const selectedModulesCount = selectedCalculableModules.length;
        
        if (selectedModulesCount === 0) return 0;

        let multiplier = this.licenseType === 'saas' 
            ? this.config.saasMultiplier 
            : this.config.onPremiseMultiplier;

        // Calculations in Base Currency (USD)
        const modulesCost = selectedModulesCount * this.config.moduleBasePrice;
        // User Cost (Base * Users * LicenseMultiplier)
        const userCost = (this.config.basePricePerUser * this.userCount) * multiplier;
        const storageCost = this.storageGB * this.config.storagePricePerGB;

        let totalUSD = modulesCost + userCost + storageCost + this.additionalServices;

        // Apply Annual Discount if SaaS and Annual
        if (this.licenseType === 'saas' && this.billingCycle === 'annual') {
            // Apply discount to the monthly total
            totalUSD *= this.config.annualSaaSMultiplier;
            // Then multiply by 12 for the full year
            totalUSD *= 12;
        }

        // Convert if Currency is COP
        if (this.config.currency === 'COP') {
            return totalUSD * this.config.exchangeRate;
        }

        return totalUSD;
    }

    getFormattedTotal() {
        const total = this.calculateTotal();
        const currency = this.config.currency || 'COP';
        
        // Formatter options
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

        return new Intl.NumberFormat('es-CO', options).format(total);
    }

    getSelectedModules() {
        return this.modules.filter(m => m.selected);
    }
}
