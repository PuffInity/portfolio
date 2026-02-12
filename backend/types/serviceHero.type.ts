
export type ServiceHeroRow = {
    id: number,
    service_id: number,
    title: string,
    lead: string | null,
    image: string | null,
    btn_href1: string | null,
    btn_text1: string | null,
    btn_href2: string | null,
    btn_text2: string | null,
    duration: string | null,
    executor: string | null,
    price_hero: string | null,
    created_at: Date,
    updated_at: Date
}

export type ServiceHeroEntity = {
    id: number,
    serviceId: number,
    title: string,
    lead: string | null,
    image: string | null,
    btnHref1: string | null,
    btnText1: string | null,
    btnHref2: string | null,
    btnText2: string | null,
    duration: string | null,
    executor: string | null,
    priceHero: string | null,
    createdAt: Date,
    updatedAt: Date,
}



export type ServiceHeroInsert = {
    serviceId: number,
    title: string,
    lead: string | null,
    image: string | null,
    btnHref1: string | null,
    btnText1: string | null,
    btnHref2: string | null,
    btnText2: string | null,
    duration: string | null,
    executor: string | null,
    priceHero: string | null,
}

export type ServiceHeroUpdate = Partial<{
    title: string,
    lead: string | null,
    image: string | null,
    btnHref1: string | null,
    btnText1: string | null,
    btnHref2: string | null,
    btnText2: string | null,
    duration: string | null,
    executor: string | null,
    priceHero: string | null,
}>