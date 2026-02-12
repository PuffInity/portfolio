import {writeTestimonials,sendLetter} from "../../module/works/main-works.handler.js";
import {wrapAsync} from "../../core/http/async.wrapper.js";
import {Router} from "express";
import {upload} from "../../config/multer.config.js";

const router = Router()

/**
 * @file main-works.route.ts
 * @summary Другорядна робота головної сторінки
 */

//==========================================================================================

/**
 * @summary /testimonials - Створити відгук
 */
router.post('/testimonials', wrapAsync(writeTestimonials))

//==========================================================================================

/**
 * @summary /send-letter - Відправити повідомлення адміністратору на Email
 */
router.post('/send-letter', wrapAsync(sendLetter))

//==========================================================================================

export default router