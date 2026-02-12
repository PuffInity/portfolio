import { mailerConfig } from "../validator/schema/nodemailer.schema.js";
import {createAppLogger} from "../utils/logger/logger.js";
export const mailLogger = createAppLogger({ service: 'Nodemailer' });



export const nodemailerConfig = {
    host: mailerConfig.SMTP_HOST,
    port: mailerConfig.SMTP_PORT,
    secure: mailerConfig.SMTP_SECURE,

    auth: {
        user: mailerConfig.SMTP_USER,
        pass: mailerConfig.SMTP_PASSWORD,
    },

    pool: mailerConfig.SMTP_POOL,
    maxConnections: mailerConfig.SMTP_POOL_MAX_CONNECTIONS,
    maxMessages: mailerConfig.SMTP_POOL_MAX_MESSAGES,
    keepAlive: mailerConfig.SMTP_KEEP_ALIVE,

    connectionTimeout: mailerConfig.SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: mailerConfig.SMTP_GREETING_TIMEOUT_MS,
    socketTimeout: mailerConfig.SMTP_SOCKET_TIMEOUT_MS,

    tls: {
        rejectUnauthorized: mailerConfig.SMTP_TLS_REJECT_UNAUTHORIZED,
    },

    rateLimit: mailerConfig.RATE_LIMIT,
    disableFileAccess: true,
    disableUrlAccess: true,

};

export const defaultMailFrom = mailerConfig.MAIL_FROM;