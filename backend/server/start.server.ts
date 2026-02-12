import {Server} from "http";
import {ILogger} from "../utils/logger/interface.logger.js";
import {ConfigInterface} from "../config/server/server.config.js";
import {Shutdown} from "./shutdown.server.js";
import dotenv from 'dotenv'

/**
 * @summary Класс який відповідає за вимакання сервера
 * @param {Server} server - Обʼєкт сервера потрібен для налаштування події та інших його властивостів та методів
 * @param {ILogger} logger - Логер потрібен щоб ми могли записати в логи
 * @param {ConfigInterface} config - Конфігураційний файл з конфігурацією серверних опцій
 * @param {Shutdown} shutdown - Класс який відповідає за вимикання сервера
 * @example const example = new StartServer(server,logger,config,shutdown)
 */
export class StartServer  {
    constructor(
        private server: Server,
        private logger: ILogger,
        private config: ConfigInterface,
        private shutdown: Shutdown
    ) {
        this.start()
    }

    /**
     * @summary start - Функція тримає в собі логіку запуску сервера
     */
    public async start() {
        /** NodeJs.ErrnoException - Тип який повертає системні помилки це теж саме
         *  що і звичайний Error але цей має додаткові поля помилки він повертає
         *  тільки системні помилки які приходять від системи а не від коду
         *  чи користувача
         *
         *  Ми реєструмо подію 'error' -  до системних помилок якщо виникне
         *  системна помилка то подія переходить її
         */
        this.server.once('error', async (error: NodeJS.ErrnoException)=> {
            /** Якщо в системній помилкі немає listen тоді це не те що нам потрібно томущо воно не відповідатиме
             * за запуск сервера, в нашому випадку потрібно тільки помилки які повʼязані з стартом */
            if(error.syscall !== 'listen') {
                this.logger.error('Помилка сервера', {code: error.code, message: error.message, syscall: error.syscall})
                throw error
            }

            /** bind - Робимо акуратний вивід порта та провіряємо його тип повертаємо тип який зараз використовуємо */
            const bind = this.config.portType === 'port' ? `port: ${this.config.port}` : `pipe: ${this.config.port}`


            switch(error.code) {
                /** EACCES - Код помилки яка відповідає за доступ якщо виникла помилка то в нас недостатньо прав для цього порта */
                case 'EACCES':
                    this.logger.error(`Для ${bind} потрібрі права адміністратора`)
                    await this.shutdown.shutdown()
                    break;
                /** EADDRINUSE - Код помилки який виникає тільки якщо порт який
                 *  ми хочемо використати уже використовується будь-яким іншим додатком
                 */
                case 'EADDRINUSE':
                    this.logger.error(`Цей ${bind} уже використовується`)
                    await this.shutdown.shutdown()
                    break;
                default:
                    this.logger.error('Виникла помилка детальніше:', {
                        name: error.name,
                        message: error.message,
                        code: error.code,
                    })
                    await this.shutdown.shutdown()
            }
        })

        /** listening - Подія яка викликається в тому випадку якщо сервер успішно запущений
         *   коли ми запускаємо сервер по типу server.listen(3000,localhost) якшо все пройшло успішно
         *   запускається подія listening
         * */
        this.server.once('listening', () => {
            /** Адреса нашого сервера */
            const addr = this.server.address()
            const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`

            this.logger.info(`Сервера запущений на ${bind}`, {
                port: this.config.port,
                host: this.config.host,
                environment: this.config.environment,
                processId: process.pid,
                nodeVersion: process.version,
                timeouts: {
                    headers: this.server.headersTimeout,
                    request: this.server.requestTimeout,
                    keepAliveTimeout: this.server.keepAliveTimeout,
                    timeout: this.server.timeout,
                }
            })
        })
        /** Перевірка який зараз використовується порт, після перевірки запускаємо або на порті pipe або на порті port */
        if(this.config.portType === 'pipe') {
            this.server.listen(this.config.port)

        }else {
            this.server.listen(this.config.port as number, this.config.host)
        }
    }
}