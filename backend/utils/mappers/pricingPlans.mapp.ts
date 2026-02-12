import {
    PricingPlansRow,
    PricingPlansEntity,
    PricingPlansInsert,
    PricingPlansUpdate
} from "../../types/pricingPlans.type.js";

import { toDate } from "./helper.mapp.js";

/**
 * @file pricingPlans.mapp.ts
 * @summary Перетворює дані Pricing Plans між форматами: Row ↔ Entity, Insert/Update → Row
 */

//==========================================================================================

/**
 * @summary pricingPlansRowToEntity - Трансформуємо "брудні" дані з таблиці (snake_case) в "чисті" дані для коду (camelCase)
 * @param {PricingPlansRow} row - Дані з таблиці pricing_plans (формат БД)
 * @return PricingPlansEntity - Трансформовані дані, готові для використання в коді
 */
export const pricingPlansRowToEntity = (row: PricingPlansRow): PricingPlansEntity => {
    return {
        id: row.id,
        enabled: row.enabled,
        title: row.title,
        priceLabel: row.price_label,
        features: row.features,
        btnText: row.btn_text,
        btnHref: row.btn_href,
        badge: row.badge,
        badgeClass: null,
        popular: row.popular,
        sortOrder: row.sort_order,
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

//==========================================================================================

/**
 * @summary toInsertPricingPlans - Збирає дані, які були передані для вставки в таблицю
 * @param {PricingPlansInsert} d - Дані для вставки (формат проєкту)
 * @return Partial<PricingPlansRow> - Дані для INSERT (формат БД)
 */
export const toInsertPricingPlans = (d: PricingPlansInsert) => {
    const out: Partial<PricingPlansRow> = {
        enabled: d.enabled ?? false,
        title: d.title,
        price_label: d.priceLabel,
        features: d.features,
        btn_text: d.btnText,
        btn_href: d.btnHref,
        badge: d.badge,
        popular: d.popular ?? false,
        sort_order: d.sortOrder,
    };

    return out satisfies Partial<PricingPlansRow>;
};

//==========================================================================================

/**
 * @summary toUpdatePricingPlans - Збирає дані тільки ті, які реально були передані (для UPDATE)
 * @param {PricingPlansUpdate | undefined} patch - Необовʼязкові поля для оновлення
 * @return Partial<PricingPlansRow> - Частковий обʼєкт у форматі БД, готовий для UPDATE
 */
export const toUpdatePricingPlans = (patch?: PricingPlansUpdate) => {
    const out: Partial<PricingPlansRow> = {};

    if (!patch) return out;

    if ("enabled" in patch && patch.enabled !== undefined) out.enabled = patch.enabled;
    if ("title" in patch && patch.title !== undefined) out.title = patch.title;
    if ("priceLabel" in patch && patch.priceLabel !== undefined) out.price_label = patch.priceLabel;
    if ("features" in patch && patch.features !== undefined) out.features = patch.features;
    if ("btnText" in patch && patch.btnText !== undefined) out.btn_text = patch.btnText;
    if ("btnHref" in patch && patch.btnHref !== undefined) out.btn_href = patch.btnHref;
    if ("badge" in patch && patch.badge !== undefined) out.badge = patch.badge;
    if ("badgeClass" in patch && patch.badgeClass !== undefined) out.badgeClass = patch.badgeClass;
    if ("popular" in patch && patch.popular !== undefined) out.popular = patch.popular;
    if ("sortOrder" in patch && patch.sortOrder !== undefined) out.sort_order = patch.sortOrder;

    return out satisfies Partial<PricingPlansRow>;
};