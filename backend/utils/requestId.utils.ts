import {AsyncLocalStorage} from "node:async_hooks";

/**
 * @file requestId.utils.ts
 * @summary Файл для керування X-request-id
 */

/**
 * @summary Створюємо тип для requestId
 */
export type Context = { requestId?: string};
/**
 * @summary асинхронне сховище
 */
const storage = new AsyncLocalStorage<Context>();

/**
 * @summary Створюємо обʼєкт з 3 методами
 * run - Передаємо в нього сам requestId та функцію next - вона буде передавати requestId як по ланцюгу
 * get - Отримати всі дані з сховища
 * getRequestId - Отримати requestId
 */
export const RequestContext = {
    run<T>(ctx: Context, cb: () => T):T {
        return storage.run(ctx, cb);
    },

    get(): Context {
        return storage.getStore() ?? {}
    },

    getRequestId(): string | undefined {
        return storage.getStore()?.requestId;
    }
}