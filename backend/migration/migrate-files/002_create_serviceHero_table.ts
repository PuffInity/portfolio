import {PoolClient} from 'pg'
import {BaseMigration, migrationLogger} from "../base.migration.js";


/**
 * @file 002_create_servicesHero_table.ts
 * @summary Файл для створення таблиці проекту
 * */


/**
 * @summary Класс по запуску SQL-code
 */
export class Migration002CreateServicesHeroTable extends BaseMigration {
    async up(client: PoolClient): Promise<void> {
        try {
            /** Створюємо таблицю для початкових даних для існування Сервіса */
            await this.executeQuery(client, `
            
            CREATE TABLE IF NOT EXISTS services_hero (
            id           SERIAL PRIMARY KEY,
            service_id   INTEGER     NOT NULL REFERENCES services(id) ON DELETE CASCADE,

            title        TEXT        NOT NULL, 
            lead         TEXT,                  
            image        TEXT,                  
            btn_href1    TEXT,                  
            btn_text1    TEXT,                  
            btn_href2    TEXT,                  
            btn_text2    TEXT,                  

            duration     TEXT,                  
            executor     TEXT,                  
            price_hero   TEXT,                  

            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            
            `)

            /** Індекси для пришвидшеного пошуку */
            await this.executeQuery(client, `
            
            CREATE INDEX IF NOT EXISTS idx_services_hero_service_id
            ON services_hero (service_id);
           
            `)

            /** Тригер який автоматично запускає функцію в момент оновлення рядка  */
            await this.executeQuery(client, `
            
            CREATE TRIGGER trg_services_hero_set_timestamp
            BEFORE UPDATE ON services_hero
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
            
            `)

            migrationLogger.info('Міграція 002 виконана')
        } finally {
        }
    }


    async down(client: PoolClient): Promise<void> {
        try {

            /** Скидаємо все що створили раніше в міграції 002 */

            await this.executeQuery(client, `
            DROP TABLE IF EXISTS services_hero CASCADE;
            `)

            await this.executeQuery(client, `
            DROP INDEX IF EXISTS idx_services_hero_service_id CASCADE;
            `)

            await this.executeQuery(client, `
            DROP TRIGGER IF EXISTS trg_services_hero_set_timestamp ON services_hero CASCADE;
            `)

            migrationLogger.info('Міграція 002 скинута')
        } finally {
        }
    }
}



