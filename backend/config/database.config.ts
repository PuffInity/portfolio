import {Pool} from 'pg'
import {dbConfig} from "../validator/schema/database.schema.js";
import {createAppLogger} from "../utils/logger/logger.js";
import {PoolClient} from "pg";

/**
 * @file database.config.ts
 * @summary Конфігурація Бази даних
 */

/**
 * @summary Конфігурація пул зʼєднання
 */
export const pool = new Pool({
    /** Адреса сервера бази даних */
    host: dbConfig.PG_HOST,
    /** Порт бази даних */
    port: dbConfig.PG_PORT,
    /** імʼя бази даних */
    database: dbConfig.PG_DATABASE,
    /** Імʼя користувача бази */
    user: dbConfig.PG_USER,
    /** Пароль користувача */
    password: dbConfig.PG_PASSWORD,
    /** Параметки ssl підключення  */
    ssl: undefined, // In production use: { ca: <CA certificate>, rejectUnauthorized: true }
    /** Максимальна кількість активних зʼєднань в пулі */
    max: dbConfig.PG_POOL_MAX,
    /** Час після якого неактивне зʼєднання буде відключене */
    idleTimeoutMillis: dbConfig.PG_IDLE_TIMEOUT_MS,
    /** Скільки часу чекати поки пул створить нове зʼєднання */
    connectionTimeoutMillis: dbConfig.PG_CONN_TIMEOUT_MS,
    /** Максимальний час виконання одного запиту*/
    statement_timeout: dbConfig.PG_STATEMENT_TIMEOUT_MS,
    /** Максимальний час очікування Node.js відповіді від бази */
    query_timeout: dbConfig.PG_QUERY_TIMEOUT_MS,

    /** Іʼмя программи якою виконуються запити до бази*/
    application_name: dbConfig.APP_NAME,

    /** Підтримує активне TCP зʼєднання між клієнтом та Postgresql */
    keepAlive: true,
    /** Якими періодами надсилати пінг для провірки(Кожні 30 секунд Node.js провірятиме чи підключення триває і далі) */
    keepAliveInitialDelayMillis: 30000,
    /** Максимальна кількість запитів одного зʼєднання перед тим як його перестворити */
    maxUses: 7500,
    /** Максимальна життєва тривалість в пулі після чого зʼєднання буде перестворене */
    maxLifetimeSeconds: 3600,
});

export const SHUTDOWN_TIMEOUT_MS = 10000



export const dbLogger = createAppLogger({service: 'DataBase',appName: dbConfig.APP_NAME});

/**
 * @summary safeRelease - Функція яка встановлює статус 1 зʼднання
 * @param {PoolClient} client - Це 1 зʼднання
 * @param {boolean} broken - Це сам статус  true - Зламаний  false - Все чудово
 */
export function safeRelease(client: PoolClient, broken: boolean) {
    try {
        (client as unknown as PoolClient & { release(broken?: boolean): void }).release(broken)
    } catch (error) {
        dbLogger.warn('Не вдалося звільнити клієнта Postgresql', {error: (error as Error).message, broken})
    }
}

/**
 * @summary Встановлює правила для бази даних на самому початку ініцілізації
 * SET TIME ZONE 'UTC' - Встновлює щоб цьому серверу відавали часи в форматі UTC
 * SET idle_in_transaction_session_timeout = '30000ms' - Це встановлює обмеження на транзакції вони можуть тривати максимально тільки 30 секунд
 * SET lock_timeout = '5000ms' - Якщо хтось захоче змінити щось але це буде виконуватись транзакцією і в цей момент хтось також захоче замінити цеж саме
 * то тоді та транзакція яка почала пізніше буде змушена чекати 5 секунд якщо перша транзакція не завершить роботу за цей період робота другої транзакції
 * закінчиться помилкою
 */
async function applySessionDefaults(client: PoolClient) {
    await client.query(`
    SET TIME ZONE 'UTC';
    SET idle_in_transaction_session_timeout = '30000ms';
    SET lock_timeout = '5000ms';
    `)
}

/**
 * @summary Функція яка застосовує наші обмеження
 * @param {PoolClient} client - Даємо одне зʼєднання щоб фунція могла відправити
 * @param {number} retries - Кількість спроб(Стандарт 1)
 * @param {number} delayMs - Скільки чекати перед тим як спробувати знову в разі помилки першої спроби(стандарт 150)
 */
async function applyWithRetry(client: PoolClient, retries = 1,delayMs = 150) {
    let lastErr: unknown = null;
    for(let attempt = 0; attempt <= retries;attempt ++) {
        try{
            await applySessionDefaults(client);
            return;
        }catch(error) {
            lastErr = error
            if(attempt === retries) break;
            await new Promise(r =>setTimeout(r, delayMs * (attempt + 1)))
        }
    }
    throw lastErr;
}

/**
 * @summary Подія яка здійснюється кожного разу як створюється нове зʼєднання до бази
 * @param {PoolClient} - одне з зʼєднаннь
 */
pool.on('connect',async (client) => {
    try {
        await applyWithRetry(client,1, 150)
    }catch(error) {
        dbLogger.error('Помилка при застосування обмежень бази', {error: (error as Error).message})
        safeRelease(client,true)
    }
})

pool.on('error',(err) => {
    dbLogger.error('Несподівана помилка клієнта Postgresql', {error: err.message});
})