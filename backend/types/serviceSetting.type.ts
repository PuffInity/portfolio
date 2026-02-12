
export type ServiceSettingRow = {
    id: number,
    service_id: number,
    contact_id: number,
    discount: string,
    include: string[],
    additional: string[],
    price_title: string,
    price_subtitle: string,
    price: string,
    terms: string[],
    quickstart: string,
    created_at: Date,
    updated_at: Date,
}



export type ServiceSettingEntity = {
    id: number,
    serviceId: number,
    contactId: number,
    discount: string,
    include: string[]
    additional: string[],
    price_title: string,
    price_subtitle: string,
    price: string,
    terms: string[],
    quickStart: string,
    createdAt: Date,
    updatedAt: Date,
}

export type ServiceSettingInsert = {
    serviceId: number,
    contactId: number,
    discount: string,
    include: string[],
    additional: string[],
    price_title: string,
    price_subtitle: string,
    price: string,
    terms: string[],
    quickStart: string,
}

export type ServiceSettingUpdate = Partial<{
    discount: string,
    include: string[],
    additional: string[],
    price_title: string,
    price_subtitle: string,
    price: string,
    terms: string[],
    quickStart: string,
}>
