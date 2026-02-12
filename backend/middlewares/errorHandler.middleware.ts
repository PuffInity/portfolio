import type {ErrorRequestHandler} from 'express'
import createError from 'http-errors'
import {z, ZodError} from "zod";
import {ErrorApp} from "../error/app.error.js";
import {StrictErrorHandler,ErrorResponse} from '../error/type.error.js'
import {createAppLogger} from "../utils/logger/logger.js";

/**
 * @file Головний error-handler - перехоплює всі помилки які ми передаємо
 */

/**
 * Створюємо наш логер для запису в файл або консоль
 */
const errorLogger = createAppLogger({service:'Error-Handler'})

/**
 * @summary Функція яка робить перевірку чи це помилка типу HttpError
 */
function isHttpError(err: unknown): err is createError.HttpError {
    return (
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        "message" in err
    );
}

/**
 * @summary Функція яка робить перевірку чи це помилка JsonParse
 */
function isJsonParseError(e: unknown): e is { type: 'entity.parse.failed'; message?: string } {
    return (
        typeof e === "object"
        && e !== null
        && "type" in e
        && (e as { type?: unknown }).type === "entity.parse.failed"
    );
}

/**
 * @summary Функція яка робить перевірку на помилку та відає корректний статус
 */
function statusFromError(err: unknown): number {
    if (err instanceof ErrorApp) return err.status;
    if (isHttpError(err)) return err.status ?? 500;
    if (err instanceof ZodError) return 400;
    if (isJsonParseError(err)) return 400;
    return 500
}

/**
 * @summary Функція яка робить перевірку на тип помилки та відає корректний обʼєкт помилки
 */
function shapeResponse(err: unknown): ErrorResponse {
    /**
     * base - Завжди false  так як це помилка
     */
    const base = {ok: false as const};

    /**
     * Провіряє чи це не наша кастомна помилка створена классом ErrorApp
     */
    if (err instanceof ErrorApp) {
        return {
            ...base,
            error: {
                type: "app",
                code: err.code ?? "APP_ERROR",
                message: err.message,
                details: err.details,
            },
        };
    }
    /**
     * Провіряє чи ця помилка прийшла від HttpError
     */
    if (isHttpError(err)) {
        return {
            ...base,
            error: {
                type: 'http',
                code: err.name,
                message: err.message,
            },
        };
    }
    /**
     * Перевіряє чи це помилка ZodError
     */
    if (err instanceof ZodError) {
        const {formErrors, fieldErrors} = z.flattenError(err);

        return {
            ...base,
            error: {
                type: 'validation',
                code: "BAD_REQUEST",
                message: "Validation failed",
                details: {formErrors, fieldErrors}
            },
        };
    }
    /**
     * Провіряє чи це помилка від  JsonParse
     */
    if (isJsonParseError(err)) {
        return {
            ...base,
            error: {
                type: 'parse',
                code: 'INVALID_JSON',
                message: "Invalid JSON payload"
            },
        };
    }

    /**
     * Якщо нічого не пройшло перевірку то функція видасть цей обʼєкт помилки
     */
    return {
        ...base,
        error: {
            type: "internal",
            code: "INTERNAL_SERVER_ERROR",
            message: "Internal Server Error"
        }
    }
}

/**
 * @summary Функція яка вирішує що робити далі з помилкою
 * @param {unknown} err - Помилка
 * @param {Request} req - HTTP запит
 * @param {Response} res - HTTP відповідь
 * @param {NextFunction} _next - Передати далі(Не використовується потрібно тільки що доповнити middleware)
 */
const strictErrorHandler: StrictErrorHandler = (err, req, res, _next) => {

    /**
     * status - Перетворюємо в корректний статус за допомогою нашої функуціїї
     */
    const status = statusFromError(err);

    /**
     * body - Отримуємо корректний обʼєкт помилки за допомогою нашої функції
     */
    const body = shapeResponse(err);

    /**
     * Робимо перевірку чи ми маємо request-id в запиті якщо так так то приєднуємо його до обʼєкта помилки
     */
    const requestId = req.get('X-Request-Id') ?? undefined;
    if (requestId) {
        (body as { requestId?: string }).requestId = requestId;
    }

    /**
     * Робимо перевірку чи ми в середовищі розробки якщо так тоді перевіряємо чи це помилка ті чи має поле err.stack
     * якщо все ок тоді приєднуємо до обʼєкта помилки сам err.stack
     */
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev && err instanceof Error && err.stack) {
        (body as { error: { stack?: string } }).error.stack = err.stack
    }

    /**
     * Перевіряємо якщо статус 500 або більше логуємо як помилку сервера
     * якщо меньше 500 тоді логуємо як помилку клієнта
     */
    if(status >= 500) {
        errorLogger.error('Unhandled server error', {
            error: err,
            status: status,
            path: req.url,
            method: req.method,})
    }else{
        errorLogger.warn('Client error', {
            error: err,
            status: status,
            path: req.url,
            method: req.method
        })
    }



    res.status(status).json(body)
}

export const errorHandler: ErrorRequestHandler = strictErrorHandler as unknown as ErrorRequestHandler