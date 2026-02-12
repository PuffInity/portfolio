import {z} from 'zod'
import dotenv from "dotenv";
if (!process.env.DOCKER) {
    dotenv.config({ path: ".env.local" });
}
/**
 * @file database.schema.ts
 * @summary Файл валідації конфіга від ENV
 */

export const pgEnvSchema = z.object({
    /** PG_HOST - Повинен бути string та мати мінімально 1 елемент */
    PG_HOST: z.string().min(1),
    /** PG_PORT - Повинен бути number тільки ціле число та позвитивне(Більше 0)  */
    PG_PORT: z.coerce.number().int().positive(),
    /** PG_DATABASE - Повинен бути string та мати мінімально 1 елемент */
    PG_DATABASE: z.string().min(1),
    /** PG_USER - Повинен бути string та мати мінімально 1 елемент */
    PG_USER: z.string().min(1),
    PG_PASSWORD: z.string().optional(),
    /** PG_SSL - Повинен бути boolean та має дефаулт false */
    PG_SSL: z.coerce.boolean().default(false),
    /** PG_POOL_MAX - Перетворюємо в number повинно буим цілим та більше 0 дефаулт 1 */
    PG_POOL_MAX: z.coerce.number().int().positive().default(1),
    /** PG_POOL_MIN - Перетворюємо в number число повинно бути цілим дефаулт 0*/
    PG_POOL_MIN: z.coerce.number().int().default(0),
    /** PG_CONN_TIMEOUT_MS - Перетворюємо в number число повинно бути ціле та більше 0 дефаулт 5000 */
    PG_CONN_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
    /** PG_IDLE_TIMEOUT_MS - Перетворюємо в number число повинно бути ціле та більше 0 дефаулт 30000 */
    PG_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
    /** PG_STATEMENT_TIMEOUT_MS - Перетворюємо в number число повинно бути ціле та більше 0 дефаулт 30000 */
    PG_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
    /** PG_QUERY_TIMEOUT_MS - Перетворюємо в number число повинно бути ціле та більше 0 дефаулт 30000 */
    PG_QUERY_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
    /** APP_NAME - Повинен бути string та default 'node-app' */
    APP_NAME: z.string().default('node-app')
})
/** Показуємо звідки брати дані для перевірки */
export const dbConfig = pgEnvSchema.parse(process.env)