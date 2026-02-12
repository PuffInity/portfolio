import {PoolClient} from 'pg'
import {BaseMigration, migrationLogger} from "../base.migration.js";


/**
 * @file 004_create_servicesGallery_table.ts
 * @summary Файл для створення таблиці проекту
 * */


/**
 * @summary Класс по запуску SQL-code
 */
export class Migration004CreateServicesGalleryTable extends BaseMigration {
    async up(client: PoolClient): Promise<void> {
        try {
            /** Створюємо таблицю фотографій для Сервісів */
            await this.executeQuery(client, `
            
            CREATE TABLE IF NOT EXISTS service_gallery (
            id          SERIAL PRIMARY KEY,
            service_id  INTEGER     NOT NULL REFERENCES services(id) ON DELETE CASCADE,

            image       TEXT        NOT NULL,  
            title       TEXT,                 
            caption     TEXT,                  

            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            
            `)

            /** Індекси для пришвидшеного пошуку */
            await this.executeQuery(client, `
            
            CREATE INDEX IF NOT EXISTS idx_service_gallery_service_id
            ON service_gallery (service_id);
           
            `)

            /** Тригер який автоматично запускає функцію в момент оновлення рядка  */
            await this.executeQuery(client, `
            
            CREATE TRIGGER trg_service_gallery_set_timestamp
            BEFORE UPDATE ON service_gallery
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
            
            `)

            migrationLogger.info('Міграція 004 виконана')
        } finally {
        }
    }


    async down(client: PoolClient): Promise<void> {
        try {

            /** Скидаємо все що створили раніше в міграції 004 */

            await this.executeQuery(client, `
            DROP TABLE IF EXISTS service_gallery CASCADE;
            `)

            await this.executeQuery(client, `
            DROP INDEX IF EXISTS idx_service_gallery_service_id CASCADE;
            `)

            await this.executeQuery(client, `
            DROP TRIGGER IF EXISTS trg_service_gallery_set_timestamp ON service_gallery CASCADE;
            `)

            migrationLogger.info('Міграція 004 скинута')
        } finally {
        }
    }
}



