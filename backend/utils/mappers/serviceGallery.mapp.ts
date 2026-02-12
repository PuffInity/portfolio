import {
    ServiceGalleryRow,
    ServiceGalleryEntity,
    ServiceGalleryInsert,
    ServiceGalleryUpdate
} from "../../types/servicesGallery.type.js";

import { toDate } from "./helper.mapp.js";

/**
 * @file serviceGallery.mapp.ts
 * @summary Перетворює дані Service Gallery між форматами: Row ↔ Entity, Insert/Update → Row
 */

//==========================================================================================

/**
 * @summary serviceGalleryRowToEntity - Трансформуємо "брудні" дані з таблиці (snake_case) в "чисті" дані для коду (camelCase)
 * @param {ServiceGalleryRow} row - Дані з таблиці service_gallery (формат БД)
 * @return ServiceGalleryEntity - Трансформовані дані, готові для використання в коді
 */
export const serviceGalleryRowToEntity = (row: ServiceGalleryRow): ServiceGalleryEntity => {
    return {
        id: row.id,
        serviceId: row.service_id,
        image: row.image,
        title: row.title,
        caption: row.caption,
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

//==========================================================================================

/**
 * @summary toInsertServiceGallery - Збирає дані, які були передані для вставки в таблицю
 * @param {ServiceGalleryInsert} d - Дані для вставки (формат проєкту)
 * @return Partial<ServiceGalleryRow> - Дані для INSERT (формат БД)
 */
export const toInsertServiceGallery = (d: ServiceGalleryInsert) => {
    const out: Partial<ServiceGalleryRow> = {
        service_id: d.serviceId,
        image: d.image,
        title: d.title,
        caption: d.caption,
    };

    return out satisfies Partial<ServiceGalleryRow>;
};

//==========================================================================================

/**
 * @summary toUpdateServiceGallery - Збирає дані тільки ті, які реально були передані (для UPDATE)
 * @param {ServiceGalleryUpdate | undefined} patch - Необовʼязкові поля для оновлення
 * @return Partial<ServiceGalleryRow> - Частковий обʼєкт у форматі БД, готовий для UPDATE
 */
export const toUpdateServiceGallery = (patch?: ServiceGalleryUpdate) => {
    const out: Partial<ServiceGalleryRow> = {};

    if (!patch) return out;

    if ("image" in patch && patch.image !== undefined) out.image = patch.image;
    if ("title" in patch && patch.title !== undefined) out.title = patch.title;
    if ("caption" in patch && patch.caption !== undefined) out.caption = patch.caption;

    return out satisfies Partial<ServiceGalleryRow>;
};