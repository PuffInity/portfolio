import http from "http";
import dotenv from 'dotenv'
import {createAppLogger} from "./utils/logger/logger.js";
import {ConnectionsServer} from "./server/connections.server.js";
import {HealthMonitor} from "./server/health.server.js";
import {ProcessHandlers} from "./server/process.server.js";
import {Shutdown} from "./server/shutdown.server.js";
import {StartServer} from "./server/start.server.js";
import {createConfig} from "./config/server/server.config.js";
import {applyTimeout} from "./config/server/timeouts.config.js";

import {onApp} from "./metrics/init.metric.js";
import {initDb} from "./server/life-cycle/database.lifeCycle.js";
import {redisInit} from "./server/life-cycle/life-cycle.redis.js";
import {nodemailerInit} from "./server/life-cycle/nodemailer.life-cycle.js";

/**
 * Зчитуємо всі env-файли
 */

if (!process.env.DOCKER) {
    dotenv.config({ path: ".env.local" });
}


/**
 * @file server.ts
 * @summary Головний файл ініцілізації проекта відповідає за запуск системи
 */

/**
 * @summary Створення обєекта логер який логує в файли
 * @param {string} service -  Сервис в якому працює данний логер
 */
const loggerServ = createAppLogger({service: 'Server'});

/**
 * @summary Створюємо конфігурацю сервера
 */
const config = createConfig(loggerServ)



async function bootstrap() {

    /**
     * @summary Запускаємо всі наші бібліотеки
     *
     */
    await redisInit()
    await initDb()
    await nodemailerInit()

    /**
     * @summary Імпортуємо app
     */
    const { default: app } = await import("./app.js");

    /**
     * @summary Створюємо обʼєкт сервера
     * http - Моудль який дозволяє створювати http сервера
     */
    const server = http.createServer(app)

    /**
     * @summary Підключаємо таймери
     */
    applyTimeout(server)

    /**
     * @summary Підключаємо класс який відповідає за зʼєднання сокеті та їх вікдлючення
     * @param server - Даємо север для регістрації подій
     * @param loggerServ - Даємо логер для логування в файли чи консоль
     */
    const connectionTracker = new ConnectionsServer(
        server,
        loggerServ,
    )

    /**
     * @summary Підключаємо класс який відповідає за моніторинг памʼяті та сокетів
     * @param loggerServ - Даємо логер для логування в файли чи консоль
     * @param ConectionTracker - Даємо класс ConnectionTracker щоб він міг дістати наявну кількість підʼєднатих сокетів
     */
    const healthMonitor = new HealthMonitor(
        loggerServ,
        connectionTracker,
    )
    /**
     * @summary Підключаємо класс який відповідає за ретельне вимкнення сервера
     * @param 70000 - Це 70 секунд які будуть вставлені в таймер який жорстоко вимкне сервер через 70 секунд якщо він зависне
     * @param loggerServ - Даємо логер для логування в файли чи консоль
     * @param server - Передаємо сервер щоб класс міг реєструвати події та працювтаи з ними
     * @param ConnectionTracker - Передаємо клас щоб він міг очистити рахунок сокетів та відʼєднати всіх
     * @param healthMonitor - Преедаємо класс щоб міг очистити таймер який встановлений в HealthMonitor
     */
    const gracefulShutdown = new Shutdown(
        70000,
        loggerServ,
        server,
        connectionTracker,
        healthMonitor,
    )

    /**
     * @summary Класс який реєструє події помилок
     * @param loggerServ - Даємо логер для логування в файли чи консоль
     * @param gracefulShutdown - Передаємо клас що він міг ретельно вимкнути сервер в разі необхідності
     */
    const processHandler = new ProcessHandlers(
        loggerServ,
        gracefulShutdown,
    )

    /**
     * @summary Класс який запускає сервер
     * @param server - Передаємо сервер щоб класс міг реєструвати події та працювтаи з ними
     * @param loggerServ - Даємо логер для логування в файли чи консоль
     * @param config - Передаємо конфіг щоб клас міг їх застосувати при необхідності
     * @param gracefulShutdown - Передаєио клас  в тому випадку якщо виникне помилка після якої потрібно вимкнути сервер
     */
    const start = new StartServer(
        server,
        loggerServ,
        config,
        gracefulShutdown,
    )
    onApp('1.0.0', 'Node.js')
}

bootstrap()

/**
 * @summary Передаємо на всяк випадок
 */
export {}