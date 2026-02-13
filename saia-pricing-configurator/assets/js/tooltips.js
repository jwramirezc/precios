/**
 * Generic Tooltips System
 * 
 * This system allows you to add tooltips to any element by:
 * 1. Adding a data-tooltip-id attribute to the element
 * 2. Adding the corresponding entry in tooltips-config.json
 * 
 * Example usage:
 * <span class="help-icon" data-tooltip-id="numero_usuarios">?</span>
 * 
 * Then in tooltips-config.json:
 * {
 *   "numero_usuarios": {
 *     "titulo": "Title here",
 *     "texto": "Description text here"
 *   }
 * }
 */

let TOOLTIPS_CONFIG = null;
let activeTooltip = null;

/**
 * Load tooltips configuration from JSON
 */
async function loadTooltipsConfig() {
    try {
        const baseUrl = typeof getDataUrl === 'function' ? getDataUrl() : 'assets/data/';
        const response = await fetch(baseUrl + 'tooltips-config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        TOOLTIPS_CONFIG = await response.json();
        initializeTooltips();
    } catch (error) {
        console.warn('Tooltips config not available:', error);
        // Don't break the page if tooltips can't load
        hideAllTooltips();
    }
}

/**
 * Initialize tooltips for all elements with data-tooltip-id
 */
function initializeTooltips() {
    if (!TOOLTIPS_CONFIG) return;

    const tooltipElements = document.querySelectorAll('[data-tooltip-id]');
    
    tooltipElements.forEach(element => {
        const tooltipId = element.getAttribute('data-tooltip-id');
        const tooltipData = TOOLTIPS_CONFIG[tooltipId];

        if (!tooltipData) {
            // Tooltip ID not found in config - handle gracefully
            element.style.display = 'none'; // Hide icon if no config
            return;
        }

        // Create tooltip element
        const tooltip = createTooltipElement(tooltipId, tooltipData);
        document.body.appendChild(tooltip);

        // Setup event listeners
        setupTooltipEvents(element, tooltip, tooltipId);
    });
}

/**
 * Create tooltip DOM element
 */
function createTooltipElement(tooltipId, tooltipData) {
    const tooltip = document.createElement('div');
    tooltip.id = `tooltip-${tooltipId}`;
    tooltip.className = 'tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.innerHTML = `
        <div class="tooltip-content">
            <strong class="tooltip-title">${escapeHtml(tooltipData.titulo)}</strong>
            <p class="tooltip-text">${escapeHtml(tooltipData.texto)}</p>
        </div>
        <div class="tooltip-arrow"></div>
    `;
    return tooltip;
}

/**
 * Setup event listeners for tooltip interactions
 */
function setupTooltipEvents(triggerElement, tooltip, tooltipId) {
    // Desktop: hover
    triggerElement.addEventListener('mouseenter', () => {
        showTooltip(triggerElement, tooltip);
    });

    triggerElement.addEventListener('mouseleave', () => {
        hideTooltip(tooltip);
    });

    // Mobile/touch: click/tap
    let isTooltipVisible = false;
    triggerElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isTooltipVisible) {
            hideTooltip(tooltip);
            isTooltipVisible = false;
        } else {
            // Hide any other active tooltip
            if (activeTooltip && activeTooltip !== tooltip) {
                hideTooltip(activeTooltip);
            }
            showTooltip(triggerElement, tooltip);
            isTooltipVisible = true;
        }
    });

    // Close tooltip when clicking outside
    document.addEventListener('click', (e) => {
        if (isTooltipVisible && !triggerElement.contains(e.target) && !tooltip.contains(e.target)) {
            hideTooltip(tooltip);
            isTooltipVisible = false;
        }
    });
}

/**
 * Show tooltip positioned near the trigger element
 */
function showTooltip(triggerElement, tooltip) {
    if (activeTooltip && activeTooltip !== tooltip) {
        hideTooltip(activeTooltip);
    }

    activeTooltip = tooltip;
    tooltip.setAttribute('aria-hidden', 'false');
    tooltip.classList.add('tooltip-visible');

    // Position tooltip
    positionTooltip(triggerElement, tooltip);
}

/**
 * Position tooltip relative to trigger element
 */
function positionTooltip(triggerElement, tooltip) {
    const rect = triggerElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Position below the icon by default
    let top = rect.bottom + scrollY + 8;
    let left = rect.left + scrollX + (rect.width / 2) - (tooltipRect.width / 2);

    // Adjust if tooltip goes off screen
    const viewportWidth = window.innerWidth;
    if (left + tooltipRect.width > viewportWidth) {
        left = viewportWidth - tooltipRect.width - 10;
    }
    if (left < 10) {
        left = 10;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
}

/**
 * Hide tooltip
 */
function hideTooltip(tooltip) {
    if (!tooltip) return;
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.classList.remove('tooltip-visible');
    if (activeTooltip === tooltip) {
        activeTooltip = null;
    }
}

/**
 * Hide all tooltips (fallback)
 */
function hideAllTooltips() {
    document.querySelectorAll('.tooltip').forEach(tooltip => {
        hideTooltip(tooltip);
    });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTooltipsConfig);
} else {
    loadTooltipsConfig();
}
