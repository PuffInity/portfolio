import {cacheClient} from "../server/life-cycle/life-cycle.redis.js";
import {redisLogger} from "../config/redis/redis-base.config.js";

/**
 * @file redisCache.helper.ts
 * @summary Створюємо файл з хелперами для Redis
 */

//==========================================================================================

/**
 * @summary Функція яка провіряє наявність збереженого ключа в Redis памʼяті
 * @param {string} key - Ключ збережених даних за допомогою якого можливо знайти
 * @example
 *
 *  const example = await isExistKey(exampleKey)
 *
 */
export async function isExistKey(key: string): Promise<boolean> {
    if(!cacheClient) {
        throw new Error('Інстанс Redis не ініцілізований')
    }
    try {
        const exists: number = await cacheClient.exists(key)
        return exists === 1
    }catch(error) {
        const message = error instanceof Error ? error.message : String(error)
        redisLogger.error('Виникла помилка при провірці на наявність ключа в памʼяті Redis', {key, message})
        throw error
    }
}

//==========================================================================================

/**
 * @summary Функція яка записує JSON дані в памʼять Redis
 * @param {string} key - Ключ збережених даних за допомогою якого можливо знайти
 * @param {unknown} json - Дані Json які плануємо зберегти
 * @param {number | string} ttl - Необовʼязковий параметер добавляємо час життя існування в памʼяті JSON даних
 *
 * @example
 *
 *  await setJSON(exampleKey, {example1: Hello, example2: World! }, 600(Не обовʼязково але рекомендуємо використовувати завжди TTL))
 */
export async function setJSON (key: string, json: unknown, ttl?: number | string): Promise<void> {
    if(!cacheClient) {
        throw new Error('Інстанс Redis не ініцілізований')
    }
    try {
        const dataJson = JSON.stringify(json)

        if(ttl !== undefined) {
            const ttlNumber = Number(ttl)

            if(Number.isNaN(ttlNumber) || ttlNumber <= 0) {
                throw new Error(`Некоректний TTL: "${ttl}" для ключа "${key}"`);            }

            await cacheClient.set(key,dataJson,{EX: ttlNumber})
        } else {
            await cacheClient.set(key, dataJson)
        }
    }catch(error) {
        const message = error instanceof Error ? error.message : String(error)
        redisLogger.error('Виникла помилка при запису в Redis', {message, key})
        throw error
       }
    }

//==========================================================================================

/**
 * @summary Функція яка читає дані JSON з памʼяті Redis
 * @param {string} key - Ключ збережених даних за допомогою якого можливо знайти
 *
 * @example
 *
 * const example = await getJSON (exampleKey)
 */

export async function getJSON<T>(key: string): Promise<T | null> {
    if(!cacheClient) {
        throw new Error('Інстанс Redis не ініцілізований')
    }
    try {
      const raw: string | null = await cacheClient.get(key);
      if(!raw) return null

      return JSON.parse(raw) as T
    }catch(error) {
        const message = error instanceof Error ? error.message : String(error)
        redisLogger.error('Виникла помилка при читанні запису з Redis', {message, key})
        throw error
    }
}

//==========================================================================================

/**
 * @summary Функція видаляє ключі з даними з памʼяті Redis
 * @param {string} key - Ключ збережених даних за допомогою якого можливо знайти
 *
 * @example
 *
 * await deleteKey(exampleKey)
 */
export async function deleteKey(key:string): Promise<void> {
    if(!cacheClient) {
        throw new Error('Інстанс Redis не ініцілізований')
    }
    try {
        await cacheClient.del(key)
    }catch(error) {
        const message = error instanceof Error ? error.message : String(error)
        redisLogger.error('Помилка при спробі видалити дані з памʼяті Redis', {message, key})
        throw error
    }

}