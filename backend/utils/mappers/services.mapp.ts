import {
    ServicesRow,
    ServicesEntity,
    ServicesInsert,
    ServicesUpdate
} from "../../types/services.type.js";

import { toDate } from "./helper.mapp.js";

/**
 * @file services.mapp.ts
 * @summary Перетворює дані Services між форматами: Row ↔ Entity, Insert/Update → Row
 */

//==========================================================================================

/**
 * @summary servicesRowToEntity - Трансформуємо "брудні" дані з таблиці (snake_case) в "чисті" дані для коду (camelCase)
 * @param {ServicesRow} row - Дані з таблиці services (формат БД)
 * @return ServicesEntity - Трансформовані дані, готові для використання в коді
 */
export const servicesRowToEntity = (row: ServicesRow): ServicesEntity => {
    return {
        id: row.id,
        name: row.name,
        path: row.path,
        url: row.url,
        descriptions: row.description,
        priceLabel: row.price_label,
        iconHtml: row.icon_html,
        enabled: row.enabled,
        sortOrder: row.sort_order,
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

//==========================================================================================

/**
 * @summary toInsertServices - Збирає дані, які були передані для вставки в таблицю
 * @param {ServicesInsert} d - Дані для вставки (формат проєкту)
 * @return Partial<ServicesRow> - Дані для INSERT (формат БД)
 */
export const toInsertServices = (d: ServicesInsert) => {
    const out: Partial<ServicesRow> = {
        name: d.name,
        path: d.path,
        description: d.description,
        url: d.url,
    };

    if (d.priceLabel !== undefined) out.price_label = d.priceLabel;
    if (d.enabled !== undefined) out.enabled = d.enabled;
    if (d.iconHtml !== undefined) out.icon_html = d.iconHtml;
    if (d.sortOrder !== undefined) out.sort_order = d.sortOrder;

    return out satisfies Partial<ServicesRow>;
};

//==========================================================================================

/**
 * @summary toUpdateServices - Збирає дані тільки ті, які реально були передані (для UPDATE)
 * @param {ServicesUpdate | undefined} patch - Необовʼязкові поля для оновлення
 * @return Partial<ServicesRow> - Частковий обʼєкт у форматі БД, готовий для UPDATE
 */
export const toUpdateServices = (patch?: ServicesUpdate) => {
    const out: Partial<ServicesRow> = {};

    if (!patch) return out;

    if ("name" in patch && patch.name !== undefined) out.name = patch.name;
    if ("description" in patch && patch.description !== undefined) out.description = patch.description;
    if ("priceLabel" in patch && patch.priceLabel !== undefined) out.price_label = patch.priceLabel;
    if ("path" in patch && patch.path !== undefined) out.path = patch.path;
    if ("iconHtml" in patch && patch.iconHtml !== undefined) out.icon_html = patch.iconHtml;
    if ("enabled" in patch && patch.enabled !== undefined) out.enabled = patch.enabled;
    if ("sortOrder" in patch && patch.sortOrder !== undefined) out.sort_order = patch.sortOrder;

    return out satisfies Partial<ServicesRow>;
};