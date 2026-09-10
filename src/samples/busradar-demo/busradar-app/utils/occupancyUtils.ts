// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/** Kanonische Auslastungsstufe einer Abfahrt. */
export type OccupancyCategory = "low" | "medium" | "high";

/**
 * Ordnet den rohen `besetztgrad`-Text der Busradar-API einer kanonischen
 * Auslastungsstufe zu. Die Zuordnung ist schlüsselwortbasiert und
 * groß-/kleinschreibungsunabhängig, damit unterschiedliche API-Schreibweisen
 * (z. B. "Schwach besetzt" oder "Niedrig") dieselbe Stufe ergeben.
 *
 * Rückgabe:
 * - eine {@link OccupancyCategory}, wenn ein bekanntes Schlüsselwort passt
 * - `undefined` für leere Werte oder nicht zuordenbare Texte; die UI zeigt
 *   dann für nicht-leere Werte ein generisches Label an.
 */
export function classifyOccupancy(value: unknown): OccupancyCategory | undefined {
    if (typeof value !== "string") {
        return undefined;
    }

    const normalized = value.trim().toLocaleLowerCase("de-DE");
    if (!normalized) {
        return undefined;
    }

    if (/(schwach|niedrig|gering)/.test(normalized)) {
        return "low";
    }
    if (/(mittel|mäßig|maessig|durchschnitt|normal)/.test(normalized)) {
        return "medium";
    }
    if (/(stark|hoch|voll|überfüllt|ueberfuellt)/.test(normalized)) {
        return "high";
    }

    return undefined;
}
