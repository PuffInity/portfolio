import {queryOne,executeOne} from "../db.helper.js";
import {pool} from "../../config/database.config.js";
import {helperLogger} from "../db.helper.js"
import bcrypt from 'bcrypt'

import {adminRowToEntity,toInsertAdmin,toUpdateAdmin} from "../../utils/mappers/admin.mapp.js";
import {isTableNotFound,isColumnNotFound} from "../../error/db.error.js";

/**
 * @file admin.ds.ts
 * @summary Хелпери для бази даних які керуються доступом адміністратоора
 */

//==========================================================================================

/**
 * @summary ifExistAdmin - Провірка на наявість адміністратора
 * @param {string} login - Логін адміністратора над яким буде здійснюватись провірка на наявність
 * @returns boolean - Якщо адмін існує повертає true якщо не існує повертає false
 * @example
 *
 *  const admin = await ifExistAdmin(admin)
 */
export async function ifExistAdmin(login: string): Promise<boolean> {
    /**
     * client - Беремо 1 коннекст з черги коннектів щоб виконати операцію
     */
    const client = await pool.connect()
    try {
        /**
         * Запит до бази даних з пошуком по полю login
         */
        const admin = await queryOne(`SELECT * FROM admin WHERE login = $1`,[login],adminRowToEntity,client)
        if(!admin || admin.login !== login) {
            helperLogger.warn('Була виконана перевірка Адміністратора', {login})
            return false
        }
        return true
    }catch(error) {
        if (isTableNotFound(error))  helperLogger.error('Таблиці admin не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці admin')
        const message = error instanceof Error ? error.message : String(error)
        helperLogger.error('Виникла помилка при провірці на наявність адміністратора по логіну', {message})
        throw error
    } finally {
        /**
         * Повертаємо коннект знову в чергу
         */
        client.release()
    }
}

//==========================================================================================

/**
 * @summary  auditAdmin - Провірка на корректний пароль
 * @param {string} login - Логін адміністратора
 * @param {string} password - Пароль адміністратора
 * @returns boolean - Якщо пароль правильний повертає true якщо не правильний повертає false
 * @example
 *
 * const adminPassword = await auditAdmin(admin, 1111)
 */
export async function auditAdmin  (login: string, password: string): Promise<boolean> {
    /**
     * client - Беремо 1 коннекст з черги коннектів щоб виконати операцію
     */
    const client = await pool.connect()
    try {
        const admin = await queryOne(`SELECT * FROM admin WHERE login = $1`,[login],adminRowToEntity,client)
        if(!admin) return false
        /**
         * Розхешовуємо пароль та провіряємо чи все корректно
         */
        return await bcrypt.compare(password, admin.passwordHash)
    }catch(error) {
        if (isTableNotFound(error))  helperLogger.error('Таблиці admin не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці admin')
        const message = error instanceof Error ? error.message : String(error)
        helperLogger.error('Виникла помилка з провіркою hash Адміністора',{message})
        throw error
    } finally {
        /**
         * Повертаємо коннект знову в чергу
         */
        client.release()
    }
}

//==========================================================================================

/**
 * @summary createAdmin - Створення нового адмінітсратора
 * @param {string} login - Логін адміністратора
 * @param {string} password - Пароль адміністратора
 * @example
 *
 * await createAdmin(admin, 1111)
 */
export async function createAdmin (login: string, password: string) {
    /**
     * client - Беремо 1 коннекст з черги коннектів щоб виконати операцію
     */
    const client = await pool.connect()
    try {
        const admin = await queryOne(`SELECT * FROM admin WHERE login = $1`,[login],adminRowToEntity,client)

        if(admin && login == admin.login) {
            helperLogger.error('Адміністратор з таким логіном вже інсує')
            return
        }
        /**
         * Хешування пароля
         */
        const passwordHash = await bcrypt.hash(password, 12)

        await executeOne(`INSERT INTO admin (login,password_hash) VALUES ($1, $2)`, [login, passwordHash],toInsertAdmin,client)
        helperLogger.warn('Створений новий адміністратор!', {login})
    }catch(error) {
        if (isTableNotFound(error))  helperLogger.error('Таблиці admin не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці admin')
        const message = error instanceof Error ? error.message : String(error)
        helperLogger.error('Виникла помилка при створенні адміністратора', {message})
        throw error
    } finally {
        /**
         * Повертаємо коннект знову в чергу
         */
        client.release()
    }
}

//==========================================================================================

/**
 * @summary deleteAdmin - Видалення адміністратора
 * @param {string} login - Логін адміністратора над яким потрібно виконати операцію
 * @example
 *
 * await deleteAdmin(admin)
 */
export async function deleteAdmin(login: string) {
    /**
     * client - Беремо 1 коннекст з черги коннектів щоб виконати операцію
     */
    const client = await pool.connect()
    try {
        const admin = await queryOne(`SELECT * FROM admin WHERE login = $1`,[login],adminRowToEntity,client)
        if(!admin) {
            helperLogger.error('Адміністратор з таким логіном не інсує')
            return        }
        helperLogger.info('Адміністратор був видалений',{login: login})
        await executeOne(`DELETE FROM admin WHERE login = $1`, [login],toUpdateAdmin,client)
    }catch(error) {
        if (isTableNotFound(error))  helperLogger.error('Таблиці admin не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці admin')
        const message = error instanceof Error ? error.message : String(error)
        helperLogger.error('Виникла помилка при видалені адміністратора', {message})
        throw error
    } finally {
        /**
         * Повертаємо коннект знову в чергу
         */
        client.release()
    }
}


