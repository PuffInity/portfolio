import type { RedisClientOptions } from "redis";
import { createAppLogger } from "../../utils/logger/logger.js";

/**
 * @file redis-base.config.ts
 * @summary Файл для базової конфігурації Redis
 */

export const redisLogger = createAppLogger({service: 'Redis'});


export type BaseConfig = {
    /** maxRetriesPerRequest - Скільки разів Redis буде повторювати запит при помилці перед тим як відмовитись */
    maxRetriesPerRequest?: number;
    /** keyPrefix - Префікс який буде додаватись до кожного ключа (Не залежить від сервісу)*/
    keyPrefix: string;
    /** clientOptions - Базові налаштування конфігурації для Redis */
    clientOptions: RedisClientOptions;
};

interface ParamsForBaseConfig {
    /** host - Хост до контейнера чи сервера Redis */
    host: string;
    /** port - Порт до Redis */
    port: number;
    /** name - Імʼя інстансу */
    name:string;
    /** password - Пароль для Redis */
    password?: string;
    /** database - Номер бази зазвичай 0 (0-15) */
    database?: number;
    /** keyPrefix - Ключ додаватиметься до кожного ключа (Залежить від сервісу) */
    keyPrefix: string;
    /** maxRetriesPerRequest - Кількість повторів при збої запиту */
    maxRetriesPerRequest?: number;
}

/**
 * @summary Створюємо функцію яка буде повертати обʼєкт готового конфігу
 * @param {ParamsForBaseConfig} params - Нас інтерфейси який створений трошку вище для створення конф. файлу
 */
export function makeBaseConfig(params: ParamsForBaseConfig): BaseConfig {
    /** Відразу для зручності створюємо констатнти та передаємо в них дані */
    const { host,port,name,password,
        database = 0,keyPrefix,
        maxRetriesPerRequest = 3
    } = params;

    return {
        maxRetriesPerRequest,
        keyPrefix,
        clientOptions: {
            socket: {
                host,
                port,
                connectTimeout: 10000,
                /** keepAlive - Підтримує постійне -TCP зʼєднання */
                keepAlive: true,
                /** Якщо зʼєднання буде встрачено або не буде підʼєднано з першого разу застосовується ця функія */
                reconnectStrategy: (retries: number) => {
                    /** Маємо 10 спроб */
                    if (retries > 10) {
                        redisLogger.error(`[${name}] Перевищено максимальну кількість спроб підключення`);
                        return new Error;
                    }
                    /** кожен раз множино кілкьість спроб на 50 і щоб не перевищило 5000 (5 секунд) */
                    const base = Math.min(retries * 50, 5000);
                    /** Створюємо константу яка матиме рандомне число до 250 */
                    const jitter = Math.floor(Math.random() * 250);
                    /** Додаємо 1 константсу base до другої jitter = Виходить постійно рандомне число
                     * Для того щоб Redis не навантужувася під час перепідключення всіх користувачів
                     * в нашому випадку кожен користувач буде перепідключатись в рандомний час
                     */
                    const delay = base + jitter;
                    redisLogger.info(`[${name}] перепідключення через ${delay}мл (Спроба / ${retries})`);
                    return delay;
                },
            },
            password,
            database,
            name,
        },
    };
}