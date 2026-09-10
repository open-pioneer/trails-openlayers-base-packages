// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/** Gibt einen nicht-leeren String zurück oder `undefined`. */
export function getOptionalString(value: unknown) {
    return typeof value === "string" && value ? value : undefined;
}

/** Wandelt einen Wert in eine endliche Zahl um oder gibt `undefined` zurück. */
export function getOptionalNumber(value: unknown) {
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
}

/** Type-Guard: filtert `undefined` aus einer String-Liste. */
export function isDefinedString(value: string | undefined): value is string {
    return value !== undefined;
}

/** Type-Guard: filtert `undefined` aus einer beliebigen Liste. */
export function isDefined<T>(value: T | undefined): value is T {
    return value !== undefined;
}
