
export type MainPageRow = {
    id: number,
    service_id: number,
    title: string | null,
    subtitle: string | null,
    bullets: string[],
    image: string | null,
    btn_text1: string | null,
    btn_href1: string | null,
    btn_text2: string | null,
    btn_href2: string | null,
    services_lead: string | null,
    pricing_lead: string | null,
    created_at: Date,
    updated_at: Date,
}


export type MainPageEntity = {
    id: number,
    serviceId: number,
    title: string | null,
    subtitle: string | null,
    bullets: string[],
    image: string | null,
    btnText1: string | null,
    btnHref1: string | null,
    btnText2: string | null,
    btnHref2: string | null,
    servicesLead: string | null,
    pricingLead: string | null,
    createdAt: Date,
    updatedAt: Date,
}


export type MainPageInsert = {
    serviceId: number,
    title: string | null,
    subtitle: string | null,
    bullets: string[],
    image: string | null,
    btnText1: string | null,
    btnHref1: string | null,
    btnText2: string | null,
    btnHref2: string | null,
    servicesLead: string | null,
    pricingLead: string | null,
}

export type MainPageUpdate = Partial<{
    title: string | null,
    subtitle: string | null,
    bullets: string[],
    image: string | null,
    btnText1: string | null,
    btnHref1: string | null,
    btnText2: string | null
    btnHref2: string | null,
    servicesLead: string | null,
    pricingLead: string | null,
}>