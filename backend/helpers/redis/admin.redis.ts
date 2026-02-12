import {getJSON, isExistKey, setJSON} from "../redisCache.helper.js";
import {redisLogger} from "../../config/redis/redis-base.config.js";

/**
 * @file admin.redis.ts
 * @summary Хелпери для керування статусом Адміністратора
 */

//==========================================================================================

/**
 * @summary LoginAttempts - Лічильник спроб війти та час коли користувач був заблокований.
 */
interface LoginAttempts {
    count: number;
    blockedUntilMs?: number;
}

//==========================================================================================

/**
 * @summary BlockedResult - Інтерфейс який є результатом
 */
interface BlockedResult {
    count: number;
    isBlocked: boolean;
    blockedUntilMs?: number;
}

//==========================================================================================

/**
 *  maxAttempts - Максимальна кількість спроб входу
 *  blockTime - Час скільки адміністратор буде заблокований для спроб входу в систему
 */
const maxAttempts = 3
const blockTime = 60 * 60 * 1000

//==========================================================================================

/**
 * @summary blockedUser - Функція яка викликається кожен раз, якщо користувач намагався війти в панель адміністратора та написав якісь дані невірно
 * @param {string} login - Логін адміністратора який намагається війти.
 * @return {BlockedResult} - Повертає Кількість помилок, чи заблокований  користувач,
 */
export async function blockedUser (login: string): Promise<BlockedResult> {
    /**
     * Робимо провірку чи існує ключ в базі Redis
     */
    const key = `login:${login}`
    try {
        if(!await isExistKey(key)) {
            /**
             * Якщо ключа в базі не існує,
             * Створюємо константу та записуємо в лічільник 1
             * та створюємо JSON запись в Redis з count: 1 та тривалість життя 1 годину.
             */
            const firstAttempt: LoginAttempts = {count: 1}
            await setJSON(key,firstAttempt,3600)
            /**
             * Повертаємо що лічільник рівно 1
             * та Адміністратор не є заблокований.
             */
            return {
                count: 1,
                isBlocked: false
            }
        }

        /**
         * Якщо ключ уже існує в базі Redis
         * Дістаємо його з бази за допомогою хелпера getJSON
         */
        const data = await getJSON<LoginAttempts>(key)

        /**
         * currentCount - Теперішня кількість спроб війти
         * nowMs - Записуємо в зміну коли почалась операція входу в профіль
         */
        const currentCount = data?.count ?? 0
        const nowMs = Date.now()

        /**
         * Робимо провірку чи записаний blockedUntilMs в JSON запись в базі
         * Якщо так тоді робимо ще одну перевірку Якщо blockedUntilMs
         * є більшим ніж nowMs тоді час блокіровки ще не закінчився та користувач є заблокованим
         */
        if(data?.blockedUntilMs && data.blockedUntilMs > nowMs) {
            return {
                count: currentCount,
                isBlocked: true,
                blockedUntilMs: data.blockedUntilMs,
            }
        }

        /**
         *  newCount - Додаємо до теперішнього стану лічильника ще 1
         */
        const newCount = currentCount + 1;

        /**
         * Провіка чи теперішній стан лічільник не перейшов дозволену кількість(3)
         * Якщо ні тоді обновляємо JSON запись в базі Redis
         */
        if(newCount < maxAttempts) {
            const updated: LoginAttempts = {count: newCount}
            await setJSON(key,updated,3600)
            return {
                count: newCount,
                isBlocked: false
            }
        }

        /**
         * Якщо кількість спроб входу перейшла дозволений ліміт(3)
         * Додаємо до теперішнього часу ще час на скільки він буде заблокований
         * зберігаємо в зміну та збергіємо в базу Redis
         */
        const blockedUntilMs = nowMs + blockTime;
        const blockedDate: LoginAttempts = {
            count: newCount,
            blockedUntilMs
        };

        await setJSON(key,blockedDate,3600);

        return {
            count: newCount,
            isBlocked: true,
            blockedUntilMs,
        }

    }catch(error) {
        const message = error instanceof  Error ? error.message : String(error);
        redisLogger.error('Виникла помилка під час аудиту кількості спроб входу до Адмін-панелі', {login: login, message: message})
        throw error
    }
}

//==========================================================================================

/**
 * @summary isBlockedUser - Провірка чи адміністратор є заблокованим
 * @param {string} login - Логін адміністратора який намагається війти
 */
export async function isBlockedUser (login: string): Promise<boolean> {
    try {
        if(!await isExistKey(`login:${login}`)) {
            return false
        }

        const data = await getJSON<LoginAttempts>(`login:${login}`)

        const current = data?.count ?? 0

        return current >= 3
    }catch(error) {
        const message = error instanceof Error ? error.message : String(error)
        redisLogger.error('Виникла помилка під час запиту до Redis для провірки заблокованого користува',{message})
        throw error
    }
}
