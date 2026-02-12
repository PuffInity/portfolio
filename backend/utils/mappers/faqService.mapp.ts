import {
    ServiceFaqRow,
    ServiceFaqEntity,
    ServiceFaqInsert,
    ServiceFaqUpdate
} from "../../types/serviceFaq.type.js";

import { toDate } from "./helper.mapp.js";

/**
 * @file faqService.mapp.ts
 * @summary Перетворює дані Service FAQ між форматами: Row ↔ Entity, Insert/Update → Row
 */

//==========================================================================================

/**
 * @summary serviceFaqRowToEntity - Трансформуємо "брудні" дані з таблиці (snake_case) в "чисті" дані для коду (camelCase)
 * @param {ServiceFaqRow} row - Дані з таблиці service_faq (формат БД)
 * @return ServiceFaqEntity - Трансформовані дані, готові для використання в коді
 */
export const serviceFaqRowToEntity = (row: ServiceFaqRow): ServiceFaqEntity => {
    return {
        id: row.id,
        serviceId: row.service_id,
        enabled: row.enabled,
        question: row.question,
        answer: row.answer,
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

//==========================================================================================

/**
 * @summary toInsertServiceFaq - Збирає дані, які були передані для вставки в таблицю
 * @param {ServiceFaqInsert} d - Дані для вставки (формат проєкту)
 * @return Partial<ServiceFaqRow> - Дані для INSERT (формат БД)
 */
export const toInsertServiceFaq = (d: ServiceFaqInsert) => {
    const out: Partial<ServiceFaqRow> = {
        service_id: d.serviceId,
        enabled: d.enabled,
        question: d.question,
        answer: d.answer,
    };

    return out satisfies Partial<ServiceFaqRow>;
};

//==========================================================================================

/**
 * @summary toUpdateServiceFaq - Збирає дані тільки ті, які реально були передані (для UPDATE)
 * @param {ServiceFaqUpdate | undefined} patch - Необовʼязкові поля для оновлення
 * @return Partial<ServiceFaqRow> - Частковий обʼєкт у форматі БД, готовий для UPDATE
 */
export const toUpdateServiceFaq = (patch?: ServiceFaqUpdate) => {
    const out: Partial<ServiceFaqRow> = {};

    if (!patch) return out;

    if ("enabled" in patch && patch.enabled !== undefined) out.enabled = patch.enabled;
    if ("question" in patch && patch.question !== undefined) out.question = patch.question;
    if ("answer" in patch && patch.answer !== undefined) out.answer = patch.answer;

    return out satisfies Partial<ServiceFaqRow>;
};