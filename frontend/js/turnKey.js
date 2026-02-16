/* ==========================================
 * Turnkey service page renderer
 * ========================================== */

// Footer year sync.
const yearEl = document.getElementById('year');
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

// Lightweight DOM/validation helpers used across renderer functions.
const $ = (selector, root = document) => root.querySelector(selector);
const show = (el) => el && el.classList.remove('hidden');
const isStr = (v) => typeof v === 'string' && v.trim() !== '';
const isArr = (v) => Array.isArray(v) && v.length > 0;

/**
 * Renders hero block (title/lead/image/cta).
 */
function renderHero(hero) {
    if (!hero) return;

    if (isStr(hero.badge)) {
        const badgeSpan = $('#hero-badge [data-bind="badge"]');
        if (badgeSpan) badgeSpan.textContent = hero.badge;
        show($('#hero-badge'));
    }

    if (isStr(hero.title)) {
        const titleEl = $('#hero-title');
        if (titleEl) titleEl.textContent = hero.title;
    }

    if (isStr(hero.lead)) {
        const leadEl = $('#hero-lead');
        if (leadEl) leadEl.textContent = hero.lead;
    }

    if (isStr(hero.image)) {
        const img = $('#hero-image');
        if (img) {
            img.src = hero.image;
            show($('#hero-image-wrap'));
        }
    }

    if (hero.cta1?.text) {
        const span = $('#hero-cta1 [data-bind="cta1Text"]');
        if (span) span.textContent = hero.cta1.text;
    }

    if (hero.cta2?.text) {
        const span = $('#hero-cta2 [data-bind="cta2Text"]');
        if (span) span.textContent = hero.cta2.text;
    }

    if (hero.cta1?.text || hero.cta2?.text) {
        show($('#hero-ctas'));
    }
}

/**
 * Renders service highlights row (duration/price/executor).
 */
function renderHighlights(block) {
    if (!block) return;
    let any = false;

    if (isStr(block.duration)) {
        const el = $('#hl-duration [data-bind="duration"]');
        if (el) el.textContent = block.duration;
        show($('#hl-duration'));
        any = true;
    }

    if (isStr(block.price)) {
        const el = $('#hl-price [data-bind="price"]');
        if (el) el.textContent = block.price;
        show($('#hl-price'));
        any = true;
    }

    if (isStr(block.executor)) {
        const el = $('#hl-executor [data-bind="executor"]');
        if (el) el.textContent = block.executor;
        show($('#hl-executor'));
        any = true;
    }

    if (any) {
        show($('#highlights'));
    }
}

/**
 * Renders "included in service" list.
 */
function renderIncluded(items) {
    if (!isArr(items)) return;

    const ul = $('#included-list');
    if (!ul) return;
    ul.innerHTML = '';

    items.forEach((txt) => {
        if (!isStr(txt)) return;

        const li = document.createElement('li');
        li.className =
            'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
      <span>
        <i class="bi bi-check2-circle text-success me-2"></i>${txt}
      </span>
      <span class="badge text-bg-light">включено</span>
    `;
        ul.appendChild(li);
    });

    if (ul.children.length) {
        show($('#included-wrap'));
    }
}

/**
 * Renders additional options list.
 */
function renderAdditional(items) {
    if (!isArr(items)) return;

    const ul = $('#additional-list');
    if (!ul) return;
    ul.innerHTML = '';

    items.forEach((txt) => {
        if (!isStr(txt)) return;
        const li = document.createElement('li');
        li.textContent = txt;
        ul.appendChild(li);
    });

    if (ul.children.length) {
        show($('#additional-wrap'));
    }
}

/**
 * Renders discount hint text.
 */
function renderDiscount(txt) {
    if (!isStr(txt)) return;

    const el = $('#discount-text');
    if (!el) return;

    el.textContent = txt;
    show($('#discount-wrap'));
}

/**
 * Renders pricing CTA section.
 */
function renderPricingCTA(pr) {
    if (!pr || (!isStr(pr.title) && !isStr(pr.subtitle))) return;

    const titleEl = $('#pricing-title');
    const subEl = $('#pricing-subtitle');

    if (isStr(pr.title) && titleEl) {
        titleEl.textContent = pr.title;
    }
    if (isStr(pr.subtitle) && subEl) {
        subEl.textContent = pr.subtitle;
    }

    show($('#pricing-cta'));
}

/**
 * Generic carousel renderer for gallery slides.
 */
function renderCarousel(inner, indicators, slides) {
    if (!inner || !indicators) return;

    inner.innerHTML = '';
    indicators.innerHTML = '';

    slides.forEach((slide, index) => {
        if (!isStr(slide.image)) return;

        const item = document.createElement('div');
        item.className = 'carousel-item' + (index === 0 ? ' active' : '');
        item.innerHTML = `
      <img
        src="${slide.image}"
        class="d-block w-100 portfolio-img"
        alt="${slide.title || 'Slide ' + (index + 1)}"
      >
      ${
            slide.title || slide.caption
                ? `
        <div class="carousel-caption d-none d-md-block">
          ${slide.title ? `<h5>${slide.title}</h5>` : ''}
          ${slide.caption ? `<p>${slide.caption}</p>` : ''}
        </div>
      `
                : ''
        }
    `;
        inner.appendChild(item);

        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('data-bs-target', '#carouselWorks');
        dot.setAttribute('data-bs-slide-to', String(index));
        dot.setAttribute('aria-label', String(index + 1));
        if (index === 0) dot.className = 'active';
        indicators.appendChild(dot);
    });
}

/**
 * Renders gallery section and delegates slide rendering to carousel builder.
 */
function renderGallery(gal) {
    if (!isArr(gal?.slides)) return;

    const inner = $('#carousel-inner');
    const ind = $('#carousel-indicators');
    if (!inner || !ind) return;

    renderCarousel(inner, ind, gal.slides);

    if (isStr(gal.lead)) {
        const leadEl = $('#gallery-lead');
        if (leadEl) leadEl.textContent = gal.lead;
    }

    show($('#gallery'));
}

/**
 * Renders contacts list block.
 */
function renderContacts(c) {
    if (!c || typeof c !== 'object') return;

    const list = $('#contacts-list');
    if (!list) return;
    list.innerHTML = '';

    let added = false;

    if (isStr(c.email)) {
        list.insertAdjacentHTML(
            'beforeend',
            `
      <li class="mb-1">
        <i class="bi bi-envelope me-2"></i>
        <strong>E-mail:</strong>
        <a href="mailto:${c.email}">${c.email}</a>
      </li>
    `
        );
        added = true;
    }

    if (isStr(c.telegram)) {
        list.insertAdjacentHTML(
            'beforeend',
            `
      <li class="mb-1">
        <i class="bi bi-telegram me-2"></i>
        <strong>Telegram:</strong>
        <a href="${c.telegram}" target="_blank" rel="noopener">
          ${c.telegram}
        </a>
      </li>
    `
        );
        added = true;
    }

    if (isStr(c.github)) {
        list.insertAdjacentHTML(
            'beforeend',
            `
      <li>
        <i class="bi bi-github me-2"></i>
        <strong>GitHub:</strong>
        <a href="${c.github}" target="_blank" rel="noopener">
          ${c.github}
        </a>
      </li>
    `
        );
        added = true;
    }

    if (added) {
        show($('#contact-block'));
    }
}

/**
 * Renders terms/quick-start block.
 */
function renderTerms(t) {
    const list = $('#terms-list');
    if (!list) return;

    list.innerHTML = '';

    if (isArr(t?.items)) {
        t.items.forEach((txt) => {
            if (!isStr(txt)) return;
            const li = document.createElement('li');
            li.textContent = txt;
            list.appendChild(li);
        });
    }

    if (isStr(t?.quickStart)) {
        const qs = $('#quickstart-text');
        if (qs) {
            qs.textContent = t.quickStart;
            show($('#quickstart'));
        }
    }

    if (list.children.length || isStr(t?.quickStart)) {
        show($('#terms-block'));
    }
}

/**
 * Renders FAQ accordion.
 */
function renderFAQ(f) {
    if (!isArr(f?.items)) return;

    const acc = $('#faq-accordion');
    if (!acc) return;
    acc.innerHTML = '';

    f.items.forEach((qa, index) => {
        if (!isStr(qa?.q) || !isStr(qa?.a)) return;

        const id = 'faq_' + index;

        acc.insertAdjacentHTML(
            'beforeend',
            `
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button ${index === 0 ? '' : 'collapsed'}"
            data-bs-toggle="collapse"
            data-bs-target="#${id}"
          >
            ${qa.q}
          </button>
        </h2>
        <div
          id="${id}"
          class="accordion-collapse collapse ${index === 0 ? 'show' : ''}"
          data-bs-parent="#faq-accordion"
        >
          <div class="accordion-body">
            ${qa.a}
          </div>
        </div>
      </div>
    `
        );
    });

    if (acc.children.length) {
        show($('#faq-section'));
    }
}

/**
 * Shows wrapper that contains contact + terms columns when at least one exists.
 */
function renderContactTermsWrapper(hasContacts, hasTerms) {
    if (hasContacts || hasTerms) {
        show($('#contact-terms'));
    }
}

/**
 * Main page renderer for the turnkey service page.
 */
function renderPage(data) {
    renderHero(data.hero);
    renderHighlights(data.highlights);
    renderIncluded(data.included);
    renderAdditional(data.additional);
    renderDiscount(data.discount);
    renderPricingCTA(data.pricingCta);
    renderGallery(data.gallery);
    renderContacts(data.contacts);
    renderTerms(data.terms);
    renderFAQ(data.faq);
    renderContactTermsWrapper(!!data.contacts, !!data.terms);
}

/**
 * Maps backend response into normalized frontend view model.
 * This keeps UI rendering stable even if backend fields differ from UI names.
 */
function mapServicePageFromApi(apiData) {
    const heroSrc = apiData.hero || {};
    const optionsSrc = apiData.options || {};
    const gallerySrc = Array.isArray(apiData.gallery) ? apiData.gallery : [];
    const contactSrc = apiData.contact || null;
    const faqSrc = Array.isArray(apiData.faq) ? apiData.faq : [];

    const hero = {
        badge: 'Послуга',
        title: heroSrc.title || '',
        lead: heroSrc.lead || '',
        image: heroSrc.image || '',
        cta1:
            heroSrc.textBtn1 || heroSrc.hrefBtn1
                ? {
                    text: heroSrc.textBtn1 || '',
                    href: heroSrc.hrefBtn1 || '#process'
                }
                : null,
        cta2:
            heroSrc.textBtn2 || heroSrc.hrefBtn2
                ? {
                    text: heroSrc.textBtn2 || '',
                    href: heroSrc.hrefBtn2 || '#gallery'
                }
                : null
    };

    const highlights = {
        duration: heroSrc.duration || '',
        // Uses hero-level price first, then falls back to options-level price.
        price: heroSrc.priceHero || optionsSrc.price || '',
        executor: heroSrc.executor || ''
    };

    const included = Array.isArray(optionsSrc.include) ? optionsSrc.include : [];
    const additional = Array.isArray(optionsSrc.additional) ? optionsSrc.additional : [];
    const discount = optionsSrc.discount || '';

    const pricingCta =
        optionsSrc.price_title ||
        optionsSrc.price_subtitle ||
        optionsSrc.price
            ? {
                title:
                    optionsSrc.price_title ||
                    (optionsSrc.price ? `Пакет — ${optionsSrc.price}` : ''),
                subtitle: optionsSrc.price_subtitle || ''
            }
            : null;

    const gallery = {
        slides: gallerySrc.map((g) => ({
            image: g.image || '',
            title: g.title || '',
            caption: g.caption || ''
        }))
    };

    const contacts = contactSrc
        ? {
            email: contactSrc.email || '',
            telegram: contactSrc.telegram || '',
            github: contactSrc.github || ''
        }
        : null;

    const terms = {
        items: Array.isArray(optionsSrc.terms) ? optionsSrc.terms : [],
        quickStart: optionsSrc.quickStart || ''
    };

    const faq = {
        items: faqSrc
            .filter((f) => f && f.enabled !== false)
            .map((f) => ({
                q: f.question || '',
                a: f.answer || ''
            }))
    };

    return {
        hero,
        highlights,
        included,
        additional,
        discount,
        pricingCta,
        gallery,
        contacts,
        terms,
        faq
    };
}

// Endpoint for turnkey service content.
const TURNKEY_SERVICE_PATH = '/main/turnkey';

/**
 * Loads turnkey service data and renders the page.
 */
async function loadServicePage() {
    const apiData = await safeFetchJson(TURNKEY_SERVICE_PATH, {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });

    if (!apiData) return;
    const mapped = mapServicePageFromApi(apiData);
    renderPage(mapped);
}

document.addEventListener('DOMContentLoaded', loadServicePage);

