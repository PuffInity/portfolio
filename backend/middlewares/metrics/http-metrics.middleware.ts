import type {Request, Response, NextFunction} from "express";
import {httpCounter, httpDuration, httpRespSize} from "../../metrics/http.metric.js";


/**
 * @file http-metrics.middleware.ts
 * @summary middleware який збираємо http метрики
 *
 */

/**
 * @summary Функція яка повертає шлях сторінки до якої здійснився http запит
 */
export function getRouteTemplate(req: Request): string {
    return (req.route?.path as string)
        ?? (req.baseUrl || req.path)
        ?? 'unknown'
}

/**
 * @summary Функція яка повертає статус який повернув сервер при закінченні http запиту
 */
export function getStatusLabel(res: Response): string {
return String(res.statusCode || 0)
}

/**
 * @summary Функція яка повертає розмір запиту в байтах
 */
export function getResponseSize(res: Response): number {
    const header = res.getHeader('content-length')
    if (typeof header === 'string') return parseInt(header, 10) || 0;
    if (typeof header === 'number') return  header
    return 0
}

/**
 * @summary middleware через який проходить кожен запит
 *
 */
export function metricsHttpNodeMiddleware(req: Request, res: Response, next: NextFunction) {
    /** Вмикаємо високоточний таймер який повертає час в наносекундах */
    const startNs = process.hrtime.bigint()

    res.on('finish', () => {
        /** Коли запит закінчився чи віднімаємо теперішній час від часу коли запит почався та ділимо на 1 Мілліард Тобто | Час коли закінчився запит - Час коли почався запит = Час скільки здійсювався запит  */
        const durSec = Number(process.hrtime.bigint() - startNs) / 1e9
        /** Отримуємо метод запиту */
        const method = req.method
        /** Отримуємо шлях запиту */
        const route = getRouteTemplate(req);
        /** Отримуємо Статус запиту */
        const status = getStatusLabel(res)
        /** Отримуємо Розмір запиту */
        const size = getResponseSize(res)
        /** Будуємо структуру яку будемо давати в метрики */
        const labels = {method, route, status};

        /** фіксуємо скільки було запитів до якогось Http роута */
        httpCounter.inc(labels)
        /** Міряємо тривалість запиту */
        httpDuration.observe(labels,durSec)
        /** Отримуємо розмір запиту */
        httpRespSize.observe(labels, size)
    })
    /** Передаємо далі */
    next()
}