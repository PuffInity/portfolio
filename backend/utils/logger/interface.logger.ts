import {Logger} from "winston";
import TransportStream from "winston-transport";

/**
 * @file interface.logger.ts
 * @summary  Інтерфейси/Обіцянки для головного логера потрібно для створення обіцянок
 */

/**
 * @summary Обіцянка з рівнями логів
 */
export interface ILogger {
    info(t: string, context?: Record<string, unknown>): void
    debug(t: string, context?: Record<string, unknown>): void
    warn(t: string, context?: Record<string, unknown>): void
    error(t: string, context?: Record<string, unknown>): void
    flush(): Promise<void>
    close(): Promise<void>
}

/**
 * @summary обіцянка створення логера
 */
export interface ILoggerFactory {
    createLogger(context?: Record<string, unknown>): ILogger
}

/**
 * @summary  Інтерфейс для підказок при створенні лога
 */
export interface LogContext {
    userId?: number,
    locale?: string,
    endPoint?: string,
    service?: string,
    method?: string,
    [key: string]: unknown
}

/**
 * @summary Тип Логера
 */
export type WinstonLogger = Logger


/**
 * @summary Додаємо до TransportStream поле close
 * @TransportStream Обіцянка для всі інших транспортів які будуть створені
 */
export type ClosableTransport = TransportStream & {close: () => void}

/**
 * @summary Доказуємо що в Наших транспортах існує метод close()
 */
export function hasClose(t:TransportStream): t is ClosableTransport {
    return 'close' in t && typeof (t as {close: unknown}).close === 'function'
}