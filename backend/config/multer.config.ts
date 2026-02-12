import multer, {FileFilterCallback} from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import type {Request} from "express";


/**
 * @file multer.config.ts
 * @summary Конфігураційний файл бібліотеки Multer для загрузки фотографії
 */



/**
 *  UPLOAD_DIR - Шлях до файла з збереженим фотографіями
 */
const UPLOAD_DIR = process.env.NODE_ENV === 'development' ? path.resolve(process.cwd(), 'uploads') : '/app/uploads'

/**
 * Провіряємо чи папка для збереження фотографій існує
 * Якщо ні створюємо її якщо потрібно і її вкладені папки також створюємо
 */
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Описуємо як зберігати фотографії
 */
const storage = multer.diskStorage({

   /**
    * destination - Функція викликається до кожного файлу(фотографії) які будуть приходити з фронтенда
    */
    destination: (req, file, cb) => {
        /**
         * null - Помилок немає
         * UPLOAD_DIR - Куди зберігати файл
         */
        cb(null, UPLOAD_DIR);
    },

   /**
    *  filename - Змінюємо імя файла на своє
    */
    filename: (req, file, cb) => {

        /**
         * ext - Дістаємо розширення фотографії
         */
        const ext = path.extname(file.originalname).toLowerCase();

        /**
         *  safeExt - Якщо розширення немає тоді просто ставимо своє .bin
         */
        const safeExt = ext || '.bin';

        /**
         * unique - Генеруємо унікальну частину імені файла
         * Беремо дату початка обробки файла
         * Беремо рандомне число множимо його на 1 мілліард та перетворюємо його в ціле число
         */
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

       /**
        * Повертаємо upload-Унікальна частина-Дата початка обробки файла
        * Нове ім,я файла
        */
        cb(null, `upload-${unique}${safeExt}`);
    }
});



/**
 *  fileFilter - Фільтрація файлів по MIME-тип
 */
function fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback) {

    /**
     *  allowed - Дозволені типи для використання
     */
    const allowed = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif'
    ];

    /**
     * Якщо тип файла немає в списку дозволених викидаємо помилку та зупиняємо роботу
     */
    if (!allowed.includes(file.mimetype)) {
        cb(new Error('Дозволені тільки Фотографії'));
        return
    }

    /**
     * Повертаємо що помилок немає та можемо продоувжувати
     */
    cb(null, true);
}

/**
 *  upload - Створюємо middleware та показуємо
 *  storage - Куди зберігати
 *  fileFilter - Які файли дозволені
 *  limits - Обмеження розміру файла в 2MB
 */
export const upload = multer({
    storage,

    fileFilter,

    limits: {
        fileSize: 2 * 1024 * 1024
    }
});