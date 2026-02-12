import {Request,Response} from "express";

import {testimonialsSchema} from "../../validator/schema/mainPage-work.schema.js";
import {createTestimonials} from "../../helpers/db/app.db.js";
import {TestimonialsEntity} from "../../types/testimonials.type.js";



import {sendLetterSchema} from "../../validator/schema/mainPage-work.schema.js";
import {sendLetterHelper} from "../../helpers/nodemailer.helper.js";

/**
 * @file main-works.handler.ts
 * @summary Другорядна робота на головній сторінці
 */


//==========================================================================================

/**
 * CreateTestimonial - Тип відгука для створення
 */
export interface CreateTestimonial extends Pick<TestimonialsEntity, 'avatar' | 'role' | 'text' | 'author'> {}

/**
 * createLetter - Тип для створення повідомлення
 */
interface createLetter {
    name: string,
    from: string,
    text: string
}

//==========================================================================================

/**
 * @summary writeTestimonials - Створення відгука
 */
export const writeTestimonials = async (req: Request<{},{},CreateTestimonial>,res: Response) => {
    const data = testimonialsSchema.parse(req.body)
    await createTestimonials(data.text, data.author, data.role || null, data.avatar || null)

    return res.status(201).json({
        ok:true,
        message: 'Ваш відгук прийнято. Він буде перевірений адміністрацією на наявність шкідливого або небажаного контенту. Якщо все добре, відгук з’явиться на сайті протягом 24 годин.'
    })
}

//==========================================================================================

/**
 * @summary sendLetter - Відправити email лист
 */
export const sendLetter = async (req: Request<{},{},createLetter>, res: Response)=> {
    const data = sendLetterSchema.parse(req.body)

    await sendLetterHelper(data.name,data.from,data.text)

    res.json({message: 'Лист відправлено'})
}