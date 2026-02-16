import {pool} from "../../config/database.config.js";
import {executeVoid} from "../db.helper.js";
import {isColumnNotFound, isTableNotFound} from "../../error/db.error.js";
import {helperLogger} from "../db.helper.js";
import {GalleryService} from "../../types/admin/servicesType.admin.js";

export async function saveImageForMainHero (path?: string) {
    const client = await pool.connect()
    try {
        if(!path)  {
            helperLogger.warn('Шлях не був відправлений', {image: path})
            return
        }
        await executeVoid(`UPDATE main_page
                                SET image = $1
                                WHERE id = $2`,[path,1],client)
        return
    }catch (err) {
        if (isTableNotFound(err)) helperLogger.error('Таблиці main_page не існує')
        if (isColumnNotFound(err)) helperLogger.error('Одної або більше колонок не існує в таблиці main_page')
        throw err
    }finally {
         client.release()
    }
}

export async function saveImageForAboutMe (path?: string) {
    const client = await pool.connect()
    try {
        if(!path)  {
            helperLogger.warn('Шлях не був відправлений', {image: path})
            return
        }

        await executeVoid(`UPDATE about_me
                                SET image = $1
                                WHERE id = $2`,[path,1],client)
        return
    }catch (err) {
        if (isTableNotFound(err)) helperLogger.error('Таблиці about_me не існує')
        if (isColumnNotFound(err)) helperLogger.error('Одної або більше колонок не існує в таблиці about_me')
        throw err
    }finally {
        client.release()
    }
}

export async function saveImageForService(data: GalleryService, path?: string) {
    const client = await pool.connect()
    try {
        await executeVoid(`UPDATE service_gallery 
                                SET image = COALESCE($1, image),
                                    title = COALESCE($2, title),
                                    caption = COALESCE($3, caption)
                                WHERE id = $4
                                `,[
                                    path ?? null,
                                    data?.title ?? null,
                                    data?.caption ?? null,
                                    data.galleryId

        ],client)
    }catch (error) {
        if (isTableNotFound(error)) helperLogger.error('Таблиці about_me не існує')
        if (isColumnNotFound(error)) helperLogger.error('Одної або більше колонок не існує в таблиці about_me')
        throw error
    }finally {
        client.release()
    }
}
