import {Response,Request} from "express";
import {MainTypeAdmin} from "../../types/admin/mainType.admin.js";
import {ServicesTypeAdmin} from "../../types/admin/servicesType.admin.js";
import {ContactUpdate} from "../../types/contact.type.js";

import {updateMainCategory,
    updateServicesCategory,
    getTestimonials,
    getPricing,
    getServices,
    turnOffTestimonials,
    turnOnTestimonials,
    deleteTestimonials,
    editContacts,
    getFaqByName,
    createFaq,
    deleteFaq,
    editFaq,
    turnOnFaq,
    turnOffFaq,
    getServiceGallery} from "../../helpers/db/adminPanel.db.js";

import {mainPageSchema, servicesPageSchema, contactPageSchema} from "../../validator/schema/admin-panel.schema.js";
import {ServiceFaqInsert,ServiceFaqUpdate} from "../../types/serviceFaq.type.js";

/**
 * @file admin-panel.handler.ts
 * @summary Файл який відповідає за роботу Адмін панелі
 */

/**
 * @summary sendTitlesPricingAndServices - Відправляємо на фронтенд назви Сервісів та Прайсів
 * Відаємо на фротенд щоб адміністратор мав вибів вибрати що він хоче редагувати
 */
export const sendTitlesPricingAndServices = async (req: Request, res: Response) => {
    const titleServices = await getServices()
    const titlePricing = await getPricing()
    if(!titlePricing || !titleServices) {
       return res.status(404).json({message: 'error'})
    }
    return res.status(200).json({message: 'ok', service: titleServices, pricing: titlePricing})
}

//==========================================================================================

/**
 * @summary sendTestimonials - Відправити на фронтенд відгуки для відображення
 */
export const sendTestimonials = async (req: Request, res: Response) => {
    const data = await getTestimonials()
    res.status(200).json({message: 'ok', data: data})
}

//==========================================================================================

/**
 * @summary mainCategory - Фронтенд відравляє дані головної сторінки на бекенд та замінює нові дані на старі.
 */
export const mainCategory = async (req: Request<{},{}, MainTypeAdmin>, res: Response) => {
    const body = mainPageSchema.parse(req.body)
    await updateMainCategory(body)
    res.status(200).json({message: 'ok'})
}

//==========================================================================================

/**
 * @summary serviceCategory - Фронтенд відравляє дані Сервіса на бекенд та замінює нові дані на старі.
 */
export const serviceCategory = async (req: Request<{},{},ServicesTypeAdmin>, res: Response) => {
    const body = servicesPageSchema.parse(req.body)
    await updateServicesCategory(body)
    res.status(200).json({message: 'ok'})
}

//==========================================================================================

/**
 * @summary onTestimonials - Увімкнути відображення відгуку.
 */
export const onTestimonials = async (req: Request<{},{},{id: number}>, res: Response) => {
    const body = req.body
    await turnOnTestimonials(body.id)
    res.status(200).json({message: 'ok'})
}

//==========================================================================================

/**
 * @summary offTestimonials - Вимкнути відображення відгуку.
 */
export const offTestimonials = async (req: Request<{},{},{id: number}>, res: Response) => {
    const body = req.body
    await turnOffTestimonials(body.id)
    res.status(200).json({message: 'ok'})
}

//==========================================================================================

/**
 * @summary delTestimonials - Видалити відображення відгуку.
 */
export const delTestimonials = async (req: Request<{},{},{id: number}>, res: Response) => {
    const body = req.body;
    await deleteTestimonials(body.id);
    res.status(200).json({message: 'ok'})
}

//==========================================================================================

/**
 * @summary edContacts - Від фронтенда приходять дані, замінюємо старі дані контактів на нові які відправив фронетнд
 */
export const edContacts = async (req: Request<{},{},ContactUpdate>, res: Response)=> {
    const body = contactPageSchema.parse(req.body)
    await editContacts(body.contacts)
    res.status(200).json({message: 'ok'})
}

//==========================================================================================

/**
 * @summary sendFaq - Фронтент відправляє назву сервісу після чого бекенд відправляє на фронтенд FAQ данного сервісу
 */
export const sendFaq = async (req: Request<{},{},{name: string}>, res: Response) => {
    const body = req.body
    const data = await getFaqByName(body.name)
    if(!data) {
        return  res.status(404).json({message: 'error'})
    }
    return res.status(200).json({message: 'ok', data: data})
}

//==========================================================================================

/**
 * @summary newFaq - Фронтенд відправляє дані для створення нового FAQ
 */
export const newFaq = async (req: Request<{},{},ServiceFaqInsert>, res: Response) => {
    const body = req.body
    console.log(body)
    await createFaq(body)
    res.status(200).json({message: 'ok'})
}

//==========================================================================================

/**
 * @summary edFaq - Фронтенд відправляє дані для редагування існуючого FAQ
 */
export const edFaq = async (req: Request<{},{},{id: number, data: ServiceFaqUpdate }>, res: Response) => {
    const body = req.body
    await editFaq(body.id,body.data)
    res.status(200).json({message: 'ok'})
}

//==========================================================================================

/**
 * @summary delFaq - Видалити Faq
 */
export const delFaq = async (req: Request<{},{},{id: number}>,res: Response) => {
    const body = req.body
    await deleteFaq(body.id)
    res.status(200).json({message: 'ok'})
}

//==========================================================================================

/**
 * @summary Увімкнути відображення FAQ
 */
export const onFaq = async (req: Request<{},{},{id: number}>, res: Response) => {
    const body = req.body
    await turnOnFaq(body.id)
    res.status(200).json({message: 'ok'})
}

//==========================================================================================

/**
 * @summary Вимкнути відображення FAQ
 */
export const offFaq = async (req: Request<{},{},{id: number}>, res: Response) => {
    const body = req.body
    console.log(body)
    await turnOffFaq(body.id)
    res.status(200).json({message: 'ok'})
}

//==========================================================================================

export const sendGallery = async (req: Request, res: Response) => {
    console.log('Я тут починаю в sendGallery')
    const gallery = await getServiceGallery()
    return res.status(200).json(gallery)
}