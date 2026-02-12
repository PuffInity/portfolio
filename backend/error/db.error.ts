import { DatabaseError } from "pg";

/**
 * @ Файл з основними та частими помилками користувачів
 */


export function isDatabaseError(error: unknown): error is DatabaseError {
    return error instanceof DatabaseError;
}

/** 42P01 — таблиця не існує */
export function isTableNotFound(error: unknown): boolean {
    return isDatabaseError(error) && error.code === "42P01";
}

/** 42703 — колонки не існує */
export function isColumnNotFound(error: unknown): boolean {
    return isDatabaseError(error) && error.code === "42703";
}

/** 23502 — порушення NOT NULL */
export function isNotNullViolation(error: unknown): boolean {
    return isDatabaseError(error) && error.code === "23502";
}

/** 23505 — унікальність порушена */
export function isUniqueViolation(error: unknown): boolean {
    return isDatabaseError(error) && error.code === "23505";
}

/** 23503 — FOREIGN KEY порушений */
export function isForeignKeyViolation(error: unknown): boolean {
    return isDatabaseError(error) && error.code === "23503";
}

/** 42501 — немає прав доступу */
export function isPermissionDenied(error: unknown): boolean {
    return isDatabaseError(error) && error.code === "42501";
}

/** 22P02 — неправильний формат даних (наприклад id='abc') */
export function isInvalidFormat(error: unknown): boolean {
    return isDatabaseError(error) && error.code === "22P02";
}

/** 23514 — CHECK-constraint порушено */
export function isCheckViolation(error: unknown): boolean {
    return isDatabaseError(error) && error.code === "23514";
}