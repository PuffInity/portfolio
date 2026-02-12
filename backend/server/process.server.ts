import {Shutdown} from "./shutdown.server.js";
import {ILogger} from "../utils/logger/interface.logger.js";

/**
 * @summary Класс який відповідає за процесси вимикання
 * @param {ILogger} logger - Логер яким ми записуємо логи в файли або консоль
 * @param {Shutdown} shutdownServer - Класс який вимикає сервер
 * @example const example = new ProcessHandlers(logger,Shutdown)
 */
export class ProcessHandlers {

    constructor(
        private logger: ILogger,
        private shutdownServer: Shutdown,
    ) {
        this.handlersProcess()
    }

    /**
     * @summary Функція яка реєструє 4 події
     */
    public handlersProcess(){
        /**
         * SIGTERM - Подія яка викливається сторонім додатком по типу Docker або чимось іншим
         * викликає звичайне ретельне вимкнення сервера
         */
        process.once('SIGTERM',async () => {
            try{
                await this.shutdownServer.shutdown('SIGTERM')
            }catch(err) {
                /** Робимо чітку помилку з урахуванням типа unknown */
                const error = err instanceof Error ? {message: err.message, stack: err.stack} : String(err)
                this.logger.error('Помилка події SIGTERM', {err: error})
                /** Якщо this.shutdownServer.shutdown не спрацював, викликаємо жорстоке відключення  */
                process.exit(1)
            }
        })
        /** SIGINT - Це теж саме що і SIGTERM тільки SIGINT викликається нами за допомогою клавіш Ctrl+C на Windows або control+C на Mac*/
        process.once('SIGINT', async () => {
            try {
                await this.shutdownServer.shutdown('SIGINT')
            }catch(err) {
                /** Робимо чітку помилку з урахуванням типа unknown */
                const error = err instanceof Error ? {message: err.message, stack: err.stack} : String(err)
                this.logger.error('Помилка події SIGINT', {err: error})
                /** Якщо this.shutdownServer.shutdown не спрацював, викликаємо жорстоке відключення  */
                process.exit(1)
            }
        })

        /** uncaughtException - Подія викликається в випадку необробленої синхроної помилки */
        process.on('uncaughtException', async (error) => {
            this.logger.error('Виникла неочікувана помилка',{
                message: error.message,
                stack: error.stack,
            });
            try {
                await this.shutdownServer.shutdown('uncaughtException')
            } catch(err) {
                /** Робимо чітку помилку з урахуванням типа unknown */
                const error = err instanceof Error ? {message: err.message, stack: err.stack} : String(err)
                this.logger.error('Виникла помилка події uncaughtException', {err: error})
                /** Якщо this.shutdownServer.shutdown не спрацював, викликаємо жорстоке відключення  */
                process.exit(1)
            }
        })

        /** unhandledRejection - Подія яка викликається в випадку необробленої асинхроної помилки */
        process.on('unhandledRejection', async (reason,_promise) => {
            this.logger.error('Виникла неочікувана promise помилка', {
                /** Робимо провірку чи reason є тип Error якщо так тоді створюємо обʼєкт який який містить всі потрібні обʼєкти для логування */
                reason: reason instanceof Error ? {name: reason.name, message: reason.message, stack: reason.stack} : String(reason)
            })
            try {
                await this.shutdownServer.shutdown('unhandledRejection')
            } catch(err) {
                /** Робимо чітку помилку з урахуванням типа unknown */
                const error = err instanceof Error ? {message: err.message, stack: err.stack} : String(err)
                this.logger.error('Виникла помилка події unhandledRejection', {err: error})
                /** Якщо this.shutdownServer.shutdown не спрацював, викликаємо жорстоке відключення  */
                process.exit(1)
            }
        })
    }
}