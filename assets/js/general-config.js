/**
 * General Configuration Loader
 * Loads general configuration from JSON file
 */

let GENERAL_CONFIG = null;

async function loadGeneralConfig() {
    try {
        const response = await fetch('assets/data/general-config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        GENERAL_CONFIG = await response.json();
        
        // Dispatch event when config is loaded
        document.dispatchEvent(new CustomEvent('generalConfigLoaded'));
    } catch (error) {
        console.error('Error loading general-config.json:', error);
        // Set default values if loading fails
        GENERAL_CONFIG = {
            links: {
                contactSales: "https://www.saiasoftware.com/soporte-en-linea/",
                contactUs: "https://www.saiasoftware.com/soporte-en-linea/",
                requestDemo: "https://www.saiasoftware.com/#demo"
            }
        };
        document.dispatchEvent(new CustomEvent('generalConfigLoaded'));
    }
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
