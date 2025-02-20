// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BeforeRequestParams, Interceptor } from "@open-pioneer/http";

/**
 * This interceptor adds an example token to certain requests.
 * Open the developer console (GET requests to the specified host)
 * and inspect the request headers to see the effect of this.
 */
export class SampleTokenInterceptor implements Interceptor {
    beforeRequest({ target, options }: BeforeRequestParams): void {
        if (target.protocol === "https:" && target.hostname === "ogc-api.nrw.de") {
            options.headers.set("Authorization", "Bearer 12345");
        }
    }
}
