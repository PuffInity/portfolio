import {BaseConfig, makeBaseConfig} from "./redis-base.config.js";
import { redisConfig } from "../../validator/schema/redis.schema.js";

/**
 * @file redis-cache.config.ts
 * @summary Кофігураційнй файл для Redis кешу
 */

/** Це тип нашої конфігурації  */
type CacheConfig = BaseConfig & {
    keyPrefix: string;
    defaultTTL: number;
    maxValueSize: number;
    compress: boolean;
}

export const redisCacheConfig: CacheConfig = {
    ...makeBaseConfig({
        host: redisConfig.REDIS_CACHE_HOST,
        port: redisConfig.REDIS_CACHE_PORT,
        name: 'redis-cache',
        password: redisConfig.REDIS_PASSWORD || undefined,
        database: redisConfig.REDIS_CACHE_DB,
        keyPrefix: 'cache:',
    }),
    defaultTTL: redisConfig.REDIS_CACHE_TTL,
    maxValueSize: redisConfig.REDIS_CACHE_MAX_SIZE,
    compress: redisConfig.REDIS_CACHE_COMPRESS,
}