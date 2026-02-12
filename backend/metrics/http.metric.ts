import client from 'prom-client';

/**
 * @file http.metric.ts
 * @summary Збираємо метрики для Node
 */

/** Створюємо регистр в який будемо реєструвати метрики */
export const registryHttp = new client.Registry();

/** Автоматично збираємо дефолтні метрики для Node.js */
client.collectDefaultMetrics({
    register: registryHttp,
    prefix: 'app_',
    gcDurationBuckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
});

/** Збираємо інформацію про статус відповіді сервера клієнту  */
export const httpCounter = new client.Counter({
    name: 'app_http_requests_total',
    help: 'HTTP requests count',
    labelNames: ['method', 'route', 'status'] as const,
    registers: [registryHttp],
});
/** Збираємо інформацію про тривалість запитів */
export const httpDuration = new client.Histogram({
    name: 'app_http_request_duration_seconds',
    help: 'HTTP request latency (s)',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [registryHttp],
});
/** Збираємо інформацію про розмір HTTP відповіді */
export const httpRespSize = new client.Histogram({
    name: 'app_http_response_size_bytes',
    help: 'HTTP response size (bytes)',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [512, 2 * 1024, 8 * 1024, 32 * 1024, 128 * 1024, 512 * 1024, 1 * 1024 * 1024],
    registers: [registryHttp],
});

// Видача тексту для /metrics
export async function returnHttpMetrics() {
    return registryHttp.metrics();
}