// config.js
// Loads configuration data from JSON files for easier maintenance

/**
 * Get base URL for data files
 * Works both standalone and in WordPress
 * @returns {string} Base URL for JSON data files
 */
function getDataUrl() {
    // If WordPress localized script data is available, use it
    if (typeof saiaData !== 'undefined' && saiaData.dataUrl) {
        return saiaData.dataUrl;
    }
    // Fallback for standalone usage
    return 'assets/data/';
}

// Global variables to store loaded data
let PRICING_CONFIG = null;
let MODULES_DATA = null;
let REASONS_DATA = null;
let PROPOSAL_BENEFITS = null;
let MODULE_PRICING = null;
let CATEGORIES_CONFIG = null;
let CONFIGURATOR_TEXTS = null;

// Configuration loader
const ConfigLoader = {
    /**
     * Load all configuration data from JSON files
     */
    async loadAll() {
        const baseUrl = getDataUrl();

        try {
            const [pricing, modules, reasons, proposalBenefits, modulePricing, categories, configuratorTexts] = await Promise.all([
                fetch(baseUrl + 'pricing-config.json').then(r => r.json()),
                fetch(baseUrl + 'modules-data.json').then(r => r.json()),
                fetch(baseUrl + 'reasons-data.json').then(r => r.json()),
                fetch(baseUrl + 'proposal-benefits.json').then(r => r.json()),
                fetch(baseUrl + 'module-pricing.json').then(r => r.json()),
                fetch(baseUrl + 'categories-config.json').then(r => r.json()),
                fetch(baseUrl + 'configurator-texts.json').then(r => r.json())
            ]);

            PRICING_CONFIG = this.calculateAnnualMultiplier(pricing);
            MODULES_DATA = modules;
            REASONS_DATA = reasons;
            PROPOSAL_BENEFITS = proposalBenefits;
            MODULE_PRICING = modulePricing;
            CATEGORIES_CONFIG = categories;
            CONFIGURATOR_TEXTS = configuratorTexts;

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
        const baseUrl = getDataUrl();
        try {
            const response = await fetch(baseUrl + 'pricing-config.json');
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
        const baseUrl = getDataUrl();
        try {
            const response = await fetch(baseUrl + 'modules-data.json');
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
        const baseUrl = getDataUrl();
        try {
            const response = await fetch(baseUrl + 'reasons-data.json');
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
        const baseUrl = getDataUrl();
        try {
            const response = await fetch(baseUrl + 'proposal-benefits.json');
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
