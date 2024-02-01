// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";

export async function fetchCapabilities(
    url: string,
    httpService: HttpService,
    signal: AbortSignal
): Promise<string> {
    const response = await httpService.fetch(url, { signal });
    if (!response.ok) {
        throw new Error("Request failed: " + response.status);
    }
    const result = await response.text();
    return result;
}
