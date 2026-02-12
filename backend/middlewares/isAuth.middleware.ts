import {Request,Response,NextFunction} from "express";

/**
 * @file isAuth.middleware.ts
 * @summary middleware який провіряє чи користувач має сессію
 */

export function isAuthMiddleware(req: Request, res: Response, next:NextFunction) {
    if(!req.session?.userId) {
        return res.status(401).json({error: 'Немає прав',message: 'Лінк заборонений для використання клієнтам'})
    }
    next()
}
