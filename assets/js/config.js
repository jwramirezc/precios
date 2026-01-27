// config.js
// Loads configuration data from JSON files for easier maintenance

// Global variables to store loaded data
let PRICING_CONFIG = null;
let MODULES_DATA = null;
let REASONS_DATA = null;
let PROPOSAL_BENEFITS = null;
let MODULE_PRICING = null;

// Configuration loader
const ConfigLoader = {
    /**
     * Load all configuration data from JSON files
     */
    async loadAll() {
        try {
            const [pricing, modules, reasons, proposalBenefits, modulePricing] = await Promise.all([
                fetch('assets/data/pricing-config.json').then(r => r.json()),
                fetch('assets/data/modules-data.json').then(r => r.json()),
                fetch('assets/data/reasons-data.json').then(r => r.json()),
                fetch('assets/data/proposal-benefits.json').then(r => r.json()),
                fetch('assets/data/module-pricing.json').then(r => r.json())
            ]);

            PRICING_CONFIG = this.calculateAnnualMultiplier(pricing);
            MODULES_DATA = modules;
            REASONS_DATA = reasons;
            PROPOSAL_BENEFITS = proposalBenefits;
            MODULE_PRICING = modulePricing;

            // Dispatch event when all configs are loaded
            document.dispatchEvent(new CustomEvent('configLoaded'));
        } catch (error) {
            console.error('Error loading configuration:', error);
            // Fallback to default values if JSON fails
            this.loadDefaults();
        }
    },

    /**
     * Load pricing configuration
     */
    async loadPricingConfig() {
        try {
            const response = await fetch('assets/data/pricing-config.json');
            const config = await response.json();
            PRICING_CONFIG = this.calculateAnnualMultiplier(config);
            return PRICING_CONFIG;
        } catch (error) {
            console.error('Error loading pricing config:', error);
            this.loadDefaults();
            return PRICING_CONFIG;
        }
    },

    /**
     * Load modules data
     */
    async loadModulesData() {
        try {
            const response = await fetch('assets/data/modules-data.json');
            MODULES_DATA = await response.json();
            return MODULES_DATA;
        } catch (error) {
            console.error('Error loading modules data:', error);
            return MODULES_DATA;
        }
    },

    /**
     * Load reasons data
     */
    async loadReasonsData() {
        try {
            const response = await fetch('assets/data/reasons-data.json');
            REASONS_DATA = await response.json();
            return REASONS_DATA;
        } catch (error) {
            console.error('Error loading reasons data:', error);
            return REASONS_DATA;
        }
    },

    /**
     * Load proposal benefits data
     */
    async loadProposalBenefits() {
        try {
            const response = await fetch('assets/data/proposal-benefits.json');
            PROPOSAL_BENEFITS = await response.json();
            return PROPOSAL_BENEFITS;
        } catch (error) {
            console.error('Error loading proposal benefits:', error);
            return PROPOSAL_BENEFITS;
        }
    },

    /**
     * Calculate annualSaaSMultiplier from annualDiscountPercent
     */
    calculateAnnualMultiplier(config) {
        if (config.annualDiscountPercent !== undefined) {
            config.annualSaaSMultiplier = 1 - (config.annualDiscountPercent / 100);
        } else if (!config.annualSaaSMultiplier) {
            // Fallback: if neither is defined, use 15% discount
            config.annualDiscountPercent = 15;
            config.annualSaaSMultiplier = 0.85;
        }
        return config;
    },

    /**
     * Fallback default values if JSON loading fails
     */
    loadDefaults() {
        console.error('Critical Error: Configuration could not be loaded from JSON files. Use assets/data/*.json to configure the application.');
        PRICING_CONFIG = null;
    }
};

// Auto-load configurations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ConfigLoader.loadAll();
    });
} else {
    ConfigLoader.loadAll();
}
