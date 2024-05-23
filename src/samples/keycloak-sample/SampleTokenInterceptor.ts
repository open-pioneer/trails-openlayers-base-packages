// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BeforeRequestParams, Interceptor } from "@open-pioneer/http";
import { AuthService } from "@open-pioneer/authentication";
import { ServiceOptions } from "@open-pioneer/runtime";

/**
 * This interceptor adds an example token to certain requests.
 * Open the developer console (GET requests to the specified host)
 * and inspect the request headers to see the effect of this.
 */

interface References {
    authService: AuthService;
}

export class SampleTokenInterceptor implements Interceptor {
    private authService: AuthService;

    constructor(options: ServiceOptions<References>) {
        this.authService = options.references.authService;
    }

    beforeRequest({ target, options }: BeforeRequestParams): void {
        const authState = this.authService.getAuthState();
        const sessionInfo = authState.kind == "authenticated" ? authState.sessionInfo : undefined;
        const keycloak = sessionInfo?.attributes?.keycloak;
        const token = (keycloak as { token: string }).token;
        if (target.protocol === "https:" && target.hostname === "ogc-api.nrw.de" && token) {
            options.headers.set("Authorization", token);
        }
    }
}
