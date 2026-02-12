import {
    adminRow,
    adminEntity,
    adminInsert,
    adminUpdate
} from "../../types/admin.type.js";

import { toDate } from "./helper.mapp.js";

/**
 * @file admin.mapp.ts
 * @summary Перетворює дані адміністратора між форматами: Row ↔ Entity, Insert/Update → Row
 */

//==========================================================================================

/**
 * @summary adminRowToEntity - Трансформуємо "брудні" дані з таблиці в "чисті" (під бізнес-логіку)
 * @param {adminRow} row - Дані з таблиці (формат БД, snake_case)
 * @return adminEntity - Трансформовані дані для роботи в коді (формат проєкту, camelCase)
 */
export const adminRowToEntity = (row: adminRow): adminEntity => {
    return {
        id: row.id,
        login: row.login,
        passwordHash: row.password_hash,
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

//==========================================================================================

/**
 * @summary toInsertAdmin - Збирає дані, які були передані для вставки в таблицю
 * @param {adminInsert} d - Дані для створення адміністратора (формат проєкту)
 * @return Partial<adminRow> - Дані, підготовлені для INSERT в таблицю (формат БД)
 */
export const toInsertAdmin = (d: adminInsert) => {
    const out: Partial<adminRow> = {
        login: d.login,
        password_hash: d.passwordHash,
    };

    return out satisfies Partial<adminRow>;
};

//==========================================================================================

/**
 * @summary toUpdateAdmin - Збирає дані тільки ті, які реально були передані (для UPDATE)
 * @param {adminUpdate | undefined} patch - Необовʼязкові дані для оновлення полів адміністратора
 * @return Partial<adminRow> - Частковий обʼєкт у форматі БД, готовий для UPDATE
 */
export const toUpdateAdmin = (patch?: adminUpdate) => {
    const out: Partial<adminRow> = {};

    if (!patch) return out;

    if ("login" in patch && patch.login !== undefined) out.login = patch.login;
    if ("passwordHash" in patch && patch.passwordHash !== undefined) out.password_hash = patch.passwordHash;

    return out satisfies Partial<adminRow>;
};