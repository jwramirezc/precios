// config.js
// Loads configuration data from JSON files for easier maintenance

// Global variables to store loaded data
let PRICING_CONFIG = null;
let MODULES_DATA = null;
let REASONS_DATA = null;

// Configuration loader
const ConfigLoader = {
    /**
     * Load all configuration data from JSON files
     */
    async loadAll() {
        try {
            const [pricing, modules, reasons] = await Promise.all([
                fetch('assets/data/pricing-config.json').then(r => r.json()),
                fetch('assets/data/modules-data.json').then(r => r.json()),
                fetch('assets/data/reasons-data.json').then(r => r.json())
            ]);

            PRICING_CONFIG = pricing;
            MODULES_DATA = modules;
            REASONS_DATA = reasons;

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
            PRICING_CONFIG = await response.json();
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
     * Fallback default values if JSON loading fails
     */
    loadDefaults() {
        PRICING_CONFIG = {
            basePricePerUser: 10,
            saasMultiplier: 1.0,
            onPremiseMultiplier: 2.5,
            annualSaaSMultiplier: 0.85,
            storagePricePerGB: 0.5,
            moduleBasePrice: 50,
            exchangeRate: 3800,
            currency: 'COP'
        };
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
