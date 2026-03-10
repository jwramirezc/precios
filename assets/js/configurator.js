/**
 * Configurator Page Logic
 * Handles the interaction between the UI and the PricingCalculator
 */

const app = {
  calculator: null,
  activePresetId: null,

  init() {
    if (!PRICING_CONFIG || !MODULES_DATA || !MODULE_PRICING) {
      console.warn('Waiting for configuration to load...');
      return;
    }

    this.calculator = new PricingCalculator(PRICING_CONFIG);
    this.calculator.setModules(MODULES_DATA);
    this.calculator.setPricingTiers(MODULE_PRICING);
    console.log('Pricing App Initialized');
    this.loadConfiguratorTexts();
    this.updateAnnualDiscountLabel();
    this.initializeUserSlider();
    this.initializeStorageSlider();
    this.renderModules();
    this.renderPresets();

    // Auto-load preset from URL param (?preset=basic|standard|professional)
    const urlPreset = new URLSearchParams(window.location.search).get('preset');
    if (urlPreset) {
      this.loadPreset(urlPreset);
    } else {
      this.updatePriceUI();
    }
  },

  loadConfiguratorTexts() {
    if (!CONFIGURATOR_TEXTS) return;
    const texts = CONFIGURATOR_TEXTS;

    const headerTitle = document.querySelector('.display-6.fw-bold');
    if (headerTitle && texts.header?.title)
      headerTitle.textContent = texts.header.title;

    const headerSubtitle = document.querySelector('.lead.text-muted');
    if (headerSubtitle && texts.header?.subtitle)
      headerSubtitle.textContent = texts.header.subtitle;

    const headerDisclaimer = document.querySelector('.small.text-muted');
    if (headerDisclaimer && texts.header?.disclaimer)
      headerDisclaimer.textContent = texts.header.disclaimer;

    const configTitle = document.querySelector('.section-title');
    if (configTitle && texts.sidebar?.configTitle)
      configTitle.textContent = texts.sidebar.configTitle;
  },

  updateAnnualDiscountLabel() {
    const annualDiscount = PRICING_CONFIG?.annualDiscountPercent;
    const el = document.getElementById('annual-discount-label');
    if (el && annualDiscount !== undefined)
      el.textContent = `-${annualDiscount}%`;
  },

  initializeUserSlider() {
    const userSlider = PRICING_CONFIG.userSlider;
    if (!userSlider) {
      console.error('Missing userSlider in pricing-config.json');
      return;
    }

    const usersInput = document.getElementById('users-input');
    const userCountDisplay = document.getElementById('user-count-display');

    if (usersInput) {
      usersInput.min = userSlider.min;
      usersInput.max = userSlider.max;
      usersInput.value = userSlider.default;
      usersInput.step = userSlider.step;
      this.calculator.updateConfig('userCount', userSlider.default);
    }
    if (userCountDisplay) userCountDisplay.textContent = userSlider.default;
  },

  initializeStorageSlider() {
    const storageSlider = PRICING_CONFIG.storageSlider;
    if (!storageSlider) {
      console.error('Missing storageSlider in pricing-config.json');
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
      this.calculator.updateConfig('storageGB', storageSlider.default);
    }
    if (storageCountDisplay)
      storageCountDisplay.textContent = storageSlider.default;
  },

  getCategoryInfo(categoryId) {
    if (!CATEGORIES_CONFIG)
      return {
        name: 'Cargando...',
        icon: '<i class="fa-solid fa-spinner fa-spin"></i>',
      };
    const category = CATEGORIES_CONFIG.find(cat => cat.id === categoryId);
    if (category)
      return {
        name: category.name,
        icon: `<i class="fa-solid fa-${category.icon}"></i>`,
      };
    const otros = CATEGORIES_CONFIG.find(cat => cat.id === 'otros');
    return otros
      ? { name: otros.name, icon: `<i class="fa-solid fa-${otros.icon}"></i>` }
      : { name: 'Otros', icon: '<i class="fa-solid fa-cubes"></i>' };
  },

  /* ------------------------------------------------------------------ */
  /*  Preset selector                                                    */
  /* ------------------------------------------------------------------ */

  renderPresets() {
    const container = document.getElementById('presets-container');
    if (!container) return;

    // Use plans with includedModules as presets (basic, standard, professional)
    const presets = (PLANS_CONFIG || []).filter(p => p.includedModules);
    if (!presets.length) return;

    const customActive = this.activePresetId === null;
    let html = `
      <div class="preset-card ${customActive ? 'active' : ''}" onclick="app.loadPreset(null)">
        <div class="preset-card-icon"><i class="fa-solid fa-pen-ruler"></i></div>
        <div class="preset-card-name">Personalizada</div>
        <div class="preset-card-sub">Desde cero</div>
        <div class="preset-card-cta">${customActive ? 'Activa ✓' : 'Seleccionar'}</div>
      </div>`;

    presets.forEach(preset => {
      const isActive = this.activePresetId === preset.id;
      const exchangeRate = this.calculator.config.exchangeRate || 4000;
      const priceCOP = typeof preset.price === 'number'
        ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(preset.price * exchangeRate) + '/mes'
        : '';
      html += `
        <div class="preset-card ${isActive ? 'active' : ''}" onclick="app.loadPreset('${preset.id}')">
          <div class="preset-card-icon"><i class="fa-solid ${preset.icon}"></i></div>
          <div class="preset-card-name">${preset.name}</div>
          <div class="preset-card-sub">${preset.presetSubtitle || ''}</div>
          <div class="preset-card-price">${priceCOP}</div>
          <div class="preset-card-cta">${isActive ? 'Cargada ✓' : 'Cargar'}</div>
        </div>`;
    });

    container.innerHTML = html;

    const presetNote = document.getElementById('preset-note');
    if (presetNote)
      presetNote.style.display = this.activePresetId ? 'block' : 'none';
  },

  /**
   * Load a reference preset (or reset to custom mode if presetId === null).
   * Uses includedModules / includedUsers / includedStorageGB from JSON.
   */
  loadPreset(presetId) {
    // Clear all module selections, preset markers and quantity selectors
    this.calculator.modules.forEach(m => {
      m.selected = false;
      if (m.hasQuantity()) {
        m.selectedQty = m.quantity_config.default_qty;
        this._hideQuantitySelector(m.id);
      }
    });
    document.querySelectorAll('.module-item').forEach(el => {
      el.classList.remove('selected', 'preset-included');
    });

    if (presetId === null) {
      const defaultUsers = this.calculator.config.userSlider?.default || 5;
      const defaultStorage =
        this.calculator.config.storageSlider?.default || 100;
      this.calculator.updateConfig('userCount', defaultUsers);
      this.calculator.updateConfig('storageGB', defaultStorage);
      this._setSlider('users-input', 'user-count-display', defaultUsers);
      this._setSlider('storage-input', 'storage-count-display', defaultStorage);
      this.calculator.setActivePreset(null);
      this.activePresetId = null;
      this.renderPresets();
      this.updatePriceUI();
      return;
    }

    const preset = (PLANS_CONFIG || []).find(p => p.id === presetId && p.includedModules);
    if (!preset) return;

    // Select and mark preset's includedModules
    const includedModules = preset.includedModules || [];
    const includedQtys = preset.includedQuantities || {};
    includedModules.forEach(moduleId => {
      const module = this.calculator.getModuleById(moduleId);
      if (module && module.visible) {
        module.selected = true;
        // Apply included quantity (or keep default_qty if not in includedQuantities)
        if (module.hasQuantity()) {
          module.selectedQty =
            includedQtys[moduleId] || module.quantity_config.default_qty;
          this._showQuantitySelector(module);
        }
        const el = document.querySelector(`[data-module-id="${moduleId}"]`);
        if (el) el.classList.add('selected', 'preset-included');
      }
    });

    // Set users and storage from preset
    this.calculator.updateConfig('userCount', preset.includedUsers);
    this.calculator.updateConfig('storageGB', preset.includedStorageGB);
    this._setSlider('users-input', 'user-count-display', preset.includedUsers);
    this._setSlider(
      'storage-input',
      'storage-count-display',
      preset.includedStorageGB
    );

    // Activate preset mode in calculator
    this.calculator.setActivePreset(preset);
    this.activePresetId = presetId;
    this.renderPresets();
    this.updatePriceUI();
  },

  /** Helper: update a range input and its display label simultaneously. */
  _setSlider(inputId, displayId, value) {
    const input = document.getElementById(inputId);
    if (input) input.value = value;
    const display = document.getElementById(displayId);
    if (display) display.textContent = value;
  },

  /* ------------------------------------------------------------------ */
  /*  Module grid                                                        */
  /* ------------------------------------------------------------------ */

  renderModules() {
    const modulesContainer = document.getElementById('modules-container');
    if (!modulesContainer) return;

    const modulesByCategory = {};
    this.calculator.modules.forEach(module => {
      if (!module.visible) return;
      const category = module.category || 'otros';
      if (!modulesByCategory[category]) modulesByCategory[category] = [];
      modulesByCategory[category].push(module);
    });

    modulesContainer.innerHTML = '';

    Object.keys(modulesByCategory).forEach(categoryId => {
      const categoryInfo = this.getCategoryInfo(categoryId);
      const modules = modulesByCategory[categoryId];
      if (!modules.length) return;

      const categoryCard = document.createElement('div');
      categoryCard.className = 'module-category-card';
      categoryCard.innerHTML = `
        <div class="category-header">
          <div class="category-icon">${categoryInfo.icon}</div>
          <h3 class="category-title">${categoryInfo.name}</h3>
        </div>
        <div class="category-modules">
          ${modules.map(module => this.renderModuleItem(module)).join('')}
        </div>`;
      modulesContainer.appendChild(categoryCard);
    });
  },

  renderModuleItem(module) {
    const isCustomService = !module.calculable;
    const selectedClass = module.selected ? 'selected' : '';
    const customServiceClass = isCustomService ? 'custom-service' : '';
    const moduleTexts = CONFIGURATOR_TEXTS?.modulesSection || {};
    const infoText = moduleTexts.infoLinkText || 'Más info';
    const infoTitle = moduleTexts.infoLinkTitle || 'Más información sobre';

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
             title="${infoTitle} ${module.name}"
             onclick="event.stopPropagation()">
            <i class="fa-solid fa-circle-info"></i> ${infoText}
          </a>
        </div>
        ${module.hasQuantity() ? `<div class="module-quantity-selector" data-qty-for="${module.id}" style="display:none"></div>` : ''}
      </div>`;
  },

  toggleModuleItem(moduleId, event) {
    if (event && event.target.closest('.module-item-info-link')) return;
    this.toggleModuleUI(moduleId);
  },

  toggleModuleUI(id) {
    // Prevent deselecting a module that belongs to the active preset bundle
    const presetModules = this.calculator.activePreset?.includedModules || [];
    const module = this.calculator.getModuleById(id);

    if (presetModules.includes(id) && module?.selected) {
      // Visual shake: module is locked in the preset
      const el = document.querySelector(`[data-module-id="${id}"]`);
      if (el) {
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 400);
      }
      return;
    }

    this.calculator.toggleModule(id);
    this.updateModuleItemState(id);

    // Show or hide quantity selector
    if (module?.hasQuantity()) {
      if (module.selected) {
        // Reset to default qty when activating manually
        module.selectedQty = module.quantity_config.default_qty;
        this._showQuantitySelector(module);
      } else {
        this._hideQuantitySelector(id);
      }
    }

    this.updatePriceUI();
  },

  updateModuleItemState(moduleId) {
    const el = document.querySelector(`[data-module-id="${moduleId}"]`);
    if (!el) return;
    const module = this.calculator.modules.find(m => m.id === moduleId);
    if (!module) return;

    module.selected
      ? el.classList.add('selected')
      : el.classList.remove('selected');

    // Maintain preset-included marker
    const presetModules = this.calculator.activePreset?.includedModules || [];
    presetModules.includes(moduleId)
      ? el.classList.add('preset-included')
      : el.classList.remove('preset-included');
  },

  /* ------------------------------------------------------------------ */
  /*  Price UI                                                           */
  /* ------------------------------------------------------------------ */

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
    const upgradeEl = document.getElementById('upgrade-recommendation');

    if (!totalPriceEl) return;

    const selectedModules = this.calculator.getSelectedModules();
    const hasPreset = !!this.calculator.activePreset;

    // ── Empty state (no preset, no modules selected) ─────────────────
    if (!hasPreset && selectedModules.length === 0) {
      if (originalPriceContainer) originalPriceContainer.style.display = 'none';
      if (customServicesSummary) customServicesSummary.style.display = 'none';
      if (upgradeEl) upgradeEl.style.display = 'none';
      const qtySummaryEmpty = document.getElementById('quantity-summary');
      if (qtySummaryEmpty) {
        qtySummaryEmpty.innerHTML = '';
        qtySummaryEmpty.style.display = 'none';
      }
      if (labelEl) labelEl.textContent = 'Selecciona módulos para calcular';
      totalPriceEl.textContent = '—';
      this.syncSaiaInputs();
      return;
    }

    // ── Shared setup ──────────────────────────────────────────────────
    const isAnnual = this.calculator.billingCycle === 'annual';
    const currency = this.calculator.config.currency || 'COP';
    const exchangeRate = this.calculator.config.exchangeRate || 4000;
    const isCOP = currency === 'COP';
    const priceLabels = CONFIGURATOR_TEXTS?.priceLabels || {};
    const breakdown = this.calculator.calculateBreakdown();

    if (labelEl) {
      labelEl.textContent = isAnnual
        ? priceLabels.annual || 'Precio Estimado (Anual)'
        : priceLabels.monthly || 'Precio Estimado (Mensual)';
    }

    const formatMoney = amountUSD => {
      let val = isCOP ? amountUSD * exchangeRate : amountUSD;
      const opts = {
        style: 'currency',
        currency: isCOP ? 'COP' : 'USD',
        minimumFractionDigits: isCOP ? 0 : 2,
        maximumFractionDigits: isCOP ? 0 : 2,
      };
      return new Intl.NumberFormat('es-CO', opts).format(val);
    };

    // ── Upgrade recommendation (solo en modo custom) ──────────────────
    if (upgradeEl) {
      if (!breakdown.isPreset) {
        const referencePlans = this.calculator.config.referencePlans || [];
        const cur = breakdown.totalMonthlyUSD;
        const match = referencePlans.find(
          p => cur >= p.priceUSD * 0.6 && cur < p.priceUSD * 1.1
        );
        if (match && selectedModules.length > 0) {
          upgradeEl.style.display = 'block';
          upgradeEl.innerHTML = `
            <div class="alert alert-info small py-2 px-3 mb-3">
              <i class="fa-solid fa-lightbulb me-1"></i>
              <strong>Tip:</strong> La configuración <strong>${match.name}</strong> incluye bolsas de firmas y emails certificados, además de beneficios adicionales, por <strong>${formatMoney(match.priceUSD)}/mes</strong>. En configuración puede ajustar cada bolsa según necesidad.
              <a href="#" data-page="planes" class="alert-link ms-1">Comparar →</a>
            </div>`;
        } else {
          upgradeEl.style.display = 'none';
        }
      } else {
        upgradeEl.style.display = 'none';
      }
    }

    // ── Quantity modules summary (líneas de bolsa en sidebar) ─────────
    const quantitySummaryEl = document.getElementById('quantity-summary');
    if (quantitySummaryEl) {
      const qtyModules = this.calculator.modules.filter(
        m => m.selected && m.visible && m.hasQuantity() && m.selectedQty
      );
      if (qtyModules.length > 0) {
        const preset = this.calculator.activePreset;
        const includedQtys = preset?.includedQuantities || {};
        const lines = qtyModules
          .map(m => {
            const key = m.quantity_config.pricing_key;
            const includedQty = includedQtys[m.id] || 0;
            let cost = 0;
            if (preset) {
              if (m.selectedQty > includedQty) {
                cost =
                  this.calculator._getBlockPrice(key, m.selectedQty) -
                  this.calculator._getBlockPrice(key, includedQty);
              }
            } else {
              cost = this.calculator._getBlockPrice(key, m.selectedQty);
            }
            const tag =
              cost === 0
                ? `<span class="badge bg-success ms-1" style="font-size:0.7em;">Incluido</span>`
                : `<span class="qty-cost-tag">+${formatMoney(cost)}/mes</span>`;
            return `<div class="qty-summary-line">
            <span><i class="fa-solid fa-layer-group me-1 text-primary" style="font-size:0.8em;"></i>${m.name} (${m.selectedQty} ${m.quantity_config.unit}/mes)</span>
            ${tag}
          </div>`;
          })
          .join('');
        quantitySummaryEl.innerHTML = `
          <div class="qty-summary-block">
            <div class="qty-summary-title">Bolsas de consumo</div>
            ${lines}
          </div>`;
        quantitySummaryEl.style.display = 'block';
      } else {
        quantitySummaryEl.innerHTML = '';
        quantitySummaryEl.style.display = 'none';
      }
    }

    // ── Original price (annual mode) ──────────────────────────────────
    if (isAnnual && originalPriceContainer && originalPriceEl) {
      originalPriceEl.textContent = formatMoney(breakdown.totalMonthlyUSD * 12);
      originalPriceContainer.style.display = 'block';
    } else if (originalPriceContainer) {
      originalPriceContainer.style.display = 'none';
    }

    // ── Custom services summary ───────────────────────────────────────
    const selectedCustomServices = this.calculator.modules.filter(
      m => m.selected && !m.calculable
    );
    if (
      selectedCustomServices.length > 0 &&
      customServicesSummary &&
      customServicesList
    ) {
      const customServiceText =
        priceLabels.customService || 'Requiere Cotización personalizada';
      customServicesList.innerHTML = selectedCustomServices
        .map(
          s =>
            `<div class="custom-service-item">
           <i class="fa-solid fa-check text-success me-2"></i>
           <span><strong>${s.name}</strong>: ${customServiceText}</span>
         </div>`
        )
        .join('');
      customServicesSummary.style.display = 'block';
    } else if (customServicesSummary) {
      customServicesSummary.style.display = 'none';
    }

    // ── Total ─────────────────────────────────────────────────────────
    totalPriceEl.textContent = this.calculator.getFormattedTotal();
    this.syncSaiaInputs();
  },

  calculateOriginalAnnualPrice() {
    // Legacy method — kept for compatibility; logic now lives in updatePriceUI
    return 0;
  },

  /**
   * Syncs hidden #saia-* inputs so cta-redirect.js can read configurator state
   * without parsing formatted strings or coupling to internal state.
   */
  syncSaiaInputs() {
    const c = this.calculator;
    if (!c) return;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = (val != null) ? val : '';
    };

    set('saia-users',      c.userCount         || '');
    set('saia-storage-gb', c.storageGB         || '');
    set('saia-currency',   c.config.currency   || 'COP');

    const priceText = (document.getElementById('total-price') || {}).textContent || '';
    set('saia-price-estimated', priceText);

    const mods = c.getSelectedModules().map(m => m.id).join(',');
    set('saia-selected-modules', mods);

    const preset = c.activePreset;
    set('saia-selected-plan', preset ? preset.name : 'Personalizada');
  },

  /* ------------------------------------------------------------------ */
  /*  Quantity selector — módulos con quantity_config.enabled = true     */
  /* ------------------------------------------------------------------ */

  _buildQuantitySelectorHTML(module) {
    const cfg = module.quantity_config;
    const pricingDef = this.calculator.pricingTiers[cfg.pricing_key];
    if (!pricingDef?.blocks) return '';

    const options = pricingDef.blocks
      .map(
        b =>
          `<option value="${b.qty}" ${b.qty === module.selectedQty ? 'selected' : ''}>${b.label}</option>`
      )
      .join('');

    return `
      <div class="qty-inner">
        <label class="qty-label">
          <i class="fa-solid fa-layer-group"></i> ${cfg.label}
        </label>
        <select class="qty-select"
                onchange="app.updateModuleQty('${module.id}', +this.value)"
                onclick="event.stopPropagation()">
          ${options}
        </select>
      </div>`;
  },

  _showQuantitySelector(module) {
    const container = document.querySelector(`[data-qty-for="${module.id}"]`);
    if (!container) return;
    container.innerHTML = this._buildQuantitySelectorHTML(module);
    container.style.display = 'block';
  },

  _hideQuantitySelector(moduleId) {
    const container = document.querySelector(`[data-qty-for="${moduleId}"]`);
    if (!container) return;
    container.innerHTML = '';
    container.style.display = 'none';
  },

  updateModuleQty(moduleId, qty) {
    const module = this.calculator.getModuleById(moduleId);
    if (module && module.hasQuantity()) {
      module.selectedQty = qty;
      this.updatePriceUI();
    }
  },
};

// --- Globals (Window) for HTML inline handlers ---

window.setCurrency = function (curr) {
  app.calculator.updateConfig('currency', curr);
  document.getElementById('btn-cop').className =
    `radio-card ${curr === 'COP' ? 'active' : ''}`;
  document.getElementById('btn-usd').className =
    `radio-card ${curr === 'USD' ? 'active' : ''}`;
  app.updatePriceUI();
};

window.setBilling = function (cycle) {
  app.calculator.updateConfig('billingCycle', cycle);
  document.getElementById('btn-monthly').className =
    `radio-card ${cycle === 'monthly' ? 'active' : ''}`;
  document.getElementById('btn-annual').className =
    `radio-card ${cycle === 'annual' ? 'active' : ''}`;
  app.updatePriceUI();
};

window.updateUsers = function (val) {
  app.calculator.updateConfig('userCount', parseInt(val));
  const display = document.getElementById('user-count-display');
  if (display) display.textContent = val;
  app.updatePriceUI();
};

window.updateStorage = function (val) {
  app.calculator.updateConfig('storageGB', parseInt(val));
  const display = document.getElementById('storage-count-display');
  if (display) display.textContent = val;
  app.updatePriceUI();
};

window.updateModuleQty = function (moduleId, qty) {
  app.updateModuleQty(moduleId, qty);
};

// Initialize when configs are loaded (only on configurator page)
// Requires PLANS_CONFIG because loadPreset() now reads presets from it.
function initializeConfigurator() {
  if (!document.getElementById('configurator-container')) return;
  if (PRICING_CONFIG && MODULES_DATA && MODULE_PRICING && PLANS_CONFIG) app.init();
}

document.addEventListener('configLoaded', initializeConfigurator);
document.addEventListener('plansConfigLoaded', initializeConfigurator);
document.addEventListener('DOMContentLoaded', initializeConfigurator);
