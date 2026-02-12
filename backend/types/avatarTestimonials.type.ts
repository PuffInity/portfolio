export type AvatarTestimonialsRow = {
    id: number;
    name: string;
    url: string;
};

export type AvatarTestimonialsEntity = {
    id: number;
    name: string;
    url: string;
};

export type AvatarTestimonialsInsert = {
    name: string;
    url: string;
};

export type AvatarTestimonialsUpdate = Partial<{
    name: string;
    url: string;
}>;