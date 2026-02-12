import {Router} from "express";
import {wrapAsync} from "../../core/http/async.wrapper.js";
import {
    mainCategory,
    sendTitlesPricingAndServices,
    serviceCategory,
    sendTestimonials,
    offTestimonials,
    onTestimonials,
    delTestimonials,
    edContacts,
    delFaq,
    edFaq,
    newFaq,
    onFaq,
    sendFaq,
    offFaq,
    sendGallery} from "../../module/works/admin-panel.handler.js";
import {
    updateServiceImage,
    updateMainImage,
    updateAboutMeImage
} from "../../module/works/multer-works.handler.js";
import {upload} from "../../config/multer.config.js";
import {isAuthMiddleware} from "../../middlewares/isAuth.middleware.js";

import {catchMulterError} from "../../middlewares/catchMulterError.middleware.js";

const router = Router()

/**
 * @file admin-panel.route.ts
 * @summary Керування адмін панелі
 */


//==========================================================================================

/**
 * @summary Активувати middleware на всі нижчі роути
 */
router.use(isAuthMiddleware)

//==========================================================================================

/**
 * @summary /category - Відправити список назв Прайсів та Сервісів
 */
router.get('/category', wrapAsync(sendTitlesPricingAndServices))

//==========================================================================================

/**
 * @summary /testimonials - Відправити список Відгуків
 */
router.get('/testimonials', wrapAsync(sendTestimonials))

//==========================================================================================

/**
 * @summary /turnOffTestimonials - Вимкнути відгук
 */
router.post('/turnOffTestimonials',wrapAsync(offTestimonials))

//==========================================================================================

/**
 * @summary /turnOnTestimonials - Увімкнути відгук
 */
router.post('/turnOnTestimonials', wrapAsync(onTestimonials))

//==========================================================================================

/**
 * @summary /deleteTestimonials - Видалити відгук
 */
router.post('/deleteTestimonials', wrapAsync(delTestimonials))

//==========================================================================================

/**
 * @summary /main - Редагування головної сторінки
 */
router.post('/main', wrapAsync(mainCategory))

//==========================================================================================

/**
 * @summary /services - Редагування сервісів
 */
router.post('/services', wrapAsync(serviceCategory))

//==========================================================================================

/**
 * @summary /contacts - Редагування контактів
 */
router.post('/contacts', wrapAsync(edContacts))

//==========================================================================================

/**
 * @summary /sendFaq - Відправити FAQ для відображення
 */
router.post('/sendFaq', wrapAsync(sendFaq))

//==========================================================================================

/**
 * @summary Видалити FAQ
 */
router.post('/deleteFaq', wrapAsync(delFaq))

//==========================================================================================

/**
 * @summary /editFaq - Редагувати FAQ
 */
router.post('/editFaq', wrapAsync(edFaq))

//==========================================================================================

/**
 * @summary /createFaq - Створити FAQ
 */
router.post('/createFaq', wrapAsync(newFaq))

//==========================================================================================

/**
 * @summary /onFaq - Увімкнути FAQ
 */
router.post('/onFaq', wrapAsync(onFaq))

//==========================================================================================

/**
 * @summary /offFaq - Вимкнути FAQ
 */
router.post('/offFaq', wrapAsync(offFaq))

//==========================================================================================

router.post('/sendGallery', wrapAsync(sendGallery))

//==========================================================================================

router.post('/save-gallery1', upload.single('gallery_1'), catchMulterError ,wrapAsync(updateServiceImage))
router.post('/save-gallery2', upload.single('gallery_2'), catchMulterError ,wrapAsync(updateServiceImage))
router.post('/save-gallery3', upload.single('gallery_3'), catchMulterError ,wrapAsync(updateServiceImage))

//==========================================================================================

router.post('/save-main-gallery', upload.single('gallery_main'), catchMulterError ,wrapAsync(updateMainImage))

//==========================================================================================

router.post('/save-aboutMe-gallery', upload.single('gallery_about_me'), catchMulterError ,wrapAsync(updateAboutMeImage))

//==========================================================================================


export default router

