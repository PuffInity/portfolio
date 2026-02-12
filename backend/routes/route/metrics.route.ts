import {Router} from "express";
import {registryHttp, returnHttpMetrics} from "../../metrics/http.metric.js";
import {registryInitApp, returnInitMetrics} from "../../metrics/init.metric.js";
import client from "prom-client";

/**
 * @file metrics.route.ts
 * @summary Файл з роутами метрик
 */

const router = Router()

//==========================================================================================

/**
 * @summary Зʼєднуємо метрики в одну щоб легше передаватив роуті
 */
const mergedRegistry = client.Registry.merge([registryHttp,registryInitApp])

//==========================================================================================

/** Створюємо роутер з методом GET */
router.get('/', async (_req,res) => {
    // Попереждаємо браузер що передаємо метрики
    res.set('Content-Type', mergedRegistry.contentType);
    // Повертаємо метрики
    res.send(await mergedRegistry.metrics())
})

//==========================================================================================

export default router