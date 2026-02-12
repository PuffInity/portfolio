
export type ContactRow = {
    id: number,
    email: string,
    telegram: string | null,
    telegram_label: string | null,
    github: string | null,
    github_label: string | null,
    created_at: Date,
    updated_at: Date
}


export type ContactEntity = {
    id: number,
    email: string,
    telegram: string | null,
    telegramLabel: string | null,
    github: string | null,
    githubLabel: string | null,
    createdAt: Date,
    updatedAt: Date,
}

 export type ContactInsert = {
     email: string,
     telegram: string | null,
     telegramLabel: string | null,
     github: string | null,
     githubLabel: string | null,
 }

 export type ContactUpdate = Partial<{
     email: string,
     telegram: string | null,
     telegramLabel: string | null,
     github: string | null,
     githubLabel: string | null,
 }>