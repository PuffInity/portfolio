import { z } from "zod";
import dotenv from "dotenv";
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: '.env.local' });
}

/**
 * @file mailer.schema.ts
 * @summary Файл валідації SMTP конфіга від ENV
 */

export const mailEnvSchema = z.object({
    /** SMTP_HOST - Повинен бути string та мати мінімально 1 елемент */
    SMTP_HOST: z.string().min(1),

    /** SMTP_PORT - Повинен бути number тільки ціле число та позвитивне(Більше 0) */
    SMTP_PORT: z.coerce.number().int().positive(),

    /** SMTP_SECURE - Повинен бути boolean та має дефаулт true */
    SMTP_SECURE: z.coerce.boolean().default(true),

    /** SMTP_USER - Повинен бути string та мати мінімально 1 елемент */
    SMTP_USER: z.string().min(1),

    /** SMTP_PASSWORD - Повинен бути string та мати мінімально 1 елемент */
    SMTP_PASSWORD: z.string().min(1),

    /** SMTP_POOL - Повинен бути boolean та має дефаулт true */
    SMTP_POOL: z.coerce.boolean().default(true),

    /** SMTP_POOL_MAX_CONNECTIONS - Перетворюємо в number повинно буим цілим min 1 max 50 дефаулт 5 */
    SMTP_POOL_MAX_CONNECTIONS: z.coerce.number().int().min(1).max(50).default(5),

    /** SMTP_POOL_MAX_MESSAGES - Перетворюємо в number повинно буим цілим min 1 дефаулт 100 */
    SMTP_POOL_MAX_MESSAGES: z.coerce.number().int().min(1).default(100),

    /** SMTP_KEEP_ALIVE - Повинен бути boolean та має дефаулт true */
    SMTP_KEEP_ALIVE: z.coerce.boolean().default(true),

    /** SMTP_CONNECTION_TIMEOUT_MS - Перетворюємо в number min 1000 max 10000 */
    SMTP_CONNECTION_TIMEOUT_MS: z.coerce.number().min(1000).max(10000),

    /** SMTP_GREETING_TIMEOUT_MS - Перетворюємо в number min 1000 max 5000 */
    SMTP_GREETING_TIMEOUT_MS: z.coerce.number().min(1000).max(5000),

    /** SMTP_SOCKET_TIMEOUT_MS - Перетворюємо в number min 5000 max 20000 */
    SMTP_SOCKET_TIMEOUT_MS: z.coerce.number().min(5000).max(20000),

    /** SMTP_TLS_REJECT_UNAUTHORIZED - Повинен бути boolean та має дефаулт true */
    SMTP_TLS_REJECT_UNAUTHORIZED: z.coerce.boolean().default(true),

    /** RATE_LIMIT - Перетворюємо в number min 5 max 20 */
    RATE_LIMIT: z.coerce.number().min(5).max(20),

    /** MAIL_FROM - Повинен бути string та min 5 */
    MAIL_FROM: z.string().min(5),
});

/** Показуємо звідки брати дані для перевірки */
export const mailerConfig = mailEnvSchema.parse(process.env);