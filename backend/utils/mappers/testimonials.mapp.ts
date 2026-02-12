import {
    TestimonialsRow,
    TestimonialsEntity,
    TestimonialsInsert,
    TestimonialsUpdate
} from "../../types/testimonials.type.js";

import { toDate } from "./helper.mapp.js";

/**
 * @file testimonials.mapp.ts
 * @summary Перетворює дані Testimonials між форматами: Row ↔ Entity, Insert/Update → Row
 */

//==========================================================================================

/**
 * @summary testimonialsRowToEntity - Трансформуємо "брудні" дані з таблиці (snake_case) в "чисті" дані для коду (camelCase)
 * @param {TestimonialsRow} row - Дані з таблиці testimonials (формат БД)
 * @return TestimonialsEntity - Трансформовані дані, готові для використання в коді
 */
export const testimonialsRowToEntity = (row: TestimonialsRow): TestimonialsEntity => {
    return {
        id: row.id,
        serviceId: row.service_id,
        enabled: row.enabled,
        text: row.text,
        author: row.author,
        role: row.role,
        avatar: row.avatar,
        sortOrder: row.sort_order,
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

//==========================================================================================

/**
 * @summary toInsertTestimonials - Збирає дані, які були передані для вставки в таблицю
 * @param {TestimonialsInsert} d - Дані для вставки (формат проєкту)
 * @return Partial<TestimonialsRow> - Дані для INSERT (формат БД)
 */
export const toInsertTestimonials = (d: TestimonialsInsert) => {
    const out: Partial<TestimonialsRow> = {
        service_id: d.serviceId,
        enabled: d.enabled ?? false,
        text: d.text,
        author: d.author,
        role: d.role,
        avatar: d.avatar,
        sort_order: d.sortOrder ?? 0,
    };

    return out satisfies Partial<TestimonialsRow>;
};

//==========================================================================================

/**
 * @summary toUpdateTestimonials - Збирає дані тільки ті, які реально були передані (для UPDATE)
 * @param {TestimonialsUpdate | undefined} patch - Необовʼязкові поля для оновлення
 * @return Partial<TestimonialsRow> - Частковий обʼєкт у форматі БД, готовий для UPDATE
 */
export const toUpdateTestimonials = (patch?: TestimonialsUpdate) => {
    const out: Partial<TestimonialsRow> = {};

    if (!patch) return out;

    if ("enabled" in patch && patch.enabled !== undefined) out.enabled = patch.enabled;
    if ("text" in patch && patch.text !== undefined) out.text = patch.text;
    if ("author" in patch && patch.author !== undefined) out.author = patch.author;
    if ("role" in patch && patch.role !== undefined) out.role = patch.role;
    if ("avatar" in patch && patch.avatar !== undefined) out.avatar = patch.avatar;
    if ("sortOrder" in patch && patch.sortOrder !== undefined) out.sort_order = patch.sortOrder;

    return out satisfies Partial<TestimonialsRow>;
};