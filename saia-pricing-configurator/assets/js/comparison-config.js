/**
 * Comparison Matrix Configuration
 * Loads comparison data from JSON file for easier maintenance.
 * Defines the features and their availability per plan.
 * Values:
 * - true: Check icon (Included)
 * - false: Cross icon (Not included)
 * - string: Custom text (e.g., "10 GB", "Priority")
 * 
 * Edit assets/data/comparison-config.json to modify comparison data.
 */

let COMPARISON_ITEMS = null;

// Comparison configuration loader
const ComparisonConfigLoader = {
    /**
     * Load comparison configuration from JSON file
     */
    async load() {
        try {
            const baseUrl = typeof getDataUrl === 'function' ? getDataUrl() : 'assets/data/';
            const response = await fetch(baseUrl + 'comparison-config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            COMPARISON_ITEMS = await response.json();
            // Dispatch event when comparison config is loaded
            document.dispatchEvent(new CustomEvent('comparisonConfigLoaded'));
            return COMPARISON_ITEMS;
        } catch (error) {
            console.error('Error loading comparison configuration:', error);
            return null;
        }
    }
};

// Auto-load comparison configuration when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ComparisonConfigLoader.load();
    });
} else {
    ComparisonConfigLoader.load();
}
