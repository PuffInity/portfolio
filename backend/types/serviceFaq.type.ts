
export type ServiceFaqRow = {
    id: number,
    service_id: number | null,
    enabled: boolean,
    question: string,
    answer: string,
    created_at: Date,
    updated_at: Date,
};

export type ServiceFaqEntity = {
    id: number,
    serviceId: number | null,
    enabled: boolean,
    question: string,
    answer: string,
    createdAt: Date,
    updatedAt:Date,
}


export type ServiceFaqInsert = {
    serviceId: number | null,
    enabled: boolean,
    question: string,
    answer: string,
}

export type ServiceFaqUpdate = Partial<{
    enabled: boolean,
    answer: string,
    question: string,
}>