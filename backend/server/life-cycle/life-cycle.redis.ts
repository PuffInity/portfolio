import {createClient} from "redis";
import {redisCacheConfig} from "../../config/redis/redis-cache.config.js";
import {redisSessionConfig} from "../../config/redis/redis-sess.config.js";
import {redisLogger} from "../../config/redis/redis-base.config.js";
import {offApp, onApp} from "../../metrics/init.metric.js";

/**
 * @file life-cycle.redis.ts
 * @summary Файл яки відповідає за життя Redis
 */

/** Беремо тип Клієнту Redis */
type RedisClient = ReturnType<typeof createClient>
/**
 * sessionClient - Клієнт Redis сесій
 * cacheClient - Клієнт Redis кешу
 */
export let sessionClient: RedisClient | null = null
export let cacheClient: RedisClient | null = null
/** Індикатор Redis */
let started = false;

/** @summary Функція через яку Redis проходить кожен раз якщо щось з ним коїться
 * @param {RedisClient} client - Наш клієнт Redis
 * @param {string} name - Імя Інстансу який іменно викликав функцію
 */
function attachLogs(client: RedisClient, name: string) {
    /** Якщо Redis підключений */
    client.on('ready', () => {
        redisLogger.info(`[${name}] Готовий`)
    });
    /** Якщо виникла помилка в Redis */
    client.on('error', (error: unknown) => {
        redisLogger.error(`[${name}] Помилка ${error instanceof Error ? error.message : String(error)}`)
    });
    /** Якщо Redis переподключається */
    client.on('reconnecting', () => {
        redisLogger.warn(`[${name}] Перепідключення...`)
    })
    /** Якщо Redis відключився */
    client.on('end', () => {
        redisLogger.warn(`[${name}]  Підключення закінчено...`)
    })
}

/**
 * @summary Функція яка закриває інстанси Redis
 */
async function quitWithTimeout(client: RedisClient, ms = 5000): Promise<void> {
    let timer: NodeJS.Timeout | null = null
    try {
        /**
         * Створюємо гонку між client.quit() та Таймаутом який викликає помилку через 5 секунд
         * робимо для того щоб метод вимкнення Інстанса не завис
         */
        await Promise.race([
            client.quit(),
            new Promise<void>((_, reject) => {
                timer = setTimeout(() => reject(new Error(`quit() Таймаут після ${ms} мл.`)), ms)
            })
        ])
    } finally {
        /** Очищаємо Таймаут в любому випадку якщо він існує */
        if (timer) clearTimeout(timer)
    }
}

/**
 * @summary Функція яка вмикає Redis
 * */
export async function redisInit(): Promise<void> {
    if (started) return;
    /** Створюємо клієнти Session/Cache Redis */
    const s = createClient(redisSessionConfig.clientOptions)
    const c = createClient(redisCacheConfig.clientOptions)

    /** Регеструємо події на нащі клієнти */
    attachLogs(s, 'redis-sessions')
    attachLogs(c, 'redis-cache')
    try {
        /** Підʼєднуємо Redis та відправляємо PING чикаємо поки отримаємо PONG */
        await s.connect()
        await s.ping();

        await c.connect();
        await c.ping();

        /** Записати в наші змінні готові підключенні інстанси */
        sessionClient = s
        cacheClient = c
        started = true
        onApp('1.0.0', 'Redis-Cache')
        onApp('1.0.0', 'Redis-Session')
        redisLogger.info('[Redis] Обидва (Cache та Sessions) Клієнти підключенні')
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        redisLogger.error(`[redis] Виникла помилка. Closing any opened clients...`, {message: msg});
        try {
            /** Провіряємо чи інстанс відкритий тоді викликаєом функція яка закриває Інстанс */
            if (s.isOpen) await quitWithTimeout(s);
        } catch {
        }
        try {
            /** Провіряємо чи інстанс відкритий тоді викликаєом функція яка закриває Інстанс */
            if (c.isOpen) await quitWithTimeout(c);
        } catch {
        }
        throw error;
    }
}

/**
 * @summary Функція яка вимикає всі інстанси Redis
 */
export async function redisShutdown(): Promise<void> {
    const close = async (cl: RedisClient | null, label: string) => {
        /** Провірка чи Інсанс запущений */
        if (!cl) {
            redisLogger.warn(`[${label}] Інстнс не запущений, пропускаю вимикання`)
            return;
        }
        try {
            /** Викликаємо функцію яка вимикає Інстанс */
            await quitWithTimeout(cl, 5000)
            redisLogger.info(`[${label}] quit() OK`);

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            redisLogger.error(`[${label}] quit(). Помика при відключенні Інстанса,Пробуємо функцію disconnect()`, {message: message});
            try {
                /** Викликаємо метод disconnect() */
                await cl.disconnect();
                redisLogger.warn(`[${label}] disconnect(), успішно`);
            } catch (err: unknown) {
                const mess = err instanceof Error ? err.message : String(err);
                redisLogger.error(`[${label}] disconnect(), Помилка`, {message: mess});
            }
        }
    };
    /** Створюємо масив обʼєктів в яких зберігяються всі результати промісів */
    const results = await Promise.allSettled([
        close(sessionClient, 'redis-sessions'),
        close(cacheClient, 'redis-cache'),
    ])
    /** фільтруємо всі reject щоб бачити скільки сталось відмов  */
    const rejected = results.filter((r) => r.status === 'rejected');
    if (rejected.length > 0) {
        redisLogger.error(`[redis] Завершення роботи зіткнулося з ${rejected.length} відмовами`)
    }
    /** Очищає всі змінні з інстансами та змінну з запущеною програмою чим позначаємо що вона вимкнута */
    sessionClient = null;
    cacheClient = null;
    started = false;

    offApp('1.0.0','Redis-Cache')
    offApp('1.0.0','Redis-Session')
    redisLogger.info('[redis] Обидва клієнти закриті');
}

