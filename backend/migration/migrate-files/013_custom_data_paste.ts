import { PoolClient } from 'pg';
import { BaseMigration, migrationLogger } from '../base.migration.js';

/**
 * @file 013_custom_data_paste.ts
 * @summary Початковий контент для портфоліо / сервісів / FAQ / відгуків.
 */
export class Migration011CustomData extends BaseMigration {
    async up(client: PoolClient): Promise<void> {
        try {
            await this.executeQuery(
                client,
                `
-- ============================================
-- 1. БАЗОВІ СЕРВІСИ (services)
-- ============================================

INSERT INTO services (name, path, url, description, price_label, icon_html, enabled, sort_order)
VALUES
(
    'Сайт «під ключ»',
    'turnkey',
    'url сторінки',
    'Сучасний адаптивний сайт: дизайн, верстка, базовий SEO, підключення домену/хостингу.',
    '$1000',
    '<i class="bi bi-window-stack"></i>',
    TRUE,
    1
),
(
    'Дебаг та оптимізація',
    'debug',
    'url сторінки',
    'Виявлення і виправлення помилок, прискорення завантаження, покращення стабільності.',
    '$300+',
    '<i class="bi bi-bug"></i>',
    TRUE,
    2
),
(
    'Інтеграції',
    'integrations',
    'url сторінки',
    'Stripe/PayPal, пошта, аналітика, карти, чати, сторонні API — під ключ.',
    'Індивідуально',
    '<i class="bi bi-plug"></i>',
    TRUE,
    3
);

-- ============================================
-- 2. КОНТАКТИ (contacts)
-- ============================================
-- одна глобальна контактна сутність, яку будемо привʼязувати в service_settings

INSERT INTO contacts (email, telegram, telegram_label, github, github_label)
VALUES (
    'pfnity@gmail.com',
    'https://t.me/your_handle',
    '@your_handle',
    'https://github.com/PuffInity',
    'github.com/PuffInity'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 3. БЛОК "ПРО МЕНЕ" (about_me)
-- ============================================

INSERT INTO about_me (
    title,
    description,
    focus_label,
    focus_value,
    stack_label,
    stack_value,
    features,
    btn_text1,
    btn_href1,
    btn_text2,
    btn_href2,
    image
)
VALUES (
    'Про мене',
    'Працюю над практичними веб-рішеннями з фокусом на продуктивність і прозору комунікацію. Короткий бриф → план → дедлайни → регулярний звіт.',
    'Фокус',
    'Якість, швидкість, підтримка',
    'Стек',
    'HTML • CSS • JS • інтеграції',
    ARRAY['Адаптивність та SEO-база', 'Чистий код і документація'],
    'Дивитись роботи',
    '#portfolio',
    'Звʼязатися',
    '#contact',
    'https://…тут_твій_URL_фото…'
);

-- ============================================
-- 4. ГОЛОВНА СТОРІНКА (main_page) — hero + leads
-- service_id = NULL -> головна
-- ============================================

INSERT INTO main_page (
    service_id,
    title,
    subtitle,
    bullets,
    image,
    btn_text1,
    btn_href1,
    btn_text2,
    btn_href2,
    services_lead,
    pricing_lead
)
VALUES (
    NULL,
    'Створюю швидкі, чисті та надійні веб-рішення',
    'Сайти «під ключ», інтеграції, оптимізація та дебаг. Чіткі дедлайни і комфортна комунікація.',
    ARRAY['Адаптивність', 'Оптимізація SEO', 'Підтримка'],
    'https://www.factroom.ru/wp-content/uploads/2017/08/Depositphotos_32909195_l-2015.jpg',
    'Дізнатися більше',
    '#services',
    'Приклади робіт',
    '#portfolio',
    'Гнучкі пакети під ваші задачі. Чіткі умови й прозора вартість.',
    'Фіксовані пакети та індивідуальні рішення.'
);

-- ============================================
-- 5. HERO ДЛЯ КОЖНОГО СЕРВІСУ (services_hero)
--   1 = turnkey, 2 = debug, 3 = integrations
-- ============================================

INSERT INTO services_hero (
    service_id,
    title,
    lead,
    image,
    btn_href1,
    btn_text1,
    btn_href2,
    btn_text2,
    duration,
    executor,
    price_hero
)
VALUES
-- Сайт «під ключ»
(
    1,
    'Сайт «під ключ» — повний цикл розробки',
    'Від брифу до запуску з підтримкою. Чисто, швидко, передбачувано.',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600&auto=format&fit=crop',
    '#process',
    'Етапи робіт',
    '#gallery',
    'Приклади',
    '1–3 тижні (прототип → дизайн → верстка → запуск).',
    'Виконую особисто. За потреби — дизайнер/ілюстратор.',
    'Базовий пакет від $1000. Додаткові модулі — після брифу.'
),

-- Дебаг та оптимізація
(
    2,
    'Дебаг та оптимізація — стабільність і швидкість',
    'Виявляю причини, виправляю баги, прискорюю завантаження і стабілізую роботу.',
    'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=1600&auto=format&fit=crop',
    '#process',
    'Етапи робіт',
    '#gallery',
    'Покращення',
    'Зазвичай 1–5 днів для аудиту та критичних фіксів.',
    'Працюю особисто; за потреби — профільні спеціалісти.',
    '$300+ залежно від складності та пріоритету.'
),

-- Інтеграції
(
    3,
    'Інтеграції — з’єдную все в єдину систему',
    'Stripe, PayPal, e-mail, карти, аналітика, чати, CRM та інші API — безпечно, надійно, з документацією.',
    'https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?q=80&w=1600&auto=format&fit=crop',
    '#process',
    'Етапи робіт',
    '#gallery',
    'Приклади',
    '1–7 днів залежно від API, доступів та сценаріїв.',
    'Виконую особисто. Тести, логи, коротка документація.',
    'Від $400 для простих інтеграцій; складні CRM/API — індивідуально.'
);

-- ============================================
-- 6. НАЛАШТУВАННЯ СЕРВІСІВ (service_settings)
--    include / additional / discount / terms / quickstart
-- ============================================

INSERT INTO service_settings (
    service_id,
    contact_id,
    discount,
    include,
    additional,
    price_title,
    price_subtitle,
    price,
    terms,
    quickstart
)
VALUES
-- Сайт «під ключ» (service_id = 1)
(
    1,
    (SELECT id FROM contacts WHERE email = 'pfnity@gmail.com' LIMIT 1),
    '—10% для повторних клієнтів або при 100% оплаті; спецпропозиція при замовленні 2+ сторінок.',
    ARRAY[
        'Адаптивна верстка',
        'SEO-база (title/description, h1-h3, alt)',
        'Аналітика (події/цілі — за брифом)',
        '1 місяць підтримки після релізу',
        'fwefewfew'
    ],
    ARRAY[
        'Блог/новини, мультимова',
        'Інтеграції (оплати, карти, e-mail)',
        'Оптимізація PageSpeed/Core Web Vitals'
    ],
    'Базовий пакет — від $1000',
    'Фіксуємо цілі, прототип, дизайн, верстка, запуск. Прозорі дедлайни й правки.',
    'Базовий пакет від $1000. Додаткові модулі — після брифу.',
    ARRAY[
        'Після брифу — фіксуємо ТЗ та дедлайни.',
        'Оплата: 50/50 або 100% (−10% при повній оплаті).',
        '3 раунди правок на ключових етапах входять.'
    ],
    'Надішліть 2–3 референси й стислий опис бізнесу — запропоную структуру.'
),

-- Дебаг та оптимізація (service_id = 2)
(
    2,
    (SELECT id FROM contacts WHERE email = 'pfnity@gmail.com' LIMIT 1),
    '—10% для повторних клієнтів або при оплаті одним платежем. Пакетні знижки при поєднанні послуг.',
    ARRAY[
        'Пошук і виправлення багів',
        'Оптимізація продуктивності (Core Web Vitals)',
        'Рефакторинг критичних ділянок',
        'Звіт із рекомендаціями'
    ],
    ARRAY[
        'Налаштування логування/моніторингу',
        'Аналітика подій та помилок',
        'Стандарти коду та гайдлайни'
    ],
    'Пакет «Дебаг/Оптимізація» — від $300',
    'Аудит, пріоритезація, фікси, звіт і рекомендації. Швидко закриваю критичні проблеми.',
    '$300+ залежно від складності та пріоритету.',
    ARRAY[
        'Після короткого аудиту фіксуємо план і пріоритети.',
        'Оплата: погодинно або фікс під задачі (від $300).',
        'Критичні баги — у першу чергу.'
    ],
    'Надішліть лінк на проект, опис проблеми, скрін/відео та бажаний дедлайн.'
),

-- Інтеграції (service_id = 3)
(
    3,
    (SELECT id FROM contacts WHERE email = 'pfnity@gmail.com' LIMIT 1),
    '—10% при одночасному підключенні 2+ сервісів або 100% оплаті.',
    ARRAY[
        'Аналіз сценаріїв та вибір API/версій',
        'Підключення ключів, вебхуків, обробників',
        'Тестові кейси успіху/збоїв/таймаутів',
        'Базове логування/повідомлення про помилки',
        'Коротка документація для підтримки'
    ],
    ARRAY[
        'Поглиблене моніторинг/алертинг',
        'Резервні стратегії та черги',
        'Супровід оновлень API/версій',
        'GDPR/безпекові рекомендації'
    ],
    'Інтеграції — від $400',
    'Платежі, e-mail, карти, чати, аналітика, CRM. Чіткі терміни, прозора документація.',
    'Від $400 для простих інтеграцій; складні CRM/API — індивідуально.',
    ARRAY[
        'Бриф → доступи → пісочниця/тести → підключення.',
        'Оплата: фікс/погодинно (від $400).',
        'Передача короткої документації.'
    ],
    'Надішліть сервіс (Stripe/Maps/GA…), опис сценарію та дедлайн — підготую план.'
);

-- ============================================
-- 7. ГАЛЕРЕЇ (service_gallery) — приклади робіт
-- ============================================

INSERT INTO service_gallery (service_id, image, title, caption)
VALUES
-- Дебаг (service_id = 2)
(
    2,
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop',
    'Аудит продуктивності',
    'Зниження TTFB/LCP, оптимізація ресурсів.'
),
(
    2,
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1600&auto=format&fit=crop',
    'Виправлення багів',
    'Стабільність і чисті логи.'
),
(
    2,
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600&auto=format&fit=crop',
    'Оптимізація бандла',
    'Менші JS/CSS, швидший рендер.'
),

-- Інтеграції (service_id = 3)
(
    3,
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1600&auto=format&fit=crop',
    'Stripe інтеграція',
    'Платежі, підтвердження, безпечні токени.'
),
(
    3,
    'https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?q=80&w=1600&auto=format&fit=crop',
    'SendGrid API',
    'Шаблони листів, статистика, webhooks.'
),
(
    3,
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600&auto=format&fit=crop',
    'Telegram Bot',
    'Сповіщення замовлень у реальному часі.'
),

-- Сайт «під ключ» (service_id = 1)
(
    1,
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop',
    'Лендінг',
    ''
),
(
    1,
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1600&auto=format&fit=crop',
    'Особистий кабінет',
    ''
),
(
    1,
    'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?q=80&w=1600&auto=format&fit=crop',
    'Блог + SEO',
    ''
),
(
    1,
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600&auto=format&fit=crop',
    'Корпоративний сайт',
    ''
);

-- ============================================
-- 8. ГЛОБАЛЬНІ ПРАЙС-ПЛАНИ (pricing_plans)
--    з головної сторінки
-- ============================================

INSERT INTO pricing_plans (
    enabled,
    title,
    price_label,
    features,
    btn_text,
    btn_href,
    badge,
    badge_class,
    popular,
    sort_order
)
VALUES
(
    TRUE,
    'Старт',
    '$1000',
    ARRAY['Дизайн + верстка', 'Базовий SEO', '1 місяць підтримки'],
    'Замовити',
    '#contact',
    'лендинг',
    'text-bg-light',
    FALSE,
    1
),
(
    TRUE,
    'Оптимум',
    '$1500',
    ARRAY['Кілька сторінок', 'Аналітика і події', 'Оптимізація швидкості'],
    'Замовити',
    '#contact',
    'популярний',
    'text-bg-primary',
    TRUE,
    2
),
(
    TRUE,
    'Індивідуально',
    'Розрахунок після уточнення',
    ARRAY['Складні інтеграції', 'Особливі вимоги', 'Гнучкі умови'],
    'Обговорити',
    '#contact',
    'за брифом',
    'text-bg-light',
    FALSE,
    3
);

-- ============================================
-- 9. ВІДГУКИ (testimonials) — глобальні
-- ============================================

INSERT INTO testimonials (service_id, enabled, text, author, role, avatar, sort_order)
VALUES
(
    NULL,
    TRUE,
    'Отримали швидкий і акуратний сайт. Швидкість завантаження ідеальна, підтримка — на рівні.',
    'Марія',
    'Власниця магазину',
    'https://i.pravatar.cc/80?img=12',
    1
),
(
    NULL,
    TRUE,
    'Складний баг, який не могли знайти тиждень, виправлено за день і все задокументовано.',
    'Андрій',
    'CTO стартапу',
    'https://i.pravatar.cc/80?img=5',
    2
);

-- ============================================
-- 10. FAQ ПО СЕРВІСАХ (service_faq)
-- ============================================

INSERT INTO service_faq (service_id, enabled, question, answer)
VALUES
-- Turnkey (service_id = 1)
(
    1,
    TRUE,
    'Чи допоможете з доменом і хостингом?',
    'Так. Пораджу провайдера, підключу домен, SSL і базові бекапи.'
),
(
    1,
    TRUE,
    'Чи входить наповнення контентом?',
    'Базові тексти/зображення — так; повний копірайтинг — окремо.'
),
(
    1,
    TRUE,
    'Що з підтримкою після релізу?',
    '1 місяць включено. Далі — пакетна/погодинна підтримка.'
),

-- Debug (service_id = 2)
(
    2,
    TRUE,
    'Чи можна почати без доступу до продакшену?',
    'Так. Починаю з репродукції на стенді/клона, далі мінімальні доступи.'
),
(
    2,
    TRUE,
    'Що, якщо проблема у сторонньому сервісі?',
    'Підготую технічний запит, опишу ризики та варіанти обходу.'
),
(
    2,
    TRUE,
    'Чи буде звіт?',
    'Так. Причина, зміни, до/після, список рекомендацій.'
),

-- Integrations (service_id = 3)
(
    3,
    TRUE,
    'Чи потрібен продакшен-доступ?',
    'Починаю зі стейджингу/пісочниці. Продакшен — мінімально необхідний, на фінальному етапі.'
),
(
    3,
    TRUE,
    'Що, якщо API зміниться?',
    'Опишу точки конфігурації/версії. Можу супроводжувати оновлення за домовленістю.'
),
(
    3,
    TRUE,
    'Чи робите моніторинг?',
    'Так, базове логування/сповіщення є в пакеті; розширений моніторинг — додатково.'
);

INSERT INTO avatar_testimonials (name, url)
VALUES
('Спокійний джо', 'https://api.dicebear.com/6.x/avataaars/svg?seed=User12'),
('Задоволений джим', 'https://api.dicebear.com/6.x/avataaars/svg?seed=User43444'),
('Щаслива Енджі', 'https://api.dicebear.com/6.x/avataaars/svg?seed=User4357'),
('Нейтральна ріта', 'https://api.dicebear.com/6.x/avataaars/svg?seed=User96'),
('Сумна кейтрін', 'https://api.dicebear.com/6.x/avataaars/svg?seed=User40'),
('Розлючена Маррі', 'https://api.dicebear.com/6.x/avataaars/svg?seed=User20');
`
            );

            migrationLogger.info('Кастомні дані встановлені');
        } finally {
        }
    }

    async down(client: PoolClient): Promise<void> {
        try {
            await this.executeQuery(
                client,
                `
-- 1. ВІДГУКИ, які додали в up()
DELETE FROM testimonials
WHERE author IN ('Марія', 'Андрій');

-- 2. FAQ, додані в up() (по service_id та тексту питання)
DELETE FROM service_faq
WHERE service_id IN (SELECT id FROM services WHERE path IN ('turnkey','debug','integrations'))
  AND question IN (
    'Чи допоможете з доменом і хостингом?',
    'Чи входить наповнення контентом?',
    'Що з підтримкою після релізу?',
    'Чи можна почати без доступу до продакшену?',
    'Що, якщо проблема у сторонньому сервісі?',
    'Чи буде звіт?',
    'Чи потрібен продакшен-доступ?',
    'Що, якщо API зміниться?',
    'Чи робите моніторинг?'
  );

-- 3. ГЛОБАЛЬНІ ПРАЙС-ПЛАНИ (pricing_plans) з головної
DELETE FROM pricing_plans
WHERE title IN ('Старт', 'Оптимум', 'Індивідуально');

-- 4. ГОЛОВНИЙ HERO (main_page) з up()
DELETE FROM main_page
WHERE service_id IS NULL
  AND title = 'Створюю швидкі, чисті та надійні веб-рішення'
  AND subtitle = 'Сайти «під ключ», інтеграції, оптимізація та дебаг. Чіткі дедлайни і комфортна комунікація.';

-- 5. СЕРВІСИ
--    Видаляємо їх останніми, щоб спрацював ON DELETE CASCADE
--    для service_settings, services_hero, service_gallery, service_faq
DELETE FROM services
WHERE path IN ('turnkey','debug','integrations');

-- 6. КОНТАКТИ, створені в up()
DELETE FROM contacts
WHERE email = 'pfnity@gmail.com'
  AND telegram = 'https://t.me/your_handle'
  AND github = 'https://github.com/PuffInity';
`
            );

            migrationLogger.info('Кастомні дані видалені');
        } finally {
        }
    }
}
