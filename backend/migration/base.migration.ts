import { PoolClient, QueryResult, QueryResultRow} from "pg";
import {createAppLogger} from "../utils/logger/logger.js";

/**
 * @file base.migration.ts
 * @summary Файл який виконує одну з гол
 */

export const migrationLogger = createAppLogger({service: 'Migration'})

export interface Migration {
    up(pool: PoolClient): Promise<void>;
    down(pool: PoolClient): Promise<void>;
}


export abstract class BaseMigration implements Migration {
    abstract up (pool: PoolClient): Promise<void>
    abstract down (pool: PoolClient): Promise<void>

    protected async executeQuery<T extends QueryResultRow = QueryResultRow>(client: PoolClient, query: string, params?: (string | number | boolean | Date | null)[]): Promise<QueryResult<T>> {
        try {
            migrationLogger.info('Починаємо виконувати SQL запит',{ query: query.substring(0,50) + '...'})
            const result = await client.query<T>(query,params)
            migrationLogger.info('SQL запит був виконаний', {rowCount: result.rowCount})
            return result;
        }catch(error) {
            const message = error instanceof Error ? error.message : String(error);
            migrationLogger.error('error executing query', {message: message, query: query, params: params})
            throw error
        }
    }

}
