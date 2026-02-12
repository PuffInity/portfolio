import {
    ServiceHeroEntity,
    ServiceHeroInsert,
    ServiceHeroUpdate,
    ServiceHeroRow
} from "../../types/serviceHero.type.js";

import { toDate } from "./helper.mapp.js";

/**
 * @file serviceHero.mapp.ts
 * @summary Перетворює дані Service Hero між форматами: Row ↔ Entity, Insert/Update → Row
 */

//==========================================================================================

/**
 * @summary serviceHeroRowToEntity - Трансформуємо "брудні" дані з таблиці (snake_case) в "чисті" дані для коду (camelCase)
 * @param {ServiceHeroRow} row - Дані з таблиці service_hero (формат БД)
 * @return ServiceHeroEntity - Трансформовані дані, готові для використання в коді
 */
export const serviceHeroRowToEntity = (row: ServiceHeroRow): ServiceHeroEntity => {
    return {
        id: row.id,
        serviceId: row.service_id,
        title: row.title,
        lead: row.lead ?? null,
        image: row.image ?? null,
        btnHref1: row.btn_href1 ?? null,
        btnText1: row.btn_text1 ?? null,
        btnHref2: row.btn_href2 ?? null,
        btnText2: row.btn_text2 ?? null,
        duration: row.duration ?? null,
        executor: row.executor ?? null,
        priceHero: row.price_hero ?? null,
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

//==========================================================================================

/**
 * @summary toInsertServiceHero - Збирає дані, які були передані для вставки в таблицю
 * @param {ServiceHeroInsert} d - Дані для вставки (формат проєкту)
 * @return Partial<ServiceHeroRow> - Дані для INSERT (формат БД)
 */
export const toInsertServiceHero = (d: ServiceHeroInsert) => {
    const out: Partial<ServiceHeroRow> = {
        service_id: d.serviceId,
        title: d.title,
    };

    if (d.lead !== undefined) out.lead = d.lead;
    if (d.image !== undefined) out.image = d.image;
    if (d.btnHref1 !== undefined) out.btn_href1 = d.btnHref1;
    if (d.btnText1 !== undefined) out.btn_text1 = d.btnText1;
    if (d.btnHref2 !== undefined) out.btn_href2 = d.btnHref2;
    if (d.btnText2 !== undefined) out.btn_text2 = d.btnText2;
    if (d.duration !== undefined) out.duration = d.duration;
    if (d.executor !== undefined) out.executor = d.executor;
    if (d.priceHero !== undefined) out.price_hero = d.priceHero;

    return out satisfies Partial<ServiceHeroRow>;
};

//==========================================================================================

/**
 * @summary toUpdateServiceHero - Збирає дані тільки ті, які реально були передані (для UPDATE)
 * @param {ServiceHeroUpdate | undefined} patch - Необовʼязкові поля для оновлення
 * @return Partial<ServiceHeroRow> - Частковий обʼєкт у форматі БД, готовий для UPDATE
 */
export const toUpdateServiceHero = (patch?: ServiceHeroUpdate) => {
    const out: Partial<ServiceHeroRow> = {};

    if (!patch) return out;

    if ("title" in patch && patch.title !== undefined) out.title = patch.title;
    if ("lead" in patch && patch.lead !== undefined) out.lead = patch.lead;
    if ("image" in patch && patch.image !== undefined) out.image = patch.image;
    if ("btnHref1" in patch && patch.btnHref1 !== undefined) out.btn_href1 = patch.btnHref1;
    if ("btnText1" in patch && patch.btnText1 !== undefined) out.btn_text1 = patch.btnText1;
    if ("btnHref2" in patch && patch.btnHref2 !== undefined) out.btn_href2 = patch.btnHref2;
    if ("btnText2" in patch && patch.btnText2 !== undefined) out.btn_text2 = patch.btnText2;
    if ("duration" in patch && patch.duration !== undefined) out.duration = patch.duration;
    if ("executor" in patch && patch.executor !== undefined) out.executor = patch.executor;
    if ("priceHero" in patch && patch.priceHero !== undefined) out.price_hero = patch.priceHero;

    return out satisfies Partial<ServiceHeroRow>;
};