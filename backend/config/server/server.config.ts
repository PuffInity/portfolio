import {ILogger} from "../../utils/logger/interface.logger.js";

/**
 * @summary Інтерфейс конфігу
 */
export interface ConfigInterface {
    /** Порт сервера може бути числовий так і строковий залежить від типу */
    port: string | number;
    /** Тип порта сервера потрібно щоб визначити який поточний порт використовується */
    portType: 'pipe' | 'port';
    /** Хост сервера*/
    host: string,
    /** Середовище сервера */
    environment: string,
}

/**
 * @summary Провіряє порт на валідність та визначає його тип pipe або port
 * @param {ILogger} logger - Логер потрібен для запису в логи або консоль залежить від середовища
 * @returns Об'єкт з 3 властивостями port і portType
 * @throws {process(1)} - Помилка можлива лише в тому випадку якщо був переданий невалідний порт
 * @example - const port = configPort(logger)
 */
export function configPort (logger: ILogger) {
    const portENV = process.env.port || '3000'
    /** includes Перевіряє чи example вмістить в собі параметер - example.includes(Чи ти містиш в собі цей текст?) */
    const isNamedPort = isNaN(Number(portENV)) || portENV.includes('/') || portENV.includes('\\')

    let port: string | number
    let portType: 'pipe' | 'port'
    if(isNamedPort) {
        port = portENV
        portType = 'pipe'
    }else {
        port = parseInt(portENV,10)
        portType = 'port'
        /** isNaN - Перевіряє чи число не є NAN */
        if(isNaN(port) || port < 1 || port > 65535) {
            logger.error('Invalid port', {port: process.env.PORT})
            /** Жорстоко вирубає сервер */
            process.exit(1)
        }
    }
    return {
        port: port,
        portType: portType
    }
}

/**
 * @summary Збирає до купи конфігурацію
 * @param {ILogger} logger - Логер потрібен тільки щоб передати його в функцію яка є всередині функції
 * @returns Повертає інтерфайсе - ConfigInterface
 * @example const configServer = createConfig(logger)
 */
export function createConfig (logger: ILogger): ConfigInterface {
    const port = configPort(logger)
    return{
        port: port.port,
        portType: port.portType,
        host: process.env.HOST || '0.0.0.0',
        environment: process.env.NOD_ENV || 'development',
    }
}