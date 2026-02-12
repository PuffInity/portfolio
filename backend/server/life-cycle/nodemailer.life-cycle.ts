import nodemailer from 'nodemailer';
import { nodemailerConfig,mailLogger} from "../../config/nodemailer.config.js";


let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

let started = false;

export async function nodemailerInit() {
    if (started) {
        mailLogger.warn('Nodemailer, вже вімкнений', {
            started: started,
            transporter: transporter,
        });
        return;
    }

    try {
        const t = nodemailer.createTransport(nodemailerConfig);

        await t.verify();

        transporter = t;
        started = true;

        mailLogger.info('Nodemailer підʼєднаний');
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        mailLogger.error('Nodemailer помилка при підʼєднанні бібліотеки', { message: message });
        throw error;
    }
}

export function getMailTransporter() {
    if (!transporter || !started) {
        mailLogger.error('Nodemailer не є підʼєднанний.', {
            started: started,
            transporter: !!transporter,
        });
        throw new Error();
    }
    return transporter;
}

export async function nodemailerShutdown() {
    if (!transporter) {
        mailLogger.warn('Nodemailer не є підʼєднанний.');
        return;
    }

    try {
        await transporter.close();
        mailLogger.info('Nodemailer відʼєднанний');
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        mailLogger.error('Nodemailer помилка при спробі відʼєднання', { message: message });
    } finally {
        started = false;
        transporter = null;
        mailLogger.info('Nodemailer статус змінних скинуті');
    }
}