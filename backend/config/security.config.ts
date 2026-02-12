import type { Application, RequestHandler } from "express";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import cookieParser from "cookie-parser";


import {createAppLogger} from "../utils/logger/logger.js";

/**
 * @file security.config.ts
 * @summary Файл який відповідає за безпеку проекта
 */

const securityLogger = createAppLogger({service: 'security'})
const isProd = process.env.NODE_ENV === 'production'

/**
 * @summary ствоюємо налаштування для rateLimit
 * @remarks
 *  можна тільки 10 запитів в 60 секунд також ставити корисні заголовки по типу який ліміт,скільки ще залишилось,Коли ліміт обнулиться
 *  також вимикає застарілі заголовки та відає користувачу текст якщо ліміт всетакі буде перевищено
 */
export const authLimiter: RequestHandler =
    rateLimit({
        windowMs: 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: "Занадто багато спроб входу!",
    });

/**
 * @summary Головна функція усіх конфігурацій безпеки
 * @param {Application} app - Передаємо туди головний app за допомогою якого наша конфігурацію стає дієздібною
 * @example app.use(applySecurity)
 */
export function applySecurity(app: Application): void {

    /**
     * app.use(express.json({ limit: "200kb" })); - Перетворює дані відправлені клієнтом в JSON та обмежує максимальний розмір 200kb
     */
    app.use(express.json({ limit: "200kb" }));
    /**
     *  app.use(express.urlencoded({ limit: "200kb", extended: false })); - Перетворює дані відправлені формою з фронтенда в JSON та обмежує макимальний розмір 200kb
     *  extended: false - Використовує вбудований модуль та може тільки перетворювати прості дані
     */
    app.use(express.urlencoded({ limit: "200kb", extended: false }));
    securityLogger.info('Body parser Ввімкнений',{limit: "200kb"})

    /**
     * app.use(cookieParser()) - зитує cookie, що дає нам змогу читати їх в будь якому роуті або middleware
     */
    app.use(cookieParser())
    securityLogger.info('Cookie parser Ввімкнений')

    /**
     * Домени з якими ми може "комунікувати"
     */
    const whitelist = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
        .split(",")
        .map(s => s.trim());

    /**
     * @summary Конфігурація для cors
     * credentials - Дозволяє браузеру надсилати cookie,токени,заголовки
     * methods - Явно вказуємо які дозволяємо методи
     * allowedHeaders - Явно вкузуємо які заголовки приймати від інших доменів
     * optionsSuccessStatus - Код відповідь на OPTIONS
     */
    app.use(cors({
        origin: (origin, cb) => {
            if (!origin || whitelist.includes(origin)) return cb(null, true);
            securityLogger.warn('Прийшов запит з незнайомого домена був заблокований',{ domain:origin})
            return  cb(new Error("Не двозволено CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["content-type", "authorization"],
        optionsSuccessStatus: 204,
    }));
    securityLogger.info('Cors Ввімкнений',{whitelist: whitelist})

    /**
     * @summary Конфігурація для helmet
     * contentSecurityPolicy - Контролює звідки дозволено завантажувати ресурси true - вмикає стандартні налаштування
     * frameguard - Забороняє вставлати наш сайт в фрейм інших сайтів
     * referrerPolicy - Браузер не відправляє  адресу джерела при переходах або запитах
     * hsts - Примушує браузер використовувати тільки https
     * crossOriginOpenerPolicy - Нові вкладки не можуть отримати доступ до контенту поточної сторінки якщо вони з іншого домену
     * crossOriginResourcePolicy - Дозволяє завантаження ресурсів тільки зі свого домену
     * crossOriginEmbedderPolicy - Ресурси повинні бути з тогож походження
     */
    app.use(helmet({
        contentSecurityPolicy: isProd ? { useDefaults: true } : false,
        frameguard: { action: "deny" },
        referrerPolicy: { policy: "no-referrer" },
        hsts: isProd ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        } : false,
        crossOriginOpenerPolicy: { policy: "same-origin" },
        crossOriginResourcePolicy: { policy: "same-origin" },
        crossOriginEmbedderPolicy: process.env.COEP_DISABLED ? false : undefined,
    }));

    securityLogger.info('Helmet Ввімкнутий', {
        csp: isProd ? 'Ввімкнутно' : 'Вимкнутно',
        hsts: isProd ? 'Ввімкнуто' : 'Вимкнутий',
        coepDisabled: Boolean(process.env.COEP_DISABLED)
    })

    /**
     * @summary rateLimit конфігурація
     * windowMs - 15 хвилин
     * max: Кількість запитів які дозволено здійснити за 15 хвилин
     * standardHeaders: Вімкнути стардантні заголовки по типу Скільки діє таймер, скільки залишилось дозволених запитів, скільки до кінця таймера
     * legacyHeaders: false - Вимикає застарілі заголовки
     * message - Якщо ліміт буде перевищено повернути повідомлення
     * handler - Наша власна функція яка логує користувача який перевищив ліміт та повертає помилку
     */
    app.use(rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: "Занадто багато запитів, спробуйте пізніше",
        handler: (req,res) => {
            securityLogger.warn('Ви перевищиои Rate Limit!', {
                ip: req.ip,
                method: req.method,
                originalUrl: req.originalUrl,
            });
            res.status(429).send('Занадто багато запитів, спробуйте пізніше')
        },
    }));
    securityLogger.info('Global rateLimit Ввімкнутий', {windowMs: 15 * 60 * 1000, max: 100})

    /**
     *  hpp() - контролює дані які відправляє нам користувач захищає нам від дубльованих параметрів
     */
    app.use(hpp());
    securityLogger.info('hpp Ввімкнутий')


}