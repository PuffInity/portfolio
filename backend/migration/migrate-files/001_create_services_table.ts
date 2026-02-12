import {PoolClient} from 'pg'
import {BaseMigration, migrationLogger} from "../base.migration.js";


/**
 * @file 001_create_services_table.ts
 * @summary Файл для створення таблиці проекту
 * */


/**
 * @summary Класс по запуску SQL-code
 */
export class Migration001CreateServicesTable extends BaseMigration {
    async up(client: PoolClient): Promise<void> {
        try {
            /** Створюємо функція яка буде записувати дату коли було виконано оновлення будь якого поля */
          await this.executeQuery(client, `
          
            CREATE OR REPLACE FUNCTION trigger_set_timestamp()
            RETURNS trigger AS $$
            BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            
          `)

            /** Створюємо таблицю з сервісами */
          await this.executeQuery(client, `
          
            CREATE TABLE IF NOT EXISTS services (
            id           SERIAL PRIMARY KEY,
            name         TEXT        NOT NULL,          
            path         TEXT        NOT NULL,
            url          TEXT        NOT NULL,         
            description  TEXT,                          
            price_label  TEXT,                          
            icon_html    TEXT,                          
            enabled      BOOLEAN     NOT NULL DEFAULT TRUE,

            sort_order   INTEGER     NOT NULL DEFAULT 0, 

            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            
          `)

           /** Створюємо індекси для пришдвидшеного пошуку */
          await this.executeQuery(client, `
          
          CREATE UNIQUE INDEX IF NOT EXISTS idx_services_path
          ON services (path);

          CREATE INDEX IF NOT EXISTS idx_services_enabled
          ON services (enabled);
          
          `)

            /** Створюємо тригери який буде запускати функцію для запису оновлення кожного разу як хтось щось змінить */
          await this.executeQuery(client, `
          
          CREATE TRIGGER trg_services_set_timestamp
          BEFORE UPDATE ON services
          FOR EACH ROW
          EXECUTE FUNCTION trigger_set_timestamp();
          
          `)



            migrationLogger.info('Міграція 001 виконана')
        } finally {
        }
    }


    async down(client: PoolClient): Promise<void> {
        try {

            /** Скидаємо все що створили раніше в міграції 001 */

            await this.executeQuery(client, `
            DROP FUNCTION IF EXISTS trigger_set_timestamp() CASCADE;
            `)

            await this.executeQuery(client, `
            DROP TABLE IF EXISTS services CASCADE;
            `)

            await this.executeQuery(client, `
            DROP INDEX IF EXISTS idx_services_path CASCADE;
            DROP INDEX IF EXISTS idx_services_enabled CASCADE;
            `)

            await this.executeQuery(client, `
            DROP TRIGGER IF EXISTS trg_services_set_timestamp ON services CASCADE;
            `)



            migrationLogger.info('Міграція 001 скинута')
        } finally {
        }
    }
}



