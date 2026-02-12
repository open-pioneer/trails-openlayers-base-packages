// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Sanitizer } from "@esri/arcgis-html-sanitizer";
import { AttributionLike } from "ol/source/Source";

const sanitizer = new Sanitizer();

/**
 * Sanitizes the given raw html string.
 *
 * The result is safe to use as raw HTML in properties like `innerHTML`.
 */
export function sanitizeHtml(rawHtml: string): string {
    return sanitizer.sanitize(rawHtml);
}

/**
 * Sanitizes an OpenLayers AttributionLike option.
 */
export function sanitizeAttributions(
    attributions: AttributionLike | undefined
): AttributionLike | undefined {
    if (!attributions) {
        return attributions;
    }
    if (typeof attributions === "function") {
        return function sanitizedAttributionFunction(...args) {
            return sanitizeAttributionItems(attributions(...args));
        };
    }
    return sanitizeAttributionItems(attributions);
}

function sanitizeAttributionItems(items: string | string[]): string | string[] {
    if (typeof items === "string") {
        return sanitizeHtml(items);
    }
    if (Array.isArray(items)) {
        return items.map((item) => {
            if (typeof item === "string") {
                return sanitizeHtml(item);
            }
            throw new Error("Expected a string");
        });
    }
    throw new Error("Expected a string or an array of strings");
}
