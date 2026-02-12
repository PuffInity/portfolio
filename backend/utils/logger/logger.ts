import {createLogger, format as wformat, transports} from "winston";
import {ILogger, ILoggerFactory, WinstonLogger, LogContext, hasClose} from "./interface.logger.js";
import TransportStream from "winston-transport";
import {format as lformat, type TransformableInfo} from 'logform'
import DailyRotateFile from "winston-daily-rotate-file";
import path from 'path'
import fs from 'fs'
import {RequestContext} from "../requestId.utils.js";

/**
 * @file logger.ts
 * @summary Логер написаний на Winston з заміною чутливих даних та ротацією логів
 * @remarks
 * - В Dev стані читабельний кольоровий вивід в консоль
 * - В Prod JSON-Логи, щоденна ротація та стискання архівів
 * @example
 * const loggerExample = createAppLogger({service: 'Example',method: 'example'})
 * loggerExample.info('Текст для лога',{userId: 123, password: 'Example', userName})
 */


// Статус середовища
const isProd = process.env.NODE_ENV === 'production';

//  Файл в якому будуть збергатись логи
const logsDir = path.resolve('logs')
/**
 * @summary Перевіряємо наявність дерикторії лоя логів, створюємо при відсутності
 * existsSync() - Перевіряє чи існує дерикторія
 * mkdirSync() - Створює дерикторію
 * recursive - Створює всі структуру дерикторій якщо їх не існує, тобто створить не лише Саму дерикторію але й усі батьківські деркторії які потрібні щоб існувала основна дерикторія
 */
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, {recursive: true})
}

// Чутливі поля
const SENSITIVE = [
    'authorization',
    'email',
    'pass',
    'password',
    'hash',
    'token',
    'cookie',
    'cookies',
    'phone',
]


/**
 * @summary Функція для підміни чутливих полів в логах
 * @param {TransformableInfo} info - Це кожен наш лог зроблений в будь-якому іншому файлі
 * @returns {TransformableInfo} Повертаємо тіж самі логи тільки оброблені
 */
const redact = lformat((info: TransformableInfo) => {
    /**
     * @summary Підміняє всі чутливі поля
     * obj Передаємо лог ми не знаємо що очікувати тому unknown
     * includes - Провіряє чи існує поле в масиві/тексті/обєкті яке передасиш
     * some - Перевіряє чи хоча б один елемент задовільняє певну умову
     * toLowerCase - Перетворює весь текст в нижній регістр
     * @returns o - Повертаємо оброблений лог
     */
    const scrub = (obj: unknown): unknown => {
        if (!obj || typeof obj !== 'object') return obj
        const o = obj as Record<string, unknown>
        for (const k of Object.keys(o)) {
            const v = o[k]
            if (v && typeof v === 'object') o[k] = scrub(v)
            if (SENSITIVE.some(s => k.toLowerCase().includes(s.toLowerCase()))) o[k] = '[REDACTED]'
        }
        return o
    }
    scrub(info)
    return info
})

/**
 * @summary Обробляємо формат логів які будуть записані в дерикторію logs
 * @function redact() - Функція по обробці чутливих полів
 * timestamp - Додасть Час запису до лога
 * errors - При логуванні помилки автоматично додасть поля message,stack,level
 * json - Перетворить наш лог в JSON формат
 */
const fileFormat = wformat.combine(
    redact(),
    wformat.timestamp(),
    wformat.errors({stack: true}),
    wformat.json(),
)

/**
 * @summary Обробляємо формат логів які будуть виводитись в терміналі
 * @function redact - Функція по обробці чутливих полів
 * colorize - Додає колір логів уровням помилок
 * timestamp - Додасть Час запису до лога
 * printf - формат помилки
 */
const consoleFormat = wformat.combine(
    redact(),
    wformat.colorize(),
    wformat.timestamp({format: 'HH:mm:ss:SSS'}),
    wformat.printf(({timestamp, level, message, stack, ...meta}) => {
        const extra = Object.keys(meta).length ? `${JSON.stringify(meta)}` : "";

        return stack
            ? `[${timestamp}] ${level}: ${message}\n${stack} ${extra}`
            : `[${timestamp}] ${level}: ${message} ${extra}`
    })
)

/**
 * @summary Інструкція для ротації логів помилок
 * dirname - Назва папки де знаходитимуться файли з логами
 * filename - Назва файлу
 * datePattern - Формат дати
 * level - Який тип помилок записувати в цей файл
 * zippedArchive - Стискає ротаційні файли
 * maxSize - Скільки може максимум мати вагу файл якщо більше то буде здійснена ротація файла
 * maxFiles - Скільки житиме файл після чого буде здійснена ротація
 * format - Формат лога
 */
const errorFile = new DailyRotateFile({
    dirname: logsDir,
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    zippedArchive: true,
    maxSize: '10m',
    maxFiles: '30d',
    format: fileFormat,
})

/**
 * @summary Інструкція для ротації логів змішаних
 * dirname - Назва папки де знаходитимуться файли з логами
 * filename - Назва файлу
 * datePattern - Формат дати
 * zippedArchive - Стискає ротаційні файли
 * maxSize - Скільки може максимум мати вагу файл якщо більше то буде здійснена ротація файла
 * maxFiles - Скільки житиме файл після чого буде здійснена ротація
 * format - Формат лога
 */
const combinedFile = new DailyRotateFile({
    dirname: logsDir,
    filename: 'combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat
})

/**
 * @summary Головний файл створення логера
 * level - Рівень логів які потрібно бачити якщо продакшен то тільки info в інакшому випадку debug
 * transports - Вирішує куди саме записувати логи Файл/Консоль
 * exceptionHandlers - Інструкція для ротації логів які сталися неочікувано
 * rejectionHandlers - Інструкція для ротації логів які не були оброблені Promise
 */
export const logger = createLogger({
    level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
    format: isProd ? fileFormat : consoleFormat,
    transports: [
        ...(isProd ? [errorFile, combinedFile] : []),
        new transports.Console({format: consoleFormat}),
    ],
    exceptionHandlers: [
        new transports.Console({format: consoleFormat}),
        ...(isProd ? [new DailyRotateFile({
            dirname: logsDir,
            filename: 'exception-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '10m',
            maxFiles: '30d',
            format: fileFormat,
        })] : [])
    ],
    rejectionHandlers: [
        new transports.Console({format: consoleFormat}),
        ...(isProd ? [new DailyRotateFile({
            dirname: logsDir,
            filename: 'rejection-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '10m',
            maxFiles: '30d',
            format: fileFormat,
        })] : [])
    ]
});

/**
 * @summary Класс який виконує обіцянку ILogger потрібен для принципу Replaceability
 * @param {WinstonLogger} winston - Логер для запису в логи
 * @param {LogContext} baseContext - Допоміжні поля при створення лога
 * @function withCtx() - Доповнює лог request-id в тому випадку якщо він існує
 * @function info() - Рівень логу
 * @function debug() - Рівень логу
 * @function warn() - Рівень логу
 * @function error() - Рівень логу
 * @function flush() - Дає +1 такт при вимкнені серверу щоб I/O Встигли записати те що залишалось для запису
 * @function close() - Закриває всі транспорти логів забезпечує охайне закриття транспортів
 */
class WinstonLoggerAdapter implements ILogger {
    constructor(
        private winston: WinstonLogger,
        private baseContext: LogContext = {}
    ) {}

    private withCtx(meta: Record<string, unknown> = {}) {
        const requestId = RequestContext.getRequestId()
        return requestId ? {requestId, ...meta} : {...meta}
    }


    info(message: string, meta: Record<string, unknown> = {}): void {
        this.winston.info(message, this.withCtx({...this.baseContext, ...meta}))
    };

    debug(message: string, meta: Record<string, unknown> = {}): void {
        this.winston.debug(message, this.withCtx({...this.baseContext, ...meta}))
    };

    warn(message: string, meta: Record<string, unknown> = {}): void {
        this.winston.warn(message, this.withCtx({...this.baseContext, ...meta}))
    };

    error(message: string, meta: Record<string, unknown> = {}): void {
        this.winston.error(message, this.withCtx({...this.baseContext, ...meta}))
    };

    async flush(): Promise<void> {
        await new Promise<void>((resolve) => {
            setImmediate(() => resolve())
        })
    };

    async close(): Promise<void> {
        await this.flush()
        this.winston.close();

        const transports: ReadonlyArray<TransportStream> = this.winston.transports

        for (const t of transports) {
            try {
                t.end()
            } catch {
            }
            if (hasClose(t)) {
                try {
                    t.close()
                } catch {
                }
            }
        }
        await new Promise<void>(resolve => setTimeout(resolve, 25))
    }
}

/**
 * @summary Виконує обіцянку ILoggerFactory створює логер для запису
 * winstonLogger - Логер для запису в логи
 * context - Допоміжні поля при створення лога
 * @function createLogger() - Записує в логи
 */
export class AppLoggerFactory implements ILoggerFactory {
    constructor(private winstonLogger: WinstonLogger) {
    }
    createLogger(context: LogContext = {}): ILogger {
        return new WinstonLoggerAdapter(this.winstonLogger, context)
    }
}
// Створено класс AppLoggerFactory()
export const loggerFactory: ILoggerFactory = new AppLoggerFactory(logger)

// Функція для запису в логи
export const createAppLogger = (context?: LogContext): ILogger => {
    return loggerFactory.createLogger(context)
}