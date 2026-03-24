// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "./sanitize";

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
