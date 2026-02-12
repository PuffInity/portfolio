import {makeBaseConfig,BaseConfig} from "./redis-base.config.js";
import {redisConfig} from "../../validator/schema/redis.schema.js";

/**
 *  @file redis-sess.config.ts
 *  @summary Кофігураційнй файл для Redis Сесій
 */

/** Це тип нашої конфігурації  */
type SessionConfig = BaseConfig & {
    keyPrefix: string;
    sessionTTL: number;
    touchAfter: number;
}

export const redisSessionConfig: SessionConfig = {
    ...makeBaseConfig({
        host: redisConfig.REDIS_SESSION_HOST,
        port: redisConfig.REDIS_SESSION_PORT,
        name: 'redis-session',
        password: redisConfig.REDIS_PASSWORD || undefined,
        database: redisConfig.REDIS_SESSION_DB,
        keyPrefix: 'sess:'
    }),
    sessionTTL: redisConfig.REDIS_SESSION_TTL,
    touchAfter: redisConfig.REDIS_SESSION_TOUCH,
}