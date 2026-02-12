import client from "prom-client";

/**
 * @file init.metric.ts
 */

/** Створюємо контейнер для метрик */
export const registryInitApp = new client.Registry

/** Будуємо кастомний перемикач Інстансів */
const buildInfo = new client.Gauge({
    name: 'app_build_info',
    help: 'Build/instance metadata',
    labelNames: ['version', 'hostname'] as const,
    registers: [registryInitApp],
});

/**
 * @summary Функція яка вмикає додаток в метриках
 */
export function onApp (version: string, hostname: string) {
    buildInfo.labels(version,hostname).set(1)
}
/**
 * @summary Функція яка вимикає додаток в метриках
 */
export function offApp (version: string, hostname: string) {
    buildInfo.labels(version,hostname).set(0)
}
/**
 * @summary Повертає метрики з коробки
 */
export function returnInitMetrics() {
    return registryInitApp.metrics()
}
