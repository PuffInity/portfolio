
export type ServiceGalleryRow = {
    id: number,
    service_id: number,
    image: string,
    title: string | null,
    caption: string | null,
    created_at: Date,
    updated_at: Date,
}


export type ServiceGalleryEntity = {
    id: number,
    serviceId: number,
    image: string,
    title: string | null,
    caption: string | null,
    createdAt: Date,
    updatedAt: Date,
}

export type ServiceGalleryInsert = {
    serviceId: number,
    image: string,
    title: string | null,
    caption: string | null,
}

export type ServiceGalleryUpdate = Partial<{
    image: string,
    title: string | null,
    caption: string | null,
}>