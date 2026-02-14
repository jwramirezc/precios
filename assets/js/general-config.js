/**
 * General Configuration Loader
 * Loads general configuration from JSON file
 */

let GENERAL_CONFIG = null;

async function loadGeneralConfig() {
    try {
        const baseUrl = typeof getDataUrl === 'function' ? getDataUrl() : 'assets/data/';
        const response = await fetch(baseUrl + 'general-config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        GENERAL_CONFIG = await response.json();

        // Apply WordPress page URL overrides if available
        if (typeof saiaData !== 'undefined' && saiaData.pageUrls) {
            if (!GENERAL_CONFIG.pageUrls) {
                GENERAL_CONFIG.pageUrls = {};
            }
            Object.assign(GENERAL_CONFIG.pageUrls, saiaData.pageUrls);
        }

        // Dispatch event when config is loaded
        document.dispatchEvent(new CustomEvent('generalConfigLoaded'));
    } catch (error) {
        console.error('Error loading general-config.json:', error);
        // Set default values if loading fails
        GENERAL_CONFIG = null;
        document.dispatchEvent(new CustomEvent('generalConfigLoaded'));
    }
}

/**
 * Returns the URL for an internal page.
 * In WordPress, returns the WP page path (e.g. /configurador/).
 * In standalone, returns the HTML filename (e.g. configurator.html).
 *
 * @param {string} page - Page key: 'planes', 'configurador', or 'comparacion'
 * @returns {string}
 */
function getPageUrl(page) {
    if (GENERAL_CONFIG && GENERAL_CONFIG.pageUrls && GENERAL_CONFIG.pageUrls[page]) {
        return GENERAL_CONFIG.pageUrls[page];
    }
    // Ultimate fallback
    const defaults = { planes: 'index.html', configurador: 'configurator.html', comparacion: 'comparison.html' };
    return defaults[page] || '#';
}

/**
 * Update links in the page with configuration values
 */
function updateLinksFromConfig() {
    if (!GENERAL_CONFIG) return;

    // Update "Solicitar Demo" buttons
    document.querySelectorAll('a[data-link="requestDemo"]').forEach(link => {
        link.href = GENERAL_CONFIG.links.requestDemo;
    });

    // Update "Contáctanos" links
    document.querySelectorAll('a[data-link="contactUs"]').forEach(link => {
        link.href = GENERAL_CONFIG.links.contactUs;
    });

    // Update "Obtener Cotización Personalizada" button
    document.querySelectorAll('a[data-link="personalizedQuote"]').forEach(link => {
        link.href = GENERAL_CONFIG.links.personalizedQuote;
    });

    // Update internal page navigation links
    document.querySelectorAll('a[data-page="planes"]').forEach(link => {
        link.href = getPageUrl('planes');
    });
    document.querySelectorAll('a[data-page="configurador"]').forEach(link => {
        link.href = getPageUrl('configurador');
    });
    document.querySelectorAll('a[data-page="comparacion"]').forEach(link => {
        link.href = getPageUrl('comparacion');
    });
}

// Load config when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadGeneralConfig();
        document.addEventListener('generalConfigLoaded', updateLinksFromConfig);
    });
} else {
    loadGeneralConfig();
    document.addEventListener('generalConfigLoaded', updateLinksFromConfig);
}
