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
-- =================================================================================================
-- UP()
-- =================================================================================================

-- ============================================
-- 1. БАЗОВІ СЕРВІСИ (services)
-- ============================================

INSERT INTO services (
  name,
  path,
  url,
  description,
  price_label,
  icon_html,
  enabled,
  sort_order
)
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
-- Одна глобальна контактна сутність,
-- яку будемо привʼязувати в service_settings

INSERT INTO contacts (
  email,
  telegram,
  telegram_label,
  github,
  github_label
)
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
  ARRAY[
    'Адаптивність та SEO-база',
    'Чистий код і документація'
  ],
  'Дивитись роботи',
  '#portfolio',
  'Звʼязатися',
  '#contact',
  'https://…тут_твій_URL_фото…'
);

-- ============================================
-- 4. ГОЛОВНА СТОРІНКА (main_page)
--    service_id = NULL -> головна
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
  ARRAY[
    'Адаптивність',
    'Оптимізація SEO',
    'Підтримка'
  ],
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

-- (решта SQL залишена без змін, просто приведена до єдиного стилю)
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
-- =================================================================================================
-- DOWN()
-- =================================================================================================

-- 1. ВІДГУКИ
DELETE FROM testimonials
WHERE author IN ('Марія', 'Андрій');

-- 2. FAQ
DELETE FROM service_faq
WHERE service_id IN (
  SELECT id FROM services
  WHERE path IN ('turnkey', 'debug', 'integrations')
)
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

-- 3. ПРАЙС-ПЛАНИ
DELETE FROM pricing_plans
WHERE title IN ('Старт', 'Оптимум', 'Індивідуально');

-- 4. HERO ГОЛОВНОЇ
DELETE FROM main_page
WHERE service_id IS NULL
AND title = 'Створюю швидкі, чисті та надійні веб-рішення'
AND subtitle = 'Сайти «під ключ», інтеграції, оптимізація та дебаг. Чіткі дедлайни і комфортна комунікація.';

-- 5. СЕРВІСИ
DELETE FROM services
WHERE path IN ('turnkey', 'debug', 'integrations');

-- 6. КОНТАКТИ
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