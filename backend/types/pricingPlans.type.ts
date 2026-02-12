 export type PricingPlansRow = {
     id: number,
     enabled: boolean,
     title: string,
     price_label: string,
     features: string[],
     btn_text: string | null,
     btn_href: string | null,
     badge: string | null,
     badgeClass: string | null,
     popular: boolean,
     sort_order: number,
     created_at: Date,
     updated_at: Date,
 }


 export type PricingPlansEntity = {
     id: number,
     enabled: boolean,
     title: string,
     priceLabel: string,
     features: string[],
     btnText: string | null,
     btnHref: string |  null,
     badge: string | null,
     badgeClass: string | null,
     popular: boolean,
     sortOrder: number,
     createdAt: Date,
     updatedAt: Date,
 }

 export type PricingPlansInsert = {
     enabled?: boolean,
     title: string,
     priceLabel: string,
     features: string[],
     btnText: string | null,
     btnHref: string | null,
     badge: string | null,
     badgeClass: string | null,
     popular?: boolean,
     sortOrder: number,
 }

 export type PricingPlansUpdate = Partial<{
     enabled: boolean,
     title: string,
     priceLabel: string,
     features: string[],
     btnText: string | null,
     btnHref: string | null,
     badge: string | null,
     badgeClass: string | null,
     popular: boolean,
     sortOrder: number,
 }>