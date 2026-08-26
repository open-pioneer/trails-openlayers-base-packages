// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/** Normalisiert eine Liniennummer für den Vergleich (getrimmt, kleingeschrieben). */
export function normalizeBusradarLine(value: unknown) {
    return typeof value === "string" ? value.trim().toLocaleLowerCase("de-DE") : "";
}

/** Prüft, ob eine Linie zum aktuellen Linienfilter passt (leerer Filter = alle). */
export function lineMatchesBusradarFilter(line: unknown, selectedLines: string[]) {
    if (selectedLines.length === 0) {
        return true;
    }

    const normalizedLine = normalizeBusradarLine(line);
    return selectedLines.some(
        (selectedLine) => normalizeBusradarLine(selectedLine) === normalizedLine
    );
}
