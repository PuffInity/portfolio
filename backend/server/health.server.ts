import {ILogger} from "../utils/logger/interface.logger.js";
import {ConnectionsServer} from "./connections.server.js";


/**
 * @summary Класс слідкує за памʼятю та зʼєднаннями
 * @param {ILogger} logger - Логер потрібен для попереждення
 * @param {ConnectionsServer} connection - Класс який має в собі функцію по кількістю зʼєднань
 * @example const example = new HealthMonitor(logger,ConnectionServer)
 */
export class HealthMonitor {
    /**
     * timeout - Використовуємо для того щоб передати в нього Интервал і завжди мати можливість ним керувати
     * NodeJS.Timeout - тип який повертає  setInterval, setTimeout та SetImmediate()
     * За стандартом встановлюємо null
     * @private
     */
    private timeout: NodeJS.Timeout | null = null

    constructor(
        private logger: ILogger,
        private connection: ConnectionsServer,
    ) {}

    /**
     * @summary Тут встановлюємо щось типу датчика яки відповідає за те щоб ми завжди вчасно дізнались якщо наш додаток перевищить або наблизиться до ліміта памяті або зʼєднань
     * @example Запустити  example.start() або вимкнути example.stop
     */
    start() {
        const interval = setInterval(()=> {
            /**
             * process.memoryUsage() - Обєкт який відповіє за память на сервера
             * memUsed - Зміна яка зручно підраховує використану памʼять в MB
             */
            const memUsage = process.memoryUsage()
            const memUsed = Math.round(memUsage.heapUsed / 1024 / 1024)

            if (memUsed > 500) {
                this.logger.warn('Занадто багато памʼяті використовується!', {
                    memoryUserMB: memUsed,
                    /** memUsage.heapTotal - скільки всього виділено памʼяті*/
                    memoryTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
                    activeConnections: this.connection.getActiveCount(),
                })
            }
            if(this.connection.getActiveCount() > 1000) {
                this.logger.warn('Занадто багато зʼєднать!', {
                    activeConnection: this.connection.getActiveCount()
                });
            }
        },30000)
        /**
         * interval.unref() - Дуже важливо встановити воно каже - Можеш вимикати сервер в цьому Інтервалі немає нічого важливого
         * якщо його не встановити сервер зависне та чекатиме поки цей інтервал закінчіться
         */
        interval.unref()
        this.timeout = interval
    };

    /**
     * @summary Вимикає та скидає наш інтервал до null
     * @example example.stop()
     */
    stop() {
        if(this.timeout) {
            clearInterval(this.timeout);
            this.timeout = null;
            this.logger.info('Інтервал в HealthMonitor був очищений')
        }
    }
}