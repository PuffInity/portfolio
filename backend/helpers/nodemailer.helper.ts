import {getMailTransporter} from "../server/life-cycle/nodemailer.life-cycle.js";
import {defaultMailFrom, mailLogger} from "../config/nodemailer.config.js";

/**
 * @file nodemailer.helper.ts
 * @summary Файл який виконує дію хелпера Nodemailer
 */

//==========================================================================================

/**
 * @summary sendLetterHelper - Надсилає лист адміністратору на email
 * @param {string} name - Імʼя користувача який надсилає лист
 * @param {string} from - Email користувача який надсилає лист
 * @param {string} text - Текст користувача який надсилає лист
 */
export async function sendLetterHelper (name: string,from: string,text: string) {
    /**
     * Якщо обовязкові поля пусті тоді відразу видати помилку та зупинити роботу коду
     */
    if (!name || !from || !text) {
        mailLogger.error('Поля для відправки повідомлення пусті',{name,from,text})
        throw new Error()
    }
    /**
     * Беремо інстанс Nodemailer
     */
    const transport = getMailTransporter()
    try {
        /**
         * Відправляємо лист на Email адміністратора
         */
        await transport.sendMail({
            from: defaultMailFrom,
            to: defaultMailFrom,
            replyTo: from,
            subject: `Звернення з сайту — ${name}`,
            html: `<h2>Нове повідомлення з веб-сайту</h2>

                <p><strong>Відправник:</strong> ${name}</p>
                <p><strong>Email:</strong> ${from}</p>

                <hr>

                <p><strong>Повідомлення:</strong></p>
                <p>${text}</p>

                <hr>

                <p style="font-size:14px;color:#555;">
                Цей лист був надісланий автоматично через форму зворотного зв’язку на сайті.
                </p>`
                })
    } catch(error) {
        const message = error instanceof  Error ? error.message : String(error);
        mailLogger.error('Виникла помилка при спробі відправити повідомлення',{message})
        throw error
    }
}