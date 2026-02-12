import {PoolClient} from 'pg'
import {BaseMigration, migrationLogger} from "../base.migration.js";


/**
 * @file 011_create_aboutMe_table.ts
 * @summary Файл для створення таблиці проекту
 * */


/**
 * @summary Класс по запуску SQL-code
 */
export class Migration011CreateAboutMeTable extends BaseMigration {
    async up(client: PoolClient): Promise<void> {
        try {
            /** Створюємо таблицю для about_me */
            await this.executeQuery(client, `
            
            CREATE TABLE IF NOT EXISTS about_me (
            id              SERIAL PRIMARY KEY,

            title           TEXT        NOT NULL,  
            description     TEXT        NOT NULL,  

            focus_label     TEXT,                  
            focus_value     TEXT,                  

            stack_label     TEXT,                  
            stack_value     TEXT,                  

            features        TEXT[]  NOT NULL DEFAULT '{}',  

            btn_text1       TEXT,                  
            btn_href1       TEXT,                  
            btn_text2       TEXT,                  
            btn_href2       TEXT,                  

            image           TEXT,                  

            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            `)


            /** Тригер який автоматично запускає функцію в момент оновлення рядка  */
            await this.executeQuery(client, `
            
            CREATE TRIGGER trg_about_me_set_timestamp
            BEFORE UPDATE ON about_me
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
            
            `)

            migrationLogger.info('Міграція 011 виконана')
        } finally {
        }
    }


    async down(client: PoolClient): Promise<void> {
        try {

            /** Скидаємо все що створили раніше в міграції 011 */

            await this.executeQuery(client, `
            DROP TABLE IF EXISTS about_me CASCADE;
            `)


            await this.executeQuery(client, `
            DROP TRIGGER IF EXISTS trg_about_me_set_timestamp on about_me CASCADE;
            `)

            migrationLogger.info('Міграція 011 скинута')
        } finally {
        }
    }
}



