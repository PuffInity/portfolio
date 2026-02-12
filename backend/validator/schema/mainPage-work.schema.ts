import { z } from "zod";
import dotenv from "dotenv";

if (!process.env.DOCKER) {
    dotenv.config({ path: ".env.local" });
}
/**
 * @file testimonials.schema.ts
 * @summary Файл валідації схем Testimonials + SendLetter
 */

export const testimonialsSchema = z.object({
    /** avatar - Повинен бути string, обрізаємо пробіли, може бути null */
    avatar: z.string().trim().nullable(),

    /** role - Повинен бути string, обрізаємо пробіли, min 2 max 30, може бути null */
    role: z.string().trim().min(2).max(30).nullable(),

    /** text - Повинен бути string, обрізаємо пробіли, min 20 max 255 */
    text: z.string().trim().min(20).max(255),

    /** author - Повинен бути string, обрізаємо пробіли, min 2 max 30 */
    author: z.string().trim().min(2).max(30),
});

export const sendLetterSchema = z.object({
    /** name - Повинен бути string, обрізаємо пробіли, min 2 max 20 */
    name: z.string().trim().min(2).max(20),

    /** from - Повинен бути string, обрізаємо пробіли, min 5 max 255, та email */
    from: z.string().trim().min(5).max(255).email(),

    /** text - Повинен бути string, min 50 max 1000 */
    text: z.string().min(50).max(1000),
});