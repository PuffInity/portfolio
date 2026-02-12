import type {AppErrorOptions} from "./type.error.js";


/**
 * @summary Клас який створює кастомні користуваціькі помилки
 * @const {number} status - Статус помилки)
 * @const {string} code - Код помилки
 * @const {unknown} details - Деталі помилки
 * @param {string} message - Короткий опис помилки
 * @param {AppErrorOptions} opts - Обʼєкт помилки
 * @example throw ErrorApp.badRequest('Bad request', {code: 'USER_BAD_REQUEST'})
 */
export class ErrorApp extends Error {
    public readonly status: number;
    public readonly code?: string;
    public readonly details?: unknown;

    constructor(message: string, opts: AppErrorOptions) {
        /**
         * super(message) -  Тепер ми можемо використовувати методи батьківського класу та передаємо йому message
         */
        super(message);

        /**
         * Object.setPrototypeOf(this, new.target.prototype) - Пишемо для того щоб бути спокійними при перевірці чи є це помилкою?
         */
        Object.setPrototypeOf(this, new.target.prototype)
        this.name = new.target.name;
        this.status = opts.status ?? 500;
        this.code = opts.code
        this.details = opts.details;
        this.cause = opts.cause;


        Error.captureStackTrace?.(this, new.target)
    }

    /**
     * Короткий хелпер який створює кастомку помилку якщо був зроблений неправильний запит
     */
    static badRequest(message = 'Bad Request', opts: Omit<AppErrorOptions, "status"> = {}) {
        return new ErrorApp(message, {...opts, status: 400, code: opts.code ?? "BAD_REQUESTS"})
    };
    /**
     * Короткий хелпер який створює кастомку помилку якщо користувач неавторизований
     */
    static unauthorized(message = 'Unauthorized', opts: Omit<AppErrorOptions, "status"> = {}) {
        return new ErrorApp(message, {...opts, status: 401, code: opts.code ?? "UNAUTHORIZED"})
    };

    /**
     * Короткий хелпер який створює кастомну помилку якщо користувач використовує функціїї які йому недоступні
     */
    static forbidden(message = 'Forbidden', opts: Omit<AppErrorOptions, "status"> = {}) {
        return new ErrorApp(message, {...opts, status: 403, code: opts.code ?? "FORBIDDEN"})
    };

    /**
     * Короткий хелпер який створює кастомну помилку якщо користувач виконав запит або дію яка не була знайдена
     */
    static notFound(message = 'NotFound', opts: Omit<AppErrorOptions, "status"> = {}) {
        return new ErrorApp(message, {...opts, status: 404, code: opts.code ?? "NOT_FOUND"})
    };

    /**
     * Короткий хелпер який створює кастомну помилку якщо користувач або запит в базу створив якиїсь конфлікт з даними або чимось іншим
     */
    static conflict(message = "Conflict", opts: Omit<AppErrorOptions, "status"> = {}) {
        return new ErrorApp(message, {...opts, status: 409, code: opts.code ?? "CONFLICT"})
    };

    /**
     * Короткий хелпер який створює кастомну помилку якщо користувач зробив занадто багато запитів або якихось дій
     */
    static tooManyRequest(message = "Too Many Request", opts: Omit<AppErrorOptions, "status"> = {}) {
        return new ErrorApp(message, {...opts, status: 429, code: opts.code ?? "TOO_MANY_REQUEST"})
    }
}
