import 'express-session';

declare module 'express-session' {
    interface SessionData {
        nickname?: string,
        userId?: number | string
    }
}