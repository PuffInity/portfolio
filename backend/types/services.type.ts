
export type ServicesRow = {
    id: number,
    name: string,
    path: string,
    url: string,
    description: string | null,
    price_label: string | null,
    icon_html: string | null,
    enabled: boolean,
    sort_order: number,
    created_at: Date,
    updated_at: Date,
}


export type ServicesEntity = Partial<{
    id: number,
    name: string,
    path: string,
    url: string,
    descriptions: string | null,
    priceLabel: string | null,
    iconHtml: string | null,
    enabled: boolean,
    sortOrder: number,
    createdAt: Date,
    updatedAt: Date,
}>

export type ServicesInsert = {
    name: string,
    path: string,
    url: string,
    description: string,
    priceLabel: string | null,
    iconHtml: string | null,
    enabled?: boolean,
    sortOrder?: number,
}

export type ServicesUpdate = Partial<{
    name: string,
    description: string,
    path: string,
    priceLabel: string | null,
    iconHtml: string | null,
    enabled: boolean,
    sortOrder: number,
}>