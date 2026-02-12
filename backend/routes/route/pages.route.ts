import {Router} from "express";
import {wrapAsync} from "../../core/http/async.wrapper.js";
import {mainPage,servicePages} from "../../module/pages/pages.handler.js";
const router = Router()

/**
 * @file pages.route.ts
 * @summary Головні роути
 */

//==========================================================================================

/**
 * @summary /:path - Сервіси
 */
router.get('/:path', wrapAsync(servicePages))

//==========================================================================================

/**
 * @summary / - Головна сторінка
 */
router.get('/', wrapAsync(mainPage))

//==========================================================================================

export default router