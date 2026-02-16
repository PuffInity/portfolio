/* ==========================================
 * Shared HTTP + page-level UI helper module
 * ========================================== */
const API_BASE = 'http://localhost:3000';
const REDIRECT_404_PATH = '/pages/404.html';

/**
 * Adds reveal animation classes/variables to common blocks on all pages.
 * Animation is disabled when user prefers reduced motion.
 */
function initScrollRevealAllPages() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elements = [];

    // Binds reveal setup once per element to avoid duplicate observer work.
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
    addElements(document.querySelectorAll('section .row.g-4 > [class*="col"]'), { stagger: true, scatter: true });
    addElements(document.querySelectorAll('.card-glass, .pricing-card, .portfolio-item, .testimonial-card'), {
        stagger: true,
        scatter: true
    });
    addElements(document.querySelectorAll('.accordion .accordion-item, .list-group .list-group-item'), {
        stagger: true,
        step: 60
    });
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

document.addEventListener('DOMContentLoaded', initScrollRevealAllPages);

/**
 * Controls visibility of ".back-to-top" buttons.
 * Button appears when user passes 50% of total scrollable height.
 */
function initBackToTopVisibility() {
    const btns = document.querySelectorAll('.back-to-top');
    if (!btns.length) return;

    const update = () => {
        const doc = document.documentElement;
        const scrollTop = window.pageYOffset || doc.scrollTop || 0;
        const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 0);
        const halfway = maxScroll * 0.5;
        const show = scrollTop >= halfway;
        btns.forEach(btn => btn.classList.toggle('is-visible', show));
    };

    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
            update();
            ticking = false;
        });
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
}

document.addEventListener('DOMContentLoaded', initBackToTopVisibility);

/**
 * Tries to parse backend error payload if response is JSON.
 * Returns null when body is not JSON or cannot be parsed.
 */
async function parseErrorPayload(res) {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;
    try {
        return await res.json();
    } catch {
        return null;
    }
}

/**
 * Safe JSON fetch wrapper:
 * - prepends API base URL
 * - handles network and non-2xx errors
 * - redirects to custom 404 page on HTTP 404
 * - validates JSON content-type for successful responses
 */
async function safeFetchJson(path, options = {}) {
    const url = API_BASE + path;

    try {
        const res = await fetch(url, options);

        if (!res.ok) {
            const status = res.status;
            const errorPayload = await parseErrorPayload(res);

            if (status === 404) {
                console.warn('404 from API', { url, status, errorPayload });

                const params = new URLSearchParams({
                    status: String(status),
                    path: path,
                    code: errorPayload?.error?.code ?? 'NOT_FOUND'
                });

                window.location.href = `${REDIRECT_404_PATH}?${params.toString()}`;
                return null;
            }

            console.error('API error', { url, status, errorPayload });
            alert(`Помилка сервера (${status}). Спробуйте пізніше.`);
            return null;
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            console.error('Expected JSON but got', contentType);
            alert('Некоректні дані з сервера. Спробуйте пізніше.');
            return null;
        }

        return await res.json();
    } catch (err) {
        console.error('Network error while fetching', url, err);
        alert('Проблема з підключенням до сервера. Перевірте інтернет або спробуйте пізніше.');
        return null;
    }
}
