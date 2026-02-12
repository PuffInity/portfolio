import {z} from 'zod'
import dotenv from "dotenv";
if (!process.env.DOCKER) {
    dotenv.config({ path: ".env.local" });
}
/**
 * @file redis.schema.ts
 * @summary Фай валідаціїї конфіга redis від ENV
 */

export const redisEnvSchema = z.object({
    /** REDIS_SESSION_HOST - Повинно бути string та мати мінімально 1 елемент */
    REDIS_SESSION_HOST: z.string().min(1),
    /** REDIS_CACHE_HOST - Повинно бути string та маим мінімально 1 елемент */
    REDIS_CACHE_HOST: z.string().min(1),
    /** REDIS_PASSWORD - Повинно бути string та наявність опціонально */
    REDIS_PASSWORD: z.string().optional(),

    /** REDIS_SESSION_PORT - Перетворюємо в число мінімально 1024 максимально 65535 число повинно бути тільки ціле та більше 0 */
    REDIS_SESSION_PORT: z.coerce.number().min(1024).max(65535).int().positive(),
    /** REDIS_SESSION_DB - Перетворюємо в число воно повинно бути тільки ціле мінімально 0 максимально 15 */
    REDIS_SESSION_DB: z.coerce.number().int().min(0).max(15),
    /** REDIS_SESSION_TTL - Перетворюємо в число воно повинно бути тільки ціле мінімально 28000 максимально 259200 повинно бути більше 0 */
    REDIS_SESSION_TTL: z.coerce.number().int().min(28000).max(259200).positive(),
    /** REDIS_SESSION_TOUCH - Перетворюємо в число воно повинно бути тільки ціле мінімально 900 максимально 3600 повинно бути більше 0 */
    REDIS_SESSION_TOUCH: z.coerce.number().int().min(900).max(3600).positive(),

    /** REDIS_CACHE_PORT - Перетворюємо в число мінімально 1025 максимально 65535 тільки ціле число та більше 0 */
    REDIS_CACHE_PORT: z.coerce.number().min(1024).max(65535).int().positive(),
    /** REDIS_CACHE_DB - Перетворюємо в число мінімально 0 максимально 15 */
    REDIS_CACHE_DB: z.coerce.number().min(0).max(15),
    /** REDIS_CACHE_TTL - Перетворюємо в число мінімально 300 максимально 86400 та більше 0 */
    REDIS_CACHE_TTL: z.coerce.number().int().min(300).max(86400).positive(),
    /** REDIS_CACHE_MAX_SIZE - Перетворюємо в число мінімально 524229 максимально 10485760 */
    REDIS_CACHE_MAX_SIZE: z.coerce.number().min(524228).max(10485760),
    /** REDIS_CACHE_COMPRESS - Перетворюємо в boolean */
    REDIS_CACHE_COMPRESS: z.coerce.boolean()
})

/** Показуємо звідки брати дані для перевірки */
export const redisConfig = redisEnvSchema.parse(process.env)