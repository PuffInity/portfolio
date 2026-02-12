import {Request,Response} from "express";

import {ifExistAdmin, auditAdmin} from "../../helpers/db/admin.db.js";
import {blockedUser,isBlockedUser} from "../../helpers/redis/admin.redis.js";
import {createAdminSession,deleteAdminSession} from "../../helpers/session/session.helper.js";

/**
 * @file admin.handler.ts
 * @summary Функції входу в сесію яки виконуватимуть роути
 */

interface admin {
    login: string,
    password: string,
}

//==========================================================================================

/**
 * @summary logToAdmin - Логіка входу користувача в Адмін панель
 */
export const logToAdmin = async (req: Request<{}, {}, admin>, res: Response) => {
    /**
     * Користувач натискає вхід, тим самим відправив на бекенд дані для провірки через fetch
     */
    const {
        login,
        password,
    } = req.body
    /**
     * Провірка чи сесія уже існує, якщо існує зупинити вхід.
     */
    if(req.session?.userId) {
        res.status(403).json({message: 'Повторний вхід заборонений'})
        return
    }
    /**
     * Провірка чи користувач заблокований, якщо так зупинити вхід
     */
    if(await isBlockedUser(login)) {
         res.status(404).json({message: 'Можливість війти заблокована, спробуйте через 1 годину'})
         return
    }
    /**
     * Провірка чи адміністратор існує, якщо ні тоді відправити попередження та збільшити кількість спроб на 1
     * Максимум 3 якщо перейти максимальну кількість на 1 годину буде заборонений доступ до входу
     */
    if(!await ifExistAdmin(login)) {
        const dataBlocked = await blockedUser(login)
        res.status(404).json({message: `Неправильний пароль або логін залишилось: ${dataBlocked.count} спроби`, block: dataBlocked.isBlocked, left: dataBlocked.blockedUntilMs ?? ''})
        return
    }
    /**
     * Провірка чи пароль правильний, якщо ні тоді зробити теж саме що і в минулій провірці
     */
    if(!await auditAdmin(login,password)) {
        const dataBlocked = await blockedUser(login)
        res.status(404).json({message: `Неправильний пароль або логін залишилось: ${dataBlocked.count} спроби`, result: dataBlocked.isBlocked, left: dataBlocked.blockedUntilMs ?? ''})
        return
    }
    /**
     * Виконати вхід та створити сесію для адміністратора
     */
    await createAdminSession(req,login)

    return res.status(201).json({message: 'Успішний вхід!'})
}

//==========================================================================================

/**
 * @summary logOutAdmin - Логіка виходу користувача з Адмін панелі
 */
export const logOutAdmin = async (req: Request, res: Response) => {
    if(!req.session) {
        res.status(401).json({message: 'Не можна використати функцію вихода якщо не було створеної сесії'})
        console.log(req.session, 'Провірка на виіхд з сесії якщо сесії не існує то це тут')
        return;
    }

    console.log('Тут я намагаюсь її видалити ')
    await deleteAdminSession(req,res,req.session.nickname)
    res.status(201).json({message: 'Вихід з адмін-панелі пройшов успішно'})
    return
}

//==========================================================================================

/**
 * @summary checkSession - Провірка чи існує сесія
 */
export const checkSession = async (req: Request, res: Response) => {
    if(req.session?.userId) {
       return res.status(403).json({message: 'Адміністратор не може входити 2 рази'})
    }
    console.log('Сессія не існує можна створити')
    return  res.status(200).json({message: 'Адміністратор ще не війшов, можна створити ще одну сесію'})
}

//==========================================================================================

/**
 * @summary checkSessionForNginx - Провірка чи існує сесія для nginx
 */
export const checkSessionForNginx = async (req: Request, res: Response) => {
    if(req.session?.userId) {
        console.log('Сессія існує nginx')
        return res.status(200).json({message: 'Сессія існує, доступ наданий'})
    }
    console.log('Сесія не існує nginx')
    return  res.status(403).json({message: 'Сессія не існує, доступ не наданий'})
}