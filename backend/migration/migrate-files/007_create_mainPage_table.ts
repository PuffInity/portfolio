import {PoolClient} from 'pg'
import {BaseMigration, migrationLogger} from "../base.migration.js";


/**
 * @file 007_create_mainPage_table.ts
 * @summary Файл для створення таблиці проекту
 * */


/**
 * @summary Класс по запуску SQL-code
 */
export class Migration007CreateMainPageTable extends BaseMigration {
    async up(client: PoolClient): Promise<void> {
        try {
            /** Створюємо таблицю для наших контактів */
            await this.executeQuery(client, `
            
            CREATE TABLE IF NOT EXISTS main_page (
            id              SERIAL PRIMARY KEY,
            service_id      INTEGER REFERENCES services(id) ON DELETE SET NULL, 

 
            title           TEXT,                  
            subtitle        TEXT,                  
            bullets         TEXT[] NOT NULL DEFAULT '{}', 
            image           TEXT,                  

            btn_text1    TEXT,                  
            btn_href1    TEXT,                  
            btn_text2    TEXT,                  
            btn_href2    TEXT,                  

            services_lead   TEXT,

            pricing_lead    TEXT,

            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            
            `)

            /** Індекси для пришвидшеного пошуку */
            await this.executeQuery(client, `
            
            CREATE INDEX IF NOT EXISTS idx_main_page_service_id
            ON main_page (service_id);

            `)

            /** Тригер який автоматично запускає функцію в момент оновлення рядка  */
            await this.executeQuery(client, `
            
            CREATE TRIGGER trg_main_page_set_timestamp
            BEFORE UPDATE ON main_page
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
            
            `)

            migrationLogger.info('Міграція 007 виконана')
        } finally {
        }
    }


    async down(client: PoolClient): Promise<void> {
        try {

            /** Скидаємо все що створили раніше в міграції 007 */

            await this.executeQuery(client, `
            DROP TABLE IF EXISTS main_page CASCADE;
            `)

            await this.executeQuery(client, `
            DROP INDEX IF EXISTS idx_main_page_service_id CASCADE;
            `)

            await this.executeQuery(client, `
            DROP TRIGGER IF EXISTS trg_main_page_set_timestamp ON main_page CASCADE;
            `)

            migrationLogger.info('Міграція 007 скинута')
        } finally {
        }
    }
}



