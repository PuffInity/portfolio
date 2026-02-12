import {Request,Response,NextFunction} from "express";


export type StrictErrorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
    ) => void


export type ErrorResponse = {
    ok: false,
    error: {
        type: string,
        message: string,
        code?: string,
        stack?: string,
        [key: string]: unknown;
    };
    requestId?: string
}

/**
 * Тип помилки який створюється нашим кастомним классом
 */
export type AppErrorOptions = {
    status: number;
    code?: string;
    details?: unknown;
    cause?: unknown;
}
