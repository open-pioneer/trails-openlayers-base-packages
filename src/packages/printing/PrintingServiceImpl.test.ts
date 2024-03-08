// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { expect, it } from "vitest";

// Example:
it("test promise rejection", async () => {
    const failingPromise = Promise.reject(new Error("help!"));
    await expect(failingPromise).rejects.toMatchInlineSnapshot("[Error: help!]");
});
