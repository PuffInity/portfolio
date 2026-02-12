import {pool, SHUTDOWN_TIMEOUT_MS,safeRelease,dbLogger} from "../../config/database.config.js";
import {offApp,onApp} from "../../metrics/init.metric.js";

/**
 * @file database.lifeCycle.ts
 * @summary Файл яки відповідає за життя Postgresql
 */

let poolClosed = false

/**
 * @summary Функція яка вмикає Postgresql
 */
export async function initDb(): Promise<void> {
    if (poolClosed) {
        dbLogger.warn('Postgresql уже запущений.')
        return;
    }
    /**
     * client - Одне зʼєднання до бази
     */
        const client = await pool.connect();
        poolClosed = true
    /**
     * broken Індикатор теперішнього стану
     */
    let broken = false;
    try {
        /** Відправляємо тестовий запит та чекаємо відповіді якщо все пройшло успішно база підʼєднана */
        await client.query('SELECT 1');
        onApp('1.0.0', 'DataBase')
        dbLogger.info('Postgresql Підʼєднаний');
    } catch (err) {
        /**
         * broken: true - Встановлюємо true тобто зєʼднання бите
         */
        broken = true;
        const message = err instanceof Error ? err.message : String(err)
        dbLogger.error('Помилка при спробі підключення до Postgresql', {message: message})
        throw err
    } finally {
        /** В будь якому випадку(Чи помилка чи успіх) обовʼязково виконати цю дію */
        safeRelease(client, broken)
    }
}
/**
 * @summary Функція яка вимикає postgresql
 */
export async function shutDownDb(): Promise<void> {
    /** Провірка чи postgresql працює чи вимкнута */
    if (poolClosed) {
        dbLogger.info('Postgresql pool закритий');
        return
    }
    try {
        /** Створюємо timeout який за 10 секунд викличе помилку якщо Postgresql не вимкнеться скоріше */
        const timeout = new Promise((_, rej) =>
            setTimeout(() => rej(new Error('pool.end() timeout')), SHUTDOWN_TIMEOUT_MS)
        );
        /** Створюємо гонку між функцією яка вимкне Postgresql та таймером який викличе помилку за 10 секнуд  */
        await Promise.race([pool.end(), timeout]);
        poolClosed = true;
        offApp('1.0.0', 'DataBase')
        dbLogger.info('Postgresql pool Закритий')
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        dbLogger.error('Виникла помилка при спробі вимкнення Postgresql', {message: message});
    }
}