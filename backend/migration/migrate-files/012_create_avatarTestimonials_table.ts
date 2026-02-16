import {PoolClient} from 'pg'
import {BaseMigration, migrationLogger} from "../base.migration.js";


/**
 * @file 012_create_avatarTestimonials_table.ts
 * @summary Файл для створення таблиці проекту
 * */


/**
 * @summary Класс по запуску SQL-code
 */
export class Migration012CreateAvatarTestimonials extends BaseMigration {
    async up(client: PoolClient): Promise<void> {
        try {
            /** Створюємо таблицю для avatar_testimonials */
            await this.executeQuery(client, `
            
            CREATE TABLE avatar_testimonials (
            id SERIAL PRIMARY KEY,
            
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            
            created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

            `)


            /** Тригер який автоматично запускає функцію в момент оновлення рядка  */
            await this.executeQuery(client, `
            
            CREATE TRIGGER trg_avatar_testimonials_set_timestamp
            BEFORE UPDATE ON avatar_testimonials
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
            
            `)

            migrationLogger.info('Міграція 012 виконана')
        } finally {
        }
    }


    async down(client: PoolClient): Promise<void> {
        try {

            /** Скидаємо все що створили раніше в міграції 012 */

            await this.executeQuery(client, `
            DROP TABLE IF EXISTS avatar_testimonials CASCADE;
            `)


            await this.executeQuery(client, `
            DROP TRIGGER IF EXISTS trg_avatar_testimonials_set_timestamp on avatar_testimonials CASCADE;
            `)

            migrationLogger.info('Міграція 012 скинута')
        } finally {
        }
    }
}



