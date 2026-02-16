import multer from "multer";
import { Request, Response, NextFunction } from "express";
import {createAppLogger} from "../utils/logger/logger.js";

const uploadLogger = createAppLogger({service: 'multer-upload'});

export const catchMulterError = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!err) return next();

    // Помилки від Multer
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                error: "Файл занадто великий"
            });
        }
        uploadLogger.warn('Multer повернув помилку валідації файлу', {code: err.code, message: err.message})
        return res.status(400).json({
            error: err.message
        });
    }

    // Помилка неправильного формату (твій fileFilter)
    if (err instanceof Error) {
        uploadLogger.warn('Невалідний файл для upload', {message: err.message})
        return res.status(400).json({
            error: err.message
        });
    }

    // Все інше
    uploadLogger.error('Невідома помилка під час upload')
    return res.status(500).json({
        error: "Unknown upload error"
    });
};
