import {
    AvatarTestimonialsRow,
    AvatarTestimonialsEntity,
    AvatarTestimonialsInsert,
    AvatarTestimonialsUpdate
} from "../../types/avatarTestimonials.type.js";

/**
 * @file avatarTestimonials.mapp.ts
 * @summary Перетворює дані аватарів для відгуків між форматами: Row ↔ Entity, Insert/Update → Row
 */

//==========================================================================================

/**
 * @summary avatarTestimonialsRowToEntity - Трансформуємо "брудні" дані з таблиці в "чисті" (під бізнес-логіку)
 * @param {AvatarTestimonialsRow} row - Дані з таблиці (формат БД)
 * @return AvatarTestimonialsEntity - Трансформовані дані для роботи в коді (формат проєкту)
 */
export const avatarTestimonialsRowToEntity = (row: AvatarTestimonialsRow): AvatarTestimonialsEntity => {
    return {
        id: row.id,
        name: row.name,
        url: row.url,
    };
};

//==========================================================================================

/**
 * @summary toInsertAvatarTestimonials - Збирає дані, які були передані для вставки в таблицю
 * @param {AvatarTestimonialsInsert} d - Дані для створення аватара (формат проєкту)
 * @return Partial<AvatarTestimonialsRow> - Дані, підготовлені для INSERT в таблицю (формат БД)
 */
export const toInsertAvatarTestimonials = (d: AvatarTestimonialsInsert) => {
    const out: Partial<AvatarTestimonialsRow> = {
        name: d.name,
        url: d.url,
    };

    return out satisfies Partial<AvatarTestimonialsRow>;
};

//==========================================================================================

/**
 * @summary toUpdateAvatarTestimonials - Збирає дані тільки ті, які реально були передані (для UPDATE)
 * @param {AvatarTestimonialsUpdate | undefined} patch - Необовʼязкові дані для оновлення аватара
 * @return Partial<AvatarTestimonialsRow> - Частковий обʼєкт у форматі БД, готовий для UPDATE
 */
export const toUpdateAvatarTestimonials = (patch?: AvatarTestimonialsUpdate) => {
    const out: Partial<AvatarTestimonialsRow> = {};

    if (!patch) return out;

    if ("name" in patch && patch.name !== undefined) out.name = patch.name;
    if ("url" in patch && patch.url !== undefined) out.url = patch.url;

    return out satisfies Partial<AvatarTestimonialsRow>;
};