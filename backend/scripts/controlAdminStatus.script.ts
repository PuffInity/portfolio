import {createAppLogger} from "../utils/logger/logger.js";
import {createAdmin,ifExistAdmin,deleteAdmin} from "../helpers/db/admin.db.js";


/**
 * @file controlAdminStatus.script.ts
 * @summary Скрипти команд по контролю статуса Адміністратора
 */

const scriptLogger = createAppLogger({service: 'script-createAdmin'})

/**
 * @summary Існуючі команди
 */
const COMMANDS = {
    CREATE: 'create',
    DELETE: 'delete',
    IfEXIST: 'ifexist',
    HELP: 'help',
} as const

/**
 * showHelp - В випадку некороктного названня команди або просто команда help
 */
function showHelp() {
    scriptLogger.info(`
    Команди для контролю статуса Адміністратор:
    npm run create -login -password - Регістрація нового Адміністратора
    npm run delete -login - Видалення Адміністратора
    npm run ifexist -login - Провірка на наявність заданого Адміністратора
    `)
}

/**
 * @summary runCommand - Росприділяє команди
 * @param {string} command - Названня команди яка була викликана
 * @param {string} login - Логін адміністратора
 * @param {string} password - Пароль адміністратора
 */
async function runCommand(command: string, login: string, password?: string) {
    switch (command) {
        case COMMANDS.CREATE:
            if(!password) return
            scriptLogger.info('Регістрація адміністратора...', {login})
            await createAdmin(login,password)
            break
        case COMMANDS.IfEXIST:
            scriptLogger.info('Провірка наявності адміністратора з даним логіном', {login})
            const admin = await ifExistAdmin(login)
            if(admin){
                scriptLogger.info('Адміністратор з данним логіном уже існує', {login})
                return
            } else{
                scriptLogger.info('Адміністратор з данним логіном не існує', {login})
            }
            break
        case COMMANDS.DELETE:
            scriptLogger.info('Видалення адміністратора', {login})
            await deleteAdmin(login)
            break
        case COMMANDS.HELP:
        default:
            showHelp()
            return;
    }
}


/**
 * @summary main - Дістає команди та дані з скрипта та запускає їх по командах
 */
async function main() {
    try {
        scriptLogger.info('Запуск системи контролю Адміністратора')
        scriptLogger.info('=====================================');
        /**
         * Дістаємо комманду з скрипта
         */
        const command = process.argv[2]?.toLowerCase()

        if(!command) {
            showHelp()
            scriptLogger.info('=====================================');
            scriptLogger.info('Не була передена комманда, операція зупинена!')
        }

        /**
         * Розділяємо команду створення та команди видалення та перевірки
         * На команду створення потрібно Логін і Пароль
         * на команду перевірки та видалення тільки Логін
         * Якщо не розділити логіки дістати правильні поля неможливо
         */
        if(command === COMMANDS.CREATE) {
            /**
             *  username - Логін адміністратора
             *  code - Пароль адмінітсратора
             */
            const username = process.argv.at(-2);
            const code = process.argv.at(-1);

            if(!username || !code) {
                showHelp()
                scriptLogger.info('=====================================');
                scriptLogger.info('Не були передані потрібні аргументи для виконання операції, операцію зупинено!')
                return;
            }

            await runCommand(command,username,code)
            scriptLogger.info('=====================================');
            scriptLogger.info('Операція була виконана!')
        return
        }
        /**
         * @summary username - Лоігн адміністратора
         */
        const username = process.argv.at(-1);


        if(!username) {
            showHelp()
            scriptLogger.info('=====================================');
            scriptLogger.info('Не були передані потрібні аргументи для виконання операції, операцію зупинено!')
            return;
        }

            await runCommand(command,username)
            scriptLogger.info('=====================================');
            scriptLogger.info('Операція була виконана!')
            return

    }catch(error){
        const message = error instanceof Error ? error.message : String(error);
        scriptLogger.info('=====================================');
        scriptLogger.error('Виникла помилка з контролем статуса адміністратора',{message})
        throw error;
    }
}

main()