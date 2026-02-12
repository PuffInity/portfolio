import express from 'express'
import {errorHandler} from "./middlewares/errorHandler.middleware.js";
import {requestIdMiddleware} from "./middlewares/requestId.middleware.js";
import {applySecurity} from "./config/security.config.js";
import {activateRoutes} from "./routes/index.js";
import {metricsHttpNodeMiddleware} from "./middlewares/metrics/http-metrics.middleware.js";

/**
 * @file app.ts
 * @summary Файл в якому виконуються головні підключення та налаштування
 */

/** Створюємо головний обʼєкт app */
const app = express();
/***/
app.set('trust proxy', 1)
/** Викликаємо функцію яка вмикає захист для додатку */
applySecurity(app)
/** Вмикаємо middleware який привʼязує до кожного запиту свій ID */
app.use(requestIdMiddleware)
/** Збираємо http метрики */
app.use(metricsHttpNodeMiddleware)
/** Підʼєднуємо всі роути які маємо */
activateRoutes(app)

/** Вмикаємо error-Handler */
app.use(errorHandler)



export default app






