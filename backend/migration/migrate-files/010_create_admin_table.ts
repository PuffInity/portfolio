import {PoolClient} from 'pg'
import {BaseMigration, migrationLogger} from "../base.migration.js";


/**
 * @file 010_create_admin_table.ts
 * @summary Файл для створення таблиці проекту
 * */


/**
 * @summary Класс по запуску SQL-code
 */
export class Migration010CreateAdminTable extends BaseMigration {
    async up(client: PoolClient): Promise<void> {
        try {
            /** Створюємо таблицю для Адміністратора */
            await this.executeQuery(client, `
            
            CREATE TABLE IF NOT EXISTS admin (
            id             SERIAL PRIMARY KEY,

            login          TEXT NOT NULL UNIQUE,     
            password_hash  TEXT NOT NULL,             

            created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            `)

            /** Індекси для пришвидшеного пошуку */
            await this.executeQuery(client, `
            
            CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_login
            ON admin (login);

            `)

            /** Тригер який автоматично запускає функцію в момент оновлення рядка  */
            await this.executeQuery(client, `
            
            CREATE TRIGGER trg_admin_set_timestamp
            BEFORE UPDATE ON admin
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
            
            `)

            migrationLogger.info('Міграція 010 виконана')
        } finally {
        }
    }


    async down(client: PoolClient): Promise<void> {
        try {

            /** Скидаємо все що створили раніше в міграції 010 */

            await this.executeQuery(client, `
            DROP TABLE IF EXISTS admin CASCADE;
            `)

            await this.executeQuery(client, `
            DROP INDEX IF EXISTS idx_admin_login CASCADE;
            `)

            await this.executeQuery(client, `
            DROP TRIGGER IF EXISTS trg_admin_set_timestamp on admin CASCADE;
            `)

            migrationLogger.info('Міграція 010 скинута')
        } finally {
        }
    }
}



