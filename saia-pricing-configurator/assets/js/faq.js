/**
 * FAQ Accordion Module
 * Loads FAQ data from JSON and renders an interactive accordion
 */

const FAQManager = {
    faqData: [],
    activeItemId: null,

    /**
     * Initialize FAQ section
     */
    async init() {
        try {
            await this.loadFAQData();
            this.renderFAQ();
            this.attachEventListeners();
        } catch (error) {
            console.error('Error initializing FAQ:', error);
            this.showError();
        }
    },

    /**
     * Load FAQ data from JSON file
     */
    async loadFAQData() {
        try {
            const response = await fetch('assets/data/faq.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.faqData = await response.json();
        } catch (error) {
            console.error('Error loading FAQ data:', error);
            throw error;
        }
    },

    /**
     * Render FAQ accordion from data
     */
    renderFAQ() {
        const container = document.getElementById('faq-container');
        if (!container) {
            console.warn('FAQ container not found');
            return;
        }

        if (this.faqData.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay preguntas disponibles en este momento.</p>';
            return;
        }

        container.innerHTML = this.faqData.map((item) => {
            return `
                <div class="faq-item" data-faq-id="${item.id}">
                    <button 
                        class="faq-header" 
                        id="faq-header-${item.id}"
                        aria-expanded="false"
                        aria-controls="faq-content-${item.id}"
                        role="button"
                        tabindex="0"
                    >
                        <span class="faq-question">${this.escapeHtml(item.question)}</span>
                        <span class="faq-icon">
                            <i class="fa-solid fa-chevron-down"></i>
                        </span>
                    </button>
                    <div 
                        class="faq-content" 
                        id="faq-content-${item.id}"
                        role="region"
                        aria-labelledby="faq-header-${item.id}"
                    >
                        <div class="faq-answer">
                            ${this.escapeHtml(item.answer)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Attach event listeners to FAQ items
     */
    attachEventListeners() {
        const container = document.getElementById('faq-container');
        if (!container) return;

        // Handle click events
        container.addEventListener('click', (e) => {
            const header = e.target.closest('.faq-header');
            if (header) {
                const faqItem = header.closest('.faq-item');
                if (faqItem) {
                    this.toggleItem(faqItem.dataset.faqId);
                }
            }
        });

        // Handle keyboard events (Enter and Space)
        container.addEventListener('keydown', (e) => {
            const header = e.target.closest('.faq-header');
            if (header && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                const faqItem = header.closest('.faq-item');
                if (faqItem) {
                    this.toggleItem(faqItem.dataset.faqId);
                }
            }
        });
    },

    /**
     * Toggle FAQ item (open/close)
     * Only one item can be open at a time
     */
    toggleItem(itemId) {
        const item = document.querySelector(`[data-faq-id="${itemId}"]`);
        if (!item) return;

        const header = item.querySelector('.faq-header');
        const isCurrentlyActive = item.classList.contains('active');

        // Close all items first
        document.querySelectorAll('.faq-item').forEach(faqItem => {
            faqItem.classList.remove('active');
            const faqHeader = faqItem.querySelector('.faq-header');
            if (faqHeader) {
                faqHeader.setAttribute('aria-expanded', 'false');
            }
        });

        // If the clicked item was not active, open it
        if (!isCurrentlyActive) {
            item.classList.add('active');
            if (header) {
                header.setAttribute('aria-expanded', 'true');
            }
            this.activeItemId = itemId;
        } else {
            this.activeItemId = null;
        }
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Show error message if FAQ fails to load
     */
    showError() {
        const container = document.getElementById('faq-container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-warning" role="alert">
                    <p>No se pudo cargar las preguntas frecuentes. Por favor, intente recargar la página.</p>
                </div>
            `;
        }
    }
};

// Initialize FAQ when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    FAQManager.init();
});
