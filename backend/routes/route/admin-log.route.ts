import {Router} from "express";
import {logToAdmin, logOutAdmin, checkSession, checkSessionForNginx} from "../../module/pages/admin.handler.js";
import {wrapAsync} from "../../core/http/async.wrapper.js";
const router = Router()

/**
 * @file admin-log.route.ts
 * @summary Роути входа адміністратора
 */

//==========================================================================================

/**
 *  /check-session - Провірка чи користувач має сесію
 */
router.get('/check-session', wrapAsync(checkSession))

//==========================================================================================

/**
 *  /check-session-for-nginx - Провірка для nginx чи користувач має сесію
 */
router.get('/check-session-for-nginx', wrapAsync(checkSessionForNginx))

//==========================================================================================

/**
 * /adminLog - Вхід адміністратора
 */
router.post('/adminLog', wrapAsync(logToAdmin))

//==========================================================================================

/**
 * Вихід адміністратора
 */
router.post('/adminLogout', wrapAsync(logOutAdmin))

//==========================================================================================

export default router