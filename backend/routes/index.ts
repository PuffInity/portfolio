import {Application} from "express";
import metricRouter from "./route/metrics.route.js";
import pagesRouter from './route/pages.route.js'
import {notFound} from "../middlewares/not-found.middleware.js";
import adminPanel from'./route/admin-panel.route.js'
import worksRouter from './route/main-works.route.js'
import adminLog from './route/admin-log.route.js'

/**
 * @file index.ts
 * @summary Файл в якому активовуємо всі роути
 */

/**
 * @summary Функція в якій активовуємо роути
 * @param {Application} app - Обʼєкт app передаємо в файлі app.ts
 */
export function activateRoutes(app: Application) {
    app.use('/metrics', metricRouter)

    app.use('/main', pagesRouter)

    app.use('/work', worksRouter)

    app.use('/admin', adminLog)

    app.use('/panel', adminPanel)

    app.use(notFound)
}