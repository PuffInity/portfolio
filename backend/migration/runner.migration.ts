import * as fs from 'fs'
import * as path from 'node:path'
import {fileURLToPath} from "node:url";
import {pool} from "../config/database.config.js";
import {MigrationTracker} from "./table.migration.js";
import {Migration, migrationLogger} from "./base.migration.js";


/**
 * @file runner.migration.ts
 * @summary Файл який виконує опції міграцій
 */


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @summary Тип для классу тобто під цей тип підійде любий класс який має методи типа Migration( up() та down() */
type MigrationConstructor = new () => Migration

/**
 * @summary Це тип для того щоб визначити яким шляхом було експортоваоно класс міграцій
 */
interface MigrationModule {
    default?: MigrationConstructor

    [key: string]: unknown
}

/**
 * @summary Класс який виконує головні опціії міграцій
 * */
export class MigrationRunner {
    /** Константа в якій зберігаємо шлях до директорії з міграціями  */
    private static readonly MIGRATION_DIR = path.join(__dirname, './migrate-files')

    /** Отримуємо міграції які були знайдені в дерикторії міграцій */
    private static async getMigrationFiles(): Promise<string[]> {
        try {
            /** Читаємо дерикторію та фільтруємо кожен файл який був знайдений по критеріями - Якщо файл був з закінчення ts або якщо
             * файл має .d.ts тоді його пропускаємо та не враховуємо як маграційний файл
             * */
            const files = fs.readdirSync(this.MIGRATION_DIR)
                .filter((file: string) => (file.endsWith('ts') || file.endsWith('js')) && !file.endsWith('.d.ts'))
                .sort()

            migrationLogger.info(`Було знайдено ${files.length} файл/файлів`)
            return files;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            migrationLogger.error('Помилка при пошуку в дерикторії міграцій', {message: message})
            throw error
        }
    }

    /**
     * @summary Функція яка провіряє файли міграцій та відає корректні та перевірені файли
     */
    private static async loadMigration(file: string): Promise<Migration> {
        try {
            /** Створюємо шлях до файла маграції */
            const migrationPath = path.join(this.MIGRATION_DIR, file);
            /** Імпортуємо його та кажемо йому що він MigrationModule */
            const migrationObj = await import(migrationPath) as MigrationModule
            /** Створюємо змінну в яку передаємо тип конструктора */
            let migrationClass: MigrationConstructor

            /** Провіряємо чи в migrationObj в самому файлі він був імпортований через default якщо так ми відразу знаємо що це наш файл
             * якщо ні робимо перевірку */
            if (migrationObj.default) {
                migrationClass = migrationObj.default
            } else {
                /** Беремо наш файл та фільтруємо його якщо він підходить типу MigrationConstructor
                 * та також сам є функкцією та якщо він має прототип,
                 * беремо типи його його прототипів та провіряємо чи вони функції
                 * якщо так тоді все чудово */
                const exportedValues = Object.values(migrationObj).filter(
                    (value): value is MigrationConstructor => typeof value === 'function' &&
                        value.prototype &&
                        typeof value.prototype.up === 'function' &&
                        typeof value.prototype.down === 'function'
                )
                /** Записуємо в константу відфільтрований результат точніше перший знайдений елемент */
                const migrationClassNotDefault = exportedValues[0]

                /** Провіряємо чи є наша константа пуста */
                if (!migrationClassNotDefault) {
                    migrationLogger.error('Помилка, migrationClassNotDefault є пустим', {
                        file: migrationClassNotDefault,
                        path: migrationPath,
                    })
                    throw new Error('Помилка з відфільтрованим варіантом маграцій')
                }
                /** Якщо все ок записуємо його в змінну */
                migrationClass = migrationClassNotDefault
            }
            /** Провіряємо ще раз що ми записали в змінну функцію */
            if (typeof migrationClass !== "function") {
                migrationLogger.error('Помилка, змінна міграцій зʼясувалось була не функцією', {migrationFile: typeof migrationClass,})
                throw new Error('Помилка файла міграцій ')
            }

            /** Повертаємо провірений та корректний варіант */
            return new migrationClass()
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            migrationLogger.error('Помилка з загрузкою міграцій', {message: message,})
            throw error
        }
    }

    /**
     * @summary Функція яка запускає міграції
     *
     */
    static async runMigrations(): Promise<void> {
        migrationLogger.info('Запуск міграції')
        try {
            /** Створюємо таблицю міграцій  */
            await MigrationTracker.createMigrationTable()
            /** Отримуємо всі міграції */
            const migrationFiles = await MigrationRunner.getMigrationFiles()
            /** Отримуємо готові міграції */
            const executedMigrations = await MigrationTracker.getExecutedMigrations()
            /** Фільтруємо всі міграції та видаляємо ті міграції які вже виконані */
            const pendingMigrations = migrationFiles.filter(file => !executedMigrations.includes(file))
            /** Якщо  нічого немаємо пропускаємо */
            if(pendingMigrations.length === 0) {
                migrationLogger.info('Программа не знайшла міграції для виконання', {migration: pendingMigrations.length})
                return
            }
            migrationLogger.info(`Загружаємо міграції`, {migration: pendingMigrations.length})
            /** Перебираємо кожну міграцію */
            for(const file of pendingMigrations) {
                /** Беремо 1 зʼєднання від бази */
                const client = await pool.connect()
                migrationLogger.info(`Обробка міграції: ${file}`)
                try {
                    /** Знаходимо та загружаємо міграцію */
                    const migration = await MigrationRunner.loadMigration(file)
                    /** Виконуємо функцію up() */
                    await migration.up(client)
                    /** Записуємо в таблицю виконану міграцію */
                    await MigrationTracker.recordMigration(file)
                    migrationLogger.info(`Міграція ${file} оброблена`)
                }finally {
                    /** Повертаємо зʼєднання в базу даних */
                    client.release()
                }
            }
        }catch(error) {
            const message = error instanceof Error ? error.message : String(error)
            migrationLogger.error('Помилка при виконанні міграції', {message: message})
            throw error
        }
    }

    /**
     * @summary Функція яка робить rollback в міграціях
     */
    static async rollbackMigrations(): Promise<void> {
        migrationLogger.info('Запуск rollback')
        try {
            /** Беремо виконані міграції  */
            const executedMigrations = await MigrationTracker.getExecutedMigrations()
            /** Якщо їх немає пропускаємо */
            if(executedMigrations.length === 0) {
                migrationLogger.info('Немає міграцій для Rollback', {migration: executedMigrations.length})
                return;
            }
            /** Визначаємо останню міграцію яка була виконана */
            const lastMigration = executedMigrations[executedMigrations.length - 1]
            migrationLogger.info(`Остання міграція: ${lastMigration}`)

            /** Знаходимо та загружаємо міграцію */
            const migration = await this.loadMigration(lastMigration)
            /** Беремо зʼєднання від бази */
            const client = await pool.connect()
            try {
                /** Викликаємо функцію down() */
                await migration.down(client)
                /** Видаляємо міграцію з таблиці */
                await MigrationTracker.removeMigration(lastMigration)
                migrationLogger.info(`Міграція ${lastMigration} відкочено назад`)
            }finally {
                /** Повертаємо зʼєднання назад */
                client.release()
            }
        }catch(error) {
            const message = error instanceof Error ? error.message : String(error);
            migrationLogger.error('Помилка при Rollback', {message: message})
            throw error;
        }
    }

    /**
     * @summary Функція яка повертає статус міграцій
     */
    static async getMigrationStatus(): Promise<void> {
        migrationLogger.info('Статус міграцій')
        try {
            /** Отримуємо список всіх міграцій */
            const migrationFiles = await MigrationRunner.getMigrationFiles()
            /** Отримаємо список виконаних міграцій */
            const executedMigrations = await MigrationTracker.getExecutedMigrations()
            /** Якщо не було знайдено міграцій пропускаємо це */
            if(migrationFiles.length === 0) {
                migrationLogger.info('Немає міграцій для показу статусу')
                return
            }
            migrationLogger.info(`Знайдено міграційних файлів - ${migrationFiles.length}`)
            /** Беремо кожен файл міграцій та даємо статус виконаному Виконано а якщо ні то Очікується */
            migrationFiles.forEach(file => {
                const isExecuted = executedMigrations.includes(file)
                const status = isExecuted ? 'Виконано' : 'Очікується'
                migrationLogger.info(`${file} : ${status}`)
            })
            /** Беремо всі файли та віднімаємо готові отримаємо файли які очікують та будуємо загальний вивід для Всіх міграцій Викониних та в очікуванні */
            const pendingCount = migrationFiles.length - executedMigrations.length
            migrationLogger.info(`Загалом:${migrationFiles.length}, Виконано:${executedMigrations.length} Очікується:${pendingCount}`)
        }catch(error) {
            const message = error instanceof Error ? error.message : String(error)
            migrationLogger.error('Помилка при будувані статуса для міграцій', {message:message})
            throw error
        }
    }
}