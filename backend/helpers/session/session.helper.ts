import {Request, Response} from "express";
import {createAppLogger} from "../../utils/logger/logger.js";

/**
 * @file session.helper.ts
 * @summary файл який виконує дію хелпера сесій
 */

//==========================================================================================

/**
 * @summary loggerSession - Логгер
 */
export const loggerSession = createAppLogger({service: 'session-handler'})

//==========================================================================================

/**
 * @summary createAdminSession - Створює сесію для адміністратора в випадку правильного входу
 * @param {Request} req - Обʼєкт запиту express
 * @param {string} login - Логін адміністратора який намагаєтсья війти
 * @param {number | string} id - id адміністратора який намагаєтсья війти
 * */
export async function createAdminSession(req: Request,login: string,id?: number | string): Promise<void> {
    if(req.session?.userId) {
        loggerSession.error('Сесія уже існує, в доступі відмовленно', {login: login})
        throw new Error()
    }

    req.session.nickname = login;
    req.session.userId = id ?? 'Не надано'

    /**
     * Створюємо async функцію де асинхронно стоврюємо сессію
     */
    await new Promise<void>((resolve, reject) => {
        req.session.save((err: unknown) => {
            if (err) {
                const message =  err instanceof Error ? err.message : String(err);
                loggerSession.error("Виникла помилка при створенні сесії для адміністратора", { message, login });
                return reject(err);
            }
            loggerSession.info("Сесія успішно створена для адміністратора", { login });
            resolve();
        });
    });
}

//==========================================================================================

/**
 * @summary deleteAdminSession - Видаляє сессію для амдіністратора
 * @param {Request} req - Обʼєкт запиту express
 * @param {Response} res - Обʼєкт відповіді express
 * @param {string} login - Логін адміністратора який виходить
 */
export async function deleteAdminSession (req: Request,res: Response,login?: string): Promise<void> {
    await new Promise<void>((resolve,reject) => {
        req.session.destroy(error => error ? reject(error) : resolve())
    })
    res.clearCookie("sessionId");
    loggerSession.info('Адміністратор вийшов з адмін-панелі',{login})
    return
}