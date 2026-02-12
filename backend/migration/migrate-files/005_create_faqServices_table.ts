import {PoolClient} from 'pg'
import {BaseMigration, migrationLogger} from "../base.migration.js";


/**
 * @file 005_create_FaqServices_table.ts
 * @summary Файл для створення таблиці проекту
 * */


/**
 * @summary Класс по запуску SQL-code
 */
export class Migration005CreateFaqServicesTable extends BaseMigration {
    async up(client: PoolClient): Promise<void> {
        try {
            /** Створюємо таблицю частих запитань та даємо на них відповіді */
            await this.executeQuery(client, `
            
            CREATE TABLE IF NOT EXISTS service_faq (
            id          SERIAL PRIMARY KEY,
            service_id  INTEGER     NOT NULL REFERENCES services(id) ON DELETE CASCADE,

            enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
            question    TEXT        NOT NULL,
            answer      TEXT        NOT NULL,

            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            
            `)

            /** Індекси для пришвидшеного пошуку */
            await this.executeQuery(client, `
            
            CREATE INDEX IF NOT EXISTS idx_service_faq_service_id
            ON service_faq (service_id);

            CREATE INDEX IF NOT EXISTS idx_service_faq_service_id_enabled
            ON service_faq (service_id, enabled)
            WHERE enabled = TRUE;
           
            `)

            /** Тригер який автоматично запускає функцію в момент оновлення рядка  */
            await this.executeQuery(client, `
            
            CREATE TRIGGER trg_service_faq_set_timestamp
            BEFORE UPDATE ON service_faq
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
            
            `)

            migrationLogger.info('Міграція 005 виконана')
        } finally {
        }
    }


    async down(client: PoolClient): Promise<void> {
        try {

            /** Скидаємо все що створили раніше в міграції 005 */

            await this.executeQuery(client, `
            DROP TABLE IF EXISTS service_faq CASCADE;
            `)

            await this.executeQuery(client, `
            DROP INDEX IF EXISTS idx_service_faq_service_id CASCADE;
            DROP INDEX IF EXISTS idx_service_faq_service_id_enabled CASCADE;
            `)

            await this.executeQuery(client, `
            DROP TRIGGER IF EXISTS trg_service_faq_set_timestamp ON service_faq CASCADE;
            `)

            migrationLogger.info('Міграція 005 скинута')
        } finally {
        }
    }
}



