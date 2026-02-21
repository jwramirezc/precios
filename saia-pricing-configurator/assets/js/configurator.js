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
    if (headerTitle && texts.header?.title) headerTitle.textContent = texts.header.title;

    const headerSubtitle = document.querySelector('.lead.text-muted');
    if (headerSubtitle && texts.header?.subtitle) headerSubtitle.textContent = texts.header.subtitle;

    const headerDisclaimer = document.querySelector('.small.text-muted');
    if (headerDisclaimer && texts.header?.disclaimer) headerDisclaimer.textContent = texts.header.disclaimer;

    const configTitle = document.querySelector('.section-title');
    if (configTitle && texts.sidebar?.configTitle) configTitle.textContent = texts.sidebar.configTitle;
  },

  updateAnnualDiscountLabel() {
    const annualDiscount = PRICING_CONFIG?.annualDiscountPercent;
    const el = document.getElementById('annual-discount-label');
    if (el && annualDiscount !== undefined) el.textContent = `-${annualDiscount}%`;
  },

  initializeUserSlider() {
    const userSlider = PRICING_CONFIG.userSlider;
    if (!userSlider) { console.error('Missing userSlider in pricing-config.json'); return; }

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
    if (!storageSlider) { console.error('Missing storageSlider in pricing-config.json'); return; }

    const storageInput = document.getElementById('storage-input');
    const storageCountDisplay = document.getElementById('storage-count-display');

    if (storageInput) {
      storageInput.min = storageSlider.min;
      storageInput.max = storageSlider.max;
      storageInput.value = storageSlider.default;
      storageInput.step = storageSlider.step;
      this.calculator.updateConfig('storageGB', storageSlider.default);
    }
    if (storageCountDisplay) storageCountDisplay.textContent = storageSlider.default;
  },

  getCategoryInfo(categoryId) {
    if (!CATEGORIES_CONFIG) return { name: 'Cargando...', icon: '<i class="fa-solid fa-spinner fa-spin"></i>' };
    const category = CATEGORIES_CONFIG.find(cat => cat.id === categoryId);
    if (category) return { name: category.name, icon: `<i class="fa-solid fa-${category.icon}"></i>` };
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

    const presets = this.calculator.config.configurationPresets;
    if (!presets || !presets.length) return;

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
      html += `
        <div class="preset-card ${isActive ? 'active' : ''}" onclick="app.loadPreset('${preset.id}')">
          <div class="preset-card-icon"><i class="fa-solid ${preset.icon}"></i></div>
          <div class="preset-card-name">${preset.name}</div>
          <div class="preset-card-sub">${preset.subtitle}</div>
          <div class="preset-card-price">${preset.priceLabel}</div>
          <div class="preset-card-cta">${isActive ? 'Cargada ✓' : 'Cargar'}</div>
        </div>`;
    });

    container.innerHTML = html;

    const presetNote = document.getElementById('preset-note');
    if (presetNote) presetNote.style.display = this.activePresetId ? 'block' : 'none';
  },

  /**
   * Load a reference preset (or reset to custom mode if presetId === null).
   * Uses includedModules / includedUsers / includedStorageGB from JSON.
   */
  loadPreset(presetId) {
    // Clear all module selections and preset-included markers
    this.calculator.modules.forEach(m => { m.selected = false; });
    document.querySelectorAll('.module-item').forEach(el => {
      el.classList.remove('selected', 'preset-included');
    });

    if (presetId === null) {
      const defaultUsers = this.calculator.config.userSlider?.default || 5;
      const defaultStorage = this.calculator.config.storageSlider?.default || 100;
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

    const presets = this.calculator.config.configurationPresets || [];
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    // Select and mark preset's includedModules
    const includedModules = preset.includedModules || [];
    includedModules.forEach(moduleId => {
      const module = this.calculator.getModuleById(moduleId);
      if (module && module.visible) {
        module.selected = true;
        const el = document.querySelector(`[data-module-id="${moduleId}"]`);
        if (el) el.classList.add('selected', 'preset-included');
      }
    });

    // Set users and storage from preset
    this.calculator.updateConfig('userCount', preset.includedUsers);
    this.calculator.updateConfig('storageGB', preset.includedStorageGB);
    this._setSlider('users-input', 'user-count-display', preset.includedUsers);
    this._setSlider('storage-input', 'storage-count-display', preset.includedStorageGB);

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
    this.updatePriceUI();
  },

  updateModuleItemState(moduleId) {
    const el = document.querySelector(`[data-module-id="${moduleId}"]`);
    if (!el) return;
    const module = this.calculator.modules.find(m => m.id === moduleId);
    if (!module) return;

    module.selected ? el.classList.add('selected') : el.classList.remove('selected');

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
    const totalPriceEl       = document.getElementById('total-price');
    const labelEl            = document.getElementById('price-label');
    const originalPriceContainer = document.getElementById('original-price-container');
    const originalPriceEl    = document.getElementById('original-price');
    const customServicesSummary  = document.getElementById('custom-services-summary');
    const customServicesList = document.getElementById('custom-services-list');
    const breakdownContainer = document.getElementById('price-breakdown');
    const upgradeEl          = document.getElementById('upgrade-recommendation');

    if (!totalPriceEl) return;

    const selectedModules = this.calculator.getSelectedModules();
    const hasPreset = !!this.calculator.activePreset;

    // ── Empty state (no preset, no modules selected) ─────────────────
    if (!hasPreset && selectedModules.length === 0) {
      if (breakdownContainer) breakdownContainer.innerHTML = '';
      if (originalPriceContainer) originalPriceContainer.style.display = 'none';
      if (customServicesSummary) customServicesSummary.style.display = 'none';
      if (upgradeEl) upgradeEl.style.display = 'none';
      if (labelEl) labelEl.textContent = 'Seleccione módulos para calcular';
      totalPriceEl.textContent = '—';
      return;
    }

    // ── Shared setup ──────────────────────────────────────────────────
    const isAnnual      = this.calculator.billingCycle === 'annual';
    const currency      = this.calculator.config.currency || 'COP';
    const exchangeRate  = this.calculator.config.exchangeRate || 4000;
    const isCOP         = currency === 'COP';
    const priceLabels   = CONFIGURATOR_TEXTS?.priceLabels || {};
    const breakdown     = this.calculator.calculateBreakdown();

    if (labelEl) {
      labelEl.textContent = isAnnual
        ? (priceLabels.annual  || 'Precio Estimado (Anual)')
        : (priceLabels.monthly || 'Precio Estimado (Mensual)');
    }

    const formatMoney = (amountUSD) => {
      let val = isCOP ? amountUSD * exchangeRate : amountUSD;
      const opts = {
        style: 'currency',
        currency: isCOP ? 'COP' : 'USD',
        minimumFractionDigits: isCOP ? 0 : 2,
        maximumFractionDigits: isCOP ? 0 : 2
      };
      return new Intl.NumberFormat('es-CO', opts).format(val);
    };

    // ── Breakdown HTML ────────────────────────────────────────────────
    if (breakdownContainer) {
      if (breakdown.isPreset) {
        breakdownContainer.innerHTML = this._buildPresetBreakdownHTML(breakdown, formatMoney);
      } else {
        breakdownContainer.innerHTML = this._buildCustomBreakdownHTML(breakdown, formatMoney);
      }
    }

    // ── Upgrade recommendation (solo en modo custom) ──────────────────
    if (upgradeEl) {
      if (!breakdown.isPreset) {
        const referencePlans = this.calculator.config.referencePlans || [];
        const cur = breakdown.totalMonthlyUSD;
        const match = referencePlans.find(p => cur >= p.priceUSD * 0.6 && cur < p.priceUSD * 1.1);
        if (match && selectedModules.length > 0) {
          upgradeEl.style.display = 'block';
          upgradeEl.innerHTML = `
            <div class="alert alert-info small py-2 px-3 mb-3">
              <i class="fa-solid fa-lightbulb me-1"></i>
              <strong>Tip:</strong> La <strong>${match.name}</strong> incluye IA básica y firmas certificadas por <strong>${formatMoney(match.priceUSD)}/mes</strong>.
              <a href="#" data-page="planes" class="alert-link ms-1">Comparar →</a>
            </div>`;
        } else {
          upgradeEl.style.display = 'none';
        }
      } else {
        upgradeEl.style.display = 'none';
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
    const selectedCustomServices = this.calculator.modules.filter(m => m.selected && !m.calculable);
    if (selectedCustomServices.length > 0 && customServicesSummary && customServicesList) {
      const customServiceText = priceLabels.customService || 'Requiere Cotización personalizada';
      customServicesList.innerHTML = selectedCustomServices.map(s =>
        `<div class="custom-service-item">
           <i class="fa-solid fa-check text-success me-2"></i>
           <span><strong>${s.name}</strong>: ${customServiceText}</span>
         </div>`
      ).join('');
      customServicesSummary.style.display = 'block';
    } else if (customServicesSummary) {
      customServicesSummary.style.display = 'none';
    }

    // ── Total ─────────────────────────────────────────────────────────
    totalPriceEl.textContent = this.calculator.getFormattedTotal();
  },

  /**
   * Breakdown HTML for PRESET mode:
   *   Configuración [Name] (base):   $800.000
   *   [if extras] Módulos adicionales / Usuarios adicionales / Almacenamiento adicional
   */
  _buildPresetBreakdownHTML(breakdown, formatMoney) {
    const preset = this.calculator.activePreset;
    const extraUsers   = this.calculator.userCount - preset.includedUsers;
    const extraStorage = this.calculator.storageGB  - preset.includedStorageGB;

    let extrasHtml = '';

    if (breakdown.extraModules.length > 0) {
      extrasHtml += `
        <div class="d-flex justify-content-between mb-0 mt-2">
          <span>Módulos adicionales (${breakdown.extraModules.length}):</span>
          <span>${formatMoney(breakdown.extraModulesCost)}</span>
        </div>
        <div class="breakdown-modules-list">`;
      breakdown.extraModules.forEach(m => {
        const price = this.calculator.pricingTiers[m.pricing_tier] || 0;
        extrasHtml += `
          <div class="breakdown-module-item">
            <span class="breakdown-module-name">· ${m.name}</span>
            <span>${formatMoney(price)}</span>
          </div>`;
      });
      extrasHtml += `</div>`;
    }

    if (breakdown.extraUsersCost > 0) {
      extrasHtml += `
        <div class="d-flex justify-content-between mb-0 mt-1">
          <span>Usuarios adicionales (+${extraUsers}):</span>
          <span>${formatMoney(breakdown.extraUsersCost)}</span>
        </div>`;
    }

    if (breakdown.extraStorageCost > 0) {
      extrasHtml += `
        <div class="d-flex justify-content-between mb-0 mt-1">
          <span>Almacenamiento adicional (+${extraStorage} GB):</span>
          <span>${formatMoney(breakdown.extraStorageCost)}</span>
        </div>`;
    }

    const hasExtras = extrasHtml.length > 0;

    return `
      <div class="d-flex justify-content-between mb-0 fw-semibold">
        <span>Configuración ${breakdown.presetName}:</span>
        <span>${formatMoney(breakdown.presetBaseUSD)}</span>
      </div>
      <div class="text-muted mb-1" style="font-size:0.78em;">
        ${preset.includedUsers} usuarios · ${preset.includedStorageGB} GB · módulos base
      </div>
      ${breakdown.presetIncludedNote ? `
      <div class="text-muted mb-2" style="font-size:0.78em;">
        <i class="fa-solid fa-star text-warning me-1"></i>${breakdown.presetIncludedNote}
      </div>` : ''}
      ${hasExtras ? extrasHtml : ''}
      <div class="border-bottom my-2"></div>`;
  },

  /**
   * Breakdown HTML for CUSTOM mode:
   *   Plataforma base SaaS / Usuarios / Módulos (itemizados) / Almacenamiento
   */
  _buildCustomBreakdownHTML(breakdown, formatMoney) {
    const selectedCalculable = this.calculator.modules.filter(
      m => m.selected && m.calculable && m.visible
    );
    const MAX_VISIBLE = 5;
    const visible = selectedCalculable.slice(0, MAX_VISIBLE);
    const hiddenCount = selectedCalculable.length - visible.length;

    let modulesItemsHtml = '';
    if (selectedCalculable.length > 0) {
      modulesItemsHtml = `<div class="breakdown-modules-list">`;
      visible.forEach(m => {
        const price = this.calculator.pricingTiers[m.pricing_tier] || 0;
        modulesItemsHtml += `
          <div class="breakdown-module-item">
            <span class="breakdown-module-name">· ${m.name}</span>
            <span>${formatMoney(price)}</span>
          </div>`;
      });
      if (hiddenCount > 0) {
        const hiddenCost = selectedCalculable.slice(MAX_VISIBLE)
          .reduce((s, m) => s + (this.calculator.pricingTiers[m.pricing_tier] || 0), 0);
        modulesItemsHtml += `
          <div class="breakdown-module-item" style="font-style:italic;">
            <span>· y ${hiddenCount} módulo${hiddenCount > 1 ? 's' : ''} más</span>
            <span>${formatMoney(hiddenCost)}</span>
          </div>`;
      }
      modulesItemsHtml += `</div>`;
    }

    const perUserCost = this.calculator.userCount > 0
      ? breakdown.userCost / this.calculator.userCount
      : 0;

    return `
      <div class="d-flex justify-content-between mb-0 fw-semibold">
        <span>Plataforma base SaaS:</span>
        <span>${formatMoney(breakdown.platformFee)}</span>
      </div>
      <div class="text-muted mb-2" style="font-size:0.78em;">AWS · soporte técnico · actualizaciones automáticas</div>
      <div class="d-flex justify-content-between mb-0">
        <span>Usuarios (${this.calculator.userCount}):</span>
        <span>${formatMoney(breakdown.userCost)}</span>
      </div>
      <div class="microcopy-price-user text-end mb-2">
        ≈ ${formatMoney(perUserCost)} por usuario
      </div>
      <div class="mb-1">
        <div class="d-flex justify-content-between">
          <span>Módulos (${selectedCalculable.length}):</span>
          <span>${formatMoney(breakdown.modulesCost)}</span>
        </div>
        ${modulesItemsHtml}
      </div>
      <div class="d-flex justify-content-between mb-1">
        <span>Almacenamiento (${this.calculator.storageGB} GB):</span>
        <span>${breakdown.storageCost === 0
          ? '<span class="badge bg-success text-white">Incluido</span>'
          : formatMoney(breakdown.storageCost)}</span>
      </div>
      ${breakdown.multiplier > 1.0 ? `
      <div class="d-flex justify-content-between mb-1 text-warning">
        <span>Multiplicador Enterprise:</span>
        <span>x${breakdown.multiplier.toFixed(1)}</span>
      </div>` : ''}
      <div class="border-bottom my-2"></div>`;
  },

  calculateOriginalAnnualPrice() {
    // Legacy method — kept for compatibility; logic now lives in updatePriceUI
    return 0;
  },
};

// --- Globals (Window) for HTML inline handlers ---

window.setCurrency = function (curr) {
  app.calculator.updateConfig('currency', curr);
  document.getElementById('btn-cop').className = `radio-card ${curr === 'COP' ? 'active' : ''}`;
  document.getElementById('btn-usd').className = `radio-card ${curr === 'USD' ? 'active' : ''}`;
  app.updatePriceUI();
};

window.setBilling = function (cycle) {
  app.calculator.updateConfig('billingCycle', cycle);
  document.getElementById('btn-monthly').className = `radio-card ${cycle === 'monthly' ? 'active' : ''}`;
  document.getElementById('btn-annual').className  = `radio-card ${cycle === 'annual'  ? 'active' : ''}`;
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

// Initialize when configs are loaded (only on configurator page)
function initializeConfigurator() {
  if (!document.getElementById('configurator-container')) return;
  if (PRICING_CONFIG && MODULES_DATA && MODULE_PRICING) app.init();
}

document.addEventListener('configLoaded', initializeConfigurator);
document.addEventListener('DOMContentLoaded', initializeConfigurator);
