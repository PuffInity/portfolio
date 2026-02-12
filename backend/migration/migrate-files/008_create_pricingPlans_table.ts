import {PoolClient} from 'pg'
import {BaseMigration, migrationLogger} from "../base.migration.js";


/**
 * @file 008_create_pricingPlans_table.ts
 * @summary Файл для створення таблиці проекту
 * */


/**
 * @summary Класс по запуску SQL-code
 */
export class Migration008CreatePrisingPlansTable extends BaseMigration {
    async up(client: PoolClient): Promise<void> {
        try {
            /** Створюємо таблицю для готових прайс планів */
            await this.executeQuery(client, `
            
            CREATE TABLE IF NOT EXISTS pricing_plans (
            id           SERIAL PRIMARY KEY,

            enabled      BOOLEAN NOT NULL DEFAULT TRUE,       

            title        TEXT    NOT NULL,                   
            price_label  TEXT    NOT NULL,                    
            features     TEXT[]  NOT NULL DEFAULT '{}',       

            btn_text     TEXT,                                
            btn_href     TEXT,                                

            badge        TEXT,                                
            badge_class  TEXT,                                
            popular      BOOLEAN NOT NULL DEFAULT FALSE,      

            sort_order   INTEGER NOT NULL DEFAULT 0,          

            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            
            `)

            /** Індекси для пришвидшеного пошуку */
            await this.executeQuery(client, `

            CREATE INDEX IF NOT EXISTS idx_pricing_plans_enabled
            ON pricing_plans (enabled);

            `)

            /** Тригер який автоматично запускає функцію в момент оновлення рядка  */
            await this.executeQuery(client, `
            
            CREATE TRIGGER trg_pricing_plans_set_timestamp
            BEFORE UPDATE ON pricing_plans
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
            
            `)

            migrationLogger.info('Міграція 008 виконана')
        } finally {
        }
    }


    async down(client: PoolClient): Promise<void> {
        try {

            /** Скидаємо все що створили раніше в міграції 008 */

            await this.executeQuery(client, `
            DROP TABLE IF EXISTS pricing_plans CASCADE;
            `)

            await this.executeQuery(client, `
            DROP INDEX IF EXISTS idx_pricing_plans_section_id CASCADE;
            DROP INDEX IF EXISTS idx_pricing_plans_enabled CASCADE;
            `)

            await this.executeQuery(client, `
            DROP TRIGGER IF EXISTS trg_pricing_plans_set_timestamp ON pricing_plans CASCADE;
            `)

            migrationLogger.info('Міграція 008 скинута')
        } finally {
        }
    }
}



