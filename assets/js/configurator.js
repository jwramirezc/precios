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
    const annualDiscount = PRICING_CONFIG?.annualDiscountPercent;
    const annualDiscountLabel = document.getElementById(
      'annual-discount-label'
    );
    if (annualDiscountLabel && annualDiscount !== undefined) {
      annualDiscountLabel.textContent = `-${annualDiscount}%`;
    }
  },

  initializeUserSlider() {
    const userSlider = PRICING_CONFIG.userSlider;
    if (!userSlider) {
      console.error('Missing userSlider configuration in pricing-config.json');
      return;
    }

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
    const storageSlider = PRICING_CONFIG.storageSlider;
    if (!storageSlider) {
      console.error('Missing storageSlider configuration in pricing-config.json');
      return;
    }

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

    // --- LOGIC FIX: Check for empty selection ---
    const selectedModules = this.calculator.getSelectedModules();
    const breakdownContainer = document.getElementById('price-breakdown');

    // If no modules selected, hide everything and show 0
    if (selectedModules.length === 0) {
      // Hide breakdown if exists
      if (breakdownContainer) breakdownContainer.innerHTML = '';

      // Hide original price
      if (originalPriceContainer) originalPriceContainer.style.display = 'none';

      // Hide custom services
      if (customServicesSummary) customServicesSummary.style.display = 'none';

      // Set total to 0 formatted
      const currency = this.calculator.config.currency || 'COP';
      // Create a temp 0 format
      const zeroFormatted = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: currency === 'COP' ? 'COP' : 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: currency === 'COP' ? 0 : 2
      }).format(0);

      totalPriceEl.textContent = zeroFormatted;

      return; // Stop execution here
    }
    // --------------------------------------------

    // Update Label
    const isAnnual = this.calculator.billingCycle === 'annual';
    if (isAnnual) {
      labelEl.textContent = 'Precio Estimado (Anual)';
    } else {
      labelEl.textContent = 'Precio Estimado (Mensual)';
    }

    // Get Breakdown
    const breakdown = this.calculator.calculateBreakdown();
    const currency = this.calculator.config.currency || 'COP';
    const exchangeRate = this.calculator.config.exchangeRate || 4000;
    const isCOP = currency === 'COP';

    // Helper format function
    const formatMoney = (amountUSD) => {
      let val = amountUSD;
      if (isCOP) val *= exchangeRate;
      const opts = { style: 'currency', currency: isCOP ? 'COP' : 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 };
      if (!isCOP) { opts.minimumFractionDigits = 2; opts.maximumFractionDigits = 2; }
      return new Intl.NumberFormat('es-CO', opts).format(val);
    };

    // Render Breakdown (Optional: insert into DOM if container exists, otherwise just log or simple display)
    // Assuming we want to show it in the UI, let's look for a container or create one.
    // Ideally user would have asked to create a breakdown container, but I will append it before total if possible
    // or just rely on total. The user prompt asked to "Mostrar breakdown".

    // Let's create a breakdown HTML string and inject it into a new container if it doesn't exist
    // Check definition above (already defined: breakdownContainer)
    let containerToUse = breakdownContainer;
    if (!containerToUse) {
      // Find where to insert it. Usually before total price.
      const totalContainer = totalPriceEl.parentElement;
      containerToUse = document.createElement('div');
      containerToUse.id = 'price-breakdown';
      containerToUse.className = 'mb-3 small text-muted';
      if (totalContainer && totalContainer.parentElement) {
        totalContainer.parentElement.insertBefore(containerToUse, totalContainer);
      }
    }

    if (containerToUse) {
      containerToUse.innerHTML = `
            <div class="d-flex justify-content-between mb-0">
                <span>Usuarios (${this.calculator.userCount}):</span>
                <span>${formatMoney(breakdown.userCost)}</span>
            </div>
            <div class="microcopy-price-user text-end mb-2">
                ≈ ${formatMoney(breakdown.userCost / this.calculator.userCount)} por usuario
            </div>
            <div class="mb-1">
                <div class="d-flex justify-content-between">
                    <span>Módulos (${this.calculator.getSelectedModules().length} seleccionados):</span>
                    <span>${formatMoney(breakdown.modulesCost)}</span>
                </div>
                ${this.calculator.getSelectedModules().length > 0 ?
          `<div class="text-muted ms-2" style="font-size: 0.85em; list-style-type: none;">
                        Incluye: ${this.calculator.getSelectedModules().map(m => m.name).slice(0, 3).join(', ')}${this.calculator.getSelectedModules().length > 3 ? '...' : ''}
                    </div>` : ''
        }
            </div>
            <div class="d-flex justify-content-between mb-1">
                <span>Almacenamiento (${this.calculator.storageGB} GB):</span>
                <span>
                    ${breakdown.storageCost === 0 ? '<span class="badge bg-success text-white">Incluido</span>' : formatMoney(breakdown.storageCost)}
                </span>
            </div>
            ${breakdown.multiplier > 1.0 ?
          `<div class="d-flex justify-content-between mb-1 text-warning">
                    <span>Multiplicador Enterprise:</span>
                    <span>x${breakdown.multiplier.toFixed(1)}</span>
                 </div>` : ''
        }
            <div class="border-bottom my-2"></div>
        `;
    }


    // Calculate and show original price if annual
    if (isAnnual && originalPriceContainer && originalPriceEl) {
      // Calculate original price (without discount)
      // Original Annual = Monthly * 12
      // The breakdown calculates monthly USD. 
      // Annual WITHOUT discount is just breakdown.totalMonthlyUSD * 12

      const originalTotalUSD = breakdown.totalMonthlyUSD * 12;
      originalPriceEl.textContent = formatMoney(originalTotalUSD);
      originalPriceContainer.style.display = 'block';
    } else if (originalPriceContainer) {
      originalPriceContainer.style.display = 'none';
    }

    // Update Custom Services Summary (Keep existing logic)
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

    // Update Total Price
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
  document.getElementById('btn-cop').className = `radio-card ${curr === 'COP' ? 'active' : ''
    }`;
  document.getElementById('btn-usd').className = `radio-card ${curr === 'USD' ? 'active' : ''
    }`;

  app.updatePriceUI();
};

window.setBilling = function (cycle) {
  app.calculator.updateConfig('billingCycle', cycle);

  // UI Toggle Logic
  document.getElementById('btn-monthly').className = `radio-card ${cycle === 'monthly' ? 'active' : ''
    }`;
  document.getElementById('btn-annual').className = `radio-card ${cycle === 'annual' ? 'active' : ''
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
