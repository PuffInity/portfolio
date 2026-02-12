import {Server} from 'http'
import {ILogger} from "../utils/logger/interface.logger.js";
import {ConnectionsServer} from "./connections.server.js";
import {HealthMonitor} from "./health.server.js";
import {shutDownDb} from "./life-cycle/database.lifeCycle.js";
import {redisShutdown} from "./life-cycle/life-cycle.redis.js";
import {offApp} from "../metrics/init.metric.js";
import {nodemailerShutdown} from "./life-cycle/nodemailer.life-cycle.js";


/**
 * @summary Класс який відповідає за вимкнення сервера
 * @param {number} hardShutDownTimer - Через скільки часу треба вирубити сервер якщо основний виключатель не спрацював
 * @param {ILogger} logger - Логер потрібен для запису логів  в файл чи консоль
 * @param {Server} server - Сервер потрібен для використання методів та всластивостів сервера
 * @param {ConnectionsServer} connect - Класс який відповідає за керування зʼєднаннями та сокетами
 * @param {HealthMonitor} health - Класс який працює як датчик памʼяті та сокетів також має можливість відʼєднувати всіх сокетів
 * @example const example = new Shutdown(10000,logger,server,ConnectionsServer,HealthMonitor)
 */

export class Shutdown {
    /** Дачтик сервера
     * false - сервер працює
     * true - сервер вимикається
     * @private
     * */
    private isShutdown = false
    /**
     * timeout - Використовуємо для того щоб передати в нього Интервал і завжди мати можливість ним керувати
     * NodeJS.Timeout - тип який повертає  setInterval, setTimeout та SetImmediate()
     * За стандартом встановлюємо null
     * @private
     */
    private timeout: NodeJS.Timeout | null = null

    constructor(
        private hardShutdownTimer: number,
        private logger: ILogger,
        private server: Server,
        private connection: ConnectionsServer,
        private health: HealthMonitor,
    ) {
        this.setupRequestHandler()
    }

    /**
     * @summary Вставляє в заголовки запиту доп.заголовки що повідомляє сервер що цей запит відати і відразу його закрити
     * @remarks Коли користувач входить на будь яку сторінку на сервер надсилається запит якщо сервер в стані вимкнення
     * тобто змінна isShutDown = true тоді сервер коли відповідає клієнту додає до заголовків Connection close що значить
     * що сервер відправить відповідь але після цього відразу закриє TCP зʼєднання
     * @private
     */
    private setupRequestHandler() {
        /** request - Цю подію проходить кожен запит обовязково */
        this.server.on('request', (_req, res) => {
            if(this.isShutdown){
                /** setHeader - Додає до кожного запиту які проходять цей метод заголовки які ми вкажемо */
                res.setHeader('Connection','close')
            }
        });
    }
    /**
     * @summary Основний вимикач нашого сервера який закриває всі бібліотеки та все інше охайно та ретельно
     * @param {string} signal - Потрібно тільки для логування щоб ми розуміли хто викликав функцію зазвичай SIGTERM або SIGINT
     */
    async shutdown(signal?: string): Promise<void> {
        if(this.isShutdown) {
            this.logger.warn('Сервер вже вимикається,повторний сигнал був ігнорований', {signal: signal, status: this.isShutdown})
            return;
        }
        this.isShutdown = true
        this.logger.info('Сервер вимикається...', {signal: signal})

        try{
            this.health.stop()
        } catch {
            this.logger.debug('Таймер HealthMonitor в функції stop() видав помилку')
        }
        /**
         * Викликаємо setTimeout щоб запобігти зависаню, якщо за якиїсь виділений на це час код не перейде до методу close()
         * в тому випадку викличеться Timeout який ми створити нижче він закриє всі зʼєднання залогує скаже зачекай пропусти process.exit(1)
         * в цьому такті але виконай в наступному, це потрібно для того щоб логер та інші процеси мали можливість зробити свої справи до кінця
         */
        this.timeout = setTimeout(() => {

            try{ this.connection.forceCloseAll() }catch {this.logger.debug('Таймер connection в функціїї forceCloseAll() видав помилку')}

            this.logger.warn('Сервер не встиг завершити роботу, він буде негайно вимкнутий', {time: this.hardShutdownTimer})

            setImmediate(() => {
                process.exit(1)
            })
        }, this.hardShutdownTimer)
        /** ?.unref() якщо цей метод доступний тоді застосуй його,
         *  цей метод каже що створений нами timeout не є чимось важливим
         *  щоб не вимикати сервер, можешь вимкнути сервер навіть якщо timeout не очищений
         */
        this.timeout?.unref()

        /** server.close() він більше не дозволяє приймати нові запити, він чикає поки всі
         *  активні зʼєднання закінчать свою роботу і тільки після цього починає виконання коду
         */
        this.server.close(async  (err) => {
            if(this.timeout) {
                /** Очищаємо timeout */
                clearTimeout(this.timeout)
                this.timeout = null
            }

            if(err) {
                this.logger.error('Виникла помилка під час вимкнення сервера, буде викликано жортсоке вимкнення', {error: err})
                /** Теж саме що і трошку вище, він дає що один такт
                 *  та чикає поки він поверне resolve
                 * */
                await new Promise<void>(r => { setImmediate(r)})
                process.exit(1)
            }
            try {
                this.logger.info('Закриваємо сторонні бібліотеки...')

                await shutDownDb()

                await redisShutdown()

                await nodemailerShutdown()

                this.connection.forceCloseAll()

                this.logger.info('Стороні бібліотеки закриті')
            }catch(err) {
                /** Обробляємо повідомлення помилки для зручності */
                const message = err instanceof Error ? err.message : String(err)
                this.logger.error('Виникла помилка під час закриття всії стороніх бібліотек', {message: message})
            }
            offApp('1.0.0','Node.js')
            this.logger.info('Сервер успішно вимкнений')
            /** Викликаємо функції логера які дають ще один такт щоб дописати всі
             *  логи які чекали в черзі після чого закриває всі відкриті транспорти
             */
            await this.logger.flush?.()
            await this.logger.close?.()
            process.exit(0)
        })
    }
}