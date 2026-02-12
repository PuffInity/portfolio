import { z } from "zod";
import dotenv from "dotenv";

if (!process.env.DOCKER) {
    dotenv.config({ path: ".env.local" });
}

export const mainPageSchema = z.object({
    /** main - Обʼєкт головного блоку (Hero). Може бути відсутній */
    main: z
        .object({
            /** title - Рядок, мінімум 1 символ. Може бути відсутній */
            title: z.string().min(1).optional(),
            /** subtitle - Рядок, мінімум 1 символ. Може бути відсутній */
            subtitle: z.string().min(1).optional(),
            /** buttonText1 - Рядок. Може бути відсутній */
            buttonText1: z.string().optional(),
            /** buttonPath1 - Рядок. Може бути відсутній */
            buttonPath1: z.string().optional(),
            /** buttonText2 - Рядок. Може бути відсутній */
            buttonText2: z.string().optional(),
            /** buttonPath2 - Рядок. Може бути відсутній */
            buttonPath2: z.string().optional(),
            /** image - URL-рядок або порожній рядок. Може бути відсутній */
            image: z.string().url().optional().or(z.literal("").optional()),
            /** bullets - Масив рядків. Може бути відсутній */
            bullets: z.array(z.string()).optional(),
        })
        .optional(),

    /** aboutMe - Обʼєкт блоку About Me. Може бути відсутній */
    aboutMe: z
        .object({
            /** title - Рядок. Може бути відсутній */
            title: z.string().optional(),
            /** description - Рядок. Може бути відсутній */
            description: z.string().optional(),
            /** focusLabel - Рядок. Може бути відсутній */
            focusLabel: z.string().optional(),
            /** focusValue - Рядок. Може бути відсутній */
            focusValue: z.string().optional(),
            /** stackLabel - Рядок. Може бути відсутній */
            stackLabel: z.string().optional(),
            /** stackValue - Рядок. Може бути відсутній */
            stackValue: z.string().optional(),
            /** features - Масив рядків. Може бути відсутній */
            features: z.array(z.string()).optional(),
            /** cta1Text - Рядок. Може бути відсутній */
            cta1Text: z.string().optional(),
            /** cta1Href - Рядок. Може бути відсутній */
            cta1Href: z.string().optional(),
            /** cta2Text - Рядок. Може бути відсутній */
            cta2Text: z.string().optional(),
            /** cta2Href - Рядок. Може бути відсутній */
            cta2Href: z.string().optional(),
            /** image - Рядок. Може бути відсутній */
            image: z.string().optional(),
        })
        .optional(),

    /** service - Обʼєкт блоку Service. Може бути відсутній */
    service: z
        .object({
            /** title - Рядок. Може бути відсутній */
            title: z.string().optional(),
            /** description - Рядок. Може бути відсутній */
            description: z.string().optional(),
            /** priceLabel - Рядок. Може бути відсутній */
            priceLabel: z.string().optional(),
            /** ctaText - Рядок. Може бути відсутній */
            ctaText: z.string().optional(),
            /** ctaHref - Рядок. Може бути відсутній */
            ctaHref: z.string().optional(),
            /** iconHtml - Рядок. Може бути відсутній */
            iconHtml: z.string().optional(),
            /** enabled - boolean (через coerce). Може бути відсутній */
            enabled: z.coerce.boolean().optional(),
            /** sortOrder - number (через coerce). Може бути відсутній */
            sortOrder: z.coerce.number().optional(),
        })
        .optional(),

    /** price - Обʼєкт блоку Price. Може бути відсутній */
    price: z
        .object({
            /** title - Рядок. Може бути відсутній */
            title: z.string().optional(),
            /** priceLabel - Рядок. Може бути відсутній */
            priceLabel: z.string().optional(),
            /** features - Масив рядків. Може бути відсутній */
            features: z.array(z.string()).optional(),
            /** badge - Рядок. Може бути відсутній */
            badge: z.string().optional(),
            /** badgeClass - Рядок. Може бути відсутній */
            badgeClass: z.string().optional(),
            /** ctaText - Рядок. Може бути відсутній */
            ctaText: z.string().optional(),
            /** ctaHref - Рядок. Може бути відсутній */
            ctaHref: z.string().optional(),
            /** popular - boolean (через coerce). Може бути відсутній */
            popular: z.coerce.boolean().optional(),
            /** sortOrder - number (через coerce). Може бути відсутній */
            sortOrder: z.coerce.number().optional(),
        })
        .optional(),

    /** selectedServiceName - Рядок. Може бути відсутній */
    selectedServiceName: z.string().optional(),
    /** selectedPricingTitle - Рядок. Може бути відсутній */
    selectedPricingTitle: z.string().optional(),
});

export const servicesPageSchema = z.object({
    /** hero - Обʼєкт Hero блоку. Може бути відсутній */
    hero: z
        .object({
            /** title - Рядок, мінімум 1 символ. Може бути відсутній */
            title: z.string().min(1).optional(),
            /** lead - Рядок. Може бути відсутній */
            lead: z.string().optional(),
            /** image - Рядок. Може бути відсутній */
            image: z.string().optional(),
            /** btnHref1 - Рядок. Може бути відсутній */
            btnHref1: z.string().optional(),
            /** btnText1 - Рядок. Може бути відсутній */
            btnText1: z.string().optional(),
            /** btnHref2 - Рядок. Може бути відсутній */
            btnHref2: z.string().optional(),
            /** btnText2 - Рядок. Може бути відсутній */
            btnText2: z.string().optional(),
            /** duration - Рядок. Може бути відсутній */
            duration: z.string().optional(),
            /** executor - Рядок. Може бути відсутній */
            executor: z.string().optional(),
            /** priceHero - Рядок. Може бути відсутній */
            priceHero: z.string().optional(),
        })
        .optional(),

    /** setting - Обʼєкт налаштувань/умов. Може бути відсутній */
    setting: z
        .object({
            /** discount - Рядок. Може бути відсутній */
            discount: z.string().optional(),
            /** include - Масив рядків. Може бути відсутній */
            include: z.array(z.string()).optional(),
            /** additional - Масив рядків. Може бути відсутній */
            additional: z.array(z.string()).optional(),
            /** price_title - Рядок. Може бути відсутній */
            price_title: z.string().optional(),
            /** price_subtitle - Рядок. Може бути відсутній */
            price_subtitle: z.string().optional(),
            /** price - Рядок. Може бути відсутній */
            price: z.string().optional(),
            /** terms - Масив рядків. Може бути відсутній */
            terms: z.array(z.string()).optional(),
            /** quickStart - Рядок. Може бути відсутній */
            quickStart: z.string().optional(),
        })
        .optional(),

    /** gallery - Обʼєкт галереї. Може бути відсутній */
    gallery: z
        .object({
            /** image - Рядок. Може бути відсутній */
            image: z.string().optional(),
            /** title - Рядок. Може бути відсутній */
            title: z.string().optional(),
            /** caption - Рядок. Може бути відсутній */
            caption: z.string().optional(),
        })
        .optional(),

    /** serviceName - Рядок. Обовʼязковий */
    serviceName: z.string(),
});

export const contactPageSchema = z.object({
    /** contacts - Обʼєкт контактів. Обовʼязковий */
    contacts: z.object({
        /** email - Рядок, додаткова перевірка: має містити '@'. Може бути відсутній */
        email: z.string().refine((value) => value.includes("@")).optional(),
        /** telegram - Рядок, мін 3, макс 15. Може бути відсутній */
        telegram: z.string().min(3).max(15).optional(),
        /** telegramLabel - Рядок, мін 3. Може бути відсутній */
        telegramLabel: z.string().min(3).optional(),
        /** github - Рядок, мін 3, макс 15. Може бути відсутній */
        github: z.string().min(3).max(15).optional(),
        /** githubLabel - Рядок, мін 3. Може бути відсутній */
        githubLabel: z.string().min(3).optional(),
    }),
});