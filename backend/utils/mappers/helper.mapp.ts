export const toDate = (v: Date | string): Date => (v instanceof Date ? v : new Date(v))
