/* =========================
 * Layout bootstrap helpers
 * ========================= */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

function initScrollReveal() {
    // Respect OS accessibility preference and disable animated reveal.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elements = [];

    // Register nodes once and set CSS variables used by reveal animation.
    const addElements = (nodeList, opts = {}) => {
        const list = Array.from(nodeList || []);
        list.forEach((el, i) => {
            if (!el || el.dataset.revealBound) return;
            el.dataset.revealBound = '1';
            el.classList.add('reveal');

            if (opts.stagger) {
                el.style.setProperty('--reveal-delay', `${i * (opts.step || 80)}ms`);
            }
            if (opts.scatter) {
                const offset = 18 + (i % 3) * 6;
                const rotate = (i % 3 - 1) * 0.8;
                el.style.setProperty('--reveal-offset', `${offset}px`);
                el.style.setProperty('--reveal-rotate', `${rotate}deg`);
            }
            elements.push(el);
        });
    };

    addElements(document.querySelectorAll('header.hero .col-lg-7, header.hero .col-lg-5'), {
        stagger: true,
        scatter: true,
        step: 120
    });
    addElements(document.querySelectorAll('section .section-title, section .text-muted-2'), { stagger: true, step: 80 });
    addElements(document.querySelectorAll('#services .row.g-4 > [class*="col"]'), { stagger: true, scatter: true });
    addElements(document.querySelectorAll('#portfolio .row.g-4 > [class*="col"]'), { stagger: true, scatter: true });
    addElements(document.querySelectorAll('#pricing .row.g-4 > [class*="col"]'), { stagger: true, scatter: true });
    addElements(document.querySelectorAll('#about .row.g-4 > [class*="col"]'), { stagger: true, scatter: true });
    addElements(document.querySelectorAll('#contact .row.g-4 > [class*="col"]'), { stagger: true, scatter: true });
    addElements(document.querySelectorAll('footer .container > *'), { stagger: true, step: 120 });

    if (reduceMotion) {
        elements.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                } else {
                    entry.target.classList.remove('is-visible');
                }
            });
        },
        { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    elements.forEach(el => observer.observe(el));
}

(() => {
    // Native Bootstrap validation for all forms except feedback modal
    // because feedback has custom business rules below.
    const forms = document.querySelectorAll('.needs-validation');

    Array.from(forms).forEach(form => {
        // ❗️feedback-form валідимо окремо (Zod-like)
        if (form.id === 'feedback-form') return;

        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
})();

document.addEventListener('DOMContentLoaded', initScrollReveal);

/* ================================
 * Admin session aware nav button
 * ================================ */
async function initAdminPanelButton() {
    try {
        const res = await fetch('http://localhost:3000/admin/check-session', {
            method: 'GET',
            credentials: 'include',
            headers: {
                Accept: 'application/json'
            }
        });

        // Backend contract for this project:
        // 403 => session exists => user is admin => show quick admin button.
        if (res.status === 403) {
            const navList = document.querySelector('#navMain .navbar-nav');
            if (!navList) return;

            // Prevent duplicate injection on repeated init.
            if (navList.querySelector('[data-admin-button="true"]')) return;

            const li = document.createElement('li');
            li.className = 'nav-item';

            li.innerHTML = `
                <a class="btn btn-sm btn-outline-dark ms-lg-2"
                   href="http://localhost:8080/adminPanel"
                   data-admin-button="true">
                    <i class="bi bi-speedometer2 me-1"></i>Адмін панель
                </a>
            `;

            navList.appendChild(li);
        }

    } catch (err) {
        console.error('[INIT ADMIN BUTTON] Помилка перевірки сесії:', err);
    }
}
/* ======================================
 * Main page rendering and data mapping
 * ====================================== */

function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (value == null || value === '') {
        el.textContent = '';
        return;
    }
    el.textContent = value;
}

/**
 * Replaces only text part of CTA button while keeping icon node intact.
 * Used when CTA text comes from backend and can change per service/page.
 */
function setButtonTextWithIcon(btn, text) {
    if (!btn) return;

    // Preserve first icon node and replace trailing text only.
    const textNodes = Array.from(btn.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
    textNodes.forEach(n => n.remove());
    btn.append(document.createTextNode(` ${text}`));
}

/**
 * Renders hero section from normalized data model.
 * Also normalizes old backend image path '/app/uploads/*' to '/uploads/*'.
 */
function renderHero(hero) {
    if (!hero) return;

    setText('hero-title', hero.title || '');
    setText('hero-subtitle', hero.subtitle || '');

    const cta1 = document.getElementById('hero-cta1');
    const cta2 = document.getElementById('hero-cta2');

    if (cta1) {
        cta1.style.display = hero.cta1?.text ? '' : 'none';
        if (hero.cta1?.text) setButtonTextWithIcon(cta1, hero.cta1.text);
        cta1.href = hero.cta1?.href || '#services';
    }

    if (cta2) {
        cta2.style.display = hero.cta2?.text ? '' : 'none';
        if (hero.cta2?.text) setButtonTextWithIcon(cta2, hero.cta2.text);
        cta2.href = hero.cta2?.href || '#portfolio';
    }

    const img = document.getElementById('hero-image');
    if (img) {
        const fallback =
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop';
        let finalSrc = hero.image || fallback;
        if (finalSrc.startsWith('/app/uploads/')) {
            finalSrc = finalSrc.replace('/app/uploads/', '/uploads/');
        }
        img.src = finalSrc;
    }

    const bullets = document.getElementById('hero-bullets');
    if (!bullets) return;
    bullets.innerHTML = '';
    (hero.bullets || []).forEach(t => {
        const div = document.createElement('div');
        div.innerHTML = '<i class="bi bi-check-circle me-1 text-success"></i>' + t;
        bullets.appendChild(div);
    });
}

/**
 * Renders service cards list.
 * Hidden/disabled services are filtered out by `enabled !== false`.
 */
function renderServices(servicesBlock) {
    const lead = document.getElementById('services-lead');
    if (lead) lead.textContent = servicesBlock?.lead || '';

    const container = document.getElementById('services-list');
    if (!container) return;

    container.innerHTML = '';
    const items = (servicesBlock?.items || []).filter(s => s && s.enabled !== false);
    if (!items.length) return;

    items.forEach(svc => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
      <div class="card card-glass h-100 p-3">
        <div class="d-flex align-items-center mb-3">
          <div class="icon-circle me-3">
            ${svc.iconHtml || '<i class="bi bi-window-stack"></i>'}
          </div>
          <h5 class="mb-0">${svc.title || ''}</h5>
        </div>
        <p class="text-muted">${svc.description || ''}</p>
        <div class="d-flex align-items-center justify-content-between">
          <span class="fw-bold">${svc.priceLabel || ''}</span>
          ${
            svc.href
                ? `<a href="${svc.href}" class="btn btn-sm btn-outline-primary">Дізнатись більше</a>`
                : `<button class="btn btn-sm btn-outline-secondary" disabled>Недоступно</button>`
        }
        </div>
      </div>`;
        container.appendChild(col);
    });
}

/**
 * Renders pricing plans grid with optional badge and CTA.
 */
function renderPricing(pricingBlock) {
    const lead = document.getElementById('pricing-lead');
    if (lead) lead.textContent = pricingBlock?.lead || '';

    const container = document.getElementById('pricing-list');
    if (!container) return;

    container.innerHTML = '';
    const plans = (pricingBlock?.plans || []).filter(p => p && p.enabled !== false);
    if (!plans.length) return;

    plans.forEach(plan => {
        const col = document.createElement('div');
        col.className = 'col-md-12 col-lg-4';
        col.innerHTML = `
      <div class="pricing-card ${plan.popular ? 'popular' : ''} p-4 h-100">
        <div class="d-flex justify-content-between align-items-start">
          <h5>${plan.title || ''}</h5>
          ${
            plan.badge
                ? `<span class="badge ${plan.badgeClass || 'text-bg-light'}">${plan.badge}</span>`
                : ''
        }
        </div>
        <div class="${plan.popular ? 'display-6' : 'fs-3'} fw-bold my-2">
          ${plan.priceLabel || ''}
        </div>
        <ul class="text-muted mb-3">
          ${(plan.features || []).map(f => `<li>${f}</li>`).join('')}
        </ul>
        ${
            plan.cta
                ? `<a href="${plan.cta.href || '#contact'}"
                   class="${plan.popular ? 'btn btn-gradient' : 'btn btn-outline-primary'} w-100">
                 ${plan.cta.text || 'Замовити'}
               </a>`
                : ''
        }
      </div>`;
        container.appendChild(col);
    });
}

/**
 * Renders testimonials carousel and toggles whole section visibility.
 */
function renderTestimonials(block) {
    const section = document.getElementById('testimonials');
    const inner = document.getElementById('testimonials-inner');
    if (!section || !inner) return;

    inner.innerHTML = '';
    const items = (block?.items || []).filter(t => t && t.enabled !== false);
    if (!items.length) {
        section.hidden = true;
        return;
    }

    section.hidden = false;
    items.forEach((t, idx) => {
        const item = document.createElement('div');
        item.className = 'carousel-item' + (idx === 0 ? ' active' : '');
        item.innerHTML = `
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="testimonial-card p-4">
            <div class="quote-line p-3 mb-2">“${t.text || ''}”</div>
            <div class="d-flex align-items-center gap-3">
              <img src="${t.avatar || 'https://i.pravatar.cc/80'}"
                   data-allow-external="1"
                   class="rounded-circle"
                   width="48"
                   height="48"
                   alt="${t.author || 'Клієнт'}">
              <div>
                <div class="fw-semibold">${t.author || ''}</div>
                <div class="text-muted-2 small">${t.role || ''}</div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
        inner.appendChild(item);
    });
}

/**
 * Renders selectable avatar presets for feedback form.
 * First valid avatar is preselected to keep form submission deterministic.
 */
function renderAvatarTestimonials(list) {
    const wrap = document.getElementById('fb-avatar-list');
    const hiddenUrl = document.getElementById('fb-avatar-url');
    const hiddenName = document.getElementById('fb-avatar-name');
    if (!wrap) return;

    wrap.innerHTML = '';
    const items = Array.isArray(list) ? list : [];
    if (!items.length) return;

    items.slice(0, 6).forEach((a, idx) => {
        const url = String(a?.url || '').trim();
        const name = String(a?.name || '').trim();
        if (!url) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'avatar-option';
        btn.innerHTML = `
          <img class="avatar-img" src="${url}" alt="${name || 'avatar'}" data-allow-external="1">
          <div class="avatar-name">${name || ''}</div>
        `;

        btn.addEventListener('click', () => {
            wrap.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
            btn.classList.add('selected');
            if (hiddenUrl) hiddenUrl.value = url;
            if (hiddenName) hiddenName.value = name;
        });

        if (idx === 0 && hiddenUrl && !hiddenUrl.value) {
            btn.classList.add('selected');
            hiddenUrl.value = url;
            if (hiddenName) hiddenName.value = name;
        }

        wrap.appendChild(btn);
    });
}

/**
 * Renders FAQ accordion with first item opened by default.
 */
function renderFAQ(block) {
    const section = document.getElementById('faq-section');
    const acc = document.getElementById('faq');
    if (!section || !acc) return;

    acc.innerHTML = '';
    const items = (block?.items || []).filter(q => q && q.enabled !== false);
    if (!items.length) {
        section.hidden = true;
        return;
    }

    section.hidden = false;
    items.forEach((q, idx) => {
        const id = 'q' + (idx + 1);
        const show = idx === 0 ? 'show' : '';
        const collapsed = idx === 0 ? '' : 'collapsed';
        acc.insertAdjacentHTML(
            'beforeend',
            `
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button ${collapsed}" data-bs-toggle="collapse" data-bs-target="#${id}">
            ${q.question || ''}
          </button>
        </h2>
        <div id="${id}" class="accordion-collapse collapse ${show}" data-bs-parent="#faq">
          <div class="accordion-body">${q.answer || ''}</div>
        </div>
      </div>`
        );
    });
}

/**
 * Renders contact links.
 * Missing values clear text and href to avoid broken clickable anchors.
 */
function renderContacts(data) {
    if (!data) return;

    const emailLink = document.getElementById('contact-email-link');
    const tgLink = document.getElementById('contact-telegram-link');
    const ghLink = document.getElementById('contact-github-link');

    if (emailLink) {
        if (data.email) {
            emailLink.textContent = data.email;
            emailLink.href = 'mailto:' + data.email;
        } else {
            emailLink.textContent = '';
            emailLink.removeAttribute('href');
        }
    }

    if (tgLink) {
        if (data.telegram) {
            tgLink.textContent = data.telegramLabel || data.telegram;
            tgLink.href = data.telegram;
        } else {
            tgLink.textContent = '';
            tgLink.removeAttribute('href');
        }
    }

    if (ghLink) {
        if (data.github) {
            ghLink.textContent = data.github;
            ghLink.href = data.github;
        } else {
            ghLink.textContent = '';
            ghLink.removeAttribute('href');
        }
    }
}

/**
 * Renders "About" section blocks and CTA buttons.
 */
function renderAbout(about) {
    const section = document.getElementById('about');
    if (!section || !about) return;

    const titleEl = document.getElementById('about-title');
    if (titleEl && about.title) titleEl.textContent = about.title;

    const descrEl = document.getElementById('about-description');
    if (descrEl) descrEl.textContent = about.description || '';

    const focusLabelEl = document.getElementById('about-focus-label');
    if (focusLabelEl && about.focusLabel) focusLabelEl.textContent = about.focusLabel;

    const focusValueEl = document.getElementById('about-focus-value');
    if (focusValueEl && about.focusValue) focusValueEl.textContent = about.focusValue;

    const stackLabelEl = document.getElementById('about-stack-label');
    if (stackLabelEl && about.stackLabel) stackLabelEl.textContent = about.stackLabel;

    const stackValueEl = document.getElementById('about-stack-value');
    if (stackValueEl && about.stackValue) stackValueEl.textContent = about.stackValue;

    const imgEl = document.getElementById('about-image');
    if (imgEl) {
        imgEl.src = about.image || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1200&auto=format&fit=crop';
    }

    const featuresList = document.getElementById('about-features');
    if (featuresList) {
        featuresList.innerHTML = '';
        (about.features || []).forEach(f => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
        <span><i class="bi bi-check2-circle text-success me-2"></i>${f}</span>
        <span class="badge text-bg-light">включено</span>
      `;
            featuresList.appendChild(li);
        });
    }

    const cta1 = document.getElementById('about-cta1');
    const cta1Text = document.getElementById('about-cta1-text');
    if (cta1) {
        if (about.cta1 && about.cta1.text) {
            cta1.style.display = '';
            cta1.href = about.cta1.href || '#portfolio';
            if (cta1Text) cta1Text.textContent = about.cta1.text;
        } else {
            cta1.style.display = 'none';
        }
    }

    const cta2 = document.getElementById('about-cta2');
    const cta2Text = document.getElementById('about-cta2-text');
    if (cta2) {
        if (about.cta2 && about.cta2.text) {
            cta2.style.display = '';
            cta2.href = about.cta2.href || '#contact';
            if (cta2Text) cta2Text.textContent = about.cta2.text;
        } else {
            cta2.style.display = 'none';
        }
    }
}

/**
 * Entry renderer for all homepage blocks.
 * Expects normalized object from `mapMainPageFromApi`.
 */
function renderSite(data) {
    if (data.hero) renderHero(data.hero);
    if (data.services) renderServices(data.services);
    if (data.pricing) renderPricing(data.pricing);
    if (data.testimonials) renderTestimonials(data.testimonials);
    if (data.avatarTestimonials) renderAvatarTestimonials(data.avatarTestimonials);
    if (data.faq) renderFAQ(data.faq);
    if (data.contacts) renderContacts(data.contacts);
    if (data.about) renderAbout(data.about);
}

const navMain = document.getElementById('navMain');
if (navMain) {
    // Auto-close mobile nav after menu item click for better UX.
    const links = navMain.querySelectorAll('.nav-link');
    links.forEach(a =>
        a.addEventListener('click', () => {
            if (window.getComputedStyle(navMain).display !== 'none') {
                const toggler = document.querySelector('.navbar-toggler');
                if (toggler && getComputedStyle(toggler).display !== 'none') {
                    const bsCollapse = bootstrap.Collapse.getOrCreateInstance('#navMain');
                    bsCollapse.hide();
                }
            }
        })
    );
}
// ===========================
// Testimonials (Zod-like) validation + UX
// Rules (1:1):
// author: trim, min 2 max 30
// role:   trim, min 2 max 30, nullable (empty => OK)
// text:   trim, min 20 max 255
// ===========================

/**
 * Returns safe trimmed input value for all validation paths.
 */
function _getTrimmedValue(input) {
    return String(input?.value ?? '').trim();
}

const testimonialsFieldRules = {
    name: {
        min: 2,
        max: 30,
        required: true,
        emptyMsg: "Ім’я обов’язкове.",
        rangeMsg: "Ім’я: 2–30 символів."
    },
    company: {
        min: 2,
        max: 30,
        required: false,
        rangeMsg: "Роль/компанія: 2–30 символів."
    },
    text: {
        min: 20,
        max: 255,
        required: true,
        emptyMsg: "Текст відгуку обов’язковий.",
        rangeMsg: "Текст: 20–255 символів."
    }
};

// ===== Feedback interaction state =====
let feedbackTouched = false;

/**
 * Interaction gate:
 * submit button stays disabled until user actually interacts with form.
 */
function setFeedbackTouched(v) {
    feedbackTouched = !!v;
}
function isFeedbackTouched() {
    return feedbackTouched;
}

function getTestimonialsFieldKey(input) {
    if (!input) return null;
    if (input.id === 'fb-name') return 'name';
    if (input.id === 'fb-company') return 'company';
    if (input.id === 'fb-text') return 'text';
    return null;
}

/**
 * Core field validator shared by:
 * - live validation
 * - submit-time validation
 * - submit button state calculation
 */
function validateTestimonialsValue(key, raw) {
    const rule = testimonialsFieldRules[key];
    if (!rule) return { ok: true };

    const v = String(raw ?? '').trim();

    if (!v) {
        if (rule.required) {
            return { ok: false, msg: rule.emptyMsg || 'Поле не може бути порожнім.' };
        }
        return { ok: true };
    }

    if (v.length < rule.min || v.length > rule.max) {
        return { ok: false, msg: rule.rangeMsg || 'Некоректна довжина.' };
    }

    return { ok: true };
}

/**
 * Marks input as invalid and writes message into paired error node.
 */
function setInvalid(input, message) {
    if (!input) return;
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');

    const errEl = document.getElementById(`${input.id}-error`);
    if (errEl) {
        errEl.textContent = message || 'Некоректне значення';
        errEl.style.display = 'block';
    }
}

/**
 * Brief positive feedback after valid input.
 * Green state auto-clears to avoid persistent visual noise.
 */
function flashValid(input, ms = 1500) {
    if (!input) return;
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');

    const errEl = document.getElementById(`${input.id}-error`);
    if (errEl) errEl.textContent = '';

    if (input.dataset.validTimer) {
        clearTimeout(Number(input.dataset.validTimer));
    }

    const t = window.setTimeout(() => {
        input.classList.remove('is-valid');
        delete input.dataset.validTimer;
    }, ms);

    input.dataset.validTimer = String(t);
}

/**
 * Clears both Bootstrap classes and inline error content.
 */
function clearValidation(input) {
    if (!input) return;
    input.classList.remove('is-valid', 'is-invalid');

    const errEl = document.getElementById(`${input.id}-error`);
    if (errEl) {
        errEl.textContent = '';
        errEl.style.display = 'none';
    }
}

/**
 * Resets all feedback fields visual validation state.
 */
function resetTestimonialsInputsUI({ nameInput, companyInput, textInput }) {
    [nameInput, companyInput, textInput].filter(Boolean).forEach(input => {
        clearValidation(input);

        if (input.dataset.validTimer) {
            clearTimeout(Number(input.dataset.validTimer));
            delete input.dataset.validTimer;
        }
    });
}

/**
 * Full feedback form reset after successful submit.
 */
function resetFeedbackFormState({ feedbackForm, submitBtn, getInputs }) {
    feedbackForm.reset();
    feedbackForm.classList.remove('was-validated');
    const inputs = getInputs();
    resetTestimonialsInputsUI(inputs);
    setFeedbackTouched(false);
    if (submitBtn) submitBtn.disabled = true;
}

/**
 * Field-level validation wrapper.
 */
function validateTestimonialsField(input) {
    const key = getTestimonialsFieldKey(input);
    if (!key) return { ok: true };
    return validateTestimonialsValue(key, _getTrimmedValue(input));
}

/**
 * Live field validation renderer used by input/blur events.
 */
function validateAndRenderTestimonialsInput(input, syncBtn) {
    const key = getTestimonialsFieldKey(input);
    if (!key) return true;

    const raw = _getTrimmedValue(input);

    // optional field case (company)
    if (key === 'company' && !raw) {
        clearValidation(input);
        syncBtn();
        return true;
    }

    const r = validateTestimonialsValue(key, raw);

    if (!r.ok) {
        setInvalid(input, r.msg);
        syncBtn();
        return false;
    }

    clearValidation(input);
    flashValid(input, 1200);
    syncBtn();
    return true;
}

/**
 * Submit-time full form validation.
 */
function validateTestimonialsForm({ nameInput, companyInput, textInput }) {
    let hasError = false;

    [nameInput, companyInput, textInput].forEach(input => {
        const r = validateTestimonialsField(input);
        if (!r.ok) {
            setInvalid(input, r.msg);
            hasError = true;
        }
    });

    return !hasError;
}


/**
 * Determines if submit button can be enabled.
 * company is optional, but if present must pass length rule.
 */
function isTestimonialsFormReady({ nameInput, companyInput, textInput }) {
    if (!nameInput || !textInput) return false;

    // name must be valid
    const r1 = validateTestimonialsValue('name', _getTrimmedValue(nameInput));

    // text must be valid
    const r3 = validateTestimonialsValue('text', _getTrimmedValue(textInput));

    // company optional: empty => OK, non-empty => must be valid
    const companyRaw = _getTrimmedValue(companyInput);
    const r2 = companyRaw
        ? validateTestimonialsValue('company', companyRaw)
        : { ok: true };

    return r1.ok && r2.ok && r3.ok;
}

/**
 * Builds payload for `/work/testimonials`.
 */
function buildTestimonialsPayload({ nameInput, companyInput, textInput }) {
    const author = _getTrimmedValue(nameInput);
    const roleTrimmed = _getTrimmedValue(companyInput);
    const text = _getTrimmedValue(textInput);
    const avatarUrl = String(document.getElementById('fb-avatar-url')?.value || '').trim();
    const avatarName = String(document.getElementById('fb-avatar-name')?.value || '').trim();

    return {
        enabled: false,
        author,
        text,
        role: roleTrimmed.length ? roleTrimmed : null, // nullable як у Zod
        sortOrder: null,
        avatar: avatarUrl || null,
        avatarName: avatarName || null
    };
}


/**
 * Initializes feedback modal:
 * - live validation
 * - submit enablement logic
 * - API submit and success/error UX
 */
function initFeedbackForm() {
    const feedbackForm = document.getElementById('feedback-form');
    if (!feedbackForm) return;

    const feedbackAlert = document.getElementById('feedback-alert');
    const modalEl = document.getElementById('feedbackModal');

    // Submit button can be outside <form> via HTML form="feedback-form".
    const getSubmitBtn = () =>
        feedbackForm.querySelector('button[type="submit"]') ||
        document.querySelector('button[type="submit"][form="feedback-form"]');

    // Resolve actual input nodes on each call (safe for modal re-renders).
    const getInputs = () => ({
        nameInput: feedbackForm.querySelector('#fb-name'),
        companyInput: feedbackForm.querySelector('#fb-company'),
        textInput: feedbackForm.querySelector('#fb-text')
    });

    // Centralized submit-state synchronization.
    const syncBtn = () => {
        const submitBtn = getSubmitBtn();
        if (!submitBtn) return;

        const inputs = getInputs();

        const ready = isTestimonialsFormReady({
            nameInput: inputs.nameInput,
            companyInput: inputs.companyInput,
            textInput: inputs.textInput
        });

        submitBtn.disabled = !(isFeedbackTouched() && ready);
    };

    const submitBtn = getSubmitBtn();
    if (submitBtn) submitBtn.disabled = true;
    syncBtn();

    // Live validation while user types.
    feedbackForm.addEventListener('input', e => {
        const target = e.target;
        if (!getTestimonialsFieldKey(target)) return;

        setFeedbackTouched(true);
        validateAndRenderTestimonialsInput(target, syncBtn);
    });

    // Keep blur validation for keyboard/mouse navigation.
    feedbackForm.addEventListener(
        'blur',
        e => {
            const target = e.target;
            if (!getTestimonialsFieldKey(target)) return;
            validateAndRenderTestimonialsInput(target, syncBtn);
        },
        true
    );

    // Final validation and submit.
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = getSubmitBtn();
        const inputs = getInputs();

        const ok = validateTestimonialsForm({
            nameInput: inputs.nameInput,
            companyInput: inputs.companyInput,
            textInput: inputs.textInput
        });
        if (!ok) {
            syncBtn();
            return;
        }

        const payload = buildTestimonialsPayload({
            nameInput: inputs.nameInput,
            companyInput: inputs.companyInput,
            textInput: inputs.textInput
        });

        if (feedbackAlert) {
            feedbackAlert.classList.add('d-none');
            feedbackAlert.classList.remove('alert-danger', 'alert-success');
            feedbackAlert.textContent = '';
        }

        try {
            const result = await safeFetchJson('http://localhost:3000/work/testimonials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!result || result.ok !== true) {
                if (feedbackAlert) {
                    feedbackAlert.classList.remove('d-none');
                    feedbackAlert.classList.add('alert-danger');
                    feedbackAlert.textContent =
                        (result && result.message) ||
                        'Виникла помилка при відправці відгуку. Спробуйте ще раз.';
                }
                return;
            }

            if (feedbackAlert) {
                feedbackAlert.classList.remove('d-none');
                feedbackAlert.classList.add('alert-success');
                feedbackAlert.textContent =
                    result.message ||
                    'Ваш відгук відправлено на модерацію. Він буде перевірений адміністрацією, і якщо все добре, з’явиться на сайті протягом 24 годин.';
            }

            resetFeedbackFormState({
                feedbackForm,
                submitBtn: submitBtn || null,
                getInputs
            });

            setTimeout(() => {
                const modalInstance =
                    bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modalInstance.hide();
                if (feedbackAlert) feedbackAlert.classList.add('d-none');
            }, 2500);

        } catch (_err) {
            if (feedbackAlert) {
                feedbackAlert.classList.remove('d-none');
                feedbackAlert.classList.add('alert-danger');
                feedbackAlert.textContent =
                    'Виникла помилка при відправці відгуку. Спробуйте пізніше.';
            }
        }
    });
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeedbackForm);
} else {
    initFeedbackForm();
}

/**
 * Maps backend response shape to frontend render shape.
 * Keeps rendering layer stable even if backend fields are renamed.
 */
function mapMainPageFromApi(apiData) {
    const heroSrc = apiData.hero || {};
    const servicesSrc = Array.isArray(apiData.services) ? apiData.services : [];
    const pricingSrc = Array.isArray(apiData.pricing) ? apiData.pricing : [];
    const testimonialsSrc = Array.isArray(apiData.testimonials) ? apiData.testimonials : [];
    const avatarTestimonialsSrc = Array.isArray(apiData.avatarTestimonials) ? apiData.avatarTestimonials : [];
    const faqSrc = Array.isArray(apiData.faq) ? apiData.faq : [];
    const contactsSrc = apiData.contacts || null;
    const aboutSrc = apiData.about || null;

    const hero = {
        title: heroSrc.title || '',
        subtitle: heroSrc.subtitle || '',
        cta1: {
            text: heroSrc.buttonText1 || '',
            href: heroSrc.buttonPath1 || '#services'
        },
        cta2: {
            text: heroSrc.buttonText2 || '',
            href: heroSrc.buttonPath2 || '#portfolio'
        },
        image: heroSrc.image || '',
        bullets: Array.isArray(heroSrc.bullets) ? heroSrc.bullets : []
    };

    const services = {
        lead: '',
        items: servicesSrc.map(s => ({
            enabled: s.enabled !== false,
            title: s.name || '',
            description: s.descriptions || '',
            priceLabel: s.priceLabel || '',
            href: s.path || '',
            iconHtml: s.iconHtml || ''
        }))
    };

    const pricing = {
        lead: '',
        plans: pricingSrc.map(p => ({
            enabled: p.enabled !== false,
            title: p.title || '',
            priceLabel: p.priceLabel || '',
            features: Array.isArray(p.features) ? p.features : [],
            cta: (p.ctaText || p.ctaHref)
                ? {
                    text: p.ctaText || 'Замовити',
                    href: p.ctaHref || '#contact'
                }
                : null,
            badge: p.badge || '',
            badgeClass: p.badgeClass || '',
            popular: !!p.popular
        }))
    };

    const testimonials = {
        items: testimonialsSrc.map(t => ({
            enabled: t.enabled !== false,
            text: t.text || '',
            author: t.author || '',
            role: t.role || '',
            avatar: t.avatar || ''
        }))
    };

    const faq = {
        items: faqSrc.map(f => ({
            enabled: f.enabled !== false,
            question: f.question || '',
            answer: f.answer || ''
        }))
    };

    const contacts = contactsSrc
        ? {
            email: contactsSrc.email || '',
            telegram: contactsSrc.telegram || '',
            telegramLabel: contactsSrc.telegramLabel || contactsSrc.telegram || '',
            github: contactsSrc.github || '',
            githubLabel: contactsSrc.githubLabel || contactsSrc.github || ''
        }
        : null;

    const about = aboutSrc
        ? {
            title: aboutSrc.title || '',
            description: aboutSrc.description || '',
            focusLabel: aboutSrc.focusLabel || '',
            focusValue: aboutSrc.focusValue || '',
            stackLabel: aboutSrc.stackLabel || '',
            stackValue: aboutSrc.stackValue || '',
            features: Array.isArray(aboutSrc.features) ? aboutSrc.features : [],
            cta1: (aboutSrc.cta1Text || aboutSrc.cta1Href)
                ? {
                    text: aboutSrc.cta1Text || '',
                    href: aboutSrc.cta1Href || '#portfolio'
                }
                : null,
            cta2: (aboutSrc.cta2Text || aboutSrc.cta2Href)
                ? {
                    text: aboutSrc.cta2Text || '',
                    href: aboutSrc.cta2Href || '#contact'
                }
                : null,
            image: aboutSrc.image || ''
        }
        : null;

    return { hero, services, pricing, testimonials, avatarTestimonials: avatarTestimonialsSrc, faq, contacts, about };
}

/**
 * Safe fetch helper:
 * - always includes cookies
 * - returns parsed JSON when possible
 * - normalizes non-2xx responses to { ok:false, message }
 */
async function safeFetchJson(url, options = {}) {
    const res = await fetch(url, {
        credentials: 'include',
        ...options,
    });

    const text = await res.text();
    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null;
    }

    // Normalize non-2xx responses to uniform object.
    if (!res.ok) return data || { ok: false, message: `HTTP ${res.status}` };

    return data;
}

/**
 * Loads homepage data and renders all blocks.
 */
async function loadAndRenderMainPage() {
    try {
        const apiData = await safeFetchJson('http://localhost:3000/main/', {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            }
        });

        if (!apiData) return;

        const mapped = mapMainPageFromApi(apiData);
        renderSite(mapped);
    } catch (err) {
        console.error('[MAIN PAGE] Failed to load:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Boot order:
    // 1) load page data
    // 2) resolve admin button state in navbar
    loadAndRenderMainPage();
    initAdminPanelButton();
});

/* ===================================
 * Contact form submit to /work/send-letter
 * =================================== */

const contactForm = document.getElementById('contact-form');
const contactAlert = document.getElementById('contact-alert');

if (contactForm && contactAlert) {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');

    contactForm.addEventListener('submit', async e => {
        e.preventDefault();

        // Trim before native HTML validation so minlength/maxlength are accurate.
        nameInput.value = nameInput.value.trim();
        emailInput.value = emailInput.value.trim();
        messageInput.value = messageInput.value.trim();

        if (!contactForm.checkValidity()) {
            contactForm.classList.add('was-validated');
            return;
        }

        const payload = {
            name: nameInput.value,
            from: emailInput.value,
            text: messageInput.value
        };

        contactAlert.classList.add('d-none');
        contactAlert.classList.remove('alert-danger', 'alert-success');
        contactAlert.textContent = '';

        try {
            const result = await safeFetchJson('http://localhost:3000/work/send-letter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!result || result.ok === false) {
                contactAlert.classList.remove('d-none');
                contactAlert.classList.add('alert-danger');
                contactAlert.textContent =
                    (result && result.message) ||
                    'Виникла помилка при відправці листа. Спробуйте ще раз.';
                return;
            }

            contactAlert.classList.remove('d-none');
            contactAlert.classList.add('alert-success');
            contactAlert.textContent =
                (result && result.message) || 'Лист успішно відправлено. Дякую за звернення!';

            contactForm.reset();
            contactForm.classList.remove('was-validated');
        } catch (_err) {
            contactAlert.classList.remove('d-none');
            contactAlert.classList.add('alert-danger');
            contactAlert.textContent =
                'Сталася помилка при відправці. Перевірте підключення або спробуйте пізніше.';
        }
    });
}
