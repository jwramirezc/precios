/**
 * SAIA Admin — Frontend logic for pricing configuration.
 *
 * Handles: tab switching, form rendering from JSON, change tracking,
 * diff preview modal, AJAX save with nonce, and client-side validation.
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════
   * State
   * ═══════════════════════════════════════════ */

  const state = {
    original: {},   // Deep clone at load time
    current: {},    // Live data as user edits
    dirty: {},      // file_key → boolean
    mtimes: {},     // file_key → server mtime (for concurrency)
    saving: false,
  };

  /* ═══════════════════════════════════════════
   * Helpers
   * ═══════════════════════════════════════════ */

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /** Get nested value: getPath(obj, 'storagePricing.includedGB') */
  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
  }

  /** Set nested value: setPath(obj, 'storagePricing.includedGB', 200) */
  function setPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => {
      if (o[k] == null) o[k] = {};
      return o[k];
    }, obj);
    target[last] = value;
  }

  /** Coerce input value to the right type based on original */
  function coerce(value, original) {
    if (typeof original === 'number') {
      const n = Number(value);
      return isNaN(n) ? value : n;
    }
    if (typeof original === 'boolean') return Boolean(value);
    return value;
  }

  /* ═══════════════════════════════════════════
   * Tabs
   * ═══════════════════════════════════════════ */

  function initTabs() {
    const tabs = document.querySelectorAll('.saia-tabs .nav-tab');
    const panels = document.querySelectorAll('.saia-tab-panel');

    function activate(tabId) {
      tabs.forEach(t => t.classList.toggle('nav-tab-active', t.dataset.tab === tabId));
      panels.forEach(p => p.classList.toggle('active', p.id === 'tab-' + tabId));
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const id = tab.dataset.tab;
        activate(id);
        history.replaceState(null, '', '#' + id);
      });
    });

    // Restore from hash
    const hash = location.hash.replace('#', '');
    if (hash && document.getElementById('tab-' + hash)) {
      activate(hash);
    }
  }

  /* ═══════════════════════════════════════════
   * Collapsible Sections
   * ═══════════════════════════════════════════ */

  function initCollapsible() {
    document.querySelectorAll('.saia-section-header[data-toggle]').forEach(header => {
      header.addEventListener('click', () => {
        header.closest('.saia-section').classList.toggle('collapsed');
      });
    });
  }

  /* ═══════════════════════════════════════════
   * Form Rendering
   * ═══════════════════════════════════════════ */

  function renderAllForms() {
    renderPricingConfig();
    renderModulePricing();
    renderPlansConfig();
  }

  // ── Simple field binding ──

  function bindSimpleFields(fileKey) {
    const section = document.querySelector(`.saia-section[data-file="${fileKey}"]`);
    if (!section) return;

    section.querySelectorAll('[data-path]').forEach(input => {
      const path = input.dataset.path;
      const val = getPath(state.current[fileKey], path);

      if (input.tagName === 'SELECT') {
        input.value = val != null ? val : '';
      } else if (input.type === 'checkbox') {
        input.checked = Boolean(val);
      } else {
        input.value = val != null ? val : '';
      }

      input.addEventListener('input', () => {
        const origVal = getPath(state.original[fileKey], path);
        const newVal = coerce(input.value, origVal);
        setPath(state.current[fileKey], path, newVal);
        markDirty(fileKey);

        // Visual change indicator
        const changed = JSON.stringify(newVal) !== JSON.stringify(origVal);
        input.classList.toggle('saia-changed', changed);
      });

      input.addEventListener('change', () => {
        input.dispatchEvent(new Event('input'));
      });
    });
  }

  // ── Tier table rendering ──

  function renderTierTable(tbodyId, fileKey, dataPath, columns) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const rows = getPath(state.current[fileKey], dataPath);
    if (!Array.isArray(rows)) return;

    tbody.innerHTML = '';
    rows.forEach((row, i) => {
      const tr = document.createElement('tr');
      columns.forEach(col => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = col.type || 'number';
        input.value = row[col.key] != null ? row[col.key] : '';
        if (col.step) input.step = col.step;
        if (col.min != null) input.min = col.min;

        input.addEventListener('input', () => {
          const origRows = getPath(state.original[fileKey], dataPath);
          const origVal = origRows && origRows[i] ? origRows[i][col.key] : undefined;
          const newVal = col.type === 'text' ? input.value : coerce(input.value, origVal);

          state.current[fileKey] = state.current[fileKey]; // ensure ref
          const currentRows = getPath(state.current[fileKey], dataPath);
          if (currentRows && currentRows[i]) {
            currentRows[i][col.key] = newVal;
          }
          markDirty(fileKey);

          const changed = JSON.stringify(newVal) !== JSON.stringify(origVal);
          input.classList.toggle('saia-changed', changed);
        });

        td.appendChild(input);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  // ── pricing-config.json ──

  function renderPricingConfig() {
    const fk = 'pricing-config';
    if (!state.current[fk]) return;

    bindSimpleFields(fk);

    renderTierTable('usersPricing-tbody', fk, 'usersPricing', [
      { key: 'upTo', type: 'number', min: 1, step: 1 },
      { key: 'pricePerUser', type: 'number', min: 0, step: 0.1 },
    ]);

    renderTierTable('storageTiers-tbody', fk, 'storagePricing.tiers', [
      { key: 'upTo', type: 'number', min: 1, step: 1 },
      { key: 'pricePerGB', type: 'number', min: 0, step: 0.01 },
    ]);

  }

  // ── module-pricing.json ──

  function renderModulePricing() {
    const fk = 'module-pricing';
    if (!state.current[fk]) return;

    bindSimpleFields(fk);

    renderTierTable('firmaBlocks-tbody', fk, 'firma_certificada_blocks.blocks', [
      { key: 'qty', type: 'number', min: 1, step: 1 },
      { key: 'priceUSD', type: 'number', min: 0, step: 1 },
      { key: 'label', type: 'text' },
    ]);

    renderTierTable('emailBlocks-tbody', fk, 'email_certificado_blocks.blocks', [
      { key: 'qty', type: 'number', min: 1, step: 1 },
      { key: 'priceUSD', type: 'number', min: 0, step: 1 },
      { key: 'label', type: 'text' },
    ]);
  }

  // ── plans-config.json ──

  function renderPlansConfig() {
    const fk = 'plans-config';
    if (!state.current[fk]) return;

    const container = document.getElementById('plans-accordion');
    if (!container) return;

    const plans = state.current[fk];
    const modules = state.current['modules-data'] || [];

    container.innerHTML = '';

    plans.forEach((plan, planIdx) => {
      const card = document.createElement('div');
      card.className = 'saia-plan-card collapsed';

      const priceLabel = plan.price != null && plan.price !== '' ? `$${plan.price} USD` : 'Contactar';

      // Header
      card.innerHTML = `
        <div class="saia-plan-header">
          <div class="saia-plan-header-left">
            <span class="dashicons dashicons-arrow-down-alt2"></span>
            <span class="saia-plan-name">${escHtml(plan.name)}</span>
            <span class="saia-plan-price-badge">${escHtml(priceLabel)}</span>
          </div>
          <span class="saia-plan-id" style="font-size:11px;color:#787c82;">${escHtml(plan.id)}</span>
        </div>
        <div class="saia-plan-body"></div>
      `;

      card.querySelector('.saia-plan-header').addEventListener('click', () => {
        card.classList.toggle('collapsed');
      });

      const body = card.querySelector('.saia-plan-body');
      body.appendChild(buildPlanForm(plan, planIdx, modules));

      container.appendChild(card);
    });
  }

  function buildPlanForm(plan, idx, modules) {
    const fk = 'plans-config';
    const frag = document.createDocumentFragment();

    // Basic fields
    const basicFields = [
      { label: 'ID', key: 'id', type: 'text', readonly: true },
      { label: 'Nombre', key: 'name', type: 'text' },
      { label: 'Precio (USD)', key: 'price', type: 'text', placeholder: 'Vacío = contactar' },
      { label: 'Límite Usuarios', key: 'userLimit', type: 'text' },
      { label: 'Usuarios Incluidos', key: 'includedUsers', type: 'number' },
      { label: 'Storage Incluido (GB)', key: 'includedStorageGB', type: 'number' },
    ];

    const row = el('div', 'saia-field-row');
    basicFields.forEach(f => {
      const field = el('div', 'saia-field');
      field.innerHTML = `<label>${f.label}</label>`;
      const input = document.createElement(f.type === 'textarea' ? 'textarea' : 'input');
      if (f.type !== 'textarea') input.type = f.type;
      if (f.readonly) input.readOnly = true;
      if (f.placeholder) input.placeholder = f.placeholder;

      const val = plan[f.key];
      input.value = val != null ? val : '';

      input.addEventListener('input', () => {
        let newVal = input.value;
        // Price can be number, empty string, or null
        if (f.key === 'price') {
          newVal = newVal === '' ? '' : (isNaN(Number(newVal)) ? newVal : Number(newVal));
        } else if (f.type === 'number') {
          newVal = newVal === '' ? '' : Number(newVal);
        }
        state.current[fk][idx][f.key] = newVal;
        markDirty(fk);
      });

      field.appendChild(input);
      row.appendChild(field);
    });
    frag.appendChild(row);

    // Description
    frag.appendChild(buildTextarea('Descripción', plan, idx, 'description', fk));
    frag.appendChild(buildTextarea('Descripción Resumen', plan, idx, 'summaryDescription', fk));
    frag.appendChild(buildTextarea('Subtítulo Preset', plan, idx, 'presetSubtitle', fk));

    // Included Modules (only for plans that have them)
    if (plan.includedModules || ['basic', 'standard', 'professional'].includes(plan.id)) {
      const modulesSection = el('div');
      modulesSection.innerHTML = '<h3 style="font-size:13px;font-weight:600;margin:16px 0 6px;border-bottom:1px solid #e2e4e7;padding-bottom:4px;">Módulos Incluidos</h3>';
      const grid = el('div', 'saia-modules-grid');

      const included = plan.includedModules || [];
      modules.forEach(mod => {
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = included.includes(mod.id);
        cb.addEventListener('change', () => {
          if (!state.current[fk][idx].includedModules) {
            state.current[fk][idx].includedModules = [];
          }
          const arr = state.current[fk][idx].includedModules;
          if (cb.checked && !arr.includes(mod.id)) {
            arr.push(mod.id);
          } else if (!cb.checked) {
            const i = arr.indexOf(mod.id);
            if (i !== -1) arr.splice(i, 1);
          }
          markDirty(fk);
        });
        label.appendChild(cb);
        label.appendChild(document.createTextNode(' ' + mod.name));
        grid.appendChild(label);
      });

      modulesSection.appendChild(grid);
      frag.appendChild(modulesSection);
    }

    // Included Quantities
    if (plan.includedQuantities || ['standard', 'professional'].includes(plan.id)) {
      const qtySection = el('div');
      qtySection.innerHTML = '<h3 style="font-size:13px;font-weight:600;margin:16px 0 6px;border-bottom:1px solid #e2e4e7;padding-bottom:4px;">Cantidades Incluidas</h3>';
      const qtyRow = el('div', 'saia-field-row');

      ['firma', 'email'].forEach(qKey => {
        const field = el('div', 'saia-field');
        field.innerHTML = `<label>${qKey === 'firma' ? 'Firmas Certificadas/mes' : 'Emails Certificados/mes'}</label>`;
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.value = plan.includedQuantities && plan.includedQuantities[qKey] != null
          ? plan.includedQuantities[qKey] : '';

        input.addEventListener('input', () => {
          if (!state.current[fk][idx].includedQuantities) {
            state.current[fk][idx].includedQuantities = {};
          }
          state.current[fk][idx].includedQuantities[qKey] = input.value === '' ? 0 : Number(input.value);
          markDirty(fk);
        });

        field.appendChild(input);
        qtyRow.appendChild(field);
      });

      qtySection.appendChild(qtyRow);
      frag.appendChild(qtySection);
    }

    // Extra Features (dynamic list)
    if (plan.extraFeatures || ['basic', 'standard', 'professional'].includes(plan.id)) {
      const featSection = el('div');
      featSection.innerHTML = '<h3 style="font-size:13px;font-weight:600;margin:16px 0 6px;border-bottom:1px solid #e2e4e7;padding-bottom:4px;">Características Extra</h3>';
      const list = el('ul', 'saia-features-list');

      const features = plan.extraFeatures || [];
      features.forEach((feat, fi) => {
        list.appendChild(buildFeatureItem(fk, idx, 'extraFeatures', fi, feat));
      });

      featSection.appendChild(list);

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'button saia-add-feature';
      addBtn.textContent = '+ Agregar';
      addBtn.addEventListener('click', () => {
        if (!state.current[fk][idx].extraFeatures) {
          state.current[fk][idx].extraFeatures = [];
        }
        state.current[fk][idx].extraFeatures.push('');
        const newIdx = state.current[fk][idx].extraFeatures.length - 1;
        list.appendChild(buildFeatureItem(fk, idx, 'extraFeatures', newIdx, ''));
        markDirty(fk);
      });

      featSection.appendChild(addBtn);
      frag.appendChild(featSection);
    }

    // Features (for enterprise/dev_custom/custom plans)
    if (plan.features && !plan.extraFeatures) {
      const featSection = el('div');
      featSection.innerHTML = '<h3 style="font-size:13px;font-weight:600;margin:16px 0 6px;border-bottom:1px solid #e2e4e7;padding-bottom:4px;">Features</h3>';
      const list = el('ul', 'saia-features-list');

      plan.features.forEach((feat, fi) => {
        list.appendChild(buildFeatureItem(fk, idx, 'features', fi, feat));
      });

      featSection.appendChild(list);

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'button saia-add-feature';
      addBtn.textContent = '+ Agregar';
      addBtn.addEventListener('click', () => {
        if (!state.current[fk][idx].features) {
          state.current[fk][idx].features = [];
        }
        state.current[fk][idx].features.push('');
        const newIdx = state.current[fk][idx].features.length - 1;
        list.appendChild(buildFeatureItem(fk, idx, 'features', newIdx, ''));
        markDirty(fk);
      });

      featSection.appendChild(addBtn);
      frag.appendChild(featSection);
    }

    // UI Config
    const uiRow = el('div', 'saia-field-row');
    const uiFields = [
      { label: 'Texto Botón', key: 'buttonText', type: 'text' },
      { label: 'Acción Botón', key: 'buttonAction', type: 'text' },
      { label: 'CTA Type', key: 'ctaType', type: 'text' },
      { label: 'Estilo', key: 'style', type: 'text' },
    ];

    uiFields.forEach(f => {
      const field = el('div', 'saia-field');
      field.innerHTML = `<label>${f.label}</label>`;
      const input = document.createElement('input');
      input.type = f.type;
      input.value = plan[f.key] != null ? plan[f.key] : '';
      input.addEventListener('input', () => {
        state.current[fk][idx][f.key] = input.value;
        markDirty(fk);
      });
      field.appendChild(input);
      uiRow.appendChild(field);
    });
    frag.appendChild(uiRow);

    // Highlight toggle
    const hlRow = el('div', 'saia-field-row');
    const hlField = el('div', 'saia-field');
    const hlLabel = document.createElement('label');
    const hlCb = document.createElement('input');
    hlCb.type = 'checkbox';
    hlCb.checked = Boolean(plan.highlight);
    hlCb.addEventListener('change', () => {
      state.current[fk][idx].highlight = hlCb.checked;
      markDirty(fk);
    });
    hlLabel.appendChild(hlCb);
    hlLabel.appendChild(document.createTextNode(' Destacar este plan'));
    hlField.appendChild(hlLabel);
    hlRow.appendChild(hlField);
    frag.appendChild(hlRow);

    return frag;
  }

  function buildTextarea(label, plan, idx, key, fk) {
    if (plan[key] == null && !['description', 'summaryDescription'].includes(key)) return document.createDocumentFragment();
    const div = el('div', 'saia-field');
    div.style.marginBottom = '8px';
    div.innerHTML = `<label>${label}</label>`;
    const ta = document.createElement('textarea');
    ta.rows = 2;
    ta.style.width = '100%';
    ta.value = plan[key] || '';
    ta.addEventListener('input', () => {
      state.current[fk][idx][key] = ta.value;
      markDirty(fk);
    });
    div.appendChild(ta);
    return div;
  }

  function buildFeatureItem(fk, planIdx, arrayKey, featureIdx, value) {
    const li = document.createElement('li');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.addEventListener('input', () => {
      state.current[fk][planIdx][arrayKey][featureIdx] = input.value;
      markDirty(fk);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'saia-remove-feature';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'Eliminar';
    removeBtn.addEventListener('click', () => {
      state.current[fk][planIdx][arrayKey].splice(featureIdx, 1);
      markDirty(fk);
      // Re-render the plan
      renderPlansConfig();
    });

    li.appendChild(input);
    li.appendChild(removeBtn);
    return li;
  }

  /* ═══════════════════════════════════════════
   * Dirty Tracking
   * ═══════════════════════════════════════════ */

  function markDirty(fileKey) {
    state.dirty[fileKey] = true;
    const btn = document.querySelector(`.saia-save-btn[data-file="${fileKey}"]`);
    if (btn) btn.disabled = false;
  }

  /* ═══════════════════════════════════════════
   * Diff Computation
   * ═══════════════════════════════════════════ */

  function computeDiff(fileKey) {
    const orig = state.original[fileKey];
    const curr = state.current[fileKey];
    const changes = [];
    diffRecursive(orig, curr, '', changes);
    return changes;
  }

  function diffRecursive(orig, curr, prefix, changes) {
    if (orig === curr) return;
    if (typeof orig !== typeof curr || orig === null || curr === null) {
      changes.push({ path: prefix || '(root)', oldVal: formatVal(orig), newVal: formatVal(curr) });
      return;
    }
    if (Array.isArray(orig) && Array.isArray(curr)) {
      const maxLen = Math.max(orig.length, curr.length);
      for (let i = 0; i < maxLen; i++) {
        const p = prefix ? `${prefix}[${i}]` : `[${i}]`;
        if (i >= orig.length) {
          changes.push({ path: p, oldVal: '(nuevo)', newVal: formatVal(curr[i]) });
        } else if (i >= curr.length) {
          changes.push({ path: p, oldVal: formatVal(orig[i]), newVal: '(eliminado)' });
        } else {
          diffRecursive(orig[i], curr[i], p, changes);
        }
      }
      return;
    }
    if (typeof orig === 'object' && typeof curr === 'object') {
      const allKeys = new Set([...Object.keys(orig), ...Object.keys(curr)]);
      allKeys.forEach(key => {
        const p = prefix ? `${prefix}.${key}` : key;
        diffRecursive(
          orig.hasOwnProperty(key) ? orig[key] : undefined,
          curr.hasOwnProperty(key) ? curr[key] : undefined,
          p, changes
        );
      });
      return;
    }
    if (orig !== curr) {
      changes.push({ path: prefix, oldVal: formatVal(orig), newVal: formatVal(curr) });
    }
  }

  function formatVal(v) {
    if (v === undefined) return '—';
    if (v === null) return 'null';
    if (typeof v === 'object') return JSON.stringify(v).substring(0, 80);
    return String(v);
  }

  /* ═══════════════════════════════════════════
   * Diff Modal
   * ═══════════════════════════════════════════ */

  function showDiffModal(fileKey, changes, onConfirm) {
    const modal = document.getElementById('saia-diff-modal');
    const body = document.getElementById('saia-diff-body');

    if (changes.length === 0) {
      body.innerHTML = '<p>No hay cambios para guardar.</p>';
    } else {
      let html = `<p><strong>${changes.length}</strong> cambio(s) detectado(s):</p>`;
      html += '<table class="saia-diff-table"><thead><tr><th>Campo</th><th>Anterior</th><th>Nuevo</th></tr></thead><tbody>';
      changes.forEach(c => {
        html += `<tr>
          <td>${escHtml(c.path)}</td>
          <td class="diff-old">${escHtml(c.oldVal)}</td>
          <td class="diff-new">${escHtml(c.newVal)}</td>
        </tr>`;
      });
      html += '</tbody></table>';
      body.innerHTML = html;
    }

    modal.style.display = 'flex';

    // Handlers
    const confirm = modal.querySelector('.saia-modal-confirm');
    const cancel = modal.querySelector('.saia-modal-cancel');
    const close = modal.querySelector('.saia-modal-close');
    const backdrop = modal.querySelector('.saia-modal-backdrop');

    function hide() {
      modal.style.display = 'none';
      confirm.replaceWith(confirm.cloneNode(true));
      cancel.replaceWith(cancel.cloneNode(true));
    }

    confirm.addEventListener('click', () => { hide(); onConfirm(); }, { once: true });
    cancel.addEventListener('click', hide, { once: true });
    close.addEventListener('click', hide, { once: true });
    backdrop.addEventListener('click', hide, { once: true });
  }

  /* ═══════════════════════════════════════════
   * Save
   * ═══════════════════════════════════════════ */

  function initSaveButtons() {
    document.querySelectorAll('.saia-save-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fileKey = btn.dataset.file;
        const changes = computeDiff(fileKey);

        if (changes.length === 0) {
          showStatus(fileKey, 'Sin cambios.', 'success');
          return;
        }

        showDiffModal(fileKey, changes, () => ajaxSave(fileKey));
      });
    });

    // Restore defaults buttons
    document.querySelectorAll('.saia-restore-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fileKey = btn.dataset.file;
        if (!confirm('¿Restaurar los valores por defecto del plugin? Se perderán las personalizaciones de esta sección.')) {
          return;
        }
        ajaxRestoreDefaults(fileKey);
      });
    });
  }

  function ajaxSave(fileKey) {
    if (state.saving) return;
    state.saving = true;

    const btn = document.querySelector(`.saia-save-btn[data-file="${fileKey}"]`);
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Guardando...';
    }

    const body = new URLSearchParams();
    body.append('action', 'saia_save_config');
    body.append('nonce', saiaAdmin.nonce);
    body.append('file_key', fileKey);
    body.append('json_data', JSON.stringify(state.current[fileKey]));
    if (state.mtimes[fileKey]) {
      body.append('file_mtime', state.mtimes[fileKey]);
    }

    fetch(saiaAdmin.ajaxUrl, {
      method: 'POST',
      credentials: 'same-origin',
      body: body,
    })
      .then(r => r.json())
      .then(result => {
        if (result.success) {
          state.original[fileKey] = deepClone(state.current[fileKey]);
          state.dirty[fileKey] = false;
          if (result.data && result.data.mtime) {
            state.mtimes[fileKey] = result.data.mtime;
          }
          showStatus(fileKey, 'Guardado correctamente.', 'success');

          // Re-render to clear changed indicators
          renderAllForms();
        } else {
          const msg = result.data && result.data.message ? result.data.message : 'Error desconocido.';
          const errors = result.data && result.data.errors ? result.data.errors : [];
          let fullMsg = msg;
          if (errors.length > 0) {
            fullMsg += '\n' + errors.join('\n');
          }
          showStatus(fileKey, fullMsg, 'error');
        }
      })
      .catch(err => {
        showStatus(fileKey, 'Error de red: ' + err.message, 'error');
      })
      .finally(() => {
        state.saving = false;
        if (btn) {
          btn.textContent = btn.dataset.file === 'pricing-config' ? 'Guardar Configuración Base'
            : btn.dataset.file === 'module-pricing' ? 'Guardar Precios de Módulos'
            : 'Guardar Planes';
          // Re-enable if still dirty
          if (state.dirty[fileKey]) btn.disabled = false;
        }
      });
  }

  function ajaxRestoreDefaults(fileKey) {
    const body = new URLSearchParams();
    body.append('action', 'saia_restore_defaults');
    body.append('nonce', saiaAdmin.nonce);
    body.append('file_key', fileKey);

    fetch(saiaAdmin.ajaxUrl, {
      method: 'POST',
      credentials: 'same-origin',
      body: body,
    })
      .then(r => r.json())
      .then(result => {
        if (result.success) {
          // Update state with restored defaults
          if (result.data && result.data.defaults) {
            state.original[fileKey] = deepClone(result.data.defaults);
            state.current[fileKey] = deepClone(result.data.defaults);
            state.dirty[fileKey] = false;
            if (result.data.mtime) {
              state.mtimes[fileKey] = result.data.mtime;
            }
          }
          renderAllForms();
          showStatus(fileKey, 'Defaults restaurados correctamente.', 'success');
        } else {
          const msg = result.data && result.data.message ? result.data.message : 'Error desconocido.';
          showStatus(fileKey, msg, 'error');
        }
      })
      .catch(err => {
        showStatus(fileKey, 'Error de red: ' + err.message, 'error');
      });
  }

  function showStatus(fileKey, msg, type) {
    const section = document.querySelector(`.saia-section[data-file="${fileKey}"]`);
    if (!section) return;
    const status = section.querySelector('.saia-save-status');
    if (!status) return;
    status.textContent = msg;
    status.className = 'saia-save-status ' + type;
    setTimeout(() => {
      if (status.textContent === msg) {
        status.textContent = '';
        status.className = 'saia-save-status';
      }
    }, 6000);
  }

  /* ═══════════════════════════════════════════
   * Before Unload Warning
   * ═══════════════════════════════════════════ */

  function initBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
      const hasDirty = Object.values(state.dirty).some(Boolean);
      if (hasDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  /* ═══════════════════════════════════════════
   * Utils
   * ═══════════════════════════════════════════ */

  function el(tag, className) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    return e;
  }

  function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ═══════════════════════════════════════════
   * Init
   * ═══════════════════════════════════════════ */

  function init() {
    if (typeof saiaAdmin === 'undefined' || !saiaAdmin.files) {
      console.error('SAIA Admin: No se encontraron datos de configuración.');
      return;
    }

    // Initialize state
    state.original = deepClone(saiaAdmin.files);
    state.current  = deepClone(saiaAdmin.files);

    initTabs();
    initCollapsible();
    renderAllForms();
    initSaveButtons();
    initBeforeUnload();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
