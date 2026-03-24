// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Sanitizer } from "@esri/arcgis-html-sanitizer";

const sanitizer = new Sanitizer();

/**
 * Sanitizes the given raw html string.
 *
 * The result is safe to use as raw HTML in properties like `innerHTML`.
 */
export function sanitizeHtml(rawHtml: string): string {
    return sanitizer.sanitize(rawHtml);
}
