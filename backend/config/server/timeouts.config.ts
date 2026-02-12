import {Server} from 'http';

/**
 * @summary Застосовуємо головні Timeout всі як потрібно
 * @param {Server} server - Передаємо обєкт server для того щоб застосувати відразу в функціїї
 * @example applyTimeout(server)
 */
export const applyTimeout = (server: Server) => {
    /** Максимальний час очікування всіх заголовків від клієнта - 10 секунд */
    server.headersTimeout = 1000 * 10;
    /** Максимальний час очікування на отримання повного http запиту 30 секунд */
    server.requestTimeout = 1000 * 30;
    /** Скільки сервер чикає на ще один запит перед тим як закрити сокет  60 секунд */
    server.keepAliveTimeout = 1000 * 60;
    /** В любому випадку закрити сокет 65 секунд */
    server.timeout = 1000 * 65;
}