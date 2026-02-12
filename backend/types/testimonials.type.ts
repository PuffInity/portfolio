
export type TestimonialsRow = {
    id: number,
    service_id: number,
    enabled: boolean,
    text: string,
    author: string,
    role: string | null,
    avatar: string | null,
    sort_order: number,
    created_at: Date,
    updated_at: Date,
}

export type TestimonialsEntity = {
    id: number,
    serviceId: number,
    enabled: boolean,
    text: string,
    author: string,
    role: string | null,
    avatar: string | null,
    sortOrder: number,
    createdAt: Date,
    updatedAt: Date,
}

export type TestimonialsInsert = {
    serviceId: number,
    enabled?: boolean,
    text: string,
    author: string,
    role: string | null,
    avatar: string | null,
    sortOrder?: number,
}

export type TestimonialsUpdate = Partial<{
    enabled: boolean,
    text: string,
    author: string,
    role: string | null,
    avatar: string | null,
    sortOrder: number,
}>