/**
 * Plans Configuration
 * Loads plans data from JSON file for easier maintenance.
 * Edit assets/data/plans-config.json to change prices, descriptions, or features.
 */

let PLANS_CONFIG = null;

// Plans configuration loader
const PlansConfigLoader = {
    /**
     * Load plans configuration from JSON file
     */
    async load() {
        try {
            const baseUrl = typeof getDataUrl === 'function' ? getDataUrl() : 'assets/data/';
            const response = await fetch(baseUrl + 'plans-config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            PLANS_CONFIG = await response.json();
            // Dispatch event when plans config is loaded
            document.dispatchEvent(new CustomEvent('plansConfigLoaded'));
            return PLANS_CONFIG;
        } catch (error) {
            console.error('Error loading plans configuration:', error);
            return null;
        }
    }
};

// Auto-load plans configuration when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        PlansConfigLoader.load();
    });
} else {
    PlansConfigLoader.load();
}