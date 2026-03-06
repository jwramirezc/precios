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
let COMPARISON_SUMMARY = null;

// Comparison configuration loader
const ComparisonConfigLoader = {
    /**
     * Load comparison configuration and plan names/summaries from JSON files.
     * Plan names and summaryDescription come from plans-config.json (single source of truth).
     */
    async load() {
        try {
            const [items, plans] = await Promise.all([
                fetch('assets/data/comparison-config.json').then(r => r.json()),
                fetch('assets/data/plans-config.json').then(r => r.json())
            ]);
            COMPARISON_ITEMS = items;
            COMPARISON_SUMMARY = plans
                .filter(p => p.summaryDescription)
                .map(p => ({ name: p.name, description: p.summaryDescription }));
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
