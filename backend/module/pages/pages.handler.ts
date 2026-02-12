import {Request,Response} from "express";
import {withTransaction} from "../../helpers/db.helper.js";
import {getMainPageFromDb} from "../../helpers/db/app.db.js";
import {getServicesPageFromDb} from "../../helpers/db/service.db.js";
import {getServiceByPath,getPathServices} from "../../helpers/db/service.db.js";
import {isExistKey,setJSON,getJSON} from "../../helpers/redisCache.helper.js";

/**
 * @file pages.handler.ts
 * @summary Загрузка даних на фронтенд з бази даних
 */

//==========================================================================================

/**
 * @summary mainPage - Збирає дані Головної сторінки з бази даних та відає на фронтенд
 */
export const mainPage = async (req: Request,res: Response)=> {
    /**
     * Провіряєио чи існують збережені дані головної сторінки Redis якщо так тоді відаємо з Redis якщо ні тоді беремо з бази даних
     */
    if(await isExistKey('page:main')) {
        const dataJSON = await getJSON('page:main')
       return  res.json(dataJSON)
    } else {
        const data = await withTransaction(getMainPageFromDb)
        await setJSON('page:main',data,600)

       return res.json(data)
    }
}

//==========================================================================================

/**
 * @summary servicePages - Збирає дані сторінок Сервісів з бази даних та відає на фронтенд
 */
export const servicePages = async (req: Request,res: Response) => {
    /**
     * Беремо назву сервіса з параметрів шляха
     */
    const path: string = req.params.path
    /**
     * Беремл масив існуючих шляхів до сервісів
     * та провіряємо чи співпадає потрібний нам path з одним з існуючих в базі
     */
    const ALLOWED_TYPES = await getPathServices()

    if(!ALLOWED_TYPES.includes(path)) {
        return res.sendStatus(404)
    }
    /**
     * Дістаємо данні якщо все ок тоді провіряємо ключ чи збережений в базі Redis якщо так
     * відаємо дані з Redis якщо ні тоді робимо запит в Базу даних
     */
    const services = await getServiceByPath(path)
    if(!services) {
        return res.sendStatus(404)
    }

    if(await isExistKey(`page:${path}`)){
        const dataJSON = await getJSON(`page:${path}`)
       return  res.json(dataJSON)
    }else {
        const data = await withTransaction(getServicesPageFromDb,services.id)
        await setJSON(`page:${path}`,data,600)

        return res.json(data)
    }
}