import {
    ContactRow,
    ContactEntity,
    ContactInsert,
    ContactUpdate
} from "../../types/contact.type.js";

import { toDate } from "./helper.mapp.js";

/**
 * @file contact.mapp.ts
 * @summary Перетворює дані контактів між форматами: Row ↔ Entity, Insert/Update → Row
 */

//==========================================================================================

/**
 * @summary contactRowToEntity - Трансформуємо "брудні" дані з таблиці (snake_case) в "чисті" дані для коду (camelCase)
 * @param {ContactRow} row - Дані з таблиці contact (формат БД)
 * @return ContactEntity - Трансформовані дані, готові для використання в коді
 */
export const contactRowToEntity = (row: ContactRow): ContactEntity => {
    return {
        id: row.id,
        email: row.email,
        telegram: row.telegram,
        telegramLabel: row.telegram_label,
        github: row.github,
        githubLabel: row.github_label,
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

//==========================================================================================

/**
 * @summary toInsertContact - Збирає дані, які були передані для вставки в таблицю
 * @param {ContactInsert} d - Дані для вставки (формат проєкту)
 * @return Partial<ContactRow> - Дані для INSERT (формат БД)
 */
export const toInsertContact = (d: ContactInsert) => {
    const out: Partial<ContactRow> = {
        email: d.email,
        telegram: d.telegram,
        telegram_label: d.telegramLabel,
        github: d.github,
        github_label: d.githubLabel,
    };

    return out satisfies Partial<ContactRow>;
};

//==========================================================================================

/**
 * @summary toUpdateContact - Збирає дані тільки ті, які реально були передані (для UPDATE)
 * @param {ContactUpdate | undefined} patch - Необовʼязкові поля для оновлення
 * @return Partial<ContactRow> - Частковий обʼєкт у форматі БД, готовий для UPDATE
 */
export const toUpdateContact = (patch?: ContactUpdate) => {
    const out: Partial<ContactRow> = {};

    if (!patch) return out;

    if ("email" in patch && patch.email !== undefined) out.email = patch.email;
    if ("telegram" in patch && patch.telegram !== undefined) out.telegram = patch.telegram;
    if ("telegramLabel" in patch && patch.telegramLabel !== undefined) out.telegram_label = patch.telegramLabel;
    if ("github" in patch && patch.github !== undefined) out.github = patch.github;
    if ("githubLabel" in patch && patch.githubLabel !== undefined) out.github_label = patch.githubLabel;

    return out satisfies Partial<ContactRow>;
};