import {Server} from "http";
import {Socket} from 'net'
import {ILogger} from "../utils/logger/interface.logger.js";

/**
 * @summary Класс для керування сокетами та їх підключеням
 * @param {Server} server - Передаємо щоб мати змогу використовувати його методи в класі
 * @param {ILogger} logger - Передаємо для того щоб мати змогу записувати логи
 * @example const example = new ConnectionServer(server,logger)
 */
export class ConnectionsServer {
    private activeConnection  = new Set<Socket>();

    constructor(
        private server: Server,
        private logger: ILogger,
    ) {
        /** Встановлюємо щоб вона постійно була активна  */
        this.setupTracking()
    }

    /**
     * @summary При кожному підключені додає 1 підключений сокет до активних і також навпаки при кожному відключені видаляє 1 сокет з актвних
     * @remarks - Коли користувач підєднується викликається подія server.on('connection') яка реагує на кожне підключення
     * вона додає користувача до списку активних і вона триває до того моменту в клієнта поки не закриється коли вона починає закриватись
     * викливається подія socket.on('close') яка видаляє користувача з списку активних користувачів
     * @private
     */
    private setupTracking(): void {
        this.server.on('connection', (socket: Socket)=> {
            this.activeConnection.add(socket)
            socket.on('close', () => {
                this.activeConnection.delete(socket)
            })
        })
    }

    /**
     * @summary Відає кілкість активних користувачів
     * @public
     */
    public getActiveCount(): number {
        return this.activeConnection.size;
    }

    /**
     * @summary Закриває всіх користувачів якщо якісь підключені якщо ніхто не підключений запиняє виконання функції
     * @throws try/catch - повертає помилку в тому випадку якщо виникла помилка при закриті сокетів але не перестає виконання функції
     * @public
     */
    public forceCloseAll() {
        const connectionCount = this.activeConnection.size

        if(connectionCount === 0) {
            this.logger.info('Немає активних конектів для закриття');
            return;
        }
        this.logger.info('Для закриття знайдено конектів', {activeConnection: connectionCount})

        for(const socket of this.activeConnection) {
            try {
                socket.destroy()
            }catch(error) {
                const message = error instanceof Error ? error.message : String(error)
                this.logger.warn('Помилка при відключені сокетів', {message: message})
            }
        }
        this.activeConnection.clear()
        this.logger.info('Всі сокети були закриті')
    }
}