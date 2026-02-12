import {PoolClient} from "pg";
import {isTableNotFound,isColumnNotFound} from "../../error/db.error.js";
import {helperLogger} from "../db.helper.js";
import {MainPageContent} from "../../types/pages/mainType.page.js";
import {pool} from "../../config/database.config.js";

import {ServicesEntity} from '../../types/services.type.js'
import {MainPageEntity} from '../../types/mainPage.type.js'
import {PricingPlansEntity} from "../../types/pricingPlans.type.js";
import {TestimonialsEntity} from "../../types/testimonials.type.js";
import {ServiceFaqEntity} from "../../types/serviceFaq.type.js";
import {ContactEntity} from "../../types/contact.type.js";
import {AboutMeEntity} from "../../types/aboutMe.type.js";

import {mainPageRowToEntity} from '../../utils/mappers/mainPage.mapp.js'
import {servicesRowToEntity} from '../../utils/mappers/services.mapp.js'
import {pricingPlansRowToEntity} from "../../utils/mappers/pricingPlans.mapp.js";
import {testimonialsRowToEntity} from "../../utils/mappers/testimonials.mapp.js";
import {serviceFaqRowToEntity} from '../../utils/mappers/faqService.mapp.js'
import {contactRowToEntity} from "../../utils/mappers/contact.mapp.js";
import {aboutMeRowToEntity} from "../../utils/mappers/aboutMe.mapp.js";
import {toInsertTestimonials} from "../../utils/mappers/testimonials.mapp.js";
import {queryOne,queryMany,executeOne} from '../db.helper.js'
import {AvatarTestimonialsEntity} from "../../types/avatarTestimonials.type.js";
import {avatarTestimonialsRowToEntity} from "../../utils/mappers/avatarTestimonials.mapp.js";

//==========================================================================================

/**
 * @summary getMainPageFromDb - Дістає з бази дані головної сторінки
 * @param {PoolClient} client - Коннект який буде виконувати запити до бази
 * @return {MainPageContent} - Набір даних Головної сторінки
 * @example
 *
 * import {pool} from "../../config/database.config.ts";
 *
 * const client = await pool.connect()
 *
 * const mainPage = await getMainPageFromDb(client)
 */
export const getMainPageFromDb =  async (client: PoolClient):Promise<MainPageContent> => {
        let heroResult: MainPageEntity | null = null;
        let servicesResult: ServicesEntity[] = [];
        let pricingResult: PricingPlansEntity[] = [];
        let aboutMeResult: AboutMeEntity | null = null;
        let testimonialsResult: TestimonialsEntity[] | null = null;
        let avatarTestimonialsResult: AvatarTestimonialsEntity[] | null = null;
        let faqResult: ServiceFaqEntity[] | null = null;
        let contactResult: ContactEntity[] = [];

        /**
         * Дістаємо всі дані з бази даних
         */
        try {

            heroResult = await queryOne(`SELECT * FROM main_page`, [], mainPageRowToEntity, client)

        } catch(error) {
            if (isTableNotFound(error))  helperLogger.error('Таблиці main_page не існує')
            if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці main_page')
            throw error
        }

        try {

             servicesResult = await queryMany(`SELECT * FROM services`, [], servicesRowToEntity, client)

        }catch(error) {
            if (isTableNotFound(error))  helperLogger.error('Таблиці services не існує')
            if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці services')
            throw error
        }

        try {

             pricingResult = await queryMany(`SELECT * FROM pricing_plans`, [], pricingPlansRowToEntity, client)

        } catch(error) {
            if (isTableNotFound(error))  helperLogger.error('Таблиці pricing_plans не існує')
            if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці pricing_plans')
            throw error
        }
        try {
            aboutMeResult = await queryOne(`SELECT * FROM about_me`, [], aboutMeRowToEntity,client)
        }catch(error) {
            if (isTableNotFound(error))  helperLogger.error('Таблиці about_me не існує')
            if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці about_me')
            throw error
        }

        try {

             testimonialsResult = await queryMany(`SELECT * FROM testimonials WHERE enabled = true`, [], testimonialsRowToEntity, client)

        }catch(error) {
            if (isTableNotFound(error))  helperLogger.error('Таблиці testimonials не існує')
            if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці testimonials')
        }

        try {

            avatarTestimonialsResult = await queryMany(`SELECT * FROM avatar_testimonials`, [], avatarTestimonialsRowToEntity, client)

        }catch (error) {
            if (isTableNotFound(error))  helperLogger.error('Таблиці avatar_testimonials не існує')
            if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці avatar_testimonials')
        }

        try {

             faqResult = await queryMany(`SELECT * FROM service_faq WHERE service_id IS NULL`, [], serviceFaqRowToEntity, client)

        }catch(error) {
            if (isTableNotFound(error))  helperLogger.error('Таблиці service_faq не існує')
            if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці service_faq')
        }
        try{

             contactResult = await queryMany(`SELECT * FROM contacts`, [], contactRowToEntity, client)

        }catch(error) {
            if (isTableNotFound(error))  helperLogger.error('Таблиці contact не існує')
            if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці contacts')
            throw error
        }


        /**
         * Збираємо всі дані в змінні та повертаємо одним готовим блоком
         */
        if(!heroResult || !aboutMeResult) throw new Error;

        const hero: MainPageContent["hero"] = {
            title: heroResult.title,
            subtitle: heroResult.subtitle,
            btnText1: heroResult.btnText1,
            btnHref1: heroResult.btnHref1,
            btnHref2: heroResult.btnHref2,
            btnText2: heroResult.btnText2,
            image: heroResult.image,
            bullets: heroResult.bullets
        }

        const services: MainPageContent["services"] = servicesResult.map(service => ({
            enabled: service.enabled,
            name: service.name,
            url: service.url,
            descriptions: service.descriptions,
            priceLabel: service.priceLabel,
            path: service.path,
            iconHtml: service.iconHtml
        }))

        const pricing: MainPageContent['pricing'] = pricingResult.map(pricing => ({
            enabled: pricing.enabled,
            title: pricing.title,
            priceLabel: pricing.priceLabel,
            features: pricing.features,
            btnHref: pricing.btnHref,
            btnText: pricing.btnText,
            badge: pricing.badge,
            badgeClass: pricing.badgeClass,
            popular: pricing.popular
        }))

        const about: MainPageContent['about'] = {
            title: aboutMeResult.title,
            description: aboutMeResult.description,
            focusLabel: aboutMeResult.focusLabel,
            focusValue: aboutMeResult.focusValue,
            stackLabel: aboutMeResult.stackLabel,
            stackValue: aboutMeResult.stackValue,
            features: aboutMeResult.features,
            btnText1: aboutMeResult.btnText1,
            btnHref1: aboutMeResult.btnHref1,
            btnText2: aboutMeResult.btnText2,
            btnHref2: aboutMeResult.btnHref2,
            image: aboutMeResult.image,
        }

        const testimonials: MainPageContent['testimonials'] = (testimonialsResult ?? []).map(testimonials => ({
            enabled: testimonials.enabled,
            text: testimonials.text,
            author: testimonials.author,
            role: testimonials.role,
            avatar: testimonials.avatar,
        }))

        const avatarTestimonials: MainPageContent['avatarTestimonials'] = (avatarTestimonialsResult ?? []).map(avatar => ({
            name: avatar.name,
            url: avatar.url
        }))

        const faq: MainPageContent['faq'] = (faqResult ?? []).map(faq => ({
            enabled: faq.enabled,
            question: faq.question,
            answer: faq.answer,
        }))

        const contacts: MainPageContent['contacts'] = {
            email: contactResult[0].email,
            telegram: contactResult[0].telegram,
            telegramLabel: contactResult[0].telegramLabel,
            github: contactResult[0].github,
            githubLabel: contactResult[0].githubLabel,
            }


        return {
            hero,
            services,
            pricing,
            about,
            testimonials,
            avatarTestimonials,
            faq,
            contacts
        }
}

//==========================================================================================

/**
 * @summary createTestimonials - Записує в базу даних новий відгук
 * @param {string} text - Головний текст Відгука
 * @param {string} author - Автор Відгука
 * @param {string | null} role - Для якої комнаії виконувалась робота
 * @param {string | null} avatar - Аватар Компанії
 *
 * @example
 *
 * const data = req.body
 * await createTestimonials(data.text, data.author, data.role, data.avatar)
 */
export const createTestimonials = async (text: string, author: string, role: string | null = null, avatar: string | null = null, ) => {
    if(!text || !author) {
        helperLogger.error('Дані для створення відгуку не можуть бути пустими', {text,author})
        throw new Error()
    }
    const client = await pool.connect()
    try {

        await executeOne(`INSERT INTO testimonials (text,author,role,avatar) 
                                                              VALUES ($1,$2,$3,$4) 
                                                              RETURNING enabled
                                                              `, [text, author, role, avatar], toInsertTestimonials, client)

            helperLogger.info('Успішно записано відгук в базу', {author,role,})
    }catch(error) {
        const message = error instanceof Error ? error.message : String(error)
        helperLogger.error('Виникла помилка при спробі записати дані в таблицю testimonials',{message: message})
        throw error
    }finally {
        client.release()
    }
}
