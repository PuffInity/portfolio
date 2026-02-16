import {MigrationRunner} from "./runner.migration.js";
import {migrationLogger} from "./base.migration.js";

const COMMANDS = {
    MIGRATE: 'migrate',
    ROLLBACK: 'rollback',
    STATUS: 'status',
    HELP: 'help'
}as const;

function showHelp() {
    migrationLogger.info(`
    Команди по маграції:
        npm run migrate -  Запуск міграції
        npm run rollback - Скинути міграцію
        npm run status  - Показати статус міграцій
    `);
}



async function runCommand(command:string) {
    switch (command) {
        case COMMANDS.MIGRATE:
            migrationLogger.info('start migrate')
            await MigrationRunner.runMigrations()
            break
        case COMMANDS.ROLLBACK:
            migrationLogger.info('start rollback')
            await MigrationRunner.rollbackMigrations()
            break
        case COMMANDS.STATUS:
            migrationLogger.info('start status')
            await MigrationRunner.getMigrationStatus()
            break
        case COMMANDS.HELP:
        default:
            showHelp()
            return;
    }
}




async function main() {
    try{
        migrationLogger.info('Запуск системи міграцій');
        migrationLogger.info('=====================================');
        const command = process.argv[2]?.toLowerCase()
        if(!command) {
            showHelp()
            return;
        }

        await runCommand(command)

        migrationLogger.info('=====================================');
        migrationLogger.info('Міграція закінчила роботу успішно');

    }catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        migrationLogger.error('Виникла помилка при запуску міграцій', { message })
        throw error
    }
}

main()