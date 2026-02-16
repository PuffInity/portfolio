import {pool} from "../../config/database.config.js";
import {isColumnNotFound, isTableNotFound} from "../../error/db.error.js";
import {withTransaction, executeVoid, queryOne, queryMany, helperLogger} from "../db.helper.js";

import {MainTypeAdmin} from "../../types/admin/mainType.admin.js";
import {ServicesTypeAdmin} from "../../types/admin/servicesType.admin.js";
import {ServicesEntity} from "../../types/services.type.js";
import {PricingPlansEntity} from "../../types/pricingPlans.type.js";
import {TestimonialsEntity} from "../../types/testimonials.type.js";
import {ContactUpdate} from "../../types/contact.type.js";
import {ServiceFaqEntity,ServiceFaqUpdate,ServiceFaqInsert} from "../../types/serviceFaq.type.js";

import {toUpdateAboutMe} from "../../utils/mappers/aboutMe.mapp.js";
import {toUpdateServices} from "../../utils/mappers/services.mapp.js";
import {pricingPlansRowToEntity, toUpdatePricingPlans} from "../../utils/mappers/pricingPlans.mapp.js";
import {toUpdateMainPage} from "../../utils/mappers/mainPage.mapp.js";
import {serviceGalleryRowToEntity} from "../../utils/mappers/serviceGallery.mapp.js";

import {servicesRowToEntity} from "../../utils/mappers/services.mapp.js";
import {testimonialsRowToEntity} from "../../utils/mappers/testimonials.mapp.js";
import {serviceFaqRowToEntity} from "../../utils/mappers/faqService.mapp.js";

/**
 * @file adminPanel.db.ts
 * @summary Файл в якому виконуються головні операції над Адмін панелю в Базі даних
 */

//==========================================================================================

/**
 * @summary updateMainCategory - Оновлює дані головної сторінки в базі даних на нові які були відправлені з фронтенда адміністратором
 * @param {MainTypeAdmin} data - Дані які приходитимуть з фронтенда для заміни старих даних в базі на нові побудовані типах таблиць з бази даних
 * @example
 *
 * const data = req.body
 * await updateMainCategory(data)
 */
export async function updateMainCategory(data: MainTypeAdmin): Promise<void> {
    /**
     * client - Беремо 1 коннекст з черги коннектів щоб виконати операцію
     */
    const service = toUpdateServices(data.service)
    const pricing = toUpdatePricingPlans(data.price)
    const main = toUpdateMainPage(data.main)
    const aboutMe = toUpdateAboutMe(data.aboutMe)

    /**
     *   selectedPricing - Назва Прайса над яким буде виконуватись операція(Оновлення полів)
     *   selectedService - Назва Сервісу над яким буде виконуватись операція(Оновлення полів)
     */
    const selectedPricing = data.selectedPricingTitle
    const selectedService = data.selectedServiceName

    await withTransaction(async (client) => {
        try {
            /**
             * Записуємо в базу даних тільки в тому випадку якщо фронтенд передав рядок якщо рядок не був надісланий і є null тоді ми його просто не записуємо
             * COALESCE - Оновлюємо тільки тоді якщо поле існує
             */
            await executeVoid(
                `
                    UPDATE about_me
                    SET title       = COALESCE($1, title),
                        description = COALESCE($2, description),
                        focus_label = COALESCE($3, focus_label),
                        focus_value = COALESCE($4, focus_value),
                        stack_label = COALESCE($5, stack_label),
                        stack_value = COALESCE($6, stack_value),
                        features    = COALESCE($7, features),
                        btn_text1   = COALESCE($8, btn_text1),
                        btn_href1   = COALESCE($9, btn_href1),
                        btn_text2   = COALESCE($10, btn_text2),
                        btn_href2   = COALESCE($11, btn_href2),
                        image       = COALESCE($12, image)
                    WHERE id = 1
                `,
                [
                    aboutMe?.title ?? null,
                    aboutMe?.description ?? null,
                    aboutMe?.focus_label ?? null,
                    aboutMe?.focus_value ?? null,
                    aboutMe?.stack_label ?? null,
                    aboutMe?.stack_value ?? null,
                    aboutMe?.features ?? null,
                    aboutMe?.btn_text1 ?? null,
                    aboutMe?.btn_href1 ?? null,
                    aboutMe?.btn_text2 ?? null,
                    aboutMe?.btn_href2 ?? null,
                    aboutMe?.image ?? null
                ],
                client
            );
        } catch (error) {
            if (isTableNotFound(error)) helperLogger.error('Таблиці about_me не існує')
            if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці about_me')
            throw error
        }
        try {

            await executeVoid(`
                UPDATE services
                SET name        = COALESCE($1, name),
                    description = COALESCE($2, description),
                    path        = COALESCE($3, path),
                    price_label = COALESCE($4, price_label),
                    icon_html   = COALESCE($5, icon_html),
                    enabled     = COALESCE($6, enabled),
                    sort_order  = COALESCE($7, sort_order)
                WHERE name = $8 
            `, [
                service?.name ?? null,
                service?.description ?? null,
                service?.path ?? null,
                service?.price_label ?? null,
                service?.icon_html ?? null,
                service?.enabled ?? null,
                service?.sort_order ?? null,
                selectedService
            ],
                client
            );

        } catch (error) {
            if (isTableNotFound(error)) helperLogger.error('Таблиці services не існує')
            if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці services')
            throw error
        }
        try {

            await executeVoid(
                `
                    UPDATE pricing_plans
                    SET enabled     = COALESCE($1, enabled),
                        title       = COALESCE($2, title),
                        price_label = COALESCE($3, price_label),
                        features    = COALESCE($4, features),
                        btn_text    = COALESCE($5, btn_text),
                        btn_href    = COALESCE($6, btn_href),
                        badge       = COALESCE($7, badge),
                        badge_class = COALESCE($8, badge_class),
                        popular     = COALESCE($9, popular),
                        sort_order  = COALESCE($10, sort_order)
                    WHERE title = $11
                `,
                [
                    pricing?.enabled ?? null,
                    pricing?.title ?? null,
                    pricing?.price_label ?? null,
                    pricing?.features ?? null,
                    pricing?.btn_text ?? null,
                    pricing?.btn_href ?? null,
                    pricing?.badge ?? null,
                    pricing?.badgeClass ?? null,
                    pricing?.popular ?? null,
                    pricing?.sort_order ?? null,
                    selectedPricing
                ],
                client
            );

        } catch (error) {
            if (isTableNotFound(error)) helperLogger.error('Таблиці pricing_plans не існує')
            if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці pricing_plans')
            throw error
        }

        try {

            await executeVoid(
                `
                    UPDATE main_page
                    SET title         = COALESCE($1, title),
                        subtitle      = COALESCE($2, subtitle),
                        bullets       = COALESCE($3, bullets),
                        image         = COALESCE($4, image),
                        btn_text1  = COALESCE($5, btn_text1),
                        btn_href1  = COALESCE($6, btn_href1),
                        btn_text2  = COALESCE($7, btn_text2),
                        btn_href2  = COALESCE($8, btn_href2),
                        services_lead = COALESCE($9, services_lead),
                        pricing_lead  = COALESCE($10, pricing_lead)
                    WHERE id = 1 
                `,
                [
                    main?.title ?? null,
                    main?.subtitle ?? null,
                    main?.bullets ?? null,
                    main?.image ?? null,
                    main?.btn_text1 ?? null,
                    main?.btn_href1 ?? null,
                    main?.btn_text2 ?? null,
                    main?.btn_href2 ?? null,
                    main?.services_lead ?? null,
                    main?.pricing_lead ?? null
                ],
                client
            );

        } catch (error) {
            if (isTableNotFound(error)) helperLogger.error('Таблиці main_page не існує')
            if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці main_page')
            throw error
        }
        return;
    })
}

//==========================================================================================

/**
 * @summary getPricing - Відає всі сервіси для того щоб дати змогу фронтенду показати список існуючих прайсів та розуміти над якими прайсами можливо працювати
 * @example
 *
 * const pricing = await getPricing()
 */
export async function getPricing(): Promise<PricingPlansEntity[] | null> {
    /**
     * client - Беремо 1 коннекст з черги коннектів щоб виконати операцію
     */
    const client = await pool.connect()
    try{
        const pricing = await queryMany(`SELECT title FROM pricing_plans`,[],pricingPlansRowToEntity,client)
        if(!pricing) {
            helperLogger.error('В таблиці pricing_plans немає даних для виконання операції')
            return null;
        }
        return pricing
    }catch(error) {
        if (isTableNotFound(error)) helperLogger.error('Таблиці pricing_plans не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці pricing_plans')
        const message = error instanceof Error ? error.message : String(error)
        helperLogger.error('Виникла помилка з запитом до бази за даними таблиці pricing_plans', {message})
        throw error;
    }finally {
        /**
         * Повертаємо коннект знову в чергу
         */
        client.release()
    }
}

//==========================================================================================

/**
 * @summary getServices - Відає всі сервіси для того щоб дати змогу фронтенду показати список існуючих сервісів та розуміти над якими прайсами можливо працювати
 * @example
 *
 * const services = await getServices()
 */
export async function getServices(): Promise<ServicesEntity[] | null> {
    /**
     * client - Беремо 1 коннекст з черги коннектів щоб виконати операцію
     */
    const client = await pool.connect()
    try{
        const services = await queryMany(`SELECT id, name FROM services`,[],servicesRowToEntity,client)
        if(!services) {
            helperLogger.error('В таблиці services немає даних для виконання операції')
            return null;
        }
        return services
    }catch(error) {
        if (isTableNotFound(error)) helperLogger.error('Таблиці services не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці services')
        const message = error instanceof Error ? error.message : String(error);
        helperLogger.error('Виникла помилка з запитом до бази за даними таблиці Services', {message})
        throw error;
    }finally {
        /**
         * Повертаємо коннект знову в чергу
         */
        client.release()
    }
}

//==========================================================================================

/**
 * @summary updateServicesCategory - Оновлює дані сервісів в базі даних на нові які були відправлені з фронтенда
 * @param {ServicesTypeAdmin} data - Дані відправлені з фронтенда які були побудовані на типах табилць для сервісів
 * @example
 *
 * const data = req.body
 * await updateServicesCategory(data)
 */
export async function updateServicesCategory(data: ServicesTypeAdmin): Promise<void> {
    /**
     * client - Беремо 1 коннекст з черги коннектів щоб виконати операцію
     */
    const client = await pool.connect()

    /**
     * Створюємо зручні констнтати для роботи
     */
    const hero = data.hero;
    const settings = data.setting;
    const gallery = data.gallery;

    /**
     * Беремо назву сервісу над яким буде проводитись операція
     */
    const servicesName = data.serviceName;

    try {
    /**
     *  Дістаємо ID сервіса по його назві яку нам відправляє фронтенд
     */
    const serviceId = await queryOne(`SELECT id
                                      FROM services
                                      WHERE name = $1`, [servicesName], servicesRowToEntity, client)
    await withTransaction(async (client) => {
        try {
            await executeVoid(
                `
                    UPDATE services_hero
                    SET title = COALESCE($1, title),
                        lead = COALESCE($2, lead),
                        image = COALESCE($3, image),
                        btn_text1 = COALESCE($4, btn_text1),
                        btn_text2 = COALESCE($5, btn_text2),
                        duration = COALESCE($6, duration),
                        executor = COALESCE($7, executor),
                        price_hero = COALESCE($8, price_hero)
                    WHERE id = $9;
                `,
                [
                    hero?.title ?? null,
                    hero?.lead ?? null,
                    hero?.image ?? null,
                    hero?.btnText1 ?? null,
                    hero?.btnText2 ?? null,
                    hero?.duration ?? null,
                    hero?.executor ?? null,
                    hero?.priceHero ?? null,
                    serviceId?.id
                ],
                client
            );

        }catch(error) {
            if (isTableNotFound(error)) helperLogger.error('Таблиці services_hero не існує')
            if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці services_hero')
            throw error
        }

        try {
            await executeVoid(
                `
                    UPDATE service_settings
                    SET discount = COALESCE($1, discount),
                        include = COALESCE($2, include),
                        additional = COALESCE($3, additional),
                        price_title = COALESCE($4, price_title),
                        price_subtitle = COALESCE($5, price_subtitle),
                        price = COALESCE($6, price),
                        terms = COALESCE($7, terms),
                        quickstart = COALESCE($8, quickstart)
                    WHERE id = $9;
                `,
                [
                    settings?.discount ?? null,
                    settings?.include ?? null,
                    settings?.additional ?? null,
                    settings?.price_title ?? null,
                    settings?.price_subtitle ?? null,
                    settings?.price ?? null,
                    settings?.terms ?? null,
                    settings?.quickStart ?? null,
                    serviceId?.id
                ],
                client
            );
        }catch(error) {
            if (isTableNotFound(error)) helperLogger.error('Таблиці service_settings не існує')
            if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці service_settings')
            throw error
        }

        try {
            await executeVoid(
                `
                    UPDATE service_gallery
                    SET image = COALESCE($1, image),
                        title = COALESCE($2, title),
                        caption = COALESCE($3, caption)
                    WHERE id = $4;
                `,
                [
                    gallery?.image ?? null,
                    gallery?.title ?? null,
                    gallery?.caption ?? null,
                    serviceId?.id
                ],
                client
            );
       }catch(error) {
            if (isTableNotFound(error)) helperLogger.error('Таблиці service_gallery не існує')
            if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці service_gallery')
            throw error
        }
    })
    }catch(error) {
        const message = error instanceof Error ? error.message : String(error);
        helperLogger.error('Виникла помилка з запитом до бази даних', {message});
        throw error;
    } finally {
        /**
         * Повертаємо коннект знову в чергу
         */
        client.release()
    }
}

//==========================================================================================


/**
 * @summary getTestimonials - Відає список усіх відгуків які користувачі залишили на сайті
 * @example
 *
 * const data = await getTestimonials()
 */
export async function getTestimonials(): Promise<TestimonialsEntity[] | null> {
    /**
     * client - Беремо 1 коннекст з черги коннектів щоб виконати операцію
     */
    const client = await pool.connect()
    try {
        const data=  await queryMany(`SELECT * FROM testimonials`,[],testimonialsRowToEntity,client)
        if (!data) {
            return null
        }
        return data
    }catch(error) {
        if (isTableNotFound(error)) helperLogger.error('Таблиці about_me не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці about_me')
        throw error
    }finally {
        /**
         * Повертаємо коннект знову в чергу
         */
        client.release()
    }
}

//==========================================================================================

/**
 * @summary  turnOnTestimonials - Функція яка вмикає відгук по id
 * @param {number} id - ID відгука над яким буде виконуватись операція
 */
export async function turnOnTestimonials(id: number): Promise<void> {
    /**
     * client - Беремо 1 коннекст з бази даних щоб виконати операцію
     */
    const client = await pool.connect()
    try {

    await executeVoid(`
                    UPDATE testimonials 
                    SET enabled = true
                    WHERE id = $1
                          `, [id], client)

    }catch(error) {
        if (isTableNotFound(error)) helperLogger.error('Таблиці testimonials не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці testimonials')
        throw error
    }finally {
        /**
         * Повертаємо коннект знову в чергу
         */
        client.release()
    }
}

//==========================================================================================

/**
 * @summary  turnOffTestimonials - Функція яка вимикає відгук по id
 * @param {number} id - ID відгука над яким буде виконуватись операція
 */
export async function turnOffTestimonials(id: number): Promise<void> {
    /**
     * client - Беремо 1 коннекст з бази даних щоб виконати операцію
     */
    const client = await pool.connect()
    try {

        await executeVoid(`
                    UPDATE testimonials 
                    SET enabled = false
                    WHERE id = $1
                          `, [id], client)

    }catch(error) {
        if (isTableNotFound(error)) helperLogger.error('Таблиці testimonials не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці testimonials')
        throw error
    }finally {
        /**
         * Повертаємо коннект знову в чергу
         */
        client.release()
    }
}

//==========================================================================================

/**
 * @summary  deleteTestimonials - Функція яка видаляє відгук по id
 * @param {number} id - ID відгука над яким буде виконуватись операція
 */
export async function deleteTestimonials(id: number): Promise<void> {
    /**
     * client - Беремо 1 коннекст з бази даних щоб виконати операцію
     */
    const client = await pool.connect()
    try {
        await executeVoid(`
                            DELETE FROM testimonials
                            WHERE id = $1
        `,[id],client)
    }catch(error) {
        if (isTableNotFound(error)) helperLogger.error('Таблиці testimonials не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці testimonials')
        throw error
    }finally {
        /**
         * Повертаємо коннект знову в чергу
         */
        client.release()
    }
}

//==========================================================================================

/**
 * @summary editContacts - Функція яка приймає від фронтенда дані контактів та замінює їх в базі даних
 * @param {ContactUpdate} contact - Дані які відправляє фронтенд на бекенд для заміни в таблиці контактів в базі данних
 * @example
 *
 * const data = req.body
 * await editContacts(data)
 */
export async function editContacts(contact: ContactUpdate): Promise<void> {
    /**
     * client - Беремо 1 коннекст з бази даних щоб виконати операцію
     */
    const client = await pool.connect()
    const data = contact
    try {
        await executeVoid(`
                            UPDATE contacts
                            SET email = COALESCE($1, email),
                                telegram = COALESCE($2, telegram),
                                telegram_label = COALESCE($3,telegram_label),
                                github = COALESCE($4, github),
                                github_label = COALESCE($5, github_label)
                            WHERE id = 1
                             `,[
                                 data?.email ?? null,
                                 data?.telegram ?? null,
                                 data?.telegramLabel ?? null,
                                 data?.github ?? null,
                                 data?.githubLabel ?? null,
                               ],client)
    }catch(error) {
        if (isTableNotFound(error)) helperLogger.error('Таблиці contacts не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці contacts')
        throw error
    }finally {
        /**
         * Повертаємо коннект знову в чергу
         */
        client.release()
    }
}

//==========================================================================================

/**
 * @summary getFaqByName - Отримати FAQ по імені сервісу до якого він відноситься
 * @param {string} name - Фронтенд відправлє імʼя сервісу щоб отримати його FAQ
 * @return ServiceFaqEntity[] - Масив FAQ щоб фронтенд міг їх показати адміністратору для наступних можливих операцій
 * @example
 *
 * const name = req.body
 * await getFaqByName(name)
 */
export async function getFaqByName(name: string): Promise<ServiceFaqEntity[] | void> {
    /**
     * client - Беремо 1 коннекст з бази даних щоб виконати операцію
     */
    const client = await pool.connect()
    try {
        /**
         *  serviceId - Отримавши назву сервісу ми беремо ID сервісу по його імені.
         */
        const serviceId = await queryOne(`SELECT id FROM services WHERE name = $1`,[name],servicesRowToEntity,client)
        if(!serviceId) {
            helperLogger.warn('Данного сервіса не існує',{name})
            return
        }
       const data = await queryMany(`SELECT * FROM service_faq WHERE service_id = $1`,[serviceId.id],serviceFaqRowToEntity,client)
        if(!data) {
            helperLogger.warn('Немає данних в таблиці service_faq')
            return;
        }
        return data;
    }catch(error) {
        if (isTableNotFound(error)) helperLogger.error('Таблиці service_faq або services не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці service_faq або services')
        throw error
    }finally {
        /**
         * Повертаємо коннект знову в чергу
         */
        client.release()
    }
}

//==========================================================================================

/**
 * @summary turnOnFaq - Ввімкнути FAQ
 * @param {number} id - id данного FAQ який потрібно вимкнути
 */
export async function turnOnFaq(id:number): Promise<void> {
    const client = await pool.connect()
    try {
        await executeVoid(`
                                UPDATE service_faq 
                                SET enabled = true 
                                WHERE id = $1
                                `,[id],client)
    }catch(error) {
        if (isTableNotFound(error)) helperLogger.error('Таблиці service_faq не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці service_faq')
        throw error
    }finally {
        client.release()
    }
}

//==========================================================================================
/**
 * @summary turnOffFaq - Вимкнути FAQ
 * @param {number} id - id данного FAQ який потрібно вимкнути
 */
export async function turnOffFaq(id: number): Promise<void> {
    const client = await pool.connect()
    try {
        await executeVoid(`
                                UPDATE service_faq 
                                SET enabled = false 
                                WHERE id = $1
                                `,[id],client)
    }catch(error) {
        if (isTableNotFound(error)) helperLogger.error('Таблиці service_faq не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці service_faq')
        throw error
    }finally {
        client.release()
    }
}

//==========================================================================================

/**
 * @summary turnOnFaq - Видалити FAQ
 * @param {number} id - id данного FAQ який потрібно Видалити
 */
export async function deleteFaq(id: number): Promise<void> {
    const client = await pool.connect()
    try {
        await executeVoid(`
                                DELETE FROM  service_faq 
                                WHERE id = $1
                                `,[id],client)
    }catch(error) {
        if (isTableNotFound(error)) helperLogger.error('Таблиці service_faq не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці service_faq')
        throw error
    }finally {
        client.release()
    }
}

//==========================================================================================

/**
 * @summary turnOnFaq - Змінити FAQ
 * @param {number} id - id данного FAQ який потрібно змінити
 * @param {ServiceFaqUpdate} data - Дані якими потрібно замінити старі дані в базі данних
 */
export async function editFaq(id: number, data: ServiceFaqUpdate): Promise<void> {
    const client = await pool.connect()
    try {
        await executeVoid(`
                                UPDATE service_faq 
                                SET enabled = $1,
                                    question = $2,
                                    answer = $3
                                WHERE id = $4
        `,[data.enabled,data.question,data.answer,id],client)
    }catch(error) {
        if (isTableNotFound(error)) helperLogger.error('Таблиці service_faq не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці service_faq')
        throw error
    }finally {
        client.release()
    }

}

//==========================================================================================

/**
 * @summary createFaq - Створити новий FAQ
 * @param {ServiceFaqInsert} data - Дані які відправляє фронтенд для вставлення в таблицю FAQ в базі даних
 * @example
 *
 * const data = req.body
 * await createFaq(data)
 */
export async function createFaq(data: ServiceFaqInsert): Promise<void> {
    const client = await pool.connect()
    try {
        await executeVoid(`
                        INSERT INTO service_faq (service_id,enabled,question,answer)  VALUES ($1,$2,$3,$4);
        `,[data.serviceId,data.enabled,data.question,data.answer],client)
    }catch(error) {
        if (isTableNotFound(error)) helperLogger.error('Таблиці service_faq не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці service_faq')
        throw error
    }finally {
        client.release()
    }
}

//==========================================================================================

export async function getServiceGallery() {
    const client = await pool.connect()
    try {
        return await queryMany(`SELECT * FROM service_gallery`,[],serviceGalleryRowToEntity,client)
    }catch(error) {
        if (isTableNotFound(error)) helperLogger.error('Таблиці service_gallery не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці service_gallery')
        throw error
    }finally {
        client.release()
    }
}
