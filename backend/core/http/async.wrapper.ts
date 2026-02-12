import type { Request, Response, NextFunction } from "express";

/**
 * @file async.wrapper.ts
 * @summary Це wrapper який слідкує за async помилками в роутах
 */

export type AsyncHandler<
    Req = Request,
    Res = Response
> = (req: Req, res: Res, next: NextFunction) => Promise<unknown>;

export const wrapAsync = <Req = Request, Res = Response>(
    handler: AsyncHandler<Req, Res>
) => {
    return (req: Req, res: Res, next: NextFunction) => {
        handler(req, res, next).catch(next);
    };
};