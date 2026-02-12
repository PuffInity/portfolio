import {
    AboutMeRow,
    AboutMeEntity,
    AboutMeInsert,
    AboutMeUpdate
} from "../../types/aboutMe.type.js";

import { toDate } from "./helper.mapp.js";

/**
 * @file aboutMe.mapp.ts
 * @summary Перетворює дані About Me між форматами: Row ↔ Entity, Insert/Update → Row
 */

//==========================================================================================

/**
 * @summary aboutMeRowToEntity - Трансформує "брудні" дані з таблиці (snake_case) в "чисті" дані для коду (camelCase)
 * @param {AboutMeRow} row - Дані з таблиці (формат БД)
 * @return {AboutMeEntity} Трансформовані дані, готові для використання в коді
 */
export const aboutMeRowToEntity = (row: AboutMeRow): AboutMeEntity => {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        focusLabel: row.focus_label,
        focusValue: row.focus_value,
        stackLabel: row.stack_label,
        stackValue: row.stack_value,
        features: row.features,
        btnText1: row.btn_text1,
        btnHref1: row.btn_href1,
        btnText2: row.btn_text2,
        btnHref2: row.btn_href2,
        image: row.image,
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

//==========================================================================================

/**
 * @summary toInsertAboutMe - Збирає дані, які були передані для вставки в таблицю
 * @param {AboutMeInsert} d - Дані для вставки (формат проєкту)
 * @return {Partial<AboutMeRow>} Дані для INSERT (формат БД)
 */
export const toInsertAboutMe = (d: AboutMeInsert) => {
    const out: Partial<AboutMeRow> = {
        title: d.title,
        description: d.description,
        focus_label: d.focusLabel ?? null,
        focus_value: d.focusValue ?? null,
        stack_label: d.stackLabel ?? null,
        stack_value: d.stackValue ?? null,
        features: d.features ?? [],
        btn_text1: d.btnText1 ?? null,
        btn_href1: d.btnHref1 ?? null,
        btn_text2: d.btnText2 ?? null,
        btn_href2: d.btnHref2 ?? null,
        image: d.image ?? null,
    };

    return out satisfies Partial<AboutMeRow>;
};

//==========================================================================================

/**
 * @summary toUpdateAboutMe - Збирає дані тільки ті, які реально були передані (для UPDATE)
 * @param {AboutMeUpdate | undefined} patch - Необовʼязкові поля для оновлення
 * @return {Partial<AboutMeRow>} Частковий обʼєкт у форматі БД, готовий для UPDATE
 */
export const toUpdateAboutMe = (patch?: AboutMeUpdate) => {
    const out: Partial<AboutMeRow> = {};

    if (!patch) return out;

    if ("title" in patch && patch.title !== undefined) out.title = patch.title;
    if ("description" in patch && patch.description !== undefined) out.description = patch.description;
    if ("focusLabel" in patch && patch.focusLabel !== undefined) out.focus_label = patch.focusLabel;
    if ("focusValue" in patch && patch.focusValue !== undefined) out.focus_value = patch.focusValue;
    if ("stackLabel" in patch && patch.stackLabel !== undefined) out.stack_label = patch.stackLabel;
    if ("stackValue" in patch && patch.stackValue !== undefined) out.stack_value = patch.stackValue;
    if ("features" in patch && patch.features !== undefined) out.features = patch.features;
    if ("btnText1" in patch && patch.btnText1 !== undefined) out.btn_text1 = patch.btnText1;
    if ("btnHref1" in patch && patch.btnHref1 !== undefined) out.btn_href1 = patch.btnHref1;
    if ("btnText2" in patch && patch.btnText2 !== undefined) out.btn_text2 = patch.btnText2;
    if ("btnHref2" in patch && patch.btnHref2 !== undefined) out.btn_href2 = patch.btnHref2;
    if ("image" in patch && patch.image !== undefined) out.image = patch.image;

    return out satisfies Partial<AboutMeRow>;
};