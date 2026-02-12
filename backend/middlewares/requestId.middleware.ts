import type {Request, Response, NextFunction} from 'express';
import {randomUUID} from 'node:crypto';
import {RequestContext} from '../utils/requestId.utils.js';

/**
 * @file request.middleware.ts
 * @summary Перевіряємо та створюємо request-id
 */


const HEADER = 'x-request-id';

/**
 * @summary Перевірка чи безпечний та корректний request-id
 * @param {string | null} id - передаємо request-id
 */
function sanitizeIncomingId(id: string | null): string | undefined {
    if (!id) return undefined;
    if (id.length > 200) return undefined;
    if (!/^[a-zA-Z0-9._-]+$/.test(id)) return undefined;
    return id;
}

/**
 * @summary Функція яка перевіряє наявність RequestId, генерує його, додає до запитів
 * @param {Request} req - Http Запит
 * @param {Response} res - Http Відповідь
 * @param {NextFunction} next - Передаємо далі
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
    const incoming = sanitizeIncomingId(req.header(HEADER) ?? null);
    const requestId = incoming ?? randomUUID();

    (req as Request & { requestId?: string }).requestId = requestId;
    res.setHeader(HEADER, requestId);

    RequestContext.run({requestId}, next);
}