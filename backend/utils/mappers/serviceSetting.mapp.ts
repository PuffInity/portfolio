import {
    ServiceSettingRow,
    ServiceSettingEntity,
    ServiceSettingInsert,
    ServiceSettingUpdate
} from "../../types/serviceSetting.type.js";

import { toDate } from "./helper.mapp.js";

/**
 * @file serviceSetting.mapp.ts
 * @summary Перетворює дані Service Setting між форматами: Row ↔ Entity, Insert/Update → Row
 */

//==========================================================================================

/**
 * @summary serviceSettingRowToEntity - Трансформуємо "брудні" дані з таблиці (snake_case) в "чисті" дані для коду (camelCase)
 * @param {ServiceSettingRow} row - Дані з таблиці service_setting (формат БД)
 * @return ServiceSettingEntity - Трансформовані дані, готові для використання в коді
 */
export const serviceSettingRowToEntity = (row: ServiceSettingRow): ServiceSettingEntity => {
    return {
        id: row.id,
        serviceId: row.service_id,
        contactId: row.contact_id,
        discount: row.discount,
        include: row.include,
        additional: row.additional,
        price_title: row.price_title,
        price_subtitle: row.price_subtitle,
        price: row.price,
        terms: row.terms,
        quickStart: row.quickstart,
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

//==========================================================================================

/**
 * @summary toInsertServiceSetting - Збирає дані, які були передані для вставки в таблицю
 * @param {ServiceSettingInsert} d - Дані для вставки (формат проєкту)
 * @return Partial<ServiceSettingRow> - Дані для INSERT (формат БД)
 */
export const toInsertServiceSetting = (d: ServiceSettingInsert) => {
    const out: Partial<ServiceSettingRow> = {
        service_id: d.serviceId,
        contact_id: d.contactId,
        discount: d.discount,
        include: d.include,
        additional: d.additional,
        price_title: d.price_title,
        price_subtitle: d.price_subtitle,
        price: d.price,
        terms: d.terms,
        quickstart: d.quickStart,
    };

    return out satisfies Partial<ServiceSettingRow>;
};

//==========================================================================================

/**
 * @summary toUpdateServiceSetting - Збирає дані тільки ті, які реально були передані (для UPDATE)
 * @param {ServiceSettingUpdate | undefined} patch - Необовʼязкові поля для оновлення
 * @return Partial<ServiceSettingRow> - Частковий обʼєкт у форматі БД, готовий для UPDATE
 */
export const toUpdateServiceSetting = (patch?: ServiceSettingUpdate) => {
    const out: Partial<ServiceSettingRow> = {};

    if (!patch) return out;

    if ("discount" in patch && patch.discount !== undefined) out.discount = patch.discount;
    if ("include" in patch && patch.include !== undefined) out.include = patch.include;
    if ("additional" in patch && patch.additional !== undefined) out.additional = patch.additional;
    if ("price_title" in patch && patch.price_title !== undefined) out.price_title = patch.price_title;
    if ("price_subtitle" in patch && patch.price_subtitle !== undefined) out.price_subtitle = patch.price_subtitle;
    if ("price" in patch && patch.price !== undefined) out.price = patch.price;
    if ("terms" in patch && patch.terms !== undefined) out.terms = patch.terms;
    if ("quickStart" in patch && patch.quickStart !== undefined) out.quickstart = patch.quickStart;

    return out satisfies Partial<ServiceSettingRow>;
};