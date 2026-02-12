import {PoolClient} from "pg";
import {pool} from "../../config/database.config.js";
import {isTableNotFound,isColumnNotFound} from "../../error/db.error.js";
import {helperLogger} from "../db.helper.js";
import {ServicesPageContent} from "../../types/pages/servicesType.page.js";

import {ServiceHeroEntity} from "../../types/serviceHero.type.js";
import {ServiceSettingEntity} from "../../types/serviceSetting.type.js";
import {ServiceGalleryEntity} from "../../types/servicesGallery.type.js";
import {ContactEntity} from "../../types/contact.type.js";
import {ServiceFaqEntity} from "../../types/serviceFaq.type.js";
import {ServicesEntity} from "../../types/services.type.js";

import {serviceHeroRowToEntity} from "../../utils/mappers/servicesHero.mapp.js";
import {serviceSettingRowToEntity} from "../../utils/mappers/serviceSetting.mapp.js";
import {serviceGalleryRowToEntity} from "../../utils/mappers/serviceGallery.mapp.js";
import {contactRowToEntity} from "../../utils/mappers/contact.mapp.js";
import {serviceFaqRowToEntity} from "../../utils/mappers/faqService.mapp.js";
import {servicesRowToEntity} from "../../utils/mappers/services.mapp.js";

import {queryOne,queryMany} from "../db.helper.js";



//==========================================================================================

/**
 * @summary  getServicesPageFromDb - Отримати дані для сервісу щоб відати сторінці
 * @param {PoolClient} client - Коннект для виконання SQL операцій
 * @param {number} serviceId - id самого сервісу який
 * @return {ServicesPageContent} - Зібрані дані для сервісних сторінок
 * @example
 *
 * import {pool} from "../../config/database.config.ts";
 * import {withTransaction} from "../db.helper.ts"
 *
 * const client = await pool.connect()
 * const service = req.body
 *
 * await withTransaction(getServicesPageFromDb, service.id)
 */

export const getServicesPageFromDb = async (client: PoolClient, serviceId?: number): Promise<ServicesPageContent> => {
    let heroResult: ServiceHeroEntity | null = null;
    let optionsResult: ServiceSettingEntity | null = null;
    let galleryResult: ServiceGalleryEntity[] = [];
    let contactResult: ContactEntity | null = null;
    let faqResult: ServiceFaqEntity[] = [];

    try {
        heroResult = await queryOne(`SELECT * FROM services_hero WHERE service_id = $1`, [serviceId], serviceHeroRowToEntity, client)
    }catch(error) {
        if (isTableNotFound(error))  helperLogger.error('Таблиці services_hero не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці services_hero')
        throw error;
    }

    try {
        optionsResult = await queryOne(`SELECT * FROM service_settings WHERE service_id = $1`, [serviceId], serviceSettingRowToEntity, client)
    }catch(error) {
        if (isTableNotFound(error))  helperLogger.error('Таблиці service_settings не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці service_settings')
        throw error;
    }

    try {
        galleryResult = await queryMany(`SELECT * FROM service_gallery WHERE service_id = $1`, [serviceId], serviceGalleryRowToEntity, client)
    }catch(error) {
        if (isTableNotFound(error))  helperLogger.error('Таблиці service_gallery не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці service_gallery')
        throw error;
    }

    try {
        contactResult = await queryOne(`SELECT * FROM contacts`, [], contactRowToEntity, client)
    }catch(error) {
        if (isTableNotFound(error))  helperLogger.error('Таблиці contacts не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці contacts')
        throw error;
    }

    try {
        faqResult = await queryMany(`SELECT * FROM service_faq WHERE service_id = $1`, [serviceId], serviceFaqRowToEntity, client)
    } catch(error) {
        if (isTableNotFound(error))  helperLogger.error('Таблиці service_faq не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці service_faq')
        throw error;
    }
    if(!heroResult || !optionsResult || !contactResult) throw new Error

    const hero: ServicesPageContent['hero'] = {
        title: heroResult.title,
        lead: heroResult.lead,
        image: heroResult.image,
        btnHref1: heroResult.btnHref1,
        btnHref2: heroResult.btnHref2,
        btnText1: heroResult.btnText1,
        btnText2: heroResult.btnText2,
        duration: heroResult.duration,
        executor: heroResult.executor,
        priceHero: heroResult.priceHero,
    }


    const options: ServicesPageContent['options'] = {
        discount: optionsResult.discount,
        include: optionsResult.include,
        additional: optionsResult.additional,
        price_title: optionsResult.price_title,
        price_subtitle: optionsResult.price_subtitle,
        price: optionsResult.price,
        terms: optionsResult.terms,
        quickStart: optionsResult.quickStart,
    }

    const gallery: ServicesPageContent['gallery'] = galleryResult.map(gallery => ({
        image: gallery.image,
        title: gallery.title,
        caption: gallery.caption,
    }))

    const contact: ServicesPageContent['contact'] = {
        email: contactResult.email,
        telegram: contactResult.telegram,
        telegramLabel: contactResult.telegramLabel,
        github: contactResult.github,
        githubLabel: contactResult.githubLabel,
    }

    const faq: ServicesPageContent['faq'] = faqResult.map(faq => ({
        enabled: faq.enabled,
        question: faq.question,
        answer: faq.answer,
    }))


    return {
        hero,
        options,
        gallery,
        contact,
        faq
    }

}

//==========================================================================================

/**
 * @summary isStringArr - typeGuard для getPathServices провіряє чи є в масиві всі елементи типу string
 * @param {Array<string | undefined>} arr - Масив для провірки
 */
const isStringArr = (arr: Array<string | undefined>): arr is string[] =>  arr.every((x): x is string => typeof  x === 'string')

/**
 * @summary getPathServices - Отримати всі точні назви шляхів сервісів
 */
export const getPathServices = async ():Promise<string[]> => {
    /**
     * client - Беремо 1 коннекст з черги коннектів щоб виконати операцію
     * DEFAULT - Базові назви шляхів до Сервісів
     */
    const client = await pool.connect()
    const DEFAULT = ['integrations','turnkey','debug']
    try {
    const services = await queryMany(`SELECT * FROM services`,[],servicesRowToEntity,client)
    /**
     * raw - Збираємо в константу масив з назвами шляхів до сервісів
     */
        const raw = services.map(path => path.path)

        if(!isStringArr(raw)){
            helperLogger.error('База даних не передала дані табилці services поля path! Буде використаний default масив',{DEFAULT})
            return DEFAULT
        }

            return raw

    }catch (error) {
        if (isTableNotFound(error))  helperLogger.error('Таблиці services не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці services')
        throw error
    }finally {
        /**
         * Повертає коннект знову в чергу
         */
        client.release()
    }
}

//==========================================================================================

/**
 * @summary getServiceByPath - Відає дані сервіса по шляху
 * @param {string} path - Шлях до сервіса
 */
export const getServiceByPath = async (path: string):Promise<ServicesEntity | null> => {
    const client = await pool.connect()
    try {
         return await queryOne(`SELECT *
                                     FROM services
                                     WHERE path = $1`, [path], servicesRowToEntity,client)
    } catch(error) {
        if (isTableNotFound(error))  helperLogger.error('Таблиці services не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці services')
        throw error
    }finally {
        client.release()
    }
}
