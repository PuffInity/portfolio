import {PoolClient} from 'pg'
import {BaseMigration, migrationLogger} from "../base.migration.js";


/**
 * @file 006_create_servicesSetting_table.ts
 * @summary Файл для створення таблиці проекту
 * */


/**
 * @summary Класс по запуску SQL-code
 */
export class Migration006CreateServicesSettingTable extends BaseMigration {
    async up(client: PoolClient): Promise<void> {
        try {
            /** Створюємо таблицю для головних даних для існування Сервіса */
            await this.executeQuery(client, `
            
            CREATE TABLE IF NOT EXISTS service_settings (
            id              SERIAL PRIMARY KEY,
            service_id      INTEGER     NOT NULL REFERENCES services(id) ON DELETE CASCADE,
            contact_id      INTEGER     REFERENCES contacts(id),   

            discount        TEXT,                 
            include         TEXT[]     NOT NULL DEFAULT '{}',  
            additional      TEXT[]     NOT NULL DEFAULT '{}',  
            price_title     TEXT,                  
            price_subtitle  TEXT,                  
            price           TEXT,                 

            terms           TEXT[]     NOT NULL DEFAULT '{}',  
            quickstart      TEXT,                  

            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            
            `)

            /** Індекси для пришвидшеного пошуку */
            await this.executeQuery(client, `
            
            CREATE INDEX IF NOT EXISTS idx_service_settings_service_id
            ON service_settings (service_id);

            CREATE INDEX IF NOT EXISTS idx_service_settings_contact_id
            ON service_settings (contact_id);
           
            `)

            /** Тригер який автоматично запускає функцію в момент оновлення рядка  */
            await this.executeQuery(client, `
            
           
            CREATE TRIGGER trg_service_settings_set_timestamp
            BEFORE UPDATE ON service_settings
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
            
            `)

            migrationLogger.info('Міграція 006 виконана')
        } finally {
        }
    }


    async down(client: PoolClient): Promise<void> {
        try {

            /** Скидаємо все що створили раніше в міграції 006 */

            await this.executeQuery(client, `
            DROP TABLE IF EXISTS service_settings CASCADE;
            `)

            await this.executeQuery(client, `
            DROP INDEX IF EXISTS idx_service_settings_service_id CASCADE;
            DROP INDEX IF EXISTS idx_service_settings_contact_id CASCADE;
            `)

            await this.executeQuery(client, `
            DROP TRIGGER IF EXISTS trg_service_settings_set_timestamp ON service_settings CASCADE;
            `)

            migrationLogger.info('Міграція 006 скинута')
        } finally {
        }
    }
}



