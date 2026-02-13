/* ==========================================
 * Public 404/error page renderer
 * ========================================== */

// Footer year sync.
const yearEl = document.getElementById('year');
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

/**
 * Replaces broken/invalid images with user-friendly fallback text.
 * Current policy: images are considered valid only when src contains "uploads/upload".
 */
function applyImageFallbacks() {
    const bindImg = (img) => {
        if (!img || img.dataset.fallbackBound) return;
        img.dataset.fallbackBound = '1';

        // Replace image node in-place to keep existing layout dimensions.
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

document.addEventListener('DOMContentLoaded', applyImageFallbacks);

// Minimal DOM helper for id-based lookups.
const $ = (id) => document.getElementById(id);

/* =======================
 * URL params and defaults
 * ======================= */
const params = new URLSearchParams(window.location.search);

const status = Number(params.get('status') || '404');
const code   = params.get('code') || 'NOT_FOUND';
const path   = params.get('path') || window.location.pathname;

/* ======================
 * Human-readable presets
 * ====================== */
const PRESETS = {
    404: {
        title: 'Сторінку не знайдено',
        description: 'Можливо, адресу введено неправильно, сторінка була перенесена або ще в розробці.',
        suggestion: 'Поверніться на головну або скористайтесь меню для навігації.'
    },
    400: {
        title: 'Некоректний запит',
        description: 'Сервер отримав некоректні параметри або дані запиту.',
        suggestion: 'Оновіть сторінку або поверніться на головну і спробуйте ще раз.'
    },
    401: {
        title: 'Потрібна авторизація',
        description: 'Для доступу до цієї сторінки необхідно увійти в систему.',
        suggestion: 'Увійдіть в акаунт і повторіть спробу.'
    },
    403: {
        title: 'Доступ заборонено',
        description: 'У вас немає прав для перегляду цієї сторінки.',
        suggestion: 'Якщо вважаєте, що це помилка — напишіть мені.'
    },
    500: {
        title: 'Внутрішня помилка сервера',
        description: 'Щось пішло не так на стороні сервера. Я вже працюю над виправленням.',
        suggestion: 'Спробуйте зайти трохи пізніше або поверніться на головну.'
    },
    503: {
        title: 'Сервіс тимчасово недоступний',
        description: 'Йде технічне обслуговування або сервер тимчасово перевантажений.',
        suggestion: 'Спробуйте оновити сторінку пізніше.'
    }
};

/**
 * Chooses best preset by exact status first, then by status group.
 */
let preset = PRESETS[status];
if (!preset) {
    if (status >= 500) {
        preset = PRESETS[500];
    } else if (status >= 400) {
        preset = PRESETS[400];
    } else {
        preset = PRESETS[404];
    }
}

/**
 * Builds severity class for style variants.
 */
let severityClass = 'error-generic';
if (status === 404) {
    severityClass = 'error-404';
} else if (status >= 500) {
    severityClass = 'error-5xx';
} else if (status >= 400) {
    severityClass = 'error-4xx';
}

// Global error-page class for page-level styling.
document.body.classList.add('error-page');

// Enhance central error card styling/animation.
const cardEl = document.querySelector('.glass');
if (cardEl) {
    cardEl.classList.add('error-card', severityClass, 'error-animate');
}

// Render computed status and textual content into DOM.
const codeEl = $('error-code');
if (codeEl) {
    codeEl.textContent = String(status || 404);
    codeEl.classList.add('error-code-big', severityClass);
}

const titleEl = $('error-title');
if (titleEl) {
    titleEl.textContent = preset.title;
}

const mainEl = $('error-main');
if (mainEl) {
    mainEl.textContent = preset.description;
}

const suggestionEl = $('error-suggestion');
if (suggestionEl) {
    suggestionEl.textContent = preset.suggestion;
}

const extraEl = $('error-extra');
if (extraEl) {
    extraEl.textContent =
        `Технічні деталі: status=${status}, code="${code}", path="${path}"`;
}
