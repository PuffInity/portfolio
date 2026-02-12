import {Request,Response} from "express";
import {saveImageForService,
        saveImageForMainHero,
        saveImageForAboutMe
} from "../../helpers/db/multer.db.js";
import {GalleryService} from "../../types/admin/servicesType.admin.js";

export const updateServiceImage = async (req: Request<{},{},GalleryService>, res: Response) => {
    const body = req.body
    const file= req.file
    console.log(body)
    console.log(file?.path)
    if(!file) {
        await saveImageForService(body)
        return res.status(200).json({message: 'ok'})
    }

    await saveImageForService(body, file?.path)
    return res.status(200).json({message: 'ok'})
}

export const updateMainImage = async (req: Request, res: Response) => {
    const file = req.file
    console.log(file)

    if(!file) {
        res.status(400).json({message: 'Файл не був відправлений'})
    }
    await saveImageForMainHero(file?.path)
    res.status(200).json({message: 'ok'})
}

export const updateAboutMeImage = async (req: Request, res: Response)=> {
    const file = req.file

    if(!file) {
        res.status(400).json({message: 'Файл не був відправлений'})
    }
    await saveImageForAboutMe(file?.path)
    res.status(200).json({message: 'ok'})
}