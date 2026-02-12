import {PoolClient} from 'pg'
import {BaseMigration, migrationLogger} from "../base.migration.js";


/**
 * @file 003_create_Contact_table.ts
 * @summary Файл для створення таблиці проекту
 * */


/**
 * @summary Класс по запуску SQL-code
 */
export class Migration003CreateContactTable extends BaseMigration {
    async up(client: PoolClient): Promise<void> {
        try {
            /** Створюємо таблицю для наших контактів */
            await this.executeQuery(client, `
            
            CREATE TABLE IF NOT EXISTS contacts (
            id              SERIAL PRIMARY KEY,

            email           TEXT        NOT NULL,
            telegram        TEXT,
            telegram_label  TEXT,
            github          TEXT,
            github_label    TEXT,

            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            
            `)

            /** Індекси для пришвидшеного пошуку */
            await this.executeQuery(client, `
            
            CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_email
            ON contacts (email);

            `)

            /** Тригер який автоматично запускає функцію в момент оновлення рядка  */
            await this.executeQuery(client, `
            
            CREATE TRIGGER trg_contacts_set_timestamp
            BEFORE UPDATE ON contacts
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
            
            `)

            migrationLogger.info('Міграція 003 виконана')
        } finally {
        }
    }


    async down(client: PoolClient): Promise<void> {
        try {

            /** Скидаємо все що створили раніше в міграції 003 */

            await this.executeQuery(client, `
            DROP TABLE IF EXISTS contacts CASCADE;
            `)

            await this.executeQuery(client, `
            DROP INDEX IF EXISTS idx_contacts_email CASCADE;
            `)

            await this.executeQuery(client, `
            DROP TRIGGER IF EXISTS trg_contacts_set_timestamp ON contacts CASCADE;
            `)

            migrationLogger.info('Міграція 003 скинута')
        } finally {
        }
    }
}



