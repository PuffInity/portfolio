import {
    MainPageRow,
    MainPageEntity,
    MainPageInsert,
    MainPageUpdate
} from "../../types/mainPage.type.js";

import { toDate } from "./helper.mapp.js";

/**
 * @file mainPage.mapp.ts
 * @summary Перетворює дані Main Page між форматами: Row ↔ Entity, Insert/Update → Row
 */

//==========================================================================================

/**
 * @summary mainPageRowToEntity - Трансформуємо "брудні" дані з таблиці (snake_case) в "чисті" дані для коду (camelCase)
 * @param {MainPageRow} row - Дані з таблиці main_page (формат БД)
 * @return MainPageEntity - Трансформовані дані, готові для використання в коді
 */
export const mainPageRowToEntity = (row: MainPageRow): MainPageEntity => {
    return {
        id: row.id,
        serviceId: row.service_id,
        title: row.title,
        subtitle: row.subtitle,
        bullets: row.bullets,
        image: row.image,
        btnText1: row.btn_text1,
        btnHref1: row.btn_href1,
        btnText2: row.btn_text2,
        btnHref2: row.btn_href2,
        servicesLead: row.services_lead,
        pricingLead: row.pricing_lead,
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

//==========================================================================================

/**
 * @summary toInsertMainPage - Збирає дані, які були передані для вставки в таблицю
 * @param {MainPageInsert} d - Дані для вставки (формат проєкту)
 * @return Partial<MainPageRow> - Дані для INSERT (формат БД)
 */
export const toInsertMainPage = (d: MainPageInsert) => {
    const out: Partial<MainPageRow> = {
        service_id: d.serviceId,
        title: d.title,
        subtitle: d.subtitle,
        bullets: d.bullets,
        image: d.image,
        btn_text1: d.btnText1,
        btn_href1: d.btnHref1,
        btn_text2: d.btnText2,
        btn_href2: d.btnHref2,
        services_lead: d.servicesLead,
        pricing_lead: d.pricingLead,
    };

    return out satisfies Partial<MainPageRow>;
};

//==========================================================================================

/**
 * @summary toUpdateMainPage - Збирає дані тільки ті, які реально були передані (для UPDATE)
 * @param {MainPageUpdate | undefined} patch - Необовʼязкові поля для оновлення
 * @return Partial<MainPageRow> - Частковий обʼєкт у форматі БД, готовий для UPDATE
 */
export const toUpdateMainPage = (patch?: MainPageUpdate) => {
    const out: Partial<MainPageRow> = {};

    if (!patch) return out;

    if ("title" in patch && patch.title !== undefined) out.title = patch.title;
    if ("subtitle" in patch && patch.subtitle !== undefined) out.subtitle = patch.subtitle;
    if ("bullets" in patch && patch.bullets !== undefined) out.bullets = patch.bullets;
    if ("image" in patch && patch.image !== undefined) out.image = patch.image;
    if ("btnText1" in patch && patch.btnText1 !== undefined) out.btn_text1 = patch.btnText1;
    if ("btnHref1" in patch && patch.btnHref1 !== undefined) out.btn_href1 = patch.btnHref1;
    if ("btnText2" in patch && patch.btnText2 !== undefined) out.btn_text2 = patch.btnText2;
    if ("btnHref2" in patch && patch.btnHref2 !== undefined) out.btn_href2 = patch.btnHref2;
    if ("servicesLead" in patch && patch.servicesLead !== undefined) out.services_lead = patch.servicesLead;
    if ("pricingLead" in patch && patch.pricingLead !== undefined) out.pricing_lead = patch.pricingLead;

    return out satisfies Partial<MainPageRow>;
};