import multer from "multer";
import { Request, Response, NextFunction } from "express";

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
        console.log('помилка 400')
        return res.status(400).json({
            error: err.message
        });
    }

    // Помилка неправильного формату (твій fileFilter)
    if (err instanceof Error) {
        return res.status(400).json({
            error: err.message
        });
    }

    // Все інше
    return res.status(500).json({
        error: "Unknown upload error"
    });
};