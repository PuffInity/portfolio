import {PoolClient} from 'pg'
import {BaseMigration, migrationLogger} from "../base.migration.js";


/**
 * @file 009_create_testimonials_table.ts
 * @summary Файл для створення таблиці проекту
 * */


/**
 * @summary Класс по запуску SQL-code
 */
export class Migration009CreateTestimonialsTable extends BaseMigration {
    async up(client: PoolClient): Promise<void> {
        try {
            /** Створюємо таблицю для відгуків */
            await this.executeQuery(client, `  
            
            CREATE TABLE IF NOT EXISTS testimonials (
            id         SERIAL PRIMARY KEY,
            service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,  

            enabled    BOOLEAN NOT NULL DEFAULT false,       

            text       TEXT    NOT NULL,                    
            author     TEXT    NOT NULL,                   
            role       TEXT,                               
            avatar     TEXT,                                

            sort_order INTEGER NOT NULL DEFAULT 0,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            
            `)

            /** Індекси для пришвидшеного пошуку */
            await this.executeQuery(client, `
            
            CREATE INDEX IF NOT EXISTS idx_testimonials_service_id
            ON testimonials (service_id);

            CREATE INDEX IF NOT EXISTS idx_testimonials_enabled
            ON testimonials (enabled);

            `)

            /** Тригер який автоматично запускає функцію в момент оновлення рядка  */
            await this.executeQuery(client, `
            
            CREATE TRIGGER trg_testimonials_set_timestamp
            BEFORE UPDATE ON testimonials
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
            
            `)

            migrationLogger.info('Міграція 009 виконана')
        } finally {
        }
    }


    async down(client: PoolClient): Promise<void> {
        try {

            /** Скидаємо все що створили раніше в міграції 009 */

            await this.executeQuery(client, `
            DROP TABLE IF EXISTS testimonials CASCADE;
            `)

            await this.executeQuery(client, `
            DROP INDEX IF EXISTS idx_testimonials_service_id CASCADE;
            DROP INDEX IF EXISTS idx_testimonials_enabled CASCADE;
            `)

            await this.executeQuery(client, `
            DROP TRIGGER IF EXISTS trg_testimonials_set_timestamp ON testimonials CASCADE;
            `)

            migrationLogger.info('Міграція 009 скинута')
        } finally {
        }
    }
}



