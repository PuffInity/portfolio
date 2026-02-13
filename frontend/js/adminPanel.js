'use strict';

/* ==========================================
 * Admin panel client controller
 * ==========================================
 * Responsibilities:
 * - section navigation and state sync
 * - unified save/load flows for admin forms
 * - FAQ/testimonials/gallery actions
 * - centralized 500 handling + success toasts
 */

let mainFieldRules = {};
let updateMainSaveBtnState = () => {};

const adminUnavailable = document.getElementById('admin-unavailable');

function showAdminUnavailable() {
    if (adminUnavailable) adminUnavailable.classList.remove('d-none');
    document.body.classList.add('admin-unavailable-active');
}

// Global 500 error modal.
const adminErrorModal = document.getElementById('admin-error-modal');
const adminErrorCloseBtn = adminErrorModal ? adminErrorModal.querySelector('[data-error-close]') : null;
const adminToastContainer = document.getElementById('admin-toast-container');

function showAdminServerError() {
    if (!adminErrorModal) return;
    adminErrorModal.classList.remove('d-none');
}

function hideAdminServerError() {
    if (!adminErrorModal) return;
    adminErrorModal.classList.add('d-none');
}

if (adminErrorCloseBtn) {
    adminErrorCloseBtn.addEventListener('click', hideAdminServerError);
}

function showSuccessToast(message = 'Дія виконана успішно.') {
    if (!adminToastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.innerHTML = `
        <div class="admin-toast-title">Готово</div>
        <div class="admin-toast-text">${message}</div>
        <div class="admin-toast-bar"></div>
    `;
    adminToastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Fetch wrapper: route all HTTP 500 responses to modal UI.
const _fetch = window.fetch.bind(window);
window.fetch = async (...args) => {
    const res = await _fetch(...args);
    if (res && res.status === 500) {
        showAdminServerError();
    }
    return res;
};

// Alert wrapper: suppress plain 500 alerts and use modal instead.
const _alert = window.alert.bind(window);
window.alert = (msg) => {
    if (String(msg || '').includes('Помилка сервера (500)')) {
        showAdminServerError();
        return;
    }
    _alert(msg);
};

// Original FAQ values snapshot used for "changed vs unchanged" checks.
let originalFaqSnapshot = null;

/**
 * ===== Рік у футері =====
 * Підставляємо поточний рік у span#year
 */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

/**
 * ========== Перемикання розділів адмінки ==========
 * Клік по пункту меню з data-admin-target показує відповідний .admin-section
 */
const adminMenuLinks = document.querySelectorAll('#admin-menu .nav-link');
const adminSections = document.querySelectorAll('.admin-section');
const adminLogoutBtn = document.getElementById('admin-logout-btn');

adminMenuLinks.forEach(link => {
    link.addEventListener('click', e => {
        const targetSelector = link.getAttribute('data-admin-target');
        if (!targetSelector) return;
        e.preventDefault();

        adminMenuLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        adminSections.forEach(sec => {
            if ('#' + sec.id === targetSelector) {
                sec.classList.remove('d-none');
            } else {
                sec.classList.add('d-none');
            }
        });
    });
});

if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        adminLogoutBtn.setAttribute('aria-disabled', 'true');

        try {
            const res = await fetch('http://localhost:3000/admin/adminLogout', {
                method: 'POST',
                credentials: 'include',
                headers: { Accept: 'application/json' }
            });

            if (res.status === 201) {
                window.location.href = 'http://localhost:8080/main';
                return;
            }

            if (res.status === 401) {
                alert('Сесії не існує. Увійдіть у систему повторно.');
                return;
            }

            alert(`Не вдалося виконати вихід (статус ${res.status}).`);
        } catch (_err) {
            alert('Помилка мережі. Спробуйте ще раз.');
        } finally {
            adminLogoutBtn.removeAttribute('aria-disabled');
        }
    });
}

/**
 * ========== Логіка прив'язки інпутів до прев'ю ==========
 * .admin-input ↔ .editable-preview[data-field-key="..."]
 */
const inputs = document.querySelectorAll('.admin-input');
const previewBlocks = document.querySelectorAll('.editable-preview');

/**
 * Прибираємо підсвітку інпутів і прев'ю
 */
function clearHighlights() {
    inputs.forEach(i => i.classList.remove('admin-input-highlight'));
    previewBlocks.forEach(p => p.classList.remove('active-preview'));
}

/**
 * Оновлюємо превʼю для конкретного key
 * fieldKey — значення data-field-key
 * value    — нове значення з інпуту
 */
function updatePreview(fieldKey, value) {
    const previews = document.querySelectorAll(
        '.editable-preview[data-field-key="' + fieldKey + '"]'
    );

    previews.forEach(el => {
        const type = el.dataset.previewType || 'text';
        const defaultText = el.dataset.defaultText || '';

        if (type === 'html') {
            // якщо тип html → вставляємо HTML як є
            el.innerHTML = value || defaultText;
        } else if (type === 'image') {
            // тип image → підміняємо background-image
            const defImg = el.dataset.defaultImage || '';
            if (value) {
                el.style.backgroundImage = 'url("' + value + '")';
            } else if (defImg) {
                el.style.backgroundImage = 'url("' + defImg + '")';
            } else {
                el.style.backgroundImage = 'none';
            }
        } else if (type === 'list') {
            // тип list → кожен рядок у textarea стає бейджем
            const placeholder = el.dataset.placeholder || '';
            const lines = (value || '')
                .split('\n')
                .map(l => l.trim())
                .filter(Boolean);

            if (!lines.length) {
                el.innerHTML = placeholder
                    ? '<span class="text-muted small">' + placeholder + '</span>'
                    : '';
                return;
            }

            el.innerHTML = '';
            lines.forEach(text => {
                const span = document.createElement('span');
                span.className = 'badge';
                span.textContent = text;
                el.appendChild(span);
            });
        } else {
            // за замовчуванням → просто текст
            el.textContent = value || defaultText;
        }
    });
}

/**
 * Клік по превʼю → фокусуємо відповідний інпут і підсвічуємо
 */
previewBlocks.forEach(preview => {
    preview.addEventListener('click', () => {
        const key = preview.dataset.fieldKey;
        if (!key) return;

        const previewType = (preview.dataset.previewType || 'text').trim();

        // 1) Якщо це превʼю картинки — пробуємо знайти file input і відкрити вибір файлу
        if (previewType === 'image') {
            // Шукаємо file input по data-field-key (ВАРІАНТ 1: теж має data-field-key як у превʼю)
            const fileInputByKey = document.querySelector(
                'input[type="file"][data-field-key="' + key + '"]'
            );

            // Alternative selector: map preview via data-upload-for.
            const fileInputByUploadFor = document.querySelector(
                'input[type="file"][data-upload-for="' + key + '"]'
            );

            const fileInput = fileInputByKey || fileInputByUploadFor;

            if (fileInput) {
                // Підсвітка превʼю як активного
                clearHighlights();
                preview.classList.add('active-preview');

                // Відкриваємо вікно вибору файлу
                fileInput.click();
                return;
            }
        }

        // 2) Фолбек: шукаємо звичайний .admin-input (URL/текст) і фокусимо
        const input = document.querySelector(
            '.admin-input[data-field-key="' + key + '"]'
        );
        if (!input) return;

        clearHighlights();
        preview.classList.add('active-preview');
        input.classList.add('admin-input-highlight');
        input.focus();
    });
});

/**
 * =========================
 * IMAGE UPLOAD (file -> backend -> url -> admin-input)
 * =========================
 * Requirements:
 * - file input should expose data-field-key="..." or data-upload-for="..."
 * - matching .admin-input[data-field-key="..."] receives uploaded URL
 */

// Зміни тут під свій реальний endpoint
const IMAGE_UPLOAD_ENDPOINT = '/panel/uploadImage';
const GALLERY_FETCH_ENDPOINT = '/panel/sendGallery';
const GALLERY_SAVE_ENDPOINTS = {
    1: '/panel/save-gallery1',
    2: '/panel/save-gallery2',
    3: '/panel/save-gallery3'
};
const MAIN_HERO_IMAGE_ENDPOINT = '/panel/save-main-gallery';
const ABOUT_IMAGE_ENDPOINT = '/panel/save-aboutMe-gallery';

async function uploadImageFile(file) {
    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch(`http://localhost:3000${IMAGE_UPLOAD_ENDPOINT}`, {
        method: 'POST',
        credentials: 'include',
        body: fd
    });

    if (!res.ok) {
        throw new Error('Upload failed: ' + res.status);
    }

    const json = await res.json().catch(() => ({}));
    if (json?.message !== 'ok' || !json?.url) {
        throw new Error('Backend error or missing url');
    }

    return String(json.url);
}

function getFieldKeyFromFileInput(fileInput) {
    return String(fileInput.dataset.fieldKey || fileInput.dataset.uploadFor || '').trim();
}

async function handleFileInputChange(fileInput) {
    const fieldKey = getFieldKeyFromFileInput(fileInput);
    if (!fieldKey) return;

    const file = fileInput.files?.[0];
    if (!file) return;

    // шукаємо текстовий інпут (URL), який вже підключений до валідатора/кнопки
    const textInput = document.querySelector(`.admin-input[data-field-key="${fieldKey}"]`);

    try {
        // 1) upload -> отримали URL
        const url = await uploadImageFile(file);

        // 2) записали URL в текстовий інпут (якщо він є)
        if (textInput) {
            textInput.value = url;
        } else {
            // fallback: зберігаємо URL у data-атрибуті file input (для галереї)
            fileInput.dataset.uploadedUrl = url;
        }

        // 3) оновили прев'ю
        updatePreview(fieldKey, url);

        // 4) запустили валідатор і перерахунок кнопок
        if (textInput) validateAndRenderInput(textInput);

    // Home section validation refresh.
        if (typeof updateMainSaveBtnState === 'function') updateMainSaveBtnState();

    // Service page section validation refresh.
        if (typeof updateServiceSaveBtnState === 'function') updateServiceSaveBtnState();
        if (typeof updateGallerySaveButtonsState === 'function') updateGallerySaveButtonsState();

    } catch (err) {
        console.error('[UPLOAD] error:', err);
        alert('Не вдалося завантажити зображення. Перевір endpoint або сервер.');
    }
}
function bindUploadButtons() {
    const fileInputs = document.querySelectorAll('input[type="file"][data-upload-for], input[type="file"][data-field-key]');
    fileInputs.forEach((input) => {
        input.addEventListener('change', () => {
            const key = String(input.dataset.uploadFor || input.dataset.fieldKey || '').trim();
            const btn = document.querySelector(`button[data-save-upload-for="${key}"]`);
            if (!btn) return;

            btn.disabled = !(input.files && input.files.length > 0);
        });
    });
}


function bindFileInputs() {
    const fileInputs = document.querySelectorAll('input[type="file"][data-field-key], input[type="file"][data-upload-for]');
    fileInputs.forEach(input => {
        const key = String(input.dataset.uploadFor || input.dataset.fieldKey || '').trim();
        if (key.startsWith('svc.gallery.') || key === 'hero.image' || key === 'about.image') {
            return;
        }
        input.addEventListener('change', () => handleFileInputChange(input));
    });
}

// Bind upload handlers after DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
    bindFileInputs();
    bindUploadButtons();
});

function applyAdminImageFallbacks() {
    const bindImg = (img) => {
        if (!img || img.dataset.fallbackBound) return;
        img.dataset.fallbackBound = '1';

        const swapToFallback = () => {
            if (!img.parentElement) return;
            const fallback = document.createElement('div');
            fallback.className = 'img-fallback';
            fallback.textContent = 'Фотографія недоступна. Звʼяжіться з IT‑адміністратором.';
            img.replaceWith(fallback);
        };

        const src = img.getAttribute('src');
        if (!src) return;
        if (!src.includes('uploads/upload')) {
            swapToFallback();
            return;
        }
        if (img.complete && img.naturalWidth === 0) {
            swapToFallback();
            return;
        }
        img.addEventListener('error', swapToFallback, { once: true });
    };

    document.querySelectorAll('img').forEach(bindImg);
}

document.addEventListener('DOMContentLoaded', applyAdminImageFallbacks);

function initAdminFieldTooltips() {
    const cleanLabelText = (label) => {
        if (!label) return;
        const cleaned = label.textContent
            .replace(/\s*\([^)]*\)/g, '')
            .replace(/по одному в рядок/gi, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
        if (cleaned) {
            label.textContent = cleaned;
        }
    };

    document.querySelectorAll('label.form-label').forEach(cleanLabelText);

    const tooltipMap = {
        'hero.title': 'Головний заголовок у hero-блоці на головній сторінці.',
        'hero.subtitle': 'Короткий опис під заголовком (1–2 речення).',
        'hero.buttonText1': 'Текст основної кнопки (CTA №1).',
        'hero.buttonPath1': 'Посилання або якір для CTA №1 (наприклад #services).',
        'hero.buttonText2': 'Текст додаткової кнопки (CTA №2).',
        'hero.buttonPath2': 'Посилання або якір для CTA №2 (наприклад #portfolio).',
        'hero.bullets': 'Список переваг через перенос рядка або крапку з комою.',

        'about.title': 'Заголовок блоку "Про мене".',
        'about.description': 'Основний опис (короткий абзац про вас/команду).',
        'about.focusLabel': 'Назва показника фокусу (наприклад: "Фокус").',
        'about.focusValue': 'Значення фокусу (наприклад: "Backend, інтеграції").',
        'about.stackLabel': 'Назва стека/інструментів (наприклад: "Стек").',
        'about.stackValue': 'Ключові технології в 1 рядок.',
        'about.features': 'Список переваг/фактів (кожен пункт з нового рядка).',
        'about.cta1Text': 'Текст першої кнопки блоку "Про мене".',
        'about.cta2Text': 'Текст другої кнопки блоку "Про мене".',

        'service.title': 'Назва сервісу/послуги, яка показується в картці.',
        'service.description': 'Короткий опис сервісу (1–2 речення).',
        'service.priceLabel': 'Ціна або формулювання ціни (наприклад: "від $500").',
        'service.ctaText': 'Текст кнопки в картці сервісу.',
        'service.ctaHref': 'Посилання/якір кнопки сервісу.',
        'service.iconHtml': 'HTML іконка (Bootstrap Icons). Приклад: <i class="bi bi-rocket"></i>.',

        'pricing.title': 'Назва тарифу/пакету.',
        'pricing.priceLabel': 'Ціна або формат ціни (наприклад: "$900/проєкт").',
        'pricing.features': 'Список того, що входить у тариф (кожен пункт з нового рядка).',
        'pricing.badge': 'Мітка тарифу (наприклад: "Популярний").',
        'pricing.ctaText': 'Текст кнопки тарифу.',
        'pricing.ctaHref': 'Посилання або якір кнопки тарифу.',

        'svc.hero.badge': 'Мітка/бейдж у hero на сторінці сервісу.',
        'svc.hero.title': 'Заголовок hero на сторінці сервісу.',
        'svc.hero.lead': 'Короткий опис/підзаголовок hero.',
        'svc.hero.duration': 'Тривалість виконання (наприклад: "7–14 днів").',
        'svc.hero.priceHero': 'Ціна або формулювання ціни для hero-блоку.',
        'svc.hero.executor': 'Хто виконує роботу (наприклад: "Пухінті студія").',
        'svc.hero.textBtn1': 'Текст основної кнопки на сторінці сервісу.',
        'svc.hero.hrefBtn1': 'Посилання для основної кнопки (якір або URL).',
        'svc.hero.textBtn2': 'Текст додаткової кнопки на сторінці сервісу.',
        'svc.hero.hrefBtn2': 'Посилання для додаткової кнопки.',
        'svc.hero.image': 'Зображення hero для сторінки сервісу (завантаження).',

        'svc.options.include': 'Що включено у послугу (список/перелік).',
        'svc.options.additional': 'Додаткові опції або доп. послуги.',
        'svc.options.discount': 'Знижка або умови спеціальної ціни.',
        'svc.options.price_title': 'Заголовок блоку ціни.',
        'svc.options.price_subtitle': 'Пояснювальний підзаголовок блоку ціни.',
        'svc.options.price': 'Ціна/діапазон ціни.',
        'svc.options.terms': 'Умови співпраці або оплати.',
        'svc.options.quickStart': 'Швидкий старт/терміни запуску.',

        'svc.gallery.1.image': 'Фото для слайду 1 галереї сервісу.',
        'svc.gallery.1.title': 'Заголовок слайду 1.',
        'svc.gallery.1.caption': 'Короткий опис слайду 1.',
        'svc.gallery.2.image': 'Фото для слайду 2 галереї сервісу.',
        'svc.gallery.2.title': 'Заголовок слайду 2.',
        'svc.gallery.2.caption': 'Короткий опис слайду 2.',
        'svc.gallery.3.image': 'Фото для слайду 3 галереї сервісу.',
        'svc.gallery.3.title': 'Заголовок слайду 3.',
        'svc.gallery.3.caption': 'Короткий опис слайду 3.',

        'contacts.email': 'Контактний e-mail, який відображається на сайті.',
        'contacts.telegram': 'Посилання на Telegram (URL).',
        'contacts.telegramLabel': 'Текст підпису Telegram (наприклад: @username).',
        'contacts.github': 'Посилання на GitHub (URL).',
        'contacts.githubLabel': 'Текст підпису GitHub (наприклад: github.com/user).'
    };

    const inputs = document.querySelectorAll('[data-field-key]');
    inputs.forEach((input) => {
        const key = (input.dataset.fieldKey || '').trim();
        if (!key) return;

        let label = null;
        if (input.id) {
            label = document.querySelector(`label[for="${input.id}"]`);
        }
        if (!label) {
            const wrapper = input.closest('.mb-3, .mb-4, .mb-2');
            if (wrapper) label = wrapper.querySelector('label.form-label');
        }
        if (!label) {
            const row = input.closest('.row');
            const maybeLabel = row?.previousElementSibling;
            if (maybeLabel?.classList?.contains('form-label')) label = maybeLabel;
            if (!label && row) label = row.querySelector('label.form-label');
        }
        if (!label || label.querySelector('.admin-tooltip')) return;

        cleanLabelText(label);

        const text = tooltipMap[key] || 'Це поле керує відповідним блоком на сайті.';
        const tooltip = document.createElement('span');
        tooltip.className = 'admin-tooltip ms-2';
        tooltip.setAttribute('tabindex', '0');
        tooltip.innerHTML = `i<span class="admin-tooltip-text">${text}</span>`;
        label.appendChild(tooltip);
    });
}

document.addEventListener('DOMContentLoaded', initAdminFieldTooltips);

const servicePageSelect = document.getElementById('service-page-select');
const serviceSelect = document.getElementById('service-select');
const pricingSelect = document.getElementById('pricing-select');

// ========== SHOW/HIDE service-fields + pricing-fields ==========

const serviceFields = document.getElementById('service-fields');
const pricingFields = document.getElementById('pricing-fields');

// ========== SHOW/HIDE service-page-fields (Сторінки сервісів) ==========
const servicePageFields = document.getElementById('service-page-fields');

function toggleServicePageFields() {
    if (!servicePageSelect || !servicePageFields) return;

    if (!servicePageSelect.value) {
        servicePageFields.classList.add('d-none');
    } else {
        servicePageFields.classList.remove('d-none');
    }
}

function toggleServiceFields() {
    if (!serviceSelect || !serviceFields) return;

    // якщо нічого не вибрано (value пустий) — ховаємо
    if (!serviceSelect.value) {
        serviceFields.classList.add('d-none');
    } else {
        serviceFields.classList.remove('d-none');
    }
}

function togglePricingFields() {
    if (!pricingSelect || !pricingFields) return;

    if (!pricingSelect.value) {
        pricingFields.classList.add('d-none');
    } else {
        pricingFields.classList.remove('d-none');
    }
}

// слухаємо зміну селектів
if (serviceSelect) serviceSelect.addEventListener('change', toggleServiceFields);
if (pricingSelect) pricingSelect.addEventListener('change', togglePricingFields);
if (servicePageSelect) servicePageSelect.addEventListener('change', toggleServicePageFields);
// стартовий стан (на випадок, якщо вже щось вибрано/підставлено)
toggleServiceFields();
togglePricingFields();
toggleServicePageFields();
async function loadCategories() {
    try {
        const res = await fetch('http://localhost:3000/panel/category', {
            method: 'GET',
            headers: { Accept: 'application/json' },
            credentials: 'include'
        });

        if (!res.ok) {
            throw new Error('GET /panel/category failed: ' + res.status);
        }

        const data = await res.json();

        if (data?.message !== 'ok') {
            showAdminUnavailable();
            return;
        }

        const services = Array.isArray(data?.service) ? data.service : [];
        const pricings = Array.isArray(data?.pricing) ? data.pricing : [];
        // FAQ context selector (service name + service id in data attribute).
        if (faqContextSelect) {
            faqContextSelect.innerHTML = '';

            const ph = document.createElement('option');
            ph.value = '';
            ph.textContent = '— Не вибрано —';
            ph.selected = true;
            faqContextSelect.appendChild(ph);
            services.forEach((s) => {
                const name = String(s?.name ?? s?.title ?? s?.key ?? s?.slug ?? '').trim();
                if (!name) return;

                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;

                if (s?.id) {
                    opt.dataset.serviceId = String(s.id);
                } else {
                    console.warn('[FAQ] missing id for service option:', name);
                }

                faqContextSelect.appendChild(opt);
            });

        }
        fillServicePageSelect(services);
        toggleServicePageFields();
        if (!servicePageSelect?.value) {
            clearServicePageFormAndPreview();
        }

        // ---------- service-select ----------
        if (serviceSelect) {
            serviceSelect.innerHTML = '';

            const ph = document.createElement('option');
            ph.value = '';
            ph.textContent = '— Вибрати сервіс —';
            ph.selected = true;
            serviceSelect.appendChild(ph);

            if (!services.length) {
                const empty = document.createElement('option');
                empty.value = '';
                empty.textContent = 'Немає сервісів у базі';
                empty.disabled = true;
                serviceSelect.appendChild(empty);
            } else {
                services.forEach(s => {
                    const name = (s?.name || '').trim();
                    if (!name) return;

                    const opt = document.createElement('option');
                    // Value keeps human-readable service name for current UI binding.
                    opt.value = name;
                    opt.textContent = name;
                    serviceSelect.appendChild(opt);
                });
            }
        }

        // ---------- pricing-select ----------
        if (pricingSelect) {
            pricingSelect.innerHTML = '';
            const ph = document.createElement('option');
            ph.value = '';
            ph.textContent = '— Вибрати тариф —';
            ph.selected = true;
            pricingSelect.appendChild(ph);

            if (!pricings.length) {
                const empty = document.createElement('option');
                empty.value = '';
                empty.textContent = 'Немає тарифів у базі';
                empty.disabled = true;
                pricingSelect.appendChild(empty);
            } else {
                pricings.forEach(p => {
                    const title = (p?.title || '').trim();
                    if (!title) return;

                    const opt = document.createElement('option');
                    // Value keeps human-readable pricing title for current UI binding.
                    opt.value = title;
                    opt.textContent = title;
                    pricingSelect.appendChild(opt);
                });
            }
        }

        toggleServiceFields();
        togglePricingFields();
    } catch (err) {
        console.error('[CATEGORY] loadCategories error:', err);
        showAdminUnavailable();
    }
}
function fillServicePageSelect(services) {
    if (!servicePageSelect) return;

    servicePageSelect.innerHTML = '';

    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = '— Вибрати сторінку сервісу —';
    ph.selected = true;
    servicePageSelect.appendChild(ph);

    if (!services.length) {
        const empty = document.createElement('option');
        empty.value = '';
        empty.textContent = 'Немає сервісів у базі';
        empty.disabled = true;
        servicePageSelect.appendChild(empty);
        return;
    }

    services.forEach(s => {
        const key = String(s?.key || s?.slug || s?.name || '').trim();
        const label = String(s?.name || s?.title || key).trim();
        const serviceId = s?.id ?? s?.serviceId ?? s?.service_id ?? null;
        if (!key) return;

        const opt = document.createElement('option');
        // Value is service key/slug; text is user-facing label.
        opt.value = key;
        opt.textContent = label;
        if (serviceId != null) {
            opt.dataset.serviceId = String(serviceId);
        }
        servicePageSelect.appendChild(opt);
    });
}


/**
 * ========== TESTIMONIALS (з бекенда) ==========
 * GET /panel/testimonials
 * response:
 * { message: 'ok', data: TestimonialsEntity[] }
 */

const testimonialsContainer = document.getElementById('admin-testimonials-list');

// Renders single testimonial row in admin list.
function renderTestimonialItem(t) {
    const col = document.createElement('div');
    col.className = 'col-12';

    const statusClass = t.enabled ? 'badge-status-enabled' : 'badge-status-disabled';
    const statusText = t.enabled ? 'Увімкнено' : 'Вимкнено';

    col.innerHTML = `
        <div class="admin-testimonial-item d-flex flex-column flex-md-row justify-content-between align-items-start gap-3" data-testimonial-row="${t.id}">
          <div>
            <div class="testimonial-text-short mb-2">
              "${t.text}"
            </div>
            <div class="admin-testimonial-meta">
              <span class="fw-semibold">${t.author}</span>
              <span class="text-muted">${t.role ? ' • ' + t.role : ''}</span>
            </div>
          </div>

          <div class="d-flex flex-column align-items-md-end align-items-start gap-2">
            <span class="badge ${statusClass} small" data-testimonial-status="${t.id}">
              ${statusText}
            </span>

            <div class="btn-group btn-group-sm" role="group">
              <button type="button" class="btn btn-outline-success" data-action="enable" data-id="${t.id}">
                Увімкнути
              </button>
              <button type="button" class="btn btn-outline-secondary" data-action="disable" data-id="${t.id}">
                Вимкнути
              </button>
              <button type="button" class="btn btn-outline-danger" data-action="delete" data-id="${t.id}">
                Видалити
              </button>
            </div>
          </div>
        </div>
    `;

    return col;
}

// Renders full testimonials list container state.
function renderTestimonialsList(list) {
    if (!testimonialsContainer) return;

    testimonialsContainer.innerHTML = '';

    if (!Array.isArray(list) || list.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'col-12';
        empty.innerHTML = `
          <div class="border rounded-3 p-3 bg-light-subtle text-muted small">
            Поки що немає жодного відгуку в базі.
          </div>
        `;
        testimonialsContainer.appendChild(empty);
        return;
    }

    // Keep deterministic order for stable admin UX.
    const sorted = [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    sorted.forEach(t => {
        testimonialsContainer.appendChild(renderTestimonialItem(t));
    });
}

// Loads testimonials from backend.
async function loadTestimonials() {
    if (!testimonialsContainer) return;

    try {
        const res = await fetch('http://localhost:3000/panel/testimonials', {
            method: 'GET',
            headers: { Accept: 'application/json' },
            credentials: 'include'
        });

        if (!res.ok) {
            throw new Error('GET /panel/testimonials failed: ' + res.status);
        }

        const json = await res.json().catch(() => ({}));

        if (json?.message !== 'ok') {
            renderTestimonialsList([]);
            return;
        }

        renderTestimonialsList(json.data);
    } catch (err) {
        console.error('[TESTIMONIALS] load error:', err);
        renderTestimonialsList([]);
    }
}

// Testimonials actions (enable/disable/delete) -> backend.
if (testimonialsContainer) {
    testimonialsContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const id = Number(btn.dataset.id);
        const action = btn.dataset.action;

        if (!id || !action) return;

        // Confirm destructive/visibility action first.
        let confirmText = 'Ви впевнені?';

        if (action === 'delete') {
            confirmText = 'Ви точно хочете ВИДАЛИТИ цей відгук? Цю дію неможливо скасувати.';
        }
        if (action === 'disable') {
            confirmText = 'Ви впевнені, що хочете ВИМКНУТИ цей відгук?';
        }
        if (action === 'enable') {
            confirmText = 'Ви впевнені, що хочете УВІМКНУТИ цей відгук?';
        }

        const confirmed = await showFaqConfirm(confirmText, {
            confirmText: action === 'delete' ? 'Видалити' : action === 'enable' ? 'Увімкнути' : 'Вимкнути',
            cancelText: 'Скасувати'
        });
        if (!confirmed) return;

        // Route map by action.
        let url = '';
        let method = 'POST';

        if (action === 'disable') url = '/panel/turnOffTestimonials';
        if (action === 'enable')  url = '/panel/turnOnTestimonials';
        if (action === 'delete')  url = '/panel/deleteTestimonials';

        try {
            btn.disabled = true;

            const res = await fetch(`http://localhost:3000${url}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ id })
            });

            if (!res.ok) {
                alert(`Помилка сервера (${res.status})`);
                return;
            }

            const json = await res.json().catch(() => ({}));

            if (json?.message !== 'ok') {
                alert('Бекенд повернув помилку');
                return;
            }

            // Refresh list to reflect backend state.
            await loadTestimonials();

        } catch (err) {
            console.error('[TESTIMONIALS] request error:', err);
            alert('Помилка мережі або сервера.');
        } finally {
            btn.disabled = false;
        }
    });
}

// Initial bootstrap for selectors and testimonials list.
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadTestimonials();
});

/**
 * Ключ — value селекту.
 * Значення — обʼєкт "data-field-key" -> "значення для інпуту".
 */
const mockServicePages = {
    integrations: {
        'svc.hero.badge': 'Інтеграції • API • Оплати',
        'svc.hero.title': 'Інтеграції сервісів без головного болю',
        'svc.hero.lead':
            'Налаштовую оплату, пошту, аналітику, чати та сторонні API так, щоб усе працювало стабільно.',
        'svc.hero.image':
            'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1200&auto=format&fit=crop',
        'svc.hero.duration': '1–3 тижні',
        'svc.hero.priceHero': 'Від $500',
        'svc.hero.executor': 'Ігор • Backend & інтеграції',
        'svc.hero.textBtn1': 'Подивитись етапи',
        'svc.hero.hrefBtn1': '#process',
        'svc.hero.textBtn2': 'Приклади інтеграцій',
        'svc.hero.hrefBtn2': '#gallery',

        'svc.options.include': [
            'Підбір оптимальних сервісів',
            'Підключення API / вебхуків',
            'Обробка помилок та логування',
            'Тестування ключових сценаріїв'
        ].join('\n'),

        'svc.options.additional': [
            'Моніторинг та алерти',
            'Окрема документація для команди',
            'Додаткові середовища (staging/prod)'
        ].join('\n'),

        'svc.options.discount':
            'Знижка при замовленні інтеграцій одразу для кількох проєктів.',

        'svc.options.price_title': 'Пакет інтеграцій для бізнесу',
        'svc.options.price_subtitle':
            'Підбір, підключення, тестування та документування інтеграцій під ваші задачі.',
        'svc.options.price': 'Від $500 / 10 000 Kč+',

        'svc.options.terms': [
            'Передоплата 30%',
            'Фіксовані дедлайни та етапи',
            'Прозора комунікація в процесі'
        ].join('\n'),

        'svc.options.quickStart':
            'Для старту достатньо доступів до сервісів та короткого опису бізнес-процесів.',

        'svc.gallery.1.image':
            'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?q=80&w=800&auto=format&fit=crop',
        'svc.gallery.1.title': 'Інтернет-магазин з Stripe',
        'svc.gallery.1.caption':
            'Підключення Stripe, створення вебхуків та логування подій.',

        'svc.gallery.2.image':
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
        'svc.gallery.2.title': 'CRM + e-mail розсилки',
        'svc.gallery.2.caption':
            'Синхронізація контактів з CRM, тригерні листи та аналітика.',

        'svc.gallery.3.image':
            'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
        'svc.gallery.3.title': 'Сервіс бронювань',
        'svc.gallery.3.caption':
            'Інтеграція календарів, оплат і нотифікацій.'
    },

    fullSite: {
        'svc.hero.badge': 'Сайт «під ключ»',
        'svc.hero.title': 'Сайт, який реально працює на бізнес',
        'svc.hero.lead':
            'Проєктую та розробляю сайт з урахуванням маркетингу, швидкості та технічної надійності.',
        'svc.hero.image':
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop',
        'svc.hero.duration': '3–6 тижнів',
        'svc.hero.priceHero': 'Від $1000',
        'svc.hero.executor': 'Ігор • Fullstack / Backend',
        'svc.hero.textBtn1': 'Структура та етапи',
        'svc.hero.hrefBtn1': '#process',
        'svc.hero.textBtn2': 'Подивитись приклади',
        'svc.hero.hrefBtn2': '#gallery',

        'svc.options.include': [
            'Аналіз ніші та структури',
            'Розробка backend + бази даних',
            'Адаптивна верстка',
            'Базовий SEO'
        ].join('\n'),

        'svc.options.additional': [
            'Інтеграція оплат та CRM',
            'Налаштування аналітики',
            'Підтримка після запуску'
        ].join('\n'),

        'svc.options.discount':
            'Можлива знижка при комплексному замовленні сайту та інтеграцій.',

        'svc.options.price_title': 'Сайт «під ключ» для малого бізнесу',
        'svc.options.price_subtitle':
            'Оптимальний варіант, якщо потрібен сучасний сайт без зайвої складності.',
        'svc.options.price': 'Від $1000 / 25 000 Kč+',

        'svc.options.terms': [
            'Передоплата 30–50%',
            'Чітко погоджений обсяг робіт',
            'Фіксація вимог перед стартом'
        ].join('\n'),

        'svc.options.quickStart':
            'Для старту потрібні приклади сайтів, що подобаються, логотип та короткий опис послуг.',

        'svc.gallery.1.image':
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop',
        'svc.gallery.1.title': 'Лендінг для сервісу',
        'svc.gallery.1.caption':
            'Односторінковий сайт з акцентом на конверсію.',

        'svc.gallery.2.image':
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop',
        'svc.gallery.2.title': 'Сайт компанії',
        'svc.gallery.2.caption':
            'Сторінки послуг, блог, контактні форми.',

        'svc.gallery.3.image':
            'https://images.unsplash.com/photo-1522202195461-71a8e37cbb31?q=80&w=800&auto=format&fit=crop',
        'svc.gallery.3.title': 'Портфоліо-лендінг',
        'svc.gallery.3.caption':
            'Сайт для демонстрації робіт і збору заявок.'
    },

    telegramBot: {
        'svc.hero.badge': 'Telegram-бот',
        'svc.hero.title': 'Telegram-бот для автоматизації рутини',
        'svc.hero.lead':
            'Створюю ботів для заявок, бронювань, підтримки клієнтів та сповіщень.',
        'svc.hero.image':
            'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
        'svc.hero.duration': '1–2 тижні',
        'svc.hero.priceHero': 'Від $250',
        'svc.hero.executor': 'Ігор • Node.js / Bots',
        'svc.hero.textBtn1': 'Сценарії роботи бота',
        'svc.hero.hrefBtn1': '#process',
        'svc.hero.textBtn2': 'Приклади ботів',
        'svc.hero.hrefBtn2': '#gallery',

        'svc.options.include': [
            'Проєктування логіки бота',
            'Реалізація основних сценаріїв',
            'Базове логування та обробка помилок'
        ].join('\n'),

        'svc.options.additional': [
            'Інтеграція з CRM / Google Sheets',
            'Інтеграція оплат',
            'Адмін-панель для керування'
        ].join('\n'),

        'svc.options.discount':
            'Знижка при замовленні кількох ботів або комбо з іншими послугами.',

        'svc.options.price_title': 'Запуск Telegram-бота під ваші задачі',
        'svc.options.price_subtitle':
            'Оптимально, якщо хочете автоматизувати частину комунікації з клієнтами.',
        'svc.options.price': 'Від $250 / 6 000 Kč+',

        'svc.options.terms': [
            'Передоплата 30%',
            'Узгодження сценаріїв до старту',
            'Тестовий період після запуску'
        ].join('\n'),

        'svc.options.quickStart':
            'Для старту потрібні приклади діалогів та чітка мета, навіщо вам бот.',

        'svc.gallery.1.image':
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
        'svc.gallery.1.title': 'Бот для заявок',
        'svc.gallery.1.caption':
            'Прийом заявок і відправка в Telegram-групу.',

        'svc.gallery.2.image':
            'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=800&auto=format&fit=crop',
        'svc.gallery.2.title': 'Бот для бронювань',
        'svc.gallery.2.caption':
            'Запис клієнтів з підтвердженням у адмін-чаті.',

        'svc.gallery.3.image':
            'https://images.unsplash.com/photo-1512758017271-d7b84c2113f1?q=80&w=800&auto=format&fit=crop',
        'svc.gallery.3.title': 'Інфо-бот',
        'svc.gallery.3.caption':
            'Поширені питання, відповіді, посилання, контакт.'
    }
};

/**
 * Заповнює всі інпути для обраної сторінки сервісу
 * і відразу оновлює превʼю (через updatePreview).
 */
function fillServicePageFormFromMock(key) {
    const data = mockServicePages[key];
    if (!data) return;

    Object.keys(data).forEach(fieldKey => {
        const input = document.querySelector(
            '.admin-input[data-field-key="' + fieldKey + '"]'
        );
        if (!input) return;
        input.value = data[fieldKey];
        updatePreview(fieldKey, data[fieldKey]);
    });
}

function clearServicePageFormAndPreview() {
    const svcInputs = document.querySelectorAll('.admin-input[data-field-key^="svc."]');
    svcInputs.forEach(input => {
        input.value = '';
        updatePreview(input.dataset.fieldKey, '');
    });
}

function getSelectedServiceIdFromPageSelect() {
    if (!servicePageSelect) return null;
    const opt = servicePageSelect.selectedOptions?.[0] || null;
    const rawId = opt?.dataset?.serviceId;
    const id = rawId ? Number(rawId) : null;
    return Number.isFinite(id) ? id : null;
}

function clearGalleryBindings() {
    for (let i = 1; i <= 3; i++) {
        const btn = document.querySelector(`button[data-gallery-save="${i}"]`);
        const titleInput = serviceSection?.querySelector(`.admin-input[data-field-key="svc.gallery.${i}.title"]`);
        const captionInput = serviceSection?.querySelector(`.admin-input[data-field-key="svc.gallery.${i}.caption"]`);
        const fileInput = serviceSection?.querySelector(`input[type="file"][data-upload-for="svc.gallery.${i}.image"]`);

        if (btn) {
            btn.dataset.galleryId = '';
            btn.disabled = true;
        }
        if (titleInput) {
            titleInput.value = '';
            titleInput.dataset.originalValue = '';
            titleInput.dataset.galleryId = '';
            updatePreview(`svc.gallery.${i}.title`, '');
        }
        if (captionInput) {
            captionInput.value = '';
            captionInput.dataset.originalValue = '';
            captionInput.dataset.galleryId = '';
            updatePreview(`svc.gallery.${i}.caption`, '');
        }
        if (fileInput) {
            fileInput.value = '';
            fileInput.dataset.currentImage = '';
            fileInput.dataset.uploadedUrl = '';
            fileInput.dataset.galleryId = '';
            updatePreview(`svc.gallery.${i}.image`, '');
        }
    }
}

function applyGalleryDataToForm(rows) {
    const sorted = Array.isArray(rows) ? [...rows].sort((a, b) => (a?.id ?? 0) - (b?.id ?? 0)) : [];

    for (let i = 1; i <= 3; i++) {
        const row = sorted[i - 1] || null;
        const galleryId = row?.id ? String(row.id) : '';
        const image = String(row?.image ?? '');
        const title = String(row?.title ?? '');
        const caption = String(row?.caption ?? '');

        const btn = document.querySelector(`button[data-gallery-save="${i}"]`);
        const titleInput = serviceSection?.querySelector(`.admin-input[data-field-key="svc.gallery.${i}.title"]`);
        const captionInput = serviceSection?.querySelector(`.admin-input[data-field-key="svc.gallery.${i}.caption"]`);
        const fileInput = serviceSection?.querySelector(`input[type="file"][data-upload-for="svc.gallery.${i}.image"]`);

        if (btn) btn.dataset.galleryId = galleryId;
        if (titleInput) {
            titleInput.value = title;
            titleInput.dataset.originalValue = title;
            titleInput.dataset.galleryId = galleryId;
            updatePreview(`svc.gallery.${i}.title`, title);
        }
        if (captionInput) {
            captionInput.value = caption;
            captionInput.dataset.originalValue = caption;
            captionInput.dataset.galleryId = galleryId;
            updatePreview(`svc.gallery.${i}.caption`, caption);
        }
        if (fileInput) {
            fileInput.value = '';
            fileInput.dataset.currentImage = image;
            fileInput.dataset.uploadedUrl = '';
            fileInput.dataset.galleryId = galleryId;
            updatePreview(`svc.gallery.${i}.image`, image);
        }
    }

    if (typeof updateGallerySaveButtonsState === 'function') {
        updateGallerySaveButtonsState();
    }
}

async function loadServiceGalleryForSelectedService() {
    const serviceId = getSelectedServiceIdFromPageSelect();

    if (!serviceId) {
        console.warn('[GALLERY] no serviceId selected');
        clearGalleryBindings();
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000${GALLERY_FETCH_ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ serviceId })
        });

        if (!res.ok) {
            console.error('[GALLERY] sendGallery failed:', res.status);
            clearGalleryBindings();
            return;
        }

        const json = await res.json().catch(() => ({}));
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        const filtered = list.filter(item => Number(item?.serviceId) === serviceId);
        applyGalleryDataToForm(filtered);
    } catch (err) {
        console.error('[GALLERY] load error:', err);
        clearGalleryBindings();
    }
}

if (servicePageSelect) {
    servicePageSelect.addEventListener('change', () => {
        toggleServicePageFields();

        const key = (servicePageSelect.value || '').trim();

        if (!key) {
            clearServicePageFormAndPreview();
            clearGalleryBindings();
            return;
        }

        fillServicePageFormFromMock(key);
        loadServiceGalleryForSelectedService();
    });

    // стартовий стан
    toggleServicePageFields();

    // якщо в селекті вже є реальне значення (не placeholder) — підставимо
    const startKey = (servicePageSelect.value || '').trim();
    if (startKey) {
        fillServicePageFormFromMock(startKey);
        loadServiceGalleryForSelectedService();
    }
}

/**
 * ========== FAQ АДМІНКА ==========
 */


// Вибір контексту (для якої сторінки FAQ)
const faqContextSelect = document.getElementById('faq-context-select');
// Контейнер для списку FAQ
const faqListContainer = document.getElementById('admin-faq-list');
// Елементи форми додавання/редагування
const faqFormCard = document.getElementById('faq-form-card');
const faqFormTitle = document.getElementById('faq-form-title');
const faqIdInput = document.getElementById('faq-id-input');
const faqQuestionInput = document.getElementById('faq-question-input');
const faqAnswerInput = document.getElementById('faq-answer-input');
const faqEnabledInput = document.getElementById('faq-enabled-input');
// Кнопки
const faqAddBtn = document.getElementById('faq-add-btn');
const faqSaveBtn = document.getElementById('faq-save-btn');
const faqCancelBtn = document.getElementById('faq-cancel-btn');
// ===== CREATE FAQ WINDOW (separate) =====
const faqCreateCard = document.getElementById('faq-create-card');
const faqCreateQuestionInput = document.getElementById('faq-create-question-input');
const faqCreateAnswerInput = document.getElementById('faq-create-answer-input');
const faqCreateEnabledInput = document.getElementById('faq-create-enabled-input');
const faqCreateSaveBtn = document.getElementById('faq-create-save-btn');
const faqCreateCancelBtn = document.getElementById('faq-create-cancel-btn');
const faqCreateHint = document.getElementById('faq-create-hint');
const faqAlert = document.getElementById('faq-alert');
const faqAlertText = document.getElementById('faq-alert-text');
const faqAlertCloseBtn = faqAlert ? faqAlert.querySelector('.btn-close') : null;
const faqConfirm = document.getElementById('faq-confirm');
const faqConfirmText = document.getElementById('faq-confirm-text');
const faqConfirmOk = faqConfirm ? faqConfirm.querySelector('[data-confirm-ok]') : null;
const faqConfirmCancel = faqConfirm ? faqConfirm.querySelector('[data-confirm-cancel]') : null;

let faqAlertTimer = null;

function hideFaqAlert() {
    if (!faqAlert) return;
    faqAlert.classList.add('d-none');
    if (faqAlertTimer) {
        clearTimeout(faqAlertTimer);
        faqAlertTimer = null;
    }
}

function showFaqAlert(message, type = 'warning', autoHideMs = 4000) {
    if (!faqAlert || !faqAlertText) return;

    faqAlert.classList.remove('alert-warning', 'alert-danger', 'alert-success', 'alert-info');
    faqAlert.classList.add(`alert-${type}`);
    faqAlertText.textContent = message;
    faqAlert.classList.remove('d-none');

    if (faqAlertTimer) clearTimeout(faqAlertTimer);
    if (autoHideMs) {
        faqAlertTimer = setTimeout(() => {
            hideFaqAlert();
        }, autoHideMs);
    }
}

if (faqAlertCloseBtn) {
    faqAlertCloseBtn.addEventListener('click', hideFaqAlert);
}

function showFaqConfirm(message, options = {}) {
    if (!faqConfirm || !faqConfirmText || !faqConfirmOk || !faqConfirmCancel) {
        return Promise.resolve(window.confirm(message));
    }

    const { confirmText = 'Підтвердити', cancelText = 'Скасувати' } = options;

    return new Promise(resolve => {
        faqConfirmText.textContent = message;
        faqConfirmOk.textContent = confirmText;
        faqConfirmCancel.textContent = cancelText;
        faqConfirm.classList.remove('d-none');

        const cleanup = (result) => {
            faqConfirm.classList.add('d-none');
            faqConfirmOk.removeEventListener('click', onOk);
            faqConfirmCancel.removeEventListener('click', onCancel);
            faqConfirm.removeEventListener('click', onBackdrop);
            document.removeEventListener('keydown', onEsc);
            resolve(result);
        };

        const onOk = () => cleanup(true);
        const onCancel = () => cleanup(false);
        const onBackdrop = (e) => {
            if (e.target === faqConfirm) cleanup(false);
        };
        const onEsc = (e) => {
            if (e.key === 'Escape') cleanup(false);
        };

        faqConfirmOk.addEventListener('click', onOk);
        faqConfirmCancel.addEventListener('click', onCancel);
        faqConfirm.addEventListener('click', onBackdrop);
        document.addEventListener('keydown', onEsc);
    });
}

function updateFaqAddBtnState() {
    if (!faqAddBtn || !faqContextSelect) return;

    const serviceName = String(faqContextSelect.value || '').trim();

    faqAddBtn.disabled = !serviceName;

    if (!serviceName) {
        if (faqCreateCard) faqCreateCard.classList.add('d-none');
    }
}
// FAQ validation rules (min/max).
const faqFieldRules = {
    question: { min: 5, max: 160, msg: 'Питання: 5–160 символів.' },
    answer:   { min: 10, max: 2000, msg: 'Відповідь: 10–2000 символів.' }
};

function getOrCreateFaqErrorEl(input, key) {
    // error div після інпута
    let err = input.nextElementSibling;
    if (!err || !err.classList.contains('invalid-feedback')) {
        err = document.createElement('div');
        err.className = 'invalid-feedback d-block';
        err.style.display = 'none';
        input.insertAdjacentElement('afterend', err);
    }
    err.dataset.faqErrorFor = key;
    return err;
}

function setFaqFieldError(input, key, message) {
    const err = getOrCreateFaqErrorEl(input, key);
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    err.textContent = message;
    err.style.display = 'block';
}

function clearFaqFieldError(input, key) {
    const err = getOrCreateFaqErrorEl(input, key);
    input.classList.remove('is-invalid');
    err.textContent = '';
    err.style.display = 'none';
}

function markFaqValid(input) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    setTimeout(() => input.classList.remove('is-valid'), 1500);
}

function validateFaqValue(key, raw) {
    const rule = faqFieldRules[key];
    if (!rule) return { valid: true, message: '' };

    const v = String(raw ?? '').trim();

    // Empty values are invalid for save.
    if (!v) return { valid: false, message: 'Поле не може бути порожнім.' };

    if (v.length < rule.min) return { valid: false, message: rule.msg };
    if (v.length > rule.max) return { valid: false, message: rule.msg };

    return { valid: true, message: '' };
}

function setCreateFaqFieldError(input, message) {
    let err = input.nextElementSibling;
    if (!err || !err.classList.contains('invalid-feedback')) {
        err = document.createElement('div');
        err.className = 'invalid-feedback d-block';
        err.style.display = 'none';
        input.insertAdjacentElement('afterend', err);
    }
    input.classList.add('is-invalid');
    err.textContent = message;
    err.style.display = 'block';
}

function clearCreateFaqFieldError(input) {
    let err = input.nextElementSibling;
    input.classList.remove('is-invalid');
    if (err && err.classList.contains('invalid-feedback')) {
        err.textContent = '';
        err.style.display = 'none';
    }
}

function updateCreateFaqSaveBtnState() {
    if (!faqCreateSaveBtn || !faqCreateQuestionInput || !faqCreateAnswerInput) return;

    const q = (faqCreateQuestionInput.value ?? '').trim();
    const a = (faqCreateAnswerInput.value ?? '').trim();

    if (!q || !a) {
        faqCreateSaveBtn.disabled = true;
        return;
    }

    const qRes = validateFaqValue('question', q);
    const aRes = validateFaqValue('answer', a);

    faqCreateSaveBtn.disabled = !(qRes.valid && aRes.valid);
}

function hasFaqChanges() {
    // In create mode there is no previous snapshot, so consider as changed.
    if (!originalFaqSnapshot) return true;

    const current = {
        question: String(faqQuestionInput?.value ?? '').trim(),
        answer: String(faqAnswerInput?.value ?? '').trim(),
        enabled: !!faqEnabledInput?.checked
    };

    const prev = {
        question: String(originalFaqSnapshot.question ?? '').trim(),
        answer: String(originalFaqSnapshot.answer ?? '').trim(),
        enabled: !!originalFaqSnapshot.enabled
    };

    // якщо все однакове -> змін НЕМАЄ
    const isSame =
        current.question === prev.question &&
        current.answer === prev.answer &&
        current.enabled === prev.enabled;

    return !isSame;
}

function updateFaqSaveBtnState() {
    if (!faqSaveBtn || !faqQuestionInput || !faqAnswerInput) return;

    const q = (faqQuestionInput.value ?? '').trim();
    const a = (faqAnswerInput.value ?? '').trim();
    const enabled = !!faqEnabledInput?.checked;

    // Пусті -> disabled
    if (!q || !a) {
        faqSaveBtn.disabled = true;
        return;
    }

    const qRes = validateFaqValue('question', q);
    const aRes = validateFaqValue('answer', a);

    // Помилки -> disabled
    if (!(qRes.valid && aRes.valid)) {
        faqSaveBtn.disabled = true;
        return;
    }

    if (editingFaqId && originalFaqSnapshot) {
        const changed =
            q !== (originalFaqSnapshot.question ?? '') ||
            a !== (originalFaqSnapshot.answer ?? '') ||
            enabled !== Boolean(originalFaqSnapshot.enabled);

        faqSaveBtn.disabled = !changed;
        return;
    }

    // Якщо це не редагування (теоретично) — просто enabled
    faqSaveBtn.disabled = false;
}

function validateAndRenderFaqInput(input, key) {
    const raw = (input?.value ?? '').trim();
    const res = validateFaqValue(key, raw);

    if (!res.valid) {
        setFaqFieldError(input, key, res.message);
        updateFaqSaveBtnState();
        return false;
    }

    clearFaqFieldError(input, key);
    markFaqValid(input);
    updateFaqSaveBtnState();
    return true;
}

// Current FAQ context.
let currentFaqServiceId = null;     // number | null
let currentFaqServiceName = '';     // string
let editingFaqId = null;

/**
 * Рендер усього списку FAQ для поточного контексту.
 */
function escapeHtml(v) {
    return String(v ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
let currentFaqDbList = []; // Current FAQ list loaded from backend.
function renderFaqListFromDb(list) {
    if (!faqListContainer) return;

    faqListContainer.innerHTML = '';

    if (!Array.isArray(list) || list.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'col-12';
        emptyDiv.innerHTML = `
          <div class="border rounded-3 p-3 bg-light-subtle text-muted small">
            Для цього сервісу поки немає FAQ в базі.
          </div>
        `;
        faqListContainer.appendChild(emptyDiv);
        return;
    }

    list.forEach(faq => {
        const col = document.createElement('div');
        col.className = 'col-12';

        const enabled = Boolean(faq.enabled);
        const statusClass = enabled ? 'badge-status-enabled' : 'badge-status-disabled';
        const statusText = enabled ? 'Увімкнено' : 'Вимкнено';

        col.innerHTML = `
          <div class="admin-testimonial-item d-flex flex-column flex-md-row justify-content-between align-items-start gap-3"
               data-faq-row="${faq.id}">

            <div>
              <div class="mb-1 fw-semibold">${escapeHtml(faq.question)}</div>
              <div class="text-muted small">${escapeHtml(faq.answer)}</div>
            </div>

            <div class="d-flex flex-column align-items-md-end align-items-start gap-2">
              <span class="badge ${statusClass} small" data-faq-status="${faq.id}">
                ${statusText}
              </span>

              <div class="btn-group btn-group-sm" role="group">
                <button type="button"
                        class="btn btn-outline-success"
                        data-faq-action="enable"
                        data-faq-id="${faq.id}">
                  Увімкнути
                </button>

                <button type="button"
                        class="btn btn-outline-secondary"
                        data-faq-action="disable"
                        data-faq-id="${faq.id}">
                  Вимкнути
                </button>

                <button type="button"
                        class="btn btn-outline-primary"
                        data-faq-action="edit"
                        data-faq-id="${faq.id}">
                  Змінити
                </button>

                <button type="button"
                        class="btn btn-outline-danger"
                        data-faq-action="delete"
                        data-faq-id="${faq.id}">
                  Видалити
                </button>
              </div>
            </div>
          </div>
        `;

        faqListContainer.appendChild(col);
    });
}
async function loadFaqFromBackendByServiceName(serviceName) {
    if (!serviceName) return;

    try {
        const res = await fetch('http://localhost:3000/panel/sendFaq', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ name: serviceName })
        });

        if (!res.ok) throw new Error('POST /panel/sendFaq failed: ' + res.status);

        const json = await res.json().catch(() => ({}));

        if (json?.message !== 'ok') {
            renderFaqListFromDb([]);
            return;
        }

        currentFaqDbList = Array.isArray(json?.data) ? json.data : [];
        renderFaqListFromDb(currentFaqDbList);
    } catch (err) {
        console.error('[FAQ] load error:', err);
        renderFaqListFromDb([]);
    }
}
/**
 * Відкрити форму для створення нового FAQ.
 */
function openCreateFaqForm() {
    // In create mode edit form is not used.
    editingFaqId = null;
    originalFaqSnapshot = null;

    // Hide edit form.
    if (faqFormCard) faqFormCard.classList.add('d-none');

    // Show create form.
    if (!faqCreateCard) return;

    faqCreateQuestionInput.value = '';
    faqCreateAnswerInput.value = '';
    faqCreateEnabledInput.checked = true;

    clearCreateFaqFieldError(faqCreateQuestionInput);
    clearCreateFaqFieldError(faqCreateAnswerInput);
    faqCreateQuestionInput.classList.remove('is-valid');
    faqCreateAnswerInput.classList.remove('is-valid');
    faqCreateQuestionInput.classList.remove('is-invalid');
    faqCreateAnswerInput.classList.remove('is-invalid');
    faqCreateCard.classList.remove('d-none');

    // Start disabled until required fields are valid.
    if (faqCreateSaveBtn) faqCreateSaveBtn.disabled = true;
    if (faqCreateHint) {
        faqCreateHint.style.display = 'none';
        faqCreateHint.textContent = '';
    }
}

/**
 * Відкрити форму для редагування існуючого FAQ.
 */
function openEditFaqForm(faq) {
    editingFaqId = faq.id;
    // Hide create form, show edit form.
    if (faqCreateCard) faqCreateCard.classList.add('d-none');
    if (!faqFormCard) return;

    faqFormTitle.textContent = 'Редагувати FAQ';
    faqIdInput.value = String(faq.id);

    faqQuestionInput.value = String(faq.question ?? '');
    faqAnswerInput.value = String(faq.answer ?? '');

    faqEnabledInput.checked = !!faq.enabled;
    originalFaqSnapshot = {
        question: String(faq.question ?? ''),
        answer: String(faq.answer ?? ''),
        enabled: Boolean(faq.enabled)
    };



    faqFormCard.classList.remove('d-none');

    validateAndRenderFaqInput(faqQuestionInput, 'question');
    validateAndRenderFaqInput(faqAnswerInput, 'answer');
    updateFaqSaveBtnState();
}

/**
 * Закрити форму (без збереження).
 */
function closeFaqForm() {
    if (faqFormCard) faqFormCard.classList.add('d-none');
    if (faqCreateCard) faqCreateCard.classList.add('d-none');
    editingFaqId = null;
    originalFaqSnapshot = null;
}

/**
 * Обробник збереження FAQ (нового або відредагованого).
 */
async function handleSaveFaq() {
    // Працює тільки для редагування (edit window)
    if (!editingFaqId) return;

    const qOk = validateAndRenderFaqInput(faqQuestionInput, 'question');
    const aOk = validateAndRenderFaqInput(faqAnswerInput, 'answer');

    if (!qOk || !aOk) {
        if (faqSaveBtn) faqSaveBtn.disabled = true;
        return;
    }

    updateFaqSaveBtnState();
    if (faqSaveBtn && faqSaveBtn.disabled) return; // сюди входить і "нічого не змінилось"

    const question = (faqQuestionInput?.value || '').trim();
    const answer = (faqAnswerInput?.value || '').trim();
    const enabled = !!faqEnabledInput?.checked; // boolean

    const payload = {
        id: Number(editingFaqId),
        data: { enabled, answer, question }
    };

    try {
        faqSaveBtn.disabled = true;

        const res = await fetch('http://localhost:3000/panel/editFaq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            showFaqAlert(`Помилка сервера (${res.status})`, 'danger');
            return;
        }

        const json = await res.json().catch(() => ({}));
        if (json?.message !== 'ok') {
            showFaqAlert('Бекенд повернув помилку', 'danger');
            return;
        }

        await loadFaqFromBackendByServiceName(currentFaqServiceName);
        originalFaqSnapshot = { question, answer, enabled };
        updateFaqSaveBtnState();

        closeFaqForm();
    } catch (err) {
        console.error('[FAQ] update error:', err);
        showFaqAlert('Помилка мережі або сервера.', 'danger');
    } finally {
        updateFaqSaveBtnState();
    }
}

async function handleCreateFaqSave() {
    if (!faqCreateSaveBtn || faqCreateSaveBtn.disabled) return;

    // Service context is required for create.
    if (!currentFaqServiceName) {
        if (faqCreateHint) {
            faqCreateHint.textContent = 'Оберіть сервіс у селекті, щоб створити FAQ.';
            faqCreateHint.style.display = 'block';
        }
        return;
    }

    const question = (faqCreateQuestionInput.value ?? '').trim();
    const answer = (faqCreateAnswerInput.value ?? '').trim();
    const enabled = !!faqCreateEnabledInput.checked;

    // Keep enabled as boolean.
    const payload = {
        serviceId: currentFaqServiceId,
        enabled,
        question,
        answer
    };

    try {
        faqCreateSaveBtn.disabled = true;

        const res = await fetch('http://localhost:3000/panel/createFaq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            showFaqAlert(`Помилка сервера (${res.status})`, 'danger');
            return;
        }

        const json = await res.json().catch(() => ({}));
        if (json?.message !== 'ok') {
            showFaqAlert('Бекенд повернув помилку', 'danger');
            return;
        }

        // оновлюємо список
        await loadFaqFromBackendByServiceName(currentFaqServiceName);
        // закриваємо create-вікно
        if (faqCreateCard) faqCreateCard.classList.add('d-none');
    } catch (err) {
        console.error('[FAQ] create error:', err);
        showFaqAlert('Помилка мережі або сервера.', 'danger');
    } finally {
        updateCreateFaqSaveBtnState();
    }
}

if (faqCreateSaveBtn) {
    faqCreateSaveBtn.addEventListener('click', handleCreateFaqSave);
}

if (faqCreateCancelBtn) {
    faqCreateCancelBtn.addEventListener('click', () => {
        if (faqCreateCard) faqCreateCard.classList.add('d-none');
    });
}

/**
 * Обробник кліків по кнопках у списку FAQ (enable / disable / edit / delete).
 */
if (faqListContainer) {
    faqListContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-faq-action]');
        if (!btn) return;

        const action = btn.dataset.faqAction;
        const id = Number(btn.dataset.faqId);

        if (!action || !id) return;

        const faq = currentFaqDbList.find(f => Number(f.id) === id);
        if (!faq) return;

        // Disable FAQ item.
        if (action === 'disable') {
            const confirmed = await showFaqConfirm('Ви впевнені, що хочете ВИМКНУТИ це FAQ?', {
                confirmText: 'Вимкнути',
                cancelText: 'Скасувати'
            });
            if (!confirmed) return;

            try {
                btn.disabled = true;

                const res = await fetch('http://localhost:3000/panel/offFaq', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ id })
                });

                if (!res.ok) {
                    showFaqAlert(`Помилка сервера (${res.status})`, 'danger');
                    return;
                }

                const json = await res.json().catch(() => ({}));
                if (json?.message !== 'ok') {
                    showFaqAlert('Бекенд повернув помилку', 'danger');
                    return;
                }

                await loadFaqFromBackendByServiceName(currentFaqServiceName);
            } catch (err) {
                console.error('[FAQ] offFaq error:', err);
                showFaqAlert('Помилка мережі або сервера.', 'danger');
            } finally {
                btn.disabled = false;
            }

            return;
        }

        // Open edit mode.
        if (action === 'edit') {
            openEditFaqForm(faq);
            return;
        }

        // Delete FAQ item.
        else if (action === 'delete') {
            const confirmed = await showFaqConfirm(
                'Ви точно хочете ВИДАЛИТИ це FAQ? Цю дію неможливо скасувати.',
                {
                    confirmText: 'Видалити',
                    cancelText: 'Скасувати'
                }
            );
            if (!confirmed) return;

            try {
                btn.disabled = true;

                const res = await fetch('http://localhost:3000/panel/deleteFaq', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ id }) // send FAQ id
                });

                if (!res.ok) {
                    showFaqAlert(`Помилка сервера (${res.status})`, 'danger');
                    return;
                }

                const json = await res.json().catch(() => ({}));
                if (json?.message !== 'ok') {
                    showFaqAlert('Бекенд повернув помилку', 'danger');
                    return;
                }

                await loadFaqFromBackendByServiceName(currentFaqServiceName);
            } catch (err) {
                console.error('[FAQ] deleteFaq error:', err);
                showFaqAlert('Помилка мережі або сервера.', 'danger');
            } finally {
                btn.disabled = false;
            }

            return;
        }

        // Enable FAQ item.
        if (action === 'enable') {
            const confirmed = await showFaqConfirm('Ви впевнені, що хочете УВІМКНУТИ це FAQ?', {
                confirmText: 'Увімкнути',
                cancelText: 'Скасувати'
            });
            if (!confirmed) return;

            try {
                btn.disabled = true;

                const res = await fetch('http://localhost:3000/panel/onFaq', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ id }) // send FAQ id
                });

                if (!res.ok) {
                    showFaqAlert(`Помилка сервера (${res.status})`, 'danger');
                    return;
                }

                const json = await res.json().catch(() => ({}));
                if (json?.message !== 'ok') {
                    showFaqAlert('Бекенд повернув помилку', 'danger');
                    return;
                }

                await loadFaqFromBackendByServiceName(currentFaqServiceName);
            } catch (err) {
                console.error('[FAQ] onFaq error:', err);
                showFaqAlert('Помилка мережі або сервера.', 'danger');
            } finally {
                btn.disabled = false;
            }

            return;
        }
    });
}

/**
 * Перемикання контексту (Головна / конкретний сервіс).
 */
if (faqContextSelect) {
    faqContextSelect.addEventListener('change', () => {
        const serviceName = String(faqContextSelect.value || '').trim();
        const selectedOpt = faqContextSelect.selectedOptions?.[0] || null;
        const serviceIdRaw = selectedOpt?.dataset?.serviceId;

        currentFaqServiceName = serviceName;
        currentFaqServiceId = serviceIdRaw ? Number(serviceIdRaw) : null;

        updateFaqAddBtnState();

        // якщо не вибрано — очищаємо все
        if (!currentFaqServiceName) {
            if (faqListContainer) faqListContainer.innerHTML = '';
            closeFaqForm();
            return;
        }

        closeFaqForm();
        loadFaqFromBackendByServiceName(currentFaqServiceName);
    });
}

/**
 * Кнопка "Створити новий FAQ".
 */
if (faqAddBtn) {
    faqAddBtn.addEventListener('click', () => {
        if (!currentFaqServiceName) return;
        openCreateFaqForm();
    });
}

/**
 * Кнопка "Зберегти" в формі FAQ.
 */
if (faqSaveBtn) {
    faqSaveBtn.addEventListener('click', () => {
        handleSaveFaq();
    });
}

// FAQ form live validation.

if (faqEnabledInput) {
    faqEnabledInput.addEventListener('change', () => {
        updateFaqSaveBtnState();
    });
}
if (faqQuestionInput) {
    const handler = () => validateAndRenderFaqInput(faqQuestionInput, 'question');
    faqQuestionInput.addEventListener('input', handler);
    faqQuestionInput.addEventListener('blur', handler);
}

if (faqAnswerInput) {
    const handler = () => validateAndRenderFaqInput(faqAnswerInput, 'answer');
    faqAnswerInput.addEventListener('input', handler);
    faqAnswerInput.addEventListener('blur', handler);
}



// стартовий стан кнопки
updateFaqSaveBtnState();

// Create FAQ form live validation.
if (faqCreateQuestionInput) {
    const handler = () => {
        const v = (faqCreateQuestionInput.value ?? '').trim();
        const res = validateFaqValue('question', v);
        if (!v) clearCreateFaqFieldError(faqCreateQuestionInput);
        else if (!res.valid) setCreateFaqFieldError(faqCreateQuestionInput, res.message);
        else clearCreateFaqFieldError(faqCreateQuestionInput);

        updateCreateFaqSaveBtnState();
    };
    faqCreateQuestionInput.addEventListener('input', handler);
    faqCreateQuestionInput.addEventListener('blur', handler);
}

if (faqCreateAnswerInput) {
    const handler = () => {
        const v = (faqCreateAnswerInput.value ?? '').trim();
        const res = validateFaqValue('answer', v);
        if (!v) clearCreateFaqFieldError(faqCreateAnswerInput);
        else if (!res.valid) setCreateFaqFieldError(faqCreateAnswerInput, res.message);
        else clearCreateFaqFieldError(faqCreateAnswerInput);

        updateCreateFaqSaveBtnState();
    };
    faqCreateAnswerInput.addEventListener('input', handler);
    faqCreateAnswerInput.addEventListener('blur', handler);
}

if (faqCreateEnabledInput) {
    faqCreateEnabledInput.addEventListener('change', () => {
        // enabled не впливає на валідність текстів, але хай буде
        updateCreateFaqSaveBtnState();
    });
}
/**
 * Кнопка "Скасувати" в формі FAQ.
 */
if (faqCancelBtn) {
    faqCancelBtn.addEventListener('click', () => {
        closeFaqForm();
    });
}
// FAQ enable/disable action.
const faqToggleBtn = document.getElementById('faq-toggle-btn');

if (faqToggleBtn) {
    faqToggleBtn.addEventListener('click', async () => {
        // працює тільки в режимі редагування
        if (!editingFaqId) return;

        const enabled = !!faqEnabledInput?.checked;
        const url = enabled ? '/panel/onFaq' : '/panel/offFaq';

        try {
            faqToggleBtn.disabled = true;

            const res = await fetch(`http://localhost:3000${url}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ id: Number(editingFaqId) })
            });

            if (!res.ok) {
                showFaqAlert(`Помилка сервера (${res.status})`, 'danger');
                return;
            }

            const json = await res.json().catch(() => ({}));
            if (json?.message !== 'ok') {
                showFaqAlert('Бекенд повернув помилку', 'danger');
                return;
            }

            // Reload FAQ for current service.
            await loadFaqFromBackendByServiceName(currentFaqServiceName);
        } catch (err) {
            console.error('[FAQ] toggle error:', err);
            showFaqAlert('Помилка мережі або сервера.', 'danger');
        } finally {
            faqToggleBtn.disabled = false;
        }
    });
}
/**
 * Стартовий рендер FAQ для початкового контексту (home).
 */
if (faqListContainer) {
    faqListContainer.innerHTML = '';
}

/**
 * ========== НОРМАЛІЗАЦІЯ ПОЛІВ ДЛЯ ВІДПРАВКИ НА БЕКЕНД ==========
 */

/**
 * Список ключів (data-field-key), які треба відправляти як масиви по рядках.
 */
const arrayFieldKeys = new Set([
    // Головна сторінка
    'hero.bullets',
    'about.features',
    'pricing.features',

    // Service pages.
    'svc.options.include',
    'svc.options.additional',
    'svc.options.terms'
]);

/**
 * Перетворює сире значення інпуту в правильний формат для бекенду.
 * Якщо fieldKey в arrayFieldKeys → розбиваємо по \n у масив.
 * Інакше повертаємо звичайний рядок (trim).
 */
function normalizeFieldValue(fieldKey, rawValue) {
    const value = (rawValue ?? '').trim();

    if (arrayFieldKeys.has(fieldKey)) {
        const items = value
            .split('\n')
            .map(v => v.trim())
            .filter(Boolean);

        return items;
    }

    return value;
}

/**
 * ========== КНОПКА "ЗБЕРЕГТИ" → fetch('/panel/main') ==========
 *
 * У HTML повинна бути кнопка:
 * <button id="main-save-btn" ...>Зберегти</button>
 */
const mainSaveBtn = document.getElementById('main-save-btn');

/**
 * ========== LIVE ВАЛІДАЦІЯ (ГОЛОВНА) + СТАН КНОПКИ ==========
 * Правило кнопки:
 * enabled: є >= 1 валідне заповнене поле і немає жодного невалідного заповненого
 * disabled: є хоч 1 невалідне заповнене поле або немає жодного валідного заповненого
 */

// Main-page validation constraints.
mainFieldRules = {
    // =========================
    // HERO (main)
    // =========================
    'hero.title': {
        type: 'text',
        min: 5,
        max: 120,
        msg: 'Заголовок: 5–120 символів.'
    },
    'hero.subtitle': {
        type: 'text',
        min: 10,
        max: 240, // у HTML maxlength="240"
        msg: 'Підзаголовок: 10–240 символів.'
    },

    'hero.buttonText1': {
        type: 'text',
        min: 2,
        max: 40, // у HTML maxlength="40"
        msg: 'Кнопка 1 (текст): 2–40 символів.'
    },
    'hero.buttonPath1': {
        type: 'text',
        min: 1,
        max: 120, // у HTML maxlength="120"
        msg: 'Кнопка 1 (шлях): 1–120 символів.'
    },

    'hero.buttonText2': {
        type: 'text',
        min: 2,
        max: 40,
        msg: 'Кнопка 2 (текст): 2–40 символів.'
    },
    'hero.buttonPath2': {
        type: 'text',
        min: 1,
        max: 120,
        msg: 'Кнопка 2 (шлях): 1–120 символів.'
    },

    'hero.image': {
        type: 'urlOrEmpty',
        max: 500,
        msg: 'URL зображення: коректне посилання (http/https), або поле порожнє.'
    },

    'hero.bullets': {
        type: 'lines',
        minLines: 1,
        maxLines: 12,
        minLineLen: 3,
        maxLineLen: 60,
        msg: 'Буліти: 1–12 рядків, кожен рядок 3–60 символів.'
    },

    // =========================
    // ABOUT (aboutMe)
    // =========================
    'about.title': {
        type: 'text',
        min: 5,
        max: 120,
        msg: 'Про мене (заголовок): 5–120 символів.'
    },
    'about.description': {
        type: 'text',
        min: 20,
        max: 800, // у HTML maxlength="800"
        msg: 'Про мене (опис): 20–800 символів.'
    },

    'about.focusLabel': {
        type: 'text',
        min: 2,
        max: 40,
        msg: 'Фокус (лейбл): 2–40 символів.'
    },
    'about.focusValue': {
        type: 'text',
        min: 5,
        max: 120,
        msg: 'Фокус (значення): 5–120 символів.'
    },

    'about.stackLabel': {
        type: 'text',
        min: 2,
        max: 40,
        msg: 'Стек (лейбл): 2–40 символів.'
    },
    'about.stackValue': {
        type: 'text',
        min: 5,
        max: 160,
        msg: 'Стек (значення): 5–160 символів.'
    },

    'about.features': {
        type: 'lines',
        minLines: 1,
        maxLines: 12,
        minLineLen: 3,
        maxLineLen: 60,
        msg: 'Особливості: 1–12 рядків, кожен рядок 3–60 символів.'
    },

    'about.cta1Text': {
        type: 'text',
        min: 2,
        max: 40, // у HTML maxlength="40"
        msg: 'CTA 1 (текст): 2–40 символів.'
    },
    'about.cta2Text': {
        type: 'text',
        min: 2,
        max: 40,
        msg: 'CTA 2 (текст): 2–40 символів.'
    },

    // Optional href fields are omitted because corresponding inputs are absent in current HTML.
    // 'about.cta1Href': { ... }
    // 'about.cta2Href': { ... }

    'about.image': {
        type: 'urlOrEmpty',
        max: 500,
        msg: 'Фото “Про мене”: коректний URL (http/https) або порожньо.'
    },

    // =========================
    // SERVICE card (home)
    // =========================
    'service.title': {
        type: 'text',
        min: 3,
        max: 80,
        msg: 'Сервіс (назва): 3–80 символів.'
    },
    'service.description': {
        type: 'text',
        min: 20,
        max: 600,
        msg: 'Сервіс (опис): 20–600 символів.'
    },
    'service.priceLabel': {
        type: 'text',
        min: 1,
        max: 40,
        msg: 'Сервіс (ціна): 1–40 символів.'
    },
    'service.ctaText': {
        type: 'text',
        min: 2,
        max: 40,
        msg: 'Сервіс (кнопка): 2–40 символів.'
    },
    'service.ctaHref': {
        type: 'text',
        min: 1,
        max: 200,
        msg: 'Сервіс (URL кнопки): 1–200 символів.'
    },
    'service.iconHtml': {
        type: 'text',
        min: 5,
        max: 160, // у HTML maxlength="160"
        msg: 'Сервіс (icon HTML): 5–160 символів.'
    },

    // =========================
    // PRICING card (home)
    // =========================
    'pricing.title': {
        type: 'text',
        min: 3,
        max: 60, // у HTML maxlength="60"
        msg: 'Тариф (назва): 3–60 символів.'
    },
    'pricing.priceLabel': {
        type: 'text',
        min: 1,
        max: 40, // у HTML maxlength="40"
        msg: 'Тариф (ціна): 1–40 символів.'
    },
    'pricing.features': {
        type: 'lines',
        minLines: 1,
        maxLines: 15,
        minLineLen: 3,
        maxLineLen: 60,
        msg: 'Тариф (опції): 1–15 рядків, кожен рядок 3–60 символів.'
    },
    'pricing.badge': {
        type: 'text',
        min: 2,
        max: 40, // у HTML maxlength="40"
        msg: 'Тариф (бейдж): 2–40 символів або порожньо.'
    },
    'pricing.ctaText': {
        type: 'text',
        min: 2,
        max: 40,
        msg: 'Тариф (кнопка): 2–40 символів.'
    },
    'pricing.ctaHref': {
        type: 'text',
        min: 1,
        max: 200,
        msg: 'Тариф (URL кнопки): 1–200 символів.'
    }
};

/* =========================================================
   SERVICES: RULES (валідація сторінок сервісів)
   ========================================================= */

const serviceFieldRules = {
    // ===== HERO =====
    'svc.hero.badge': {
        type: 'text',
        min: 3,
        max: 60,
        msg: 'Бейдж: 3–60 символів.'
    },
    'svc.hero.title': {
        type: 'text',
        min: 10,
        max: 120,
        msg: 'Заголовок: 10–120 символів.'
    },
    'svc.hero.lead': {
        type: 'text',
        min: 20,
        max: 300,
        msg: 'Опис: 20–300 символів.'
    },
    'svc.hero.image': {
        type: 'urlOrEmpty',
        max: 500,
        msg: 'URL зображення: коректне посилання або порожньо.'
    },
    'svc.hero.duration': {
        type: 'text',
        min: 2,
        max: 40,
        msg: 'Тривалість: 2–40 символів.'
    },
    'svc.hero.priceHero': {
        type: 'text',
        min: 1,
        max: 40,
        msg: 'Ціна: 1–40 символів.'
    },
    'svc.hero.executor': {
        type: 'text',
        min: 3,
        max: 80,
        msg: 'Виконавець: 3–80 символів.'
    },
    'svc.hero.textBtn1': {
        type: 'text',
        min: 2,
        max: 40,
        msg: 'Кнопка 1 (текст): 2–40 символів.'
    },
    'svc.hero.hrefBtn1': {
        type: 'text',
        min: 1,
        max: 120,
        msg: 'Кнопка 1 (посилання): 1–120 символів.'
    },
    'svc.hero.textBtn2': {
        type: 'text',
        min: 2,
        max: 40,
        msg: 'Кнопка 2 (текст): 2–40 символів.'
    },
    'svc.hero.hrefBtn2': {
        type: 'text',
        min: 1,
        max: 120,
        msg: 'Кнопка 2 (посилання): 1–120 символів.'
    },

    // ===== OPTIONS =====
    'svc.options.include': {
        type: 'lines',
        minLines: 1,
        maxLines: 12,
        minLineLen: 3,
        maxLineLen: 80,
        msg: 'Що включено: 1–12 рядків, 3–80 символів кожен.'
    },
    'svc.options.additional': {
        type: 'lines',
        maxLines: 12,
        minLineLen: 3,
        maxLineLen: 80,
        msg: 'Додатково: до 12 рядків.'
    },
    'svc.options.discount': {
        type: 'text',
        min: 5,
        max: 240,
        msg: 'Знижка: 5–240 символів.'
    },
    'svc.options.price_title': {
        type: 'text',
        min: 5,
        max: 120,
        msg: 'Заголовок ціни: 5–120 символів.'
    },
    'svc.options.price_subtitle': {
        type: 'text',
        min: 10,
        max: 240,
        msg: 'Підзаголовок: 10–240 символів.'
    },
    'svc.options.price': {
        type: 'text',
        min: 1,
        max: 60,
        msg: 'Ціна: 1–60 символів.'
    },
    'svc.options.terms': {
        type: 'lines',
        minLines: 1,
        maxLines: 10,
        minLineLen: 3,
        maxLineLen: 80,
        msg: 'Умови: 1–10 рядків.'
    },
    'svc.options.quickStart': {
        type: 'text',
        min: 10,
        max: 240,
        msg: 'Швидкий старт: 10–240 символів.'
    },

    // ===== GALLERY =====
    'svc.gallery.1.image': { type: 'urlOrEmpty', max: 500, msg: 'Slide 1 image: коректний URL або порожньо.' },
    'svc.gallery.2.image': { type: 'urlOrEmpty', max: 500, msg: 'Slide 2 image: коректний URL або порожньо.' },
    'svc.gallery.3.image': { type: 'urlOrEmpty', max: 500, msg: 'Slide 3 image: коректний URL або порожньо.' },
    'svc.gallery.1.title': { type: 'text', min: 3, max: 80, msg: 'Slide 1 title: 3–80 символів.' },
    'svc.gallery.1.caption': { type: 'text', min: 10, max: 240, msg: 'Slide 1 text: 10–240 символів.' },
    'svc.gallery.2.title': { type: 'text', min: 3, max: 80, msg: 'Slide 2 title: 3–80 символів.' },
    'svc.gallery.2.caption': { type: 'text', min: 10, max: 240, msg: 'Slide 2 text: 10–240 символів.' },
    'svc.gallery.3.title': { type: 'text', min: 3, max: 80, msg: 'Slide 3 title: 3–80 символів.' },
    'svc.gallery.3.caption': { type: 'text', min: 10, max: 240, msg: 'Slide 3 text: 10–240 символів.' }
};

// 2) Допоміжні перевірки
function isValidUrlStrict(str) {
    try {
        const u = new URL(str);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

function getOrCreateErrorEl(input) {
    // Створюємо блок помилки прямо після інпута (Bootstrap-style)
    let err = input.nextElementSibling;
    if (!err || !err.classList.contains('invalid-feedback')) {
        err = document.createElement('div');
        err.className = 'invalid-feedback d-block'; // d-block щоб показувалось одразу
        err.style.display = 'none';
        input.insertAdjacentElement('afterend', err);
    }
    return err;
}

function setFieldError(input, message) {
    const errEl = getOrCreateErrorEl(input);
    input.classList.add('is-invalid');
    errEl.textContent = message;
    errEl.style.display = 'block';
}

const validTimers = new WeakMap();

function flashValid(input, ms = 2000) {
    // прибираємо invalid
    input.classList.remove('is-invalid');

    // ставимо valid
    input.classList.add('is-valid');

    // якщо таймер уже був — перезапускаємо
    const prev = validTimers.get(input);
    if (prev) clearTimeout(prev);

    const t = setTimeout(() => {
        input.classList.remove('is-valid');
        validTimers.delete(input);
    }, ms);

    validTimers.set(input, t);
}

function clearValidState(input) {
    const prev = validTimers.get(input);
    if (prev) clearTimeout(prev);
    validTimers.delete(input);
    input.classList.remove('is-valid');
}

function clearFieldError(input) {
    const errEl = getOrCreateErrorEl(input);
    input.classList.remove('is-invalid');
    errEl.textContent = '';
    errEl.style.display = 'none';
    clearValidState(input);
}

function validateField(fieldKey, rawValue) {
    const rule = mainFieldRules[fieldKey];
    if (!rule) {
        // Якщо правила не описані — вважаємо валідним
        return { valid: true, message: '' };
    }

    const value = (rawValue ?? '').trim();

    // Порожнє — НЕ помилка (бо в схемі все optional)
    if (!value) return { valid: true, message: '' };

    if (rule.type === 'text') {
        if (rule.min != null && value.length < rule.min) return { valid: false, message: rule.msg };
        if (rule.max != null && value.length > rule.max) return { valid: false, message: rule.msg };
        return { valid: true, message: '' };
    }

    if (rule.type === 'urlOrEmpty') {
        if (rule.max != null && value.length > rule.max) return { valid: false, message: rule.msg };
        if (!isValidUrlStrict(value)) return { valid: false, message: rule.msg + ' (Приклад: https://site.com/img.jpg)' };
        return { valid: true, message: '' };
    }

    if (rule.type === 'lines') {
        const lines = value.split('\n').map(l => l.trim()).filter(Boolean);

        if (rule.minLines != null && lines.length < rule.minLines) return { valid: false, message: rule.msg };
        if (rule.maxLines != null && lines.length > rule.maxLines) return { valid: false, message: rule.msg };

        if (rule.minLineLen != null && lines.some(l => l.length < rule.minLineLen)) return { valid: false, message: rule.msg };
        if (rule.maxLineLen != null && lines.some(l => l.length > rule.maxLineLen)) return { valid: false, message: rule.msg };

        return { valid: true, message: '' };
    }

    return { valid: true, message: '' };
}

function validateServiceField(fieldKey, rawValue) {
    const rule = serviceFieldRules[fieldKey];
    if (!rule) return { valid: true, message: '' };

    const value = (rawValue ?? '').trim();

    // Порожнє — НЕ помилка
    if (!value) return { valid: true, message: '' };

    // Перевіряємо ТІЛЬКИ по rule з serviceFieldRules
    return validateFieldWithRule(rule, value);
}

function validateFieldWithRule(rule, value) {
    if (rule.type === 'text') {
        if (rule.min != null && value.length < rule.min) return { valid: false, message: rule.msg };
        if (rule.max != null && value.length > rule.max) return { valid: false, message: rule.msg };
        return { valid: true, message: '' };
    }

    if (rule.type === 'urlOrEmpty') {
        if (rule.max != null && value.length > rule.max) return { valid: false, message: rule.msg };
        if (!isValidUrlStrict(value)) return { valid: false, message: rule.msg + ' (Приклад: https://site.com/img.jpg)' };
        return { valid: true, message: '' };
    }

    if (rule.type === 'lines') {
        const lines = value.split('\n').map(l => l.trim()).filter(Boolean);

        if (rule.minLines != null && lines.length < rule.minLines) return { valid: false, message: rule.msg };
        if (rule.maxLines != null && lines.length > rule.maxLines) return { valid: false, message: rule.msg };

        if (rule.minLineLen != null && lines.some(l => l.length < rule.minLineLen)) return { valid: false, message: rule.msg };
        if (rule.maxLineLen != null && lines.some(l => l.length > rule.maxLineLen)) return { valid: false, message: rule.msg };

        return { valid: true, message: '' };
    }

    return { valid: true, message: '' };
}


function validateAndRenderInput(input) {
    const key = input?.dataset?.fieldKey;
    if (!key) return;

    const value = (input.value ?? '').trim();

    // якщо пусто — прибираємо все
    if (!value) {
        clearFieldError(input);
        clearValidState(input);
        return;
    }

    // Вибір валідатора
    const res = key.startsWith('svc.')
        ? validateServiceField(key, value)
        : validateField(key, value);

    if (!res.valid) {
        clearValidState(input);
        setFieldError(input, res.message);
    } else {
        clearFieldError(input);
        flashValid(input, 2000);
    }
}

// 3) Підключаємо логіку тільки до Головної сторінки (admin-home)
const mainSection = document.getElementById('admin-home');
const mainSaveBtn2 = document.getElementById('main-save-btn');

let mainBtnHintEl = null;

function ensureMainBtnHint() {
    if (!mainSaveBtn2) return null;

    // Створюємо під кнопкою маленький блок пояснення
    if (!mainBtnHintEl) {
        mainBtnHintEl = document.createElement('div');
        mainBtnHintEl.className = 'text-danger small mt-2';
        mainBtnHintEl.style.display = 'none';

        // пробуємо вставити біля кнопки
        const wrap = mainSaveBtn2.parentElement;
        if (wrap) wrap.appendChild(mainBtnHintEl);
    }
    return mainBtnHintEl;
}

updateMainSaveBtnState = function updateMainSaveBtnState() {
    if (!mainSection || !mainSaveBtn2) return;

    const inputsInMain = mainSection.querySelectorAll('.admin-input');

    let hasAtLeastOneValidFilled = false;
    let hasAnyInvalidFilled = false;

    inputsInMain.forEach(input => {
        const key = input.dataset.fieldKey;
        if (!key) return;

        // ❗❗❗ ГОЛОВНА ПРАВКА: ІГНОРУЄМО ВСІ ПОЛЯ GALLERY ❗❗❗
        if (key.startsWith('svc.gallery.')) {
            return; // ← ЦІ ПОЛЯ НЕ ВПЛИВАЮТЬ НА MAIN SAVE
        }

        const value = (input.value ?? '').trim();
        if (!value) return;

        const { valid } = key.startsWith('svc.')
            ? validateServiceField(key, value)
            : validateField(key, value);

        if (valid) hasAtLeastOneValidFilled = true;
        else hasAnyInvalidFilled = true;
    });

    const hint = ensureMainBtnHint();

    if (hasAnyInvalidFilled) {
        mainSaveBtn2.disabled = true;
        if (hint) {
            hint.textContent =
                'Є помилки у введених полях. Виправ або очисть невалідні поля, щоб активувати збереження.';
            hint.style.display = 'block';
        }
        return;
    }

    mainSaveBtn2.disabled = !hasAtLeastOneValidFilled;

    if (hint) {
        hint.style.display = 'none';
        hint.textContent = '';
    }
};

// 4) Live-обробники (НОРМАЛЬНІ)
if (mainSection) {
    const inputsInMain = mainSection.querySelectorAll('.admin-input');

    inputsInMain.forEach(input => {
        const handler = () => {
            validateAndRenderInput(input);
            updateMainSaveBtnState();
        };

        input.addEventListener('input', handler);
        input.addEventListener('change', handler);
        input.addEventListener('blur', handler);
    });

    inputsInMain.forEach(input => validateAndRenderInput(input));
    updateMainSaveBtnState();
}


if (mainSection) {
    const inputsInMain = mainSection.querySelectorAll('.admin-input');

    inputsInMain.forEach(input => {
        input.addEventListener('input', () => {
        });
    });
}

if (mainSaveBtn) {
    mainSaveBtn.addEventListener('click', async () => {
        try {
            // Захист: якщо кнопка disabled — просто виходимо
            if (mainSaveBtn.disabled) {
                return;
            }
            // 1. Беремо тільки поля з секції Головна сторінка
            const mainSection = document.getElementById('admin-home');
            if (!mainSection) {
                console.error('Не знайдено секцію #admin-home');
                alert('Технічна помилка: не знайдено розділ "Головна сторінка".');
                return;
            }

            // 2. Збираємо всі інпути з класом .admin-input всередині секції
            const inputsInMain = mainSection.querySelectorAll('.admin-input');

            const data = {};

            // 3. Проходимося по кожному інпуту і розкладаємо за fieldKey
            inputsInMain.forEach(input => {
                const fieldKey = input.dataset.fieldKey;
                if (!fieldKey) return;

                // 3.0 Беремо значення
                const rawValue = (input.value ?? '').trim();

                // якщо пусто — не відправляємо
                if (!rawValue) return;

                // 3.0.1 Якщо НЕ валідне — не відправляємо
                const check = validateField(fieldKey, rawValue);
                if (!check.valid) return;

                // 3.1 Нормалізуємо значення (рядок або масив рядків)
                const normalized = normalizeFieldValue(fieldKey, rawValue);

                // Порожній рядок → не кладемо в обʼєкт
                if (typeof normalized === 'string' && normalized.length === 0) {
                    return;
                }

                // Порожній масив → теж не кладемо
                if (Array.isArray(normalized) && normalized.length === 0) {
                    return;
                }

                // 3.2 Розбиваємо fieldKey типу "hero.title" → ['hero', 'title']
                const parts = fieldKey.split('.');
                let current = data;

                // 3.3 Ітеруємо по частинах та створюємо вкладені обʼєкти
                parts.forEach((part, index) => {
                    if (index === parts.length - 1) {
                        // остання частина → сюди пишемо значення
                        current[part] = normalized;
                    } else {
                        // проміжний рівень → якщо немає, створюємо обʼєкт
                        if (!current[part]) current[part] = {};
                        current = current[part];
                    }
                });
            });

            // 4. Готуємо фінальний payload для бекенда
            // 4. Готуємо фінальний payload для бекенда (тільки не пусті блоки)
            const payload = {};

// додаємо блоки тільки якщо вони не пусті
            if (data.hero && Object.keys(data.hero).length) payload.main = data.hero;
            if (data.about && Object.keys(data.about).length) payload.aboutMe = data.about;
            if (data.service && Object.keys(data.service).length) payload.service = data.service;
            if (data.pricing && Object.keys(data.pricing).length) payload.price = data.pricing;

// додаємо selectedServiceName / selectedPricingName тільки якщо вибрано
            const selectedServiceName = (serviceSelect?.value || '').trim();
            const selectedPricingTitle = (pricingSelect?.value || '').trim();

            if (selectedServiceName) payload.selectedServiceName = selectedServiceName;
            if (selectedPricingTitle) payload.selectedPricingTitle = selectedPricingTitle;


            const isPayloadEmpty = Object.keys(payload).length === 0;

            if (isPayloadEmpty) {
                alert('Немає жодного заповненого поля для збереження.');
                return;
            }

            if (payload.service && !payload.selectedServiceName) {
                alert('Оберіть сервіс, який редагуєте');
                return;
            }

            if (payload.price && !payload.selectedPricingTitle) {
                alert('Оберіть тариф, який редагуєте');
                return;
            }
            // 6. Надсилаємо саме payload, а не "data"
            const res = await fetch('http://localhost:3000/panel/main', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                console.error('Помилка при збереженні /panel/main, статус:', res.status);
                alert('Не вдалося зберегти головну сторінку (помилка ' + res.status + ').');
                return;
            }

            const json = await res.json().catch(() => ({}));
            alert('Головна сторінка успішно збережена.');
        } catch (err) {
            console.error('Помилка при збереженні головної сторінки:', err);
            alert('Сталася помилка при збереженні головної сторінки.');
        }
    });
}

/* =========================================================
   CONTACTS: LIVE VALIDATION + SAVE BUTTON + POST /panel/contacts
   ========================================================= */

// ===== DOM =====
const contactsSection = document.getElementById('admin-contacts');
const contactsSaveBtn = document.getElementById('contacts-save-btn');
const contactsHintEl = document.getElementById('contacts-save-hint');

// ===== Rules тільки для contacts.* =====
const contactsFieldRules = {
    'contacts.email': {
        type: 'emailOrEmpty',
        max: 120,
        msg: 'Вкажи коректний e-mail (наприклад: name@gmail.com).'
    },
    'contacts.telegram': {
        type: 'urlOrEmpty',
        max: 200,
        msg: 'Telegram URL має бути коректним (https://...).'
    },
    'contacts.telegramLabel': {
        type: 'text',
        min: 2,
        max: 60,
        msg: 'Лейбл Telegram: 2–60 символів.'
    },
    'contacts.github': {
        type: 'urlOrEmpty',
        max: 200,
        msg: 'GitHub URL має бути коректним (https://...).'
    },
    'contacts.githubLabel': {
        type: 'text',
        min: 2,
        max: 80,
        msg: 'Лейбл GitHub: 2–80 символів.'
    }
};

// ===== Helpers (тільки для contacts) =====
function isValidEmailSimple(email) {
    // проста, але робоча перевірка
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function getContactsErrorElByKey(fieldKey) {
    // ми використовуємо твій HTML: <div data-error-for="contacts.xxx">
    return document.querySelector(`[data-error-for="${fieldKey}"]`);
}

function setContactsFieldError(input, fieldKey, message) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');

    const errEl = getContactsErrorElByKey(fieldKey);
    if (errEl) {
        errEl.textContent = message;
        errEl.style.display = 'block';
    }
}

function clearContactsFieldError(input, fieldKey) {
    input.classList.remove('is-invalid');
    const errEl = getContactsErrorElByKey(fieldKey);
    if (errEl) {
        errEl.textContent = '';
        errEl.style.display = 'none';
    }
}

function markContactsValid(input) {
    // легка підсвітка як у тебе
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');

    // прибрати зелений через 2с
    setTimeout(() => input.classList.remove('is-valid'), 2000);
}

function validateContactsField(fieldKey, rawValue) {
    const rule = contactsFieldRules[fieldKey];
    if (!rule) return { valid: true, message: '' };

    const value = (rawValue ?? '').trim();

    // пусте = OK (все optional)
    if (!value) return { valid: true, message: '' };

    if (rule.max != null && value.length > rule.max) {
        return { valid: false, message: rule.msg };
    }

    if (rule.type === 'text') {
        if (rule.min != null && value.length < rule.min) return { valid: false, message: rule.msg };
        return { valid: true, message: '' };
    }

    if (rule.type === 'urlOrEmpty') {
        // використовуємо твою строгішу URL-функцію
        if (!isValidUrlStrict(value)) {
            return { valid: false, message: rule.msg + ' (Приклад: https://t.me/puffinity)' };
        }
        return { valid: true, message: '' };
    }

    if (rule.type === 'emailOrEmpty') {
        if (!isValidEmailSimple(value)) return { valid: false, message: rule.msg };
        return { valid: true, message: '' };
    }

    return { valid: true, message: '' };
}

function validateAndRenderContactsInput(input) {
    const key = input?.dataset?.fieldKey;
    if (!key || !key.startsWith('contacts.')) return;

    const value = (input.value ?? '').trim();

    // пусто -> чистимо стан і помилку
    if (!value) {
        clearContactsFieldError(input, key);
        input.classList.remove('is-valid');
        return;
    }

    const res = validateContactsField(key, value);

    if (!res.valid) {
        setContactsFieldError(input, key, res.message);
    } else {
        clearContactsFieldError(input, key);
        markContactsValid(input);
    }
}

function updateContactsSaveBtnState() {
    if (!contactsSection || !contactsSaveBtn) return;

    const inputs = contactsSection.querySelectorAll('.admin-input[data-field-key^="contacts."]');

    let hasAtLeastOneValidFilled = false;
    let hasAnyInvalidFilled = false;

    inputs.forEach(input => {
        const key = input.dataset.fieldKey;
        const value = (input.value ?? '').trim();
        if (!value) return;

        const { valid } = validateContactsField(key, value);
        if (valid) hasAtLeastOneValidFilled = true;
        else hasAnyInvalidFilled = true;
    });

    if (hasAnyInvalidFilled) {
        contactsSaveBtn.disabled = true;
        if (contactsHintEl) {
            contactsHintEl.textContent = 'Є помилки у контактах. Виправ або очисть невалідні поля.';
            contactsHintEl.style.display = 'block';
        }
        return;
    }

    contactsSaveBtn.disabled = !hasAtLeastOneValidFilled;

    if (contactsHintEl) {
        contactsHintEl.style.display = 'none';
        contactsHintEl.textContent = '';
    }
}

function buildContactsPayload() {
    if (!contactsSection) return { payload: null, error: 'Не знайдено секцію Contacts.' };

    const inputs = contactsSection.querySelectorAll('.admin-input[data-field-key^="contacts."]');

    const contacts = {};
    let hasAnyValue = false;
    let hasInvalid = false;

    inputs.forEach(input => {
        const key = input.dataset.fieldKey;
        const raw = (input.value ?? '').trim();

        if (!raw) {
            clearContactsFieldError(input, key);
            input.classList.remove('is-valid', 'is-invalid');

            const last = key.split('.').pop();

            // email не чіпаємо (не шлемо null)
            if (last !== 'email') {
                contacts[last] = null;
            }
            return;
        }

        hasAnyValue = true;

        const res = validateContactsField(key, raw);
        if (!res.valid) {
            hasInvalid = true;
            setContactsFieldError(input, key, res.message);
            return;
        }

        clearContactsFieldError(input, key);

        // key типу "contacts.email" -> беремо "email"
        const last = key.split('.').pop();
        contacts[last] = raw;
    });

    if (hasInvalid) return { payload: null, error: 'Є помилки у контактах. Виправ або очисть невалідні поля.' };
    if (!hasAnyValue) return { payload: null, error: 'Немає жодного заповненого контакту для збереження.' };

    return { payload: contacts, error: null };}

async function handleSaveContacts() {
    if (!contactsSaveBtn || contactsSaveBtn.disabled) return;

    const { payload, error } = buildContactsPayload();

    if (error) {
        if (contactsHintEl) {
            contactsHintEl.textContent = error;
            contactsHintEl.style.display = 'block';
        } else {
            alert(error);
        }
        return;
    }

    if (contactsHintEl) {
        contactsHintEl.style.display = 'none';
        contactsHintEl.textContent = '';
    }

    try {
        contactsSaveBtn.disabled = true;

        const res = await fetch('http://localhost:3000/panel/contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            alert('Не вдалося зберегти контакти (помилка ' + res.status + ').');
            return;
        }

        const json = await res.json().catch(() => ({}));
        if (json?.message !== 'ok') {
            alert('Бекенд повернув помилку при збереженні контактів.');
            return;
        }

        alert('Контакти успішно збережено.');
    } catch (err) {
        console.error('[CONTACTS] Save error:', err);
        alert('Сталася помилка при збереженні контактів.');
    } finally {
        updateContactsSaveBtnState();
    }
}

// ===== Wire up listeners =====
if (contactsSection) {
    const inputs = contactsSection.querySelectorAll('.admin-input[data-field-key^="contacts."]');

    inputs.forEach(input => {
        const handler = () => {
            validateAndRenderContactsInput(input);
            updateContactsSaveBtnState();
        };

        input.addEventListener('input', handler);
        input.addEventListener('change', handler);
        input.addEventListener('blur', handler);
    });

    // стартова перевірка
    inputs.forEach(input => validateAndRenderContactsInput(input));
    updateContactsSaveBtnState();
}

if (contactsSaveBtn) {
    contactsSaveBtn.addEventListener('click', handleSaveContacts);
}

/* =========================================================
   SERVICES: LIVE VALIDATION + SAVE BUTTON
   ========================================================= */

const serviceSection = document.getElementById('admin-services');
const serviceSaveBtn = document.getElementById('service-page-save-btn');
const serviceHint = document.getElementById('service-page-save-hint');

/**
 * =========================================================
 * SERVICES: COLLECT PAYLOAD + POST /panel/services
 * =========================================================
 * Умови:
 * - беремо тільки svc.* поля
 * - пусті поля НЕ надсилаємо
 * - якщо поле заповнене і невалідне → стоп, не відправляємо
 * - lines поля (include/additional/terms) → масив рядків
 * - додаємо serviceName (з servicePageSelect)
 */

function splitLinesToArray(rawValue) {
    return String(rawValue || '')
        .split('\n')
        .map(v => v.trim())
        .filter(Boolean);
}

function buildServicePagePayload() {
    if (!serviceSection) return { payload: null, error: 'Не знайдено секцію сервісів.' };

    // serviceName береться з селекту сторінок сервісів (slug/key)
    const serviceName = (servicePageSelect?.value || '').trim();
    if (!serviceName) {
        return { payload: null, error: 'Оберіть сторінку сервісу (serviceName), яку зберігаємо.' };
    }

    const inputs = serviceSection.querySelectorAll('.admin-input[data-field-key^="svc."]');

    let hasAnyValue = false;
    let hasInvalid = false;

    // тимчасове сховище у форматі "svc.hero.title" -> value
    const flat = {};

    inputs.forEach(input => {
        const key = input.dataset.fieldKey;
        if (!key) return;

        const raw = (input.value ?? '').trim();

        // ПУСТЕ — ігноруємо (не помилка)
        if (!raw) {
            clearFieldError(input);
            clearValidState(input);
            return;
        }

        hasAnyValue = true;

        // ВАЛІДАЦІЯ: якщо заповнене — повинно бути валідним
        const res = validateServiceField(key, raw);

        if (!res.valid) {
            hasInvalid = true;
            setFieldError(input, res.message);
            return;
        }

        // валідне → прибираємо помилку
        clearFieldError(input);

            // Normalize multiline service option fields to arrays.
            if (key === 'svc.options.include' || key === 'svc.options.additional' || key === 'svc.options.terms') {
                flat[key] = splitLinesToArray(raw);
            } else {
                flat[key] = raw;
            }
        });

    if (hasInvalid) {
        return { payload: null, error: 'Є помилки у полях. Виправ або очисть невалідні поля.' };
    }

    if (!hasAnyValue) {
        return { payload: null, error: 'Немає жодного заповненого поля для збереження.' };
    }

    // Build nested payload structure expected by backend.
    const payload = { serviceName };

    // HERO
    const hero = {};
    if (flat['svc.hero.title'] != null) hero.title = flat['svc.hero.title'];
    if (flat['svc.hero.lead'] != null) hero.lead = flat['svc.hero.lead'];
    if (flat['svc.hero.image'] != null) hero.image = flat['svc.hero.image'];
    if (flat['svc.hero.hrefBtn1'] != null) hero.btnHref1 = flat['svc.hero.hrefBtn1'];
    if (flat['svc.hero.textBtn1'] != null) hero.btnText1 = flat['svc.hero.textBtn1'];
    if (flat['svc.hero.hrefBtn2'] != null) hero.btnHref2 = flat['svc.hero.hrefBtn2'];
    if (flat['svc.hero.textBtn2'] != null) hero.btnText2 = flat['svc.hero.textBtn2'];
    if (flat['svc.hero.duration'] != null) hero.duration = flat['svc.hero.duration'];
    if (flat['svc.hero.executor'] != null) hero.executor = flat['svc.hero.executor'];
    if (flat['svc.hero.priceHero'] != null) hero.priceHero = flat['svc.hero.priceHero'];

    if (Object.keys(hero).length) payload.hero = hero;

    // Map svc.options.* keys into payload.setting.
    const setting = {};
    if (flat['svc.options.discount'] != null) setting.discount = flat['svc.options.discount'];
    if (flat['svc.options.include'] != null) setting.include = flat['svc.options.include'];
    if (flat['svc.options.additional'] != null) setting.additional = flat['svc.options.additional'];
    if (flat['svc.options.price_title'] != null) setting.price_title = flat['svc.options.price_title'];
    if (flat['svc.options.price_subtitle'] != null) setting.price_subtitle = flat['svc.options.price_subtitle'];
    if (flat['svc.options.price'] != null) setting.price = flat['svc.options.price'];
    if (flat['svc.options.terms'] != null) setting.terms = flat['svc.options.terms'];
    if (flat['svc.options.quickStart'] != null) setting.quickStart = flat['svc.options.quickStart'];

    if (Object.keys(setting).length) payload.setting = setting;

    // Build gallery array from up to 3 slide inputs.
    const gallery = [];

    for (let i = 1; i <= 3; i++) {
        const imgKey = `svc.gallery.${i}.image`;
        const titleKey = `svc.gallery.${i}.title`;
        const captionKey = `svc.gallery.${i}.caption`;

        // Collect image/title/caption if provided.
        const image = flat[imgKey];
        const title = flat[titleKey];
        const caption = flat[captionKey];

        // Add slide only when at least one field is present.
        if (image != null || title != null || caption != null) {
            const slide = {};
            if (image != null) slide.image = image;
            if (title != null) slide.title = title;
            if (caption != null) slide.caption = caption;
            gallery.push(slide);
        }
    }

    if (gallery.length) payload.gallery = gallery;

    return { payload, error: null };
}

async function handleSaveServicePage() {
    if (!serviceSaveBtn) return;

    // якщо disabled — виходимо
    if (serviceSaveBtn.disabled) return;

    const { payload, error } = buildServicePagePayload();

    if (error) {
        if (serviceHint) {
            serviceHint.textContent = error;
            serviceHint.style.display = 'block';
        } else {
            alert(error);
        }
        return;
    }

    if (serviceHint) serviceHint.style.display = 'none';

    try {
        const res = await fetch('http://localhost:3000/panel/services', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.error('POST /panel/services failed:', res.status);
            alert('Не вдалося зберегти сторінку сервісу (помилка ' + res.status + ').');
            return;
        }

        const json = await res.json().catch(() => ({}));
        alert('Сторінку сервісу успішно збережено.');
    } catch (err) {
        console.error('[SERVICE PAGE] Save error:', err);
        alert('Сталася помилка при збереженні сторінки сервісу.');
    }
}

// Вішаємо на кнопку "Зберегти сторінку сервісу"
if (serviceSaveBtn) {
    serviceSaveBtn.addEventListener('click', handleSaveServicePage);
}

function updateServiceSaveBtnState() {
    if (!serviceSection || !serviceSaveBtn) return;

    const inputs = serviceSection.querySelectorAll('.admin-input[data-field-key^="svc."]');

    let hasAnyValue = false;
    let hasInvalid = false;

    inputs.forEach(input => {
        const value = (input.value || '').trim();
        const key = input.dataset.fieldKey || '';

        // ІГНОРУЄМО поля слайдів (title/caption) для головної кнопки збереження сервісів
        if (/^svc\.gallery\.\d+\.(title|caption)$/.test(key)) {
            return;
        }

        if (!value) return; // ⬅️ ПУСТІ — ІГНОРУЄМО

        hasAnyValue = true;
        const res = validateServiceField(key, value);

        if (!res.valid) {
            hasInvalid = true;
        }
    });

    // 🔹 СТАН 1: ВСЕ ПУСТО
    if (!hasAnyValue) {
        serviceSaveBtn.disabled = true;
        if (serviceHint) serviceHint.style.display = 'none';
        return;
    }

    // 🔹 СТАН 2: Є ДАНІ + ПОМИЛКИ
    if (hasInvalid) {
        serviceSaveBtn.disabled = true;
        if (serviceHint) {
            serviceHint.textContent = 'Є помилки у полях сервісу. Виправ їх, щоб зберегти.';
            serviceHint.style.display = 'block';
        }
        return;
    }

    // 🔹 СТАН 3: Є ДАНІ + ВСЕ ОК
    serviceSaveBtn.disabled = false;
    if (serviceHint) serviceHint.style.display = 'none';
}

function updateGallerySaveButtonsState() {
    if (!serviceSection) return;

    for (let i = 1; i <= 3; i++) {
        const btn = document.querySelector(`button[data-gallery-save="${i}"]`);
        if (!btn) continue;

        const imageFileInput = serviceSection.querySelector(`input[type="file"][data-upload-for="svc.gallery.${i}.image"]`);
        const imageTextInput = serviceSection.querySelector(`.admin-input[data-field-key="svc.gallery.${i}.image"]`);
        const titleInput = serviceSection.querySelector(`.admin-input[data-field-key="svc.gallery.${i}.title"]`);
        const captionInput = serviceSection.querySelector(`.admin-input[data-field-key="svc.gallery.${i}.caption"]`);
        const inputs = [imageTextInput, titleInput, captionInput].filter(Boolean);

        let hasAnyValue = false;
        let hasInvalid = false;

        const imageChanged = Boolean(imageFileInput && imageFileInput.files && imageFileInput.files.length > 0);
        if (imageChanged) {
            hasAnyValue = true;
        }

        inputs.forEach(input => {
            const key = input.dataset.fieldKey || '';
            const value = (input.value || '').trim();
            if (!value) return;

            hasAnyValue = true;
            const res = validateServiceField(key, value);
            if (!res.valid) hasInvalid = true;
        });

        btn.disabled = !hasAnyValue || hasInvalid;
    }
}

async function handleSaveGallerySlide(btn) {
    const index = Number(btn?.dataset?.gallerySave || 0);
    const galleryId = Number(btn?.dataset?.galleryId || 0);
    if (!index || !galleryId) {
        const hint = (() => {
            let el = btn.nextElementSibling;
            if (!el || !el.classList.contains('gallery-save-hint')) {
                el = document.createElement('div');
                el.className = 'gallery-save-hint text-danger small mt-2';
                el.style.display = 'none';
                btn.insertAdjacentElement('afterend', el);
            }
            return el;
        })();
        hint.textContent = 'Не знайдено gallery_id для цього слайду.';
        hint.style.display = 'block';
        return;
    }

    const ensureGalleryHint = () => {
        let hint = btn.nextElementSibling;
        if (!hint || !hint.classList.contains('gallery-save-hint')) {
            hint = document.createElement('div');
            hint.className = 'gallery-save-hint mt-2';
            hint.style.display = 'none';
            btn.insertAdjacentElement('afterend', hint);
        }
        return hint;
    };

    const showGalleryHint = (text, type = 'error') => {
        const hint = ensureGalleryHint();
        hint.innerHTML = `
            <div class="gallery-hint-card ${type}">
                <span class="gallery-hint-icon">!</span>
                <span class="gallery-hint-text">${text}</span>
            </div>
        `;
        hint.style.display = 'block';
    };

    const hideGalleryHint = () => {
        const hint = ensureGalleryHint();
        hint.textContent = '';
        hint.style.display = 'none';
    };

    const titleInput = serviceSection?.querySelector(`.admin-input[data-field-key="svc.gallery.${index}.title"]`);
    const captionInput = serviceSection?.querySelector(`.admin-input[data-field-key="svc.gallery.${index}.caption"]`);
    const fileInput = serviceSection?.querySelector(`input[type="file"][data-upload-for="svc.gallery.${index}.image"]`);

    const formData = new FormData();
    formData.append('galleryId', String(galleryId));

    if (titleInput) {
        const value = (titleInput.value || '').trim();
        if (value) formData.append('title', value);
    }

    if (captionInput) {
        const value = (captionInput.value || '').trim();
        if (value) formData.append('caption', value);
    }

    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        formData.append(fileInput.name || 'image', fileInput.files[0]);
    }


    if (Array.from(formData.keys()).length === 1) {
        alert('Заповніть хоча б одне поле для збереження.');
        return;
    }

    try {
        btn.disabled = true;
        hideGalleryHint();

        const endpoint = GALLERY_SAVE_ENDPOINTS[index];
        if (!endpoint) {
            alert('Не знайдено endpoint для збереження цього слайду.');
            return;
        }


        const res = await fetch(`http://localhost:3000${endpoint}`, {
            method: 'POST',
            headers: { Accept: 'application/json' },
            credentials: 'include',
            body: formData
        });


        if (!res.ok) {
            if (res.status === 400) {
                showGalleryHint(
                    'Щось не так. Перевірте, чи фотографія має правильне розширення: .jpeg, .png, .webp, .gif.'
                );
                return;
            }
            if (res.status === 413) {
                showGalleryHint(
                    'Файл занадто великий. Будь ласка, оберіть зображення меншого розміру (до 2 МБ).',
                    'warning'
                );
                return;
            }
            alert(`Помилка сервера (${res.status})`);
            return;
        }

        const json = await res.json().catch(() => ({}));
        if (json?.message && json.message !== 'ok') {
            alert('Бекенд повернув помилку');
            return;
        }

        hideGalleryHint();
        showSuccessToast('Дія виконана успішно.');

        const newTitle = formData.get('title');
        if (titleInput && typeof newTitle === 'string') {
            titleInput.dataset.originalValue = newTitle;
        }
        const newCaption = formData.get('caption');
        if (captionInput && typeof newCaption === 'string') {
            captionInput.dataset.originalValue = newCaption;
        }
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            fileInput.value = '';
        }

        updateGallerySaveButtonsState();
    } catch (err) {
        console.error('[GALLERY] save error:', err);
        alert('Помилка мережі або сервера.');
    } finally {
        btn.disabled = false;
    }
}

if (serviceSection) {
    const inputs = serviceSection.querySelectorAll('.admin-input[data-field-key^="svc."]');
    const galleryFileInputs = serviceSection.querySelectorAll('input[type="file"][data-upload-for^="svc.gallery."]');
    const gallerySaveButtons = serviceSection.querySelectorAll('button[data-gallery-save]');

    inputs.forEach(input => {
        const handler = () => {
            const key = input.dataset.fieldKey;
            const value = (input.value || '').trim();

            if (!value) {
                clearFieldError(input);
                clearValidState(input);
            } else {
                const res = validateServiceField(key, value);
                if (!res.valid) setFieldError(input, res.message);
                else {
                    clearFieldError(input);
                    flashValid(input, 2000);
                }
            }

            updateServiceSaveBtnState();
            updateGallerySaveButtonsState();
        };

        input.addEventListener('input', handler);
        input.addEventListener('change', handler);
        input.addEventListener('blur', handler);
    });

    galleryFileInputs.forEach(input => {
        input.addEventListener('change', updateGallerySaveButtonsState);
    });

    gallerySaveButtons.forEach(btn => {
        btn.addEventListener('click', () => handleSaveGallerySlide(btn));
    });

    updateServiceSaveBtnState();
    updateGallerySaveButtonsState();
}

const mainHeroFileInput = document.getElementById('home-hero-image-file');
const mainHeroSaveBtn = document.getElementById('home-hero-image-save-btn');
const aboutFileInput = document.getElementById('home-about-image-file');
const aboutSaveBtn = document.getElementById('home-about-image-save-btn');

function bindMainHeroImageSave() {
    if (!mainHeroFileInput || !mainHeroSaveBtn) return;

    const ensureHint = () => {
        let hint = mainHeroSaveBtn.nextElementSibling;
        if (!hint || !hint.classList.contains('gallery-save-hint')) {
            hint = document.createElement('div');
            hint.className = 'gallery-save-hint mt-2';
            hint.style.display = 'none';
            mainHeroSaveBtn.insertAdjacentElement('afterend', hint);
        }
        return hint;
    };

    const showHint = (text, type = 'error') => {
        const hint = ensureHint();
        hint.innerHTML = `
            <div class="gallery-hint-card ${type}">
                <span class="gallery-hint-icon">!</span>
                <span class="gallery-hint-text">${text}</span>
            </div>
        `;
        hint.style.display = 'block';
    };

    const hideHint = () => {
        const hint = ensureHint();
        hint.innerHTML = '';
        hint.style.display = 'none';
    };

    mainHeroSaveBtn.addEventListener('click', async () => {
        if (!mainHeroFileInput.files || !mainHeroFileInput.files.length) return;

        const formData = new FormData();
        formData.append(mainHeroFileInput.name || 'gallery_name', mainHeroFileInput.files[0]);

        try {
            mainHeroSaveBtn.disabled = true;
            hideHint();

            const res = await fetch(`http://localhost:3000${MAIN_HERO_IMAGE_ENDPOINT}`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                credentials: 'include',
                body: formData
            });

            if (!res.ok) {
                if (res.status === 400) {
                    showHint(
                        'Щось не так. Перевірте, чи фотографія має правильне розширення: .jpeg, .png, .webp, .gif.'
                    );
                    return;
                }
                if (res.status === 413) {
                    showHint(
                        'Файл занадто великий. Будь ласка, оберіть зображення меншого розміру (до 2 МБ).',
                        'warning'
                    );
                    return;
                }
                alert(`Помилка сервера (${res.status})`);
                return;
            }

            const json = await res.json().catch(() => ({}));
            if (json?.message && json.message !== 'ok') {
                showHint('Виникла помилка збереження. Спробуйте ще раз.');
                return;
            }

            hideHint();
            showSuccessToast('Дія виконана успішно.');
            mainHeroFileInput.value = '';
        } catch (err) {
            console.error('[MAIN HERO] save image error:', err);
            alert('Помилка мережі або сервера.');
        } finally {
            mainHeroSaveBtn.disabled = false;
        }
    });
}

bindMainHeroImageSave();

function bindAboutImageSave() {
    if (!aboutFileInput || !aboutSaveBtn) return;

    const ensureHint = () => {
        let hint = aboutSaveBtn.nextElementSibling;
        if (!hint || !hint.classList.contains('gallery-save-hint')) {
            hint = document.createElement('div');
            hint.className = 'gallery-save-hint mt-2';
            hint.style.display = 'none';
            aboutSaveBtn.insertAdjacentElement('afterend', hint);
        }
        return hint;
    };

    const showHint = (text, type = 'error') => {
        const hint = ensureHint();
        hint.innerHTML = `
            <div class="gallery-hint-card ${type}">
                <span class="gallery-hint-icon">!</span>
                <span class="gallery-hint-text">${text}</span>
            </div>
        `;
        hint.style.display = 'block';
    };

    const hideHint = () => {
        const hint = ensureHint();
        hint.innerHTML = '';
        hint.style.display = 'none';
    };

    aboutSaveBtn.addEventListener('click', async () => {
        if (!aboutFileInput.files || !aboutFileInput.files.length) return;

        const formData = new FormData();
        formData.append(aboutFileInput.name || 'gallery_about_me', aboutFileInput.files[0]);

        try {
            aboutSaveBtn.disabled = true;
            hideHint();

            const res = await fetch(`http://localhost:3000${ABOUT_IMAGE_ENDPOINT}`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                credentials: 'include',
                body: formData
            });

            if (!res.ok) {
                if (res.status === 400) {
                    showHint(
                        'Щось не так. Перевірте, чи фотографія має правильне розширення: .jpeg, .png, .webp, .gif.'
                    );
                    return;
                }
                if (res.status === 413) {
                    showHint(
                        'Файл занадто великий. Будь ласка, оберіть зображення меншого розміру (до 2 МБ).',
                        'warning'
                    );
                    return;
                }
                alert(`Помилка сервера (${res.status})`);
                return;
            }

            const json = await res.json().catch(() => ({}));
            if (json?.message && json.message !== 'ok') {
                showHint('Виникла помилка збереження. Спробуйте ще раз.');
                return;
            }

            hideHint();
            showSuccessToast('Дія виконана успішно.');
            aboutFileInput.value = '';
        } catch (err) {
            console.error('[ABOUT] save image error:', err);
            alert('Помилка мережі або сервера.');
        } finally {
            aboutSaveBtn.disabled = false;
        }
    });
}

bindAboutImageSave();
