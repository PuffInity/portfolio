import type { RequestHandler} from "express";
import {ErrorApp} from "../error/app.error.js";

/**
 * @file not-found.middleware.ts
 * @summary файл який видає помилку при запиті на неіснуючий Роут
 */


export const notFound :RequestHandler = (req,_res,next) => {
    const message = `Route ${req.originalUrl} not found`


    const details = {
        method: req.method,
        originalUrl:req.originalUrl,
        path:req.path,
    };
    const error = ErrorApp.notFound?.(message, {details})
        ?? new ErrorApp(message, {status: 404, code: "NOT_FOUND", details})

    next(error)
}