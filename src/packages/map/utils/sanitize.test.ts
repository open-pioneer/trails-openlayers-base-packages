// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { sanitizeAttributions, sanitizeHtml } from "./sanitize";
import { Attribution } from "ol/source/Source";

describe("sanitizeHtml", () => {
    it("supports links and basic formatting tags", () => {
        const input = `<a href="https://example.com">Link</a> <strong>Text</strong>`;
        const sanitized = sanitizeHtml(input);
        expect(sanitized).toBe(input);
    });

    it("removes scripts", () => {
        const input = `<a href="https://example.com" onclick="alert(1)">Link</a>`;
        const sanitized = sanitizeHtml(input);
        expect(sanitized).toMatchInlineSnapshot(`"<a href="https://example.com">Link</a>"`);
    });
});

describe("sanitizeAttributions", () => {
    it("runs sanitizer on single strings", () => {
        const input = `<a href="https://example.com" onclick="alert(1)">Link</a>`;
        expect(sanitizeAttributions(input)).toMatchInlineSnapshot(
            `"<a href="https://example.com">Link</a>"`
        );
    });

    it("runs sanitizer on array of strings", () => {
        const input = `<a href="https://example.com" onclick="alert(1)">Link</a>`;
        expect(sanitizeAttributions([input, input, input])).toMatchInlineSnapshot(
            `
          [
            "<a href="https://example.com">Link</a>",
            "<a href="https://example.com">Link</a>",
            "<a href="https://example.com">Link</a>",
          ]
        `
        );
    });

    it("runs sanitizer on functions", () => {
        const input = `<a href="https://example.com" onclick="alert(1)">Link</a>`;
        const sanitizedFn = sanitizeAttributions(() => input) as Attribution;
        expect(sanitizedFn({} as any)).toMatchInlineSnapshot(
            `"<a href="https://example.com">Link</a>"`
        );
    });

    it("runs sanitizer on functions that return arrays", () => {
        const input = `<a href="https://example.com" onclick="alert(1)">Link</a>`;
        const sanitizedFn = sanitizeAttributions(() => [input, input]) as Attribution;
        expect(sanitizedFn({} as any)).toMatchInlineSnapshot(
            `
          [
            "<a href="https://example.com">Link</a>",
            "<a href="https://example.com">Link</a>",
          ]
        `
        );
    });
});
