
export type adminRow = {
    id: number,
    login: string,
    password_hash: string,
    created_at: Date,
    updated_at: Date,
}

export type adminEntity = {
    id: number,
    login: string,
    passwordHash: string,
    createdAt: Date,
    updatedAt: Date
}

export type adminInsert = {
    login: string,
    passwordHash: string,
}

export type adminUpdate = Partial<{
    login: string,
    passwordHash: string,
}>