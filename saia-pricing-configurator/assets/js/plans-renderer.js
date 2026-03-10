// State
let currentCurrency = 'COP';
let billingCycle = 'monthly'; // monthly | annual

/**
 * Plans Renderer
 * Generates HTML for the pricing cards based on PLANS_CONFIG.
 */

function toggleCurrency(isUsd) {
  currentCurrency = isUsd ? 'USD' : 'COP';
  updateLabels();
  if (PLANS_CONFIG) {
    renderPlans('plans-container-dynamic', PLANS_CONFIG);
    requestAnimationFrame(equalizeCardTopSections);
  }
}

function toggleBilling(isAnnual) {
  billingCycle = isAnnual ? 'annual' : 'monthly';
  updateLabels();
  if (PLANS_CONFIG) {
    renderPlans('plans-container-dynamic', PLANS_CONFIG);
    requestAnimationFrame(equalizeCardTopSections);
  }
}

window.addEventListener('resize', equalizeCardTopSections);

function updateLabels() {
  // Currency Labels
  document.getElementById('label-cop').className = `fw-bold ${
    currentCurrency === 'COP' ? 'text-primary' : 'text-muted'
  }`;
  document.getElementById('label-usd').className = `fw-bold ${
    currentCurrency === 'USD' ? 'text-primary' : 'text-muted'
  }`;

  // Billing Labels
  const annualDiscount = PRICING_CONFIG?.annualDiscountPercent;
  const annualBadge = `<span class="badge bg-success small rounded-pill ms-1">-${annualDiscount}%</span>`;
  document.getElementById('label-monthly').className = `fw-bold ${
    billingCycle === 'monthly' ? 'text-primary' : 'text-muted'
  }`;
  const lblAnnual = document.getElementById('label-annual');
  lblAnnual.className = `fw-bold ${
    billingCycle === 'annual' ? 'text-primary' : 'text-muted'
  }`;
  lblAnnual.innerHTML = `Anual ${annualBadge}`;
}

/**
 * Renders the main CTA button for a plan card.
 * Contact-type plans get an <a class="saia-cta"> pointing to /registro/ (JS fallback href).
 * Custom-type plans keep their onclick navigation to the configurator.
 */
function renderMainButton(plan) {
  const btnClass = getBtnClass(plan);
  const isDashed = plan.style === 'dashed';
  const extraClass = isDashed ? 'fw-bold' : '';
  const arrow = isDashed ? '<i class="fa-solid fa-arrow-right ms-2"></i>' : '';

  if (plan.buttonAction === 'contact') {
    return `<a href="https://www.saiasoftware.com/registro/"
                   class="saia-cta ${btnClass} rounded-pill py-2 ${extraClass}"
                   data-origin="planes"
                   data-cta="${plan.ctaType || 'solicitar_modelo'}">
                    ${plan.buttonText} ${arrow}
                </a>`;
  }

  // buttonAction === 'custom' — navigates to configurator, no /registro/ redirect
  return `<button onclick="${getButtonAction(plan)}" class="${btnClass} rounded-pill py-2 ${extraClass}">
                ${plan.buttonText} ${arrow}
            </button>`;
}

function renderPlans(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} not found.`);
    return;
  }

  container.innerHTML = ''; // Clear existing content

  data.forEach(plan => {
    const col = document.createElement('div');
    col.className = 'col';
    col.dataset.plan = plan.name;

    // Attach preset CTA data so cta-redirect.js can read it at click time
    if (plan.includedModules) {
      col.dataset.ctaUsers   = plan.includedUsers     || '';
      col.dataset.ctaStorage = plan.includedStorageGB || '';
      col.dataset.ctaModules = (plan.includedModules  || []).join(',');
    }
    if (typeof plan.price === 'number') {
      col.dataset.ctaPriceUsd = plan.price;
    }

    // --- Card Styles & Badge ---
    let cardClass = 'card h-100 shadow-sm rounded-4 pricing-card';
    let badgeHTML = '';
    let borderStyle = 'border-0';
    let iconColor = 'text-primary';
    let textColor = ''; // Default

    if (plan.highlight) {
      borderStyle = 'border-primary shadow position-relative overflow-hidden';
      badgeHTML = `<div class="position-absolute top-0 start-50 translate-middle-x bg-primary text-white px-3 py-1 rounded-bottom small fw-bold">Más Popular</div>`;
    }

    if (plan.style === 'white') {
      cardClass += ' bg-white';
      iconColor = 'text-dark';
      textColor = 'text-dark';
    } else if (plan.style === 'dashed') {
      borderStyle = 'border-2 border-dashed';
      cardClass = `card h-100 shadow-sm rounded-4 pricing-card`;
    }

    col.innerHTML = `
            <div class="${cardClass} ${borderStyle}" style="${
      plan.style === 'dashed'
        ? 'border-color: var(--primary) !important; background-color: #f8f9fa;'
        : ''
    }">
                ${badgeHTML}
                <div class="card-body p-4 d-flex flex-column ${
      plan.style === 'dashed' ? 'text-center' : ''
    }">
                    <!-- Top section: equalized by JS so buttons align across cards in the same row -->
                    <div class="card-top-section">
                        <!-- Invisible spacer identical in all cards so content starts at the same
                             vertical position. The "Más Popular" badge is position-absolute above. -->
                        <div class="px-3 py-1 small fw-bold invisible" aria-hidden="true">Más Popular</div>
                        <!-- Icon -->
                        <div class="mb-2 text-center">
                            <i class="fa-solid ${plan.icon} ${
      plan.style === 'dashed' ? 'fa-4x opacity-50' : 'fa-3x'
    } ${iconColor}"></i>
                        </div>

                        <!-- Title -->
                        <h3 class="card-title ${
                          plan.style === 'dashed' ? '' : 'text-center'
                        } fw-bold mb-2 ${textColor}">${plan.name}</h3>

                        <!-- Description -->
                        <p class="card-text ${
                          plan.style === 'dashed' ? '' : 'text-center'
                        } text-muted small mb-2">${plan.description}</p>

                        ${renderPriceSection(plan, textColor)}
                    </div>

                    <!-- Buttons -->
                    <div class="d-grid gap-2 mb-4">
                        ${renderMainButton(plan)}
                        ${plan.style !== 'dashed' && plan.showCustomizeButton !== false ? `
                        <button onclick="${getConfiguratorUrl(plan.id)}" class="btn-outline-primary-custom rounded-pill py-2">
                            <i class="fa-solid fa-sliders-h me-2"></i>Personalizar este modelo
                        </button>` : ''}
                    </div>

                    <!-- Features -->
                    ${renderFeatureList(plan, iconColor)}

                </div>
            </div>
        `;

    container.appendChild(col);
  });
}

function renderPriceSection(plan, textColor) {
  if (plan.style === 'dashed') return '';

  if (typeof plan.price === 'string') {
    // Case: "Contactar"
    return `<h4 class="text-center fw-bold mb-2 ${textColor}">${plan.price}</h4>
                 <div class="mb-2 invisible"><label class="form-label small fw-bold">&nbsp;</label><input class="form-control invisible"></div>`;
  }

  // Config Check
  if (!PRICING_CONFIG) {
    console.error('PRICING_CONFIG not found.');
    return `<h4 class="text-center fw-bold mb-4 text-danger">Error Config</h4>`;
  }

  // Base Price (Monthly USD)
  let finalPrice = plan.price;
  let periodLabel = '/mes';
  let originalPrice = null; // For annual discount display

  // Apply Annual Logic
  if (billingCycle === 'annual') {
    // Calculate original price (without discount)
    originalPrice = plan.price * 12;
    // Apply discount
    finalPrice = originalPrice * PRICING_CONFIG.annualSaaSMultiplier;
    periodLabel = '/año';
  }

  // Apply Currency Logic
  let currencyLabel = 'USD';
  if (currentCurrency === 'COP') {
    if (originalPrice) {
      originalPrice = originalPrice * PRICING_CONFIG.exchangeRate;
    }
    finalPrice = finalPrice * PRICING_CONFIG.exchangeRate;
    currencyLabel = 'COP';
  }

  // Format Prices
  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currentCurrency === 'COP' ? 'COP' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(finalPrice);

  // Format original price if annual
  let originalPriceHTML = '';
  if (originalPrice && billingCycle === 'annual') {
    const formattedOriginalPrice = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currentCurrency === 'COP' ? 'COP' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(originalPrice);

    originalPriceHTML = `
            <div class="text-center mb-2">
                <span class="text-muted text-decoration-line-through small">${formattedOriginalPrice} ${currencyLabel}</span>
            </div>
        `;
  }

  return `
        ${originalPriceHTML}
        <h4 class="text-center fw-bold mb-2 ${textColor}"> ${formattedPrice} ${currencyLabel}<small class="text-muted fw-normal">${periodLabel}</small></h4>
    `;
}

function renderFeatureList(plan, iconColor) {
  // Build feature list: resolve module IDs → names, then append extraFeatures.
  // Plans without includedModules (enterprise, dev_custom, custom) fall back to features[].
  let featureList;
  if (plan.includedModules) {
    const moduleNames = (plan.includedModules)
      .map(id => (MODULES_DATA || []).find(m => m.id === id))
      .filter(Boolean)
      .map(m => m.name);
    featureList = [...moduleNames, ...(plan.extraFeatures || [])];
  } else {
    featureList = plan.features || [];
  }

  if (!featureList.length && !plan.userLimit) return '';

  const listAlignClass = plan.style === 'dashed' ? ' text-start' : '';
  let html = `<ul class="list-unstyled small${listAlignClass}">`;

  // User Limit Item
  if (plan.userLimit) {
    let text =
      typeof plan.userLimit === 'number'
        ? `Hasta ${plan.userLimit} usuarios concurrentes<br/>(Usuarios nominales ilimitados)`
        : `${plan.userLimit}`;
    if (typeof plan.userLimit === 'string' && plan.userLimit.includes('Más'))
      text = `${plan.userLimit} usuarios`;

    html += `<li class="mb-2 fw-bold"><i class="fa-solid fa-users ${iconColor} me-2"></i>${text}</li>`;
  }

  // Feature items
  featureList.forEach(feat => {
    html += `<li class="mb-2"><i class="fa-solid fa-check ${
      iconColor === 'text-dark' ? 'text-dark' : 'text-success'
    } me-2"></i>${feat}</li>`;
  });

  html += `</ul>`;
  return html;
}

function getConfiguratorUrl(planId) {
  const base = typeof getPageUrl === 'function' ? getPageUrl('configurador') : 'configurator.html';
  const url = planId ? `${base}?preset=${planId}` : base;
  return `window.location.href='${url}'`;
}

function getButtonAction(plan) {
  if (plan.buttonAction === 'custom') {
    const configuradorUrl = typeof getPageUrl === 'function' ? getPageUrl('configurador') : 'configurator.html';
    return `window.location.href='${configuradorUrl}'`;
  }
  if (plan.buttonAction === 'contact') {
    const contactUrl = GENERAL_CONFIG?.links?.contactSales;
    if (!contactUrl) return '';
    return `window.location.href='${contactUrl}'`;
  }
  return '';
}

function getBtnClass(plan) {
  if (plan.style === 'white') return 'btn-dark-custom';
  if (plan.style === 'dashed') return 'btn-outline-primary-custom';
  return 'btn-primary-custom';
}

/**
 * Equalizes the height of .card-top-section elements per visual row,
 * so buttons start at the same vertical position across all cards in a row.
 */
function equalizeCardTopSections() {
  const sections = Array.from(
    document.querySelectorAll('#plans-container-dynamic .card-top-section')
  );
  if (!sections.length) return;

  // Reset previous min-heights
  sections.forEach(s => (s.style.minHeight = ''));

  // Group sections by their parent col's offsetTop (same offsetTop = same visual row)
  const rows = {};
  sections.forEach(s => {
    const col = s.closest('[data-plan]');
    if (!col) return;
    const top = col.offsetTop;
    if (!rows[top]) rows[top] = [];
    rows[top].push(s);
  });

  // Apply the max height only to the first (top) row; reset subsequent rows
  const sortedRows = Object.entries(rows)
    .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));

  sections.forEach(s => (s.style.minHeight = '326px'));
}

// Initial Render - Wait for configs to load
function initializePlansRenderer() {
  // Only render if container exists and BOTH configs are loaded
  if (document.getElementById('plans-container-dynamic') && PLANS_CONFIG && PRICING_CONFIG) {
    // Bind Currency Switch (Checked = USD, Unchecked = COP)
    const currencySwitch = document.getElementById('currencySwitch');
    if (currencySwitch) currencySwitch.checked = currentCurrency === 'USD';

    // Bind Billing Switch (Checked = Annual, Unchecked = Monthly)
    const billingSwitch = document.getElementById('billingSwitch');
    if (billingSwitch) billingSwitch.checked = billingCycle === 'annual';

    // Update annual discount badge
    const annualDiscount = PRICING_CONFIG?.annualDiscountPercent;
    const annualDiscountBadge = document.getElementById(
      'annual-discount-badge'
    );
    if (annualDiscountBadge) {
      annualDiscountBadge.textContent = `-${annualDiscount}%`;
    }

    renderPlans('plans-container-dynamic', PLANS_CONFIG);
    // Equalize after layout paint
    requestAnimationFrame(equalizeCardTopSections);
  }

  // Render 7 Reasons if container exists and data is loaded
  if (REASONS_DATA && document.getElementById('reasons-container')) {
    renderSevenReasons('reasons-container', REASONS_DATA);
  }
}

// Wait for plans config to load
document.addEventListener('plansConfigLoaded', initializePlansRenderer);
document.addEventListener('configLoaded', initializePlansRenderer);
document.addEventListener('generalConfigLoaded', initializePlansRenderer);

// Also try on DOMContentLoaded in case configs are already loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if configs are already loaded (fallback)
  if (PLANS_CONFIG) {
    initializePlansRenderer();
  }
  if (REASONS_DATA && document.getElementById('reasons-container')) {
    renderSevenReasons('reasons-container', REASONS_DATA);
  }
});

function renderSevenReasons(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  data.forEach(item => {
    const col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = `
            <div class="d-flex align-items-start gap-3">
                <div class="text-primary fs-3"><i class="fa-solid ${item.icon}"></i></div>
                <div>
                    <p class="fw-bold mb-1" style="font-size:1rem;line-height:1.2;margin:0 0 0.25rem;">${item.title}</p>
                    <small class="text-muted">${item.description}</small>
                </div>
            </div>
        `;
    container.appendChild(col);
  });
}
