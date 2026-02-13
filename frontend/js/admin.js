/* ==========================================
 * Legacy admin content editor (single-page)
 * ========================================== */

// Footer year sync.
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// API contract for loading/saving full admin content payload.
const API = {
    load: '/api/admin/content',
    save: '/api/admin/content'
};

/* ==================
 * Shared utilities
 * ================== */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function debounce(fn, ms = 500) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

/**
 * Displays Bootstrap toast in #toast-container.
 */
function showToast(message, type = 'dark') {
    const container = $('#toast-container');
    if (!container) return;

    const id = 'toast-' + Date.now();
    const el = document.createElement('div');
    el.id = id;
    el.className = `toast align-items-center text-bg-${type} border-0 mb-2`;
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');

    el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

    container.appendChild(el);
    const toast = new bootstrap.Toast(el, { delay: 2500 });
    toast.show();
}

// Save status indicator near top/bottom action buttons.
const saveStatusEl = $('#save-status');

/**
 * Updates visual status for current save lifecycle state.
 */
function setSaveStatus(mode) {
    if (!saveStatusEl) return;
    saveStatusEl.classList.remove('saving', 'saved', 'error');

    switch (mode) {
        case 'saving':
            saveStatusEl.textContent = 'Збереження...';
            saveStatusEl.classList.add('saving');
            break;
        case 'saved':
            saveStatusEl.textContent = 'Збережено';
            saveStatusEl.classList.add('saved');
            break;
        case 'error':
            saveStatusEl.textContent = 'Помилка збереження';
            saveStatusEl.classList.add('error');
            break;
        default:
            saveStatusEl.textContent = 'Зміни відсутні';
    }
}

/* ==========================================
 * State (single source of truth for the form)
 * ========================================== */

/**
 * Структура стану. Бекенд має зберігати у такому ж форматі.
 */
let state = {
    hero: {
        enabled: true,
        title: '',
        subtitle: '',
        bullets: [],
        cta1: { text: '', href: '#services' },
        cta2: { text: '', href: '#portfolio' },
        image: ''
    },
    services: {
        lead: '',
        items: [] // масив сервісів
    },
    pricing: {
        enabled: true,
        lead: '',
        plans: [] // масив планів
    },
    portfolio: {
        items: [] // { id?, title, image, enabled }
    },
    testimonials: {
        enabled: true,
        items: [] // { id?, name, role, avatar, text, enabled }
    },
    faq: {
        items: [] // { id?, question, answer, enabled }
    },
    contacts: {
        email: '',
        telegram: '',
        github: ''
    }
};

/* ==============================
 * Universal settings modal logic
 * ============================== */

let activeSettingButton = null;
let activeTargetInput = null;
let activeSecondaryInput = null;
let activeType = 'text';
let activeMaxLength = null;
let activeBulletIndex = null;

const settingModalEl = document.getElementById('settingModal');
const settingModal = settingModalEl ? new bootstrap.Modal(settingModalEl) : null;

const settingModalLabel = document.getElementById('settingModalLabel');
const settingModalFieldLabel = document.getElementById('settingModalFieldLabel');
const settingModalInput = document.getElementById('settingModalInput');
const settingModalCounter = document.getElementById('settingModalCounter');
const settingModalSecondaryWrap = document.getElementById('settingModalSecondaryWrap');
const settingModalSecondaryLabel = document.getElementById('settingModalSecondaryLabel');
const settingModalSecondaryInput = document.getElementById('settingModalSecondaryInput');
const settingModalSaveBtn = document.getElementById('settingModalSave');

function updateSettingCounter() {
    if (!settingModalInput || !settingModalCounter) return;
    const val = settingModalInput.value || '';
    if (activeMaxLength) {
        settingModalCounter.textContent = `${val.length}/${activeMaxLength} символів`;
    } else {
        settingModalCounter.textContent = `${val.length} символів`;
    }
}

if (settingModalInput) {
    settingModalInput.addEventListener('input', () => {
        if (activeMaxLength) {
            if (settingModalInput.value.length > activeMaxLength) {
                settingModalInput.value = settingModalInput.value.slice(0, activeMaxLength);
            }
        }
        updateSettingCounter();
    });
}

function openSettingModal(btn) {
    if (!settingModal) return;

    activeSettingButton = btn;
    const targetSel = btn.dataset.targetInput;
    activeTargetInput = targetSel ? document.querySelector(targetSel) : null;

    const secondarySel = btn.dataset.secondaryInput;
    activeSecondaryInput = secondarySel ? document.querySelector(secondarySel) : null;

    activeType = btn.dataset.type || 'text';
    activeMaxLength = btn.dataset.maxlength ? parseInt(btn.dataset.maxlength, 10) : null;
    activeBulletIndex = btn.dataset.bulletIndex != null
        ? parseInt(btn.dataset.bulletIndex, 10)
        : null;

    const labelText = btn.dataset.label || 'Редагування';
    if (settingModalLabel) settingModalLabel.textContent = labelText;
    if (settingModalFieldLabel) settingModalFieldLabel.textContent = labelText;

    // Prefill primary value.
    let value = '';
    if (activeTargetInput) {
        if (activeType === 'bullet' && activeBulletIndex != null) {
            const full = activeTargetInput.value || '';
            const lines = full.split('\n');
            value = (lines[activeBulletIndex] || '').trim();
        } else {
            value = (activeTargetInput.value || '').trim();
        }
    }
    if (settingModalInput) {
        settingModalInput.value = value;
    }

    // CTA mode: show and prefill secondary href input.
    if (activeType === 'cta') {
        if (settingModalSecondaryWrap) settingModalSecondaryWrap.classList.remove('d-none');
        if (settingModalSecondaryLabel) {
            settingModalSecondaryLabel.textContent = 'Посилання / якір (href)';
        }
        if (settingModalSecondaryInput) {
            if (activeSecondaryInput) {
                settingModalSecondaryInput.value = activeSecondaryInput.value || '';
            } else {
                settingModalSecondaryInput.value = '';
            }
        }
    } else {
        if (settingModalSecondaryWrap) settingModalSecondaryWrap.classList.add('d-none');
        if (settingModalSecondaryInput) settingModalSecondaryInput.value = '';
    }

    updateSettingCounter();
    settingModal.show();
}

if (settingModalSaveBtn) {
    settingModalSaveBtn.addEventListener('click', () => {
        if (!activeTargetInput || !settingModalInput) {
            if (settingModal) settingModal.hide();
            return;
        }

        const newVal = (settingModalInput.value || '').trim();

        if (activeType === 'bullet' && activeBulletIndex != null) {
            const full = activeTargetInput.value || '';
            const lines = full.split('\n');

            while (lines.length < activeBulletIndex + 1) {
                lines.push('');
            }
            lines[activeBulletIndex] = newVal;
            activeTargetInput.value = lines.join('\n');
        } else {
            activeTargetInput.value = newVal;
        }

        // For CTA settings update paired href field too.
        if (activeType === 'cta' && activeSecondaryInput && settingModalSecondaryInput) {
            activeSecondaryInput.value = (settingModalSecondaryInput.value || '').trim();
            activeSecondaryInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Trigger input event to keep autosave flow uniform.
        activeTargetInput.dispatchEvent(new Event('input', { bubbles: true }));

        // Refresh inline preview text near setting button.
        if (activeSettingButton) {
            const preview = activeSettingButton.querySelector('.setting-preview');
            if (preview) {
                if (newVal) {
                    preview.textContent = ' ' + newVal;
                } else {
                    preview.textContent = ' ' + (preview.dataset.empty || '(не задано)');
                }
            }
        }

        settingModal.hide();
    });
}

/**
 * Binds setting buttons to modal and initializes preview labels.
 */
function initSettingButtons() {
    const buttons = document.querySelectorAll('.setting-btn');
    buttons.forEach(btn => {
        // клік → модал
        btn.addEventListener('click', () => openSettingModal(btn));

        // початкове прев’ю
        const targetSel = btn.dataset.targetInput;
        const targetInput = targetSel ? document.querySelector(targetSel) : null;
        const preview = btn.querySelector('.setting-preview');
        if (targetInput && preview) {
            let val = (targetInput.value || '').trim();

            const type = btn.dataset.type || 'text';
            const bulletIndex = btn.dataset.bulletIndex != null
                ? parseInt(btn.dataset.bulletIndex, 10)
                : null;

            if (type === 'bullet' && bulletIndex != null) {
                const lines = val.split('\n');
                val = (lines[bulletIndex] || '').trim();
            }

            if (!val) {
                preview.textContent = ' ' + (preview.dataset.empty || '(не задано)');
            } else {
                preview.textContent = ' ' + val;
            }
        }
    });

    // Initialize Bootstrap tooltips once.
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        new bootstrap.Tooltip(el);
    });
}

/* ==================
 * Hero form section
 * ================== */

/**
 * Populates hero fields from current state.
 */
function fillHeroForm() {
    const enabledEl = $('#hero-enabled');
    if (enabledEl) enabledEl.checked = !!state.hero.enabled;

    const titleEl = $('#hero-title');
    const subEl   = $('#hero-subtitle');
    const cta1t   = $('#hero-cta1-text');
    const cta1h   = $('#hero-cta1-href');
    const cta2t   = $('#hero-cta2-text');
    const cta2h   = $('#hero-cta2-href');
    const imgEl   = $('#hero-image');
    const bullets = $('#hero-bullets');

    if (titleEl)  titleEl.value  = state.hero.title || '';
    if (subEl)    subEl.value    = state.hero.subtitle || '';
    if (cta1t)    cta1t.value    = state.hero.cta1?.text || '';
    if (cta1h)    cta1h.value    = state.hero.cta1?.href || '';
    if (cta2t)    cta2t.value    = state.hero.cta2?.text || '';
    if (cta2h)    cta2h.value    = state.hero.cta2?.href || '';
    if (imgEl)    imgEl.value    = state.hero.image || '';
    if (bullets)  bullets.value  = (state.hero.bullets || []).join('\n');
}

/**
 * Reads hero fields from DOM into state.
 */
function collectHeroFromForm() {
    const enabledEl = $('#hero-enabled');
    const titleEl   = $('#hero-title');
    const subEl     = $('#hero-subtitle');
    const cta1t     = $('#hero-cta1-text');
    const cta1h     = $('#hero-cta1-href');
    const cta2t     = $('#hero-cta2-text');
    const cta2h     = $('#hero-cta2-href');
    const imgEl     = $('#hero-image');
    const bulletsEl = $('#hero-bullets');

    state.hero.enabled  = enabledEl ? enabledEl.checked : true;
    state.hero.title    = titleEl   ? titleEl.value.trim() : '';
    state.hero.subtitle = subEl     ? subEl.value.trim()   : '';

    state.hero.cta1 = {
        text: cta1t ? cta1t.value.trim() : '',
        href: cta1h ? (cta1h.value.trim() || '#services') : '#services'
    };
    state.hero.cta2 = {
        text: cta2t ? cta2t.value.trim() : '',
        href: cta2h ? (cta2h.value.trim() || '#portfolio') : '#portfolio'
    };

    state.hero.image = imgEl ? imgEl.value.trim() : '';

    if (bulletsEl) {
        state.hero.bullets = bulletsEl.value
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean);
    } else {
        state.hero.bullets = [];
    }
}

/* ======================
 * Services admin section
 * ====================== */

/**
 * Renders editable cards for all services.
 */
function renderAdminServices() {
    const wrap = $('#admin-services-list');
    if (!wrap) return;
    wrap.innerHTML = '';

    const leadEl = $('#services-lead');
    if (leadEl) leadEl.value = state.services.lead || '';

    (state.services.items || []).forEach((svc, idx) => {
        const card = document.createElement('div');
        card.className = 'admin-service-card';
        card.dataset.index = String(idx);

        card.innerHTML = `
      <div class="admin-service-card-header mb-2">
        <div class="d-flex align-items-center gap-2">
          <i class="${svc.iconClass || 'bi bi-window-stack'} fs-5"></i>
          <strong>${svc.title || 'Сервіс ' + (idx + 1)}</strong>
          <span class="admin-service-meta">${svc.key || 'svc_' + (idx + 1)}</span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div class="form-check form-switch">
            <input class="form-check-input js-svc-enabled" type="checkbox"
                   ${svc.enabled !== false ? 'checked' : ''}>
            <label class="form-check-label">Активний</label>
          </div>
          <button class="btn btn-sm btn-outline-danger js-svc-delete" type="button">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
      <div class="row g-2">
        <div class="col-md-4">
          <label class="form-label">Заголовок</label>
          <input class="form-control js-svc-title" value="${svc.title || ''}">
        </div>
        <div class="col-md-8">
          <label class="form-label">Опис</label>
          <input class="form-control js-svc-desc" value="${svc.description || ''}">
        </div>
        <div class="col-md-3">
          <label class="form-label">Ціна (label)</label>
          <input class="form-control js-svc-price" value="${svc.priceLabel || ''}">
        </div>
        <div class="col-md-3">
          <label class="form-label">Тривалість</label>
          <input class="form-control js-svc-duration" value="${svc.duration || ''}">
        </div>
        <div class="col-md-3">
          <label class="form-label">Посилання (href)</label>
          <input class="form-control js-svc-href" value="${svc.href || ''}">
        </div>
        <div class="col-md-3">
          <label class="form-label">Іконка (клас)</label>
          <input class="form-control js-svc-icon" value="${svc.iconClass || 'bi bi-window-stack'}">
          <div class="form-help">Напр.: <code>bi bi-bug</code></div>
        </div>
      </div>
    `;

        wrap.appendChild(card);
    });

    wrap.querySelectorAll('.js-svc-enabled').forEach(input => {
        input.addEventListener('change', onServiceChange);
    });
    wrap.querySelectorAll('.js-svc-title,.js-svc-desc,.js-svc-price,.js-svc-duration,.js-svc-href,.js-svc-icon')
        .forEach(input => {
            input.addEventListener('input', onServiceChangeDebounced);
        });
    wrap.querySelectorAll('.js-svc-delete').forEach(btn => {
        btn.addEventListener('click', onServiceDelete);
    });
}

/**
 * Handles service card changes and mutates state.
 */
function onServiceChange(e) {
    const card = e.target.closest('.admin-service-card');
    if (!card) return;
    const idx = Number(card.dataset.index);
    const svc = state.services.items[idx];
    if (!svc) return;

    svc.enabled = card.querySelector('.js-svc-enabled').checked;
    svc.title = card.querySelector('.js-svc-title').value.trim();
    svc.description = card.querySelector('.js-svc-desc').value.trim();
    svc.priceLabel = card.querySelector('.js-svc-price').value.trim();
    svc.duration = card.querySelector('.js-svc-duration').value.trim();
    svc.href = card.querySelector('.js-svc-href').value.trim();
    svc.iconClass = card.querySelector('.js-svc-icon').value.trim() || 'bi bi-window-stack';

    saveDebounced();
}

const onServiceChangeDebounced = debounce(onServiceChange, 400);

function onServiceDelete(e) {
    const card = e.target.closest('.admin-service-card');
    if (!card) return;
    const idx = Number(card.dataset.index);
    state.services.items.splice(idx, 1);
    renderAdminServices();
    saveDebounced();
}

/**
 * Collects services lead + cards from form into state.
 */
function collectServicesFromForm() {
    const leadEl = $('#services-lead');
    state.services.lead = leadEl ? leadEl.value.trim() : '';

    const wrap = $('#admin-services-list');
    const cards = $$('.admin-service-card', wrap);

    state.services.items = cards.map(card => {
        const idx = Number(card.dataset.index);
        const old = state.services.items[idx] || {};
        return {
            key: old.key || `svc_${idx + 1}`,
            enabled: card.querySelector('.js-svc-enabled').checked,
            title: card.querySelector('.js-svc-title').value.trim(),
            description: card.querySelector('.js-svc-desc').value.trim(),
            priceLabel: card.querySelector('.js-svc-price').value.trim(),
            duration: card.querySelector('.js-svc-duration').value.trim(),
            href: card.querySelector('.js-svc-href').value.trim(),
            iconClass: card.querySelector('.js-svc-icon').value.trim() || 'bi bi-window-stack'
        };
    });
}

/* =====================
 * Pricing admin section
 * ===================== */

/**
 * Renders editable pricing plans grid.
 */
function renderAdminPricing() {
    const en = $('#pricing-enabled');
    if (en) en.checked = !!state.pricing.enabled;

    const lead = $('#pricing-lead');
    if (lead) lead.value = state.pricing.lead || '';

    const wrap = $('#admin-pricing-list');
    if (!wrap) return;
    wrap.innerHTML = '';

    (state.pricing.plans || []).forEach((plan, idx) => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.dataset.index = String(idx);

        const featuresText = (plan.features || []).join('\n');

        col.innerHTML = `
      <div class="admin-pricing-card h-100">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="d-flex align-items-center gap-2">
            <strong>${plan.title || 'Пакет ' + (idx + 1)}</strong>
            ${plan.popular ? '<span class="badge text-bg-primary">популярний</span>' : ''}
          </div>
          <div class="form-check form-switch">
            <input class="form-check-input js-plan-enabled" type="checkbox"
              ${plan.enabled !== false ? 'checked' : ''}>
            <label class="form-check-label">Активний</label>
          </div>
        </div>
        <div class="mb-2">
          <label class="form-label">Назва пакету</label>
          <input class="form-control js-plan-title" value="${plan.title || ''}">
        </div>
        <div class="mb-2">
          <label class="form-label">Ціна (label)</label>
          <input class="form-control js-plan-price" value="${plan.priceLabel || ''}">
        </div>
        <div class="mb-2">
          <label class="form-label">Бейдж</label>
          <input class="form-control js-plan-badge" value="${plan.badge || ''}">
        </div>
        <div class="mb-2">
          <label class="form-label">CSS-клас бейджа</label>
          <input class="form-control js-plan-badge-class" value="${plan.badgeClass || 'text-bg-light'}">
        </div>
        <div class="mb-2">
          <label class="form-label">Ознаки (features, один рядок = один пункт)</label>
          <textarea class="form-control js-plan-features" rows="3">${featuresText}</textarea>
        </div>
        <div class="row g-2">
          <div class="col-md-6">
            <label class="form-label">CTA текст</label>
            <input class="form-control js-plan-cta-text" value="${plan.cta?.text || ''}">
          </div>
          <div class="col-md-6">
            <label class="form-label">CTA href</label>
            <input class="form-control js-plan-cta-href" value="${plan.cta?.href || '#contact'}">
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div class="form-check">
            <input class="form-check-input js-plan-popular" type="checkbox" ${plan.popular ? 'checked' : ''}>
            <label class="form-check-label">Позначити як популярний</label>
          </div>
          <button class="btn btn-sm btn-outline-danger js-plan-delete" type="button">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `;

        wrap.appendChild(col);
    });

    wrap.querySelectorAll('.js-plan-enabled,.js-plan-popular').forEach(inp => {
        inp.addEventListener('change', onPlanChange);
    });
    wrap.querySelectorAll('.js-plan-title,.js-plan-price,.js-plan-badge,.js-plan-badge-class,.js-plan-features,.js-plan-cta-text,.js-plan-cta-href')
        .forEach(inp => inp.addEventListener('input', onPlanChangeDebounced));
    wrap.querySelectorAll('.js-plan-delete').forEach(btn => {
        btn.addEventListener('click', onPlanDelete);
    });
}

/**
 * Handles pricing card changes and mutates state.
 */
function onPlanChange(e) {
    const col = e.target.closest('.col-md-6, .col-lg-4');
    if (!col) return;
    const idx = Number(col.dataset.index);
    const plan = state.pricing.plans[idx];
    if (!plan) return;

    plan.enabled = col.querySelector('.js-plan-enabled').checked;
    plan.popular = col.querySelector('.js-plan-popular').checked;
    plan.title = col.querySelector('.js-plan-title').value.trim();
    plan.priceLabel = col.querySelector('.js-plan-price').value.trim();
    plan.badge = col.querySelector('.js-plan-badge').value.trim();
    plan.badgeClass = col.querySelector('.js-plan-badge-class').value.trim() || 'text-bg-light';
    plan.features = col.querySelector('.js-plan-features').value
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
    plan.cta = {
        text: col.querySelector('.js-plan-cta-text').value.trim(),
        href: col.querySelector('.js-plan-cta-href').value.trim() || '#contact'
    };

    saveDebounced();
}

const onPlanChangeDebounced = debounce(onPlanChange, 400);

function onPlanDelete(e) {
    const col = e.target.closest('.col-md-6, .col-lg-4');
    if (!col) return;
    const idx = Number(col.dataset.index);
    state.pricing.plans.splice(idx, 1);
    renderAdminPricing();
    saveDebounced();
}

/**
 * Collects pricing section fields from DOM into state.
 */
function collectPricingFromForm() {
    const en = $('#pricing-enabled');
    const lead = $('#pricing-lead');

    state.pricing.enabled = en ? en.checked : true;
    state.pricing.lead = lead ? lead.value.trim() : '';

    const wrap = $('#admin-pricing-list');
    const cols = $$('.admin-pricing-card', wrap);

    state.pricing.plans = cols.map((card, idx) => {
        const old = state.pricing.plans[idx] || {};
        return {
            key: old.key || `plan_${idx + 1}`,
            enabled: card.querySelector('.js-plan-enabled').checked,
            popular: card.querySelector('.js-plan-popular').checked,
            title: card.querySelector('.js-plan-title').value.trim(),
            priceLabel: card.querySelector('.js-plan-price').value.trim(),
            badge: card.querySelector('.js-plan-badge').value.trim(),
            badgeClass: card.querySelector('.js-plan-badge-class').value.trim() || 'text-bg-light',
            features: card.querySelector('.js-plan-features').value
                .split('\n')
                .map(s => s.trim())
                .filter(Boolean),
            cta: {
                text: card.querySelector('.js-plan-cta-text').value.trim(),
                href: card.querySelector('.js-plan-cta-href').value.trim() || '#contact'
            }
        };
    });
}

/* =======================
 * Portfolio admin section
 * ======================= */

/**
 * Renders editable portfolio cards.
 */
function renderAdminPortfolio() {
    const grid = $('#admin-portfolio-grid');
    if (!grid) return;
    grid.innerHTML = '';

    (state.portfolio.items || []).forEach((item, idx) => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-3';
        col.dataset.index = String(idx);

        col.innerHTML = `
      <div class="admin-portfolio-card h-100 d-flex flex-column">
        <img src="${item.image}" alt="${item.title || 'Проєкт'}">
        <div class="p-2 d-flex flex-column gap-1">
          <input class="form-control form-control-sm js-port-title" value="${item.title || ''}">
          <div class="d-flex justify-content-between align-items-center">
            <div class="form-check form-switch">
              <input class="form-check-input js-port-enabled" type="checkbox" ${item.enabled !== false ? 'checked' : ''}>
              <label class="form-check-label small">Активний</label>
            </div>
            <button class="btn btn-sm btn-outline-danger js-port-delete" type="button">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
        grid.appendChild(col);
    });

    grid.querySelectorAll('.js-port-title').forEach(inp => {
        inp.addEventListener('input', onPortfolioChangeDebounced);
    });
    grid.querySelectorAll('.js-port-enabled').forEach(inp => {
        inp.addEventListener('change', onPortfolioChange);
    });
    grid.querySelectorAll('.js-port-delete').forEach(btn => {
        btn.addEventListener('click', onPortfolioDelete);
    });
}

function onPortfolioChange(e) {
    const col = e.target.closest('.col-6, .col-md-3');
    if (!col) return;
    const idx = Number(col.dataset.index);
    const item = state.portfolio.items[idx];
    if (!item) return;

    item.title = col.querySelector('.js-port-title').value.trim();
    item.enabled = col.querySelector('.js-port-enabled').checked;
    saveDebounced();
}

const onPortfolioChangeDebounced = debounce(onPortfolioChange, 400);

function onPortfolioDelete(e) {
    const col = e.target.closest('.col-6, .col-md-3');
    if (!col) return;
    const idx = Number(col.dataset.index);
    state.portfolio.items.splice(idx, 1);
    renderAdminPortfolio();
    saveDebounced();
}

/* ==========================
 * Testimonials admin section
 * ========================== */

/**
 * Renders editable testimonials list.
 */
function renderAdminTestimonials() {
    const en = $('#testimonials-enabled');
    if (en) en.checked = !!state.testimonials.enabled;

    const list = $('#admin-testimonials-list');
    if (!list) return;
    list.innerHTML = '';

    (state.testimonials.items || []).forEach((t, idx) => {
        const row = document.createElement('div');
        row.className = 'admin-testimonial-item';
        row.dataset.index = String(idx);

        row.innerHTML = `
      <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
        <div>
          <input class="form-control form-control-sm mb-1 js-t-name" value="${t.name || ''}" placeholder="Ім’я">
          <input class="form-control form-control-sm js-t-role" value="${t.role || ''}" placeholder="Роль / позиція">
        </div>
        <div class="d-flex flex-column align-items-end gap-1">
          <div class="form-check form-switch">
            <input class="form-check-input js-t-enabled" type="checkbox" ${t.enabled !== false ? 'checked' : ''}>
            <label class="form-check-label small">Активний</label>
          </div>
          <button class="btn btn-sm btn-outline-danger js-t-delete" type="button">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
      <div class="mb-1">
        <label class="form-label small mb-1">Аватар (URL)</label>
        <input class="form-control form-control-sm js-t-avatar" value="${t.avatar || ''}">
      </div>
      <div>
        <label class="form-label small mb-1">Текст відгуку</label>
        <textarea class="form-control form-control-sm js-t-text" rows="2">${t.text || ''}</textarea>
      </div>
    `;

        list.appendChild(row);
    });

    list.querySelectorAll('.js-t-name,.js-t-role,.js-t-avatar,.js-t-text')
        .forEach(inp => inp.addEventListener('input', onTestimonialChangeDebounced));
    list.querySelectorAll('.js-t-enabled').forEach(inp => {
        inp.addEventListener('change', onTestimonialChange);
    });
    list.querySelectorAll('.js-t-delete').forEach(btn => {
        btn.addEventListener('click', onTestimonialDelete);
    });
}

function onTestimonialChange(e) {
    const row = e.target.closest('.admin-testimonial-item');
    if (!row) return;
    const idx = Number(row.dataset.index);
    const t = state.testimonials.items[idx];
    if (!t) return;

    t.name = row.querySelector('.js-t-name').value.trim();
    t.role = row.querySelector('.js-t-role').value.trim();
    t.avatar = row.querySelector('.js-t-avatar').value.trim();
    t.text = row.querySelector('.js-t-text').value.trim();
    t.enabled = row.querySelector('.js-t-enabled').checked;

    saveDebounced();
}

const onTestimonialChangeDebounced = debounce(onTestimonialChange, 400);

function onTestimonialDelete(e) {
    const row = e.target.closest('.admin-testimonial-item');
    if (!row) return;
    const idx = Number(row.dataset.index);
    state.testimonials.items.splice(idx, 1);
    renderAdminTestimonials();
    saveDebounced();
}

/* =================
 * FAQ admin section
 * ================= */

/**
 * Renders editable FAQ list.
 */
function renderAdminFAQ() {
    const list = $('#admin-faq-list');
    if (!list) return;
    list.innerHTML = '';

    (state.faq.items || []).forEach((it, idx) => {
        const row = document.createElement('div');
        row.className = 'list-group-item d-flex justify-content-between align-items-start gap-2';
        row.dataset.index = String(idx);

        row.innerHTML = `
      <div class="flex-grow-1">
        <input class="form-control form-control-sm mb-1 js-faq-q" value="${it.question || ''}">
        <input class="form-control form-control-sm js-faq-a" value="${it.answer || ''}">
      </div>
      <div class="d-flex flex-column align-items-end gap-1 ms-2">
        <div class="form-check form-switch">
          <input class="form-check-input js-faq-enabled" type="checkbox" ${it.enabled !== false ? 'checked' : ''}>
        </div>
        <button class="btn btn-sm btn-outline-danger js-faq-delete" type="button">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `;
        list.appendChild(row);
    });

    list.querySelectorAll('.js-faq-q,.js-faq-a').forEach(inp => {
        inp.addEventListener('input', onFaqChangeDebounced);
    });
    list.querySelectorAll('.js-faq-enabled').forEach(inp => {
        inp.addEventListener('change', onFaqChange);
    });
    list.querySelectorAll('.js-faq-delete').forEach(btn => {
        btn.addEventListener('click', onFaqDelete);
    });
}

function onFaqChange(e) {
    const row = e.target.closest('.list-group-item');
    if (!row) return;
    const idx = Number(row.dataset.index);
    const it = state.faq.items[idx];
    if (!it) return;

    it.question = row.querySelector('.js-faq-q').value.trim();
    it.answer = row.querySelector('.js-faq-a').value.trim();
    it.enabled = row.querySelector('.js-faq-enabled').checked;
    saveDebounced();
}

const onFaqChangeDebounced = debounce(onFaqChange, 400);

function onFaqDelete(e) {
    const row = e.target.closest('.list-group-item');
    if (!row) return;
    const idx = Number(row.dataset.index);
    state.faq.items.splice(idx, 1);
    renderAdminFAQ();
    saveDebounced();
}

/* ======================
 * Contacts form section
 * ====================== */

/**
 * Populates contacts fields from state.
 */
function fillContactsForm() {
    const em = $('#contacts-email');
    const tg = $('#contacts-telegram');
    const gh = $('#contacts-github');

    if (em) em.value = state.contacts.email || '';
    if (tg) tg.value = state.contacts.telegram || '';
    if (gh) gh.value = state.contacts.github || '';
}

/**
 * Collects contacts fields from DOM into state.
 */
function collectContactsFromForm() {
    const em = $('#contacts-email');
    const tg = $('#contacts-telegram');
    const gh = $('#contacts-github');

    state.contacts.email = em ? em.value.trim() : '';
    state.contacts.telegram = tg ? tg.value.trim() : '';
    state.contacts.github = gh ? gh.value.trim() : '';
}

/* ==========================
 * Add-item buttons handlers
 * ========================== */

/**
 * Binds "add new item" buttons for all dynamic collections.
 */
function bindAddButtons() {
    // новий сервіс
    const btnSvc = $('#btn-add-service');
    if (btnSvc) {
        btnSvc.addEventListener('click', () => {
            state.services.items.push({
                key: 'svc_' + (state.services.items.length + 1),
                enabled: true,
                title: '',
                description: '',
                priceLabel: '',
                duration: '',
                href: '',
                iconClass: 'bi bi-window-stack'
            });
            renderAdminServices();
            saveDebounced();
        });
    }

    // новий тариф
    const btnPlan = $('#btn-add-plan');
    if (btnPlan) {
        btnPlan.addEventListener('click', () => {
            state.pricing.plans.push({
                key: 'plan_' + (state.pricing.plans.length + 1),
                enabled: true,
                popular: false,
                title: '',
                priceLabel: '',
                badge: '',
                badgeClass: 'text-bg-light',
                features: [],
                cta: { text: 'Замовити', href: '#contact' }
            });
            renderAdminPricing();
            saveDebounced();
        });
    }

    // новий елемент портфоліо
    const btnPort = $('#btn-add-portfolio');
    if (btnPort) {
        btnPort.addEventListener('click', () => {
            const urlEl = $('#portfolio-new-url');
            const titleEl = $('#portfolio-new-title');
            const url = urlEl ? urlEl.value.trim() : '';
            if (!url) {
                showToast('Вкажи URL зображення для портфоліо', 'warning');
                return;
            }
            const title = titleEl ? titleEl.value.trim() : '';

            state.portfolio.items.push({
                id: 'p_' + Date.now(),
                image: url,
                title,
                enabled: true
            });

            if (urlEl) urlEl.value = '';
            if (titleEl) titleEl.value = '';
            renderAdminPortfolio();
            saveDebounced();
        });
    }

    // новий відгук
    const btnTest = $('#btn-add-testimonial');
    if (btnTest) {
        btnTest.addEventListener('click', () => {
            const nameEl = $('#t-new-name');
            const textEl = $('#t-new-text');
            const roleEl = $('#t-new-role');
            const avatarEl = $('#t-new-avatar');

            const name = nameEl ? nameEl.value.trim() : '';
            const text = textEl ? textEl.value.trim() : '';

            if (!name || !text) {
                showToast('Ім’я та текст відгуку обов’язкові', 'warning');
                return;
            }

            const item = {
                id: 't_' + Date.now(),
                name,
                role: roleEl ? roleEl.value.trim() : '',
                avatar: avatarEl ? avatarEl.value.trim() : '',
                text,
                enabled: true
            };

            state.testimonials.items.push(item);

            if (nameEl) nameEl.value = '';
            if (roleEl) roleEl.value = '';
            if (avatarEl) avatarEl.value = '';
            if (textEl) textEl.value = '';

            renderAdminTestimonials();
            saveDebounced();
        });
    }

    // новий FAQ
    const btnFaq = $('#btn-add-faq');
    if (btnFaq) {
        btnFaq.addEventListener('click', () => {
            const qEl = $('#faq-new-q');
            const aEl = $('#faq-new-a');
            const q = qEl ? qEl.value.trim() : '';
            const a = aEl ? aEl.value.trim() : '';
            if (!q || !a) {
                showToast('Питання і відповідь обов’язкові', 'warning');
                return;
            }

            state.faq.items.push({
                id: 'faq_' + Date.now(),
                question: q,
                answer: a,
                enabled: true
            });

            if (qEl) qEl.value = '';
            if (aEl) aEl.value = '';

            renderAdminFAQ();
            saveDebounced();
        });
    }
}

/* =========================
 * State collection helpers
 * ========================= */

/**
 * Collects form-backed sections before save.
 * Portfolio/testimonials/faq update state live in onChange handlers.
 */
function collectStateFromForm() {
    collectHeroFromForm();
    collectServicesFromForm();
    collectPricingFromForm();
    collectContactsFromForm();
    // Portfolio/testimonials/FAQ mutate state in their own onChange handlers.
}

/**
 * Converts state into backend payload.
 */
function buildPayload() {
    return state;
}

/* =================
 * Save/load actions
 * ================= */

const saveDebounced = debounce(saveNow, 700);

/**
 * Persists current state to backend.
 */
async function saveNow() {
    try {
        setSaveStatus('saving');
        collectStateFromForm();
        const payload = buildPayload();

        const res = await fetch(API.save, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error('Save failed with status ' + res.status);
        }

        setSaveStatus('saved');
        showToast('Зміни збережено', 'success');
    } catch (err) {
        console.error('[ADMIN] saveNow failed:', err);
        setSaveStatus('error');
        showToast('Помилка збереження. Перевір API.', 'danger');
    } finally {
        setTimeout(() => setSaveStatus('idle'), 3000);
    }
}

/**
 * Loads content from backend and initializes all form sections.
 */
async function loadContent() {
    try {
        const res = await fetch(API.load, {
            method: 'GET',
            credentials: 'include'
        });

        if (!res.ok) {
            throw new Error('Load failed with status ' + res.status);
        }

        const data = await res.json();

        // Hero
        if (data.hero) state.hero = {
            enabled: data.hero.enabled !== false,
            title: data.hero.title || '',
            subtitle: data.hero.subtitle || '',
            bullets: Array.isArray(data.hero.bullets) ? data.hero.bullets : [],
            cta1: {
                text: data.hero.cta1?.text || '',
                href: data.hero.cta1?.href || '#services'
            },
            cta2: {
                text: data.hero.cta2?.text || '',
                href: data.hero.cta2?.href || '#portfolio'
            },
            image: data.hero.image || ''
        };

        // Services
        if (data.services) {
            state.services.lead = data.services.lead || '';
            state.services.items = Array.isArray(data.services.items)
                ? data.services.items
                : [];
        }

        // Pricing
        if (data.pricing) {
            state.pricing.enabled = data.pricing.enabled !== false;
            state.pricing.lead = data.pricing.lead || '';
            state.pricing.plans = Array.isArray(data.pricing.plans)
                ? data.pricing.plans
                : [];
        }

        // Portfolio
        if (data.portfolio) {
            state.portfolio.items = Array.isArray(data.portfolio.items)
                ? data.portfolio.items
                : [];
        }

        // Testimonials
        if (data.testimonials) {
            state.testimonials.enabled = data.testimonials.enabled !== false;
            state.testimonials.items = Array.isArray(data.testimonials.items)
                ? data.testimonials.items
                : [];
        }

        // FAQ
        if (data.faq) {
            state.faq.items = Array.isArray(data.faq.items)
                ? data.faq.items
                : [];
        }

        // Contacts
        if (data.contacts) {
            state.contacts.email = data.contacts.email || '';
            state.contacts.telegram = data.contacts.telegram || '';
            state.contacts.github = data.contacts.github || '';
        }

        // Render all sections after state hydration.
        fillHeroForm();
        renderAdminServices();
        renderAdminPricing();
        renderAdminPortfolio();
        renderAdminTestimonials();
        renderAdminFAQ();
        fillContactsForm();

        // Initialize modal setting buttons after form fields are populated.
        initSettingButtons();

        setSaveStatus('idle');
        showToast('Контент завантажено', 'success');
    } catch (err) {
        console.error('[ADMIN] loadContent failed:', err);
        showToast('Не вдалося завантажити контент. Працюєш у демо-режимі.', 'warning');
        setSaveStatus('error');
        // Keep local editing usable even when backend is unavailable.
        initSettingButtons();
    }
}

/* ==================
 * Global DOM bindings
 * ================== */

/**
 * Binds global autosave and explicit save handlers.
 */
function bindGlobalHandlers() {
    // Auto-save enabled fields.
    $$('.js-auto-save').forEach(inp => {
        inp.addEventListener('input', () => saveDebounced());
    });

    // Section toggles.
    const heroEn = $('#hero-enabled');
    if (heroEn) heroEn.addEventListener('change', () => saveDebounced());

    const prEn = $('#pricing-enabled');
    if (prEn) prEn.addEventListener('change', () => saveDebounced());

    const tstEn = $('#testimonials-enabled');
    if (tstEn) tstEn.addEventListener('change', () => saveDebounced());

    // Explicit "Save now" actions.
    const btnSaveTop = $('#btn-save');
    const btnSaveBottom = $('#btn-save-bottom');
    if (btnSaveTop) btnSaveTop.addEventListener('click', () => saveNow());
    if (btnSaveBottom) btnSaveBottom.addEventListener('click', () => saveNow());
}

/* =================
 * Section tab switch
 * ================= */

/**
 * Shows selected admin section and updates active tab visual state.
 */
function initSectionTabs() {
    const tabs = document.querySelectorAll('.admin-helper-tab[data-section-tab]');
    const sections = document.querySelectorAll('.admin-section');

    if (!tabs.length || !sections.length) return;

    // Toggle sections visibility by tab key.
    function showSection(key) {
        sections.forEach(sec => {
            const secKey = sec.dataset.section;
            if (key === 'all' || key === secKey) {
                sec.classList.remove('d-none');
            } else {
                sec.classList.add('d-none');
            }
        });
    }

    // Bind tab click handlers.
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const key = tab.getAttribute('data-section-tab');

            // активний стан для вкладок
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // показати тільки потрібний розділ
            showSection(key);
        });
    });

    // Initial view.
    showSection('hero');
}

/* =====
 * Boot
 * ===== */

document.addEventListener('DOMContentLoaded', () => {
    bindGlobalHandlers();
    bindAddButtons();
    initSectionTabs();
    loadContent();
});
