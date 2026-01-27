/**
 * Configurator Page Logic
 * Handles the interaction between the UI and the PricingCalculator
 */

const app = {
  calculator: null,

  init() {
    // Wait for configs to be loaded
    if (!PRICING_CONFIG || !MODULES_DATA || !MODULE_PRICING) {
      console.warn('Waiting for configuration to load...');
      return;
    }

    this.calculator = new PricingCalculator(PRICING_CONFIG);
    this.calculator.setModules(MODULES_DATA);
    this.calculator.setPricingTiers(MODULE_PRICING);
    console.log('Pricing App Initialized');
    this.updateAnnualDiscountLabel();
    this.initializeUserSlider();
    this.initializeStorageSlider();
    this.renderModules();
    this.updatePriceUI();
  },

  updateAnnualDiscountLabel() {
    const annualDiscount = PRICING_CONFIG?.annualDiscountPercent || 15;
    const annualDiscountLabel = document.getElementById(
      'annual-discount-label'
    );
    if (annualDiscountLabel) {
      annualDiscountLabel.textContent = `-${annualDiscount}%`;
    }
  },

  initializeUserSlider() {
    const userSlider = PRICING_CONFIG.userSlider || {
      min: 5,
      max: 500,
      default: 10,
      step: 5,
    };
    const usersInput = document.getElementById('users-input');
    const userCountDisplay = document.getElementById('user-count-display');

    if (usersInput) {
      usersInput.min = userSlider.min;
      usersInput.max = userSlider.max;
      usersInput.value = userSlider.default;
      usersInput.step = userSlider.step;

      // Update calculator with default value
      this.calculator.updateConfig('userCount', userSlider.default);
    }

    if (userCountDisplay) {
      userCountDisplay.textContent = userSlider.default;
    }
  },

  initializeStorageSlider() {
    const storageSlider = PRICING_CONFIG.storageSlider || {
      min: 10,
      max: 1000,
      default: 100,
      step: 10,
    };
    const storageInput = document.getElementById('storage-input');
    const storageCountDisplay = document.getElementById(
      'storage-count-display'
    );

    if (storageInput) {
      storageInput.min = storageSlider.min;
      storageInput.max = storageSlider.max;
      storageInput.value = storageSlider.default;
      storageInput.step = storageSlider.step;

      // Update calculator with default value
      this.calculator.updateConfig('storageGB', storageSlider.default);
    }

    if (storageCountDisplay) {
      storageCountDisplay.textContent = storageSlider.default;
    }
  },

  /**
   * Get category display info
   */
  getCategoryInfo(categoryId) {
    const categories = {
      gestion_documental: {
        name: 'Gestión Documental',
        icon: '<i class="fa-solid fa-folder-open"></i>',
      },
      atencion_servicio: {
        name: 'Atención y Servicio',
        icon: '<i class="fa-solid fa-headset"></i>',
      },
      cumplimiento_gobierno: {
        name: 'Cumplimiento y Gobierno',
        icon: '<i class="fa-solid fa-shield-halved"></i>',
      },
      procesos_operaciones: {
        name: 'Procesos y Operaciones',
        icon: '<i class="fa-solid fa-gear"></i>',
      },
      personalizacion: {
        name: 'Personalización',
        icon: '<i class="fa-solid fa-wand-magic-sparkles"></i>',
      },
    };
    return categories[categoryId] || { name: 'Otros', icon: '' };
  },

  renderModules() {
    const modulesContainer = document.getElementById('modules-container');
    if (!modulesContainer) return;

    // Group modules by category
    const modulesByCategory = {};
    this.calculator.modules.forEach(module => {
      // Use category from JSON or fallback to 'otros'
      const category = module.category || 'otros';
      if (!modulesByCategory[category]) {
        modulesByCategory[category] = [];
      }
      modulesByCategory[category].push(module);
    });

    // Render category cards
    modulesContainer.innerHTML = '';
    
    // Sort categories or define a specific order if needed, otherwise default order
    // For now we iterate the keys found
    Object.keys(modulesByCategory).forEach(categoryId => {
      const categoryInfo = this.getCategoryInfo(categoryId);
      const modules = modulesByCategory[categoryId];

      const categoryCard = document.createElement('div');
      categoryCard.className = 'module-category-card';

      categoryCard.innerHTML = `
        <div class="category-header">
          <div class="category-icon">${categoryInfo.icon}</div>
          <h3 class="category-title">${categoryInfo.name}</h3>
        </div>
        <div class="category-modules">
          ${modules.map(module => this.renderModuleItem(module)).join('')}
        </div>
      `;

      modulesContainer.appendChild(categoryCard);
    });
  },

  /**
   * Render individual module item within category
   */
  renderModuleItem(module) {
    const isCustomService = !module.calculable;
    const selectedClass = module.selected ? 'selected' : '';
    const customServiceClass = isCustomService ? 'custom-service' : '';

    return `
      <div class="module-item ${selectedClass} ${customServiceClass}" 
           data-module-id="${module.id}"
           onclick="app.toggleModuleItem('${module.id}', event)">
        <div class="module-item-header">
          <div class="module-item-icon">${module.icon}</div>
          <div class="module-item-name">${module.name}</div>
        </div>
        <div class="module-item-desc">${module.description}</div>
        <div class="module-item-footer">
          <a href="${module.url}" 
             class="module-item-info-link" 
             title="Más información sobre ${module.name}"
             onclick="event.stopPropagation()">
            <i class="fa-solid fa-circle-info"></i> Más info
          </a>
        </div>
      </div>
    `;
  },

  /**
   * Toggle module selection (called from inline onclick)
   */
  toggleModuleItem(moduleId, event) {
    // Don't toggle if clicking on the info link
    if (event && event.target.closest('.module-item-info-link')) {
      return;
    }
    this.toggleModuleUI(moduleId);
  },

  toggleModuleUI(id) {
    this.calculator.toggleModule(id);
    // Update only the affected module item instead of re-rendering all
    this.updateModuleItemState(id);
    this.updatePriceUI();
  },

  /**
   * Update individual module item state after toggle
   */
  updateModuleItemState(moduleId) {
    const moduleElement = document.querySelector(
      `[data-module-id="${moduleId}"]`
    );
    if (moduleElement) {
      const module = this.calculator.modules.find(m => m.id === moduleId);
      if (module) {
        if (module.selected) {
          moduleElement.classList.add('selected');
        } else {
          moduleElement.classList.remove('selected');
        }
      }
    }
  },

  updatePriceUI() {
    const totalPriceEl = document.getElementById('total-price');
    const userCountDisplay = document.getElementById('user-count-display');
    const labelEl = document.getElementById('price-label');
    const originalPriceContainer = document.getElementById(
      'original-price-container'
    );
    const originalPriceEl = document.getElementById('original-price');
    const customServicesSummary = document.getElementById(
      'custom-services-summary'
    );
    const customServicesList = document.getElementById('custom-services-list');

    if (!totalPriceEl) return;

    // Update Label
    const isAnnual =
      this.calculator.licenseType === 'saas' &&
      this.calculator.billingCycle === 'annual';
    if (isAnnual) {
      labelEl.textContent = 'Precio Estimado Anual';
    } else {
      labelEl.textContent = 'Precio Estimado Mensual';
    }

    // Calculate and show original price if annual
    if (isAnnual && originalPriceContainer && originalPriceEl) {
      // Calculate original price (without discount)
      const originalTotal = this.calculateOriginalAnnualPrice();
      const currency = this.calculator.config.currency || 'COP';

      const options = {
        style: 'currency',
        currency: currency === 'COP' ? 'COP' : 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      };

      if (currency === 'USD') {
        options.minimumFractionDigits = 2;
        options.maximumFractionDigits = 2;
      }

      const formattedOriginalPrice = new Intl.NumberFormat(
        'es-CO',
        options
      ).format(originalTotal);
      originalPriceEl.textContent = formattedOriginalPrice;
      originalPriceContainer.style.display = 'block';
    } else if (originalPriceContainer) {
      originalPriceContainer.style.display = 'none';
    }

    // Update Custom Services Summary
    const selectedCustomServices = this.calculator.modules.filter(
      m => m.selected && !m.calculable
    );
    if (
      selectedCustomServices.length > 0 &&
      customServicesSummary &&
      customServicesList
    ) {
      customServicesList.innerHTML = selectedCustomServices
        .map(
          service =>
            `<div class="custom-service-item">
                    <i class="fa-solid fa-check text-success me-2"></i>
                    <span><strong>${service.name}</strong>: Requiere Cotización personalizada</span>
                </div>`
        )
        .join('');
      customServicesSummary.style.display = 'block';
    } else if (customServicesSummary) {
      customServicesSummary.style.display = 'none';
    }

    // Update Price
    totalPriceEl.textContent = this.calculator.getFormattedTotal();
  },

  calculateOriginalAnnualPrice() {
    // Calculate the total without applying the annual discount
    const selectedModulesCount = this.calculator.modules.filter(
      m => m.selected
    ).length;

    if (selectedModulesCount === 0) return 0;

    let multiplier =
      this.calculator.licenseType === 'saas'
        ? this.calculator.config.saasMultiplier
        : this.calculator.config.onPremiseMultiplier;

    // Calculations in Base Currency (USD)
    const modulesCost =
      selectedModulesCount * this.calculator.config.moduleBasePrice;
    const userCost =
      this.calculator.config.basePricePerUser *
      this.calculator.userCount *
      multiplier;
    const storageCost =
      this.calculator.storageGB * this.calculator.config.storagePricePerGB;

    // Monthly total
    let monthlyTotalUSD =
      modulesCost + userCost + storageCost + this.calculator.additionalServices;

    // Annual total without discount (just multiply by 12)
    let annualTotalUSD = monthlyTotalUSD * 12;

    // Convert if Currency is COP
    if (this.calculator.config.currency === 'COP') {
      return annualTotalUSD * this.calculator.config.exchangeRate;
    }

    return annualTotalUSD;
  },
};

// --- Globals (Window) for HTML attributes ---
// In a stricter setup, we'd use EventListeners, but keeping inline compatibility
window.setCurrency = function (curr) {
  app.calculator.updateConfig('currency', curr);

  // UI Toggle Logic
  document.getElementById('btn-cop').className = `radio-card ${
    curr === 'COP' ? 'active' : ''
  }`;
  document.getElementById('btn-usd').className = `radio-card ${
    curr === 'USD' ? 'active' : ''
  }`;

  app.updatePriceUI();
};

window.setBilling = function (cycle) {
  app.calculator.updateConfig('billingCycle', cycle);

  // UI Toggle Logic
  document.getElementById('btn-monthly').className = `radio-card ${
    cycle === 'monthly' ? 'active' : ''
  }`;
  document.getElementById('btn-annual').className = `radio-card ${
    cycle === 'annual' ? 'active' : ''
  }`;

  app.updatePriceUI();
};

// License toggle removed as per requirement (SaaS only)

window.updateUsers = function (val) {
  app.calculator.updateConfig('userCount', parseInt(val));
  const userCountDisplay = document.getElementById('user-count-display');
  if (userCountDisplay) userCountDisplay.textContent = val;
  app.updatePriceUI();
};

window.updateStorage = function (val) {
  app.calculator.updateConfig('storageGB', parseInt(val));
  const storageCountDisplay = document.getElementById('storage-count-display');
  if (storageCountDisplay) storageCountDisplay.textContent = val;
  app.updatePriceUI();
};

// Initialize when configs are loaded
function initializeConfigurator() {
  if (PRICING_CONFIG && MODULES_DATA && MODULE_PRICING) {
    app.init();
  }
}

// Wait for config to load
document.addEventListener('configLoaded', initializeConfigurator);

// Also try on DOMContentLoaded in case configs are already loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeConfigurator();
});
