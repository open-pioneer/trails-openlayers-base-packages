// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { AuthService } from "@open-pioneer/authentication";
import { BeforeRequestParams, Interceptor } from "@open-pioneer/http";
import { ServiceOptions } from "@open-pioneer/runtime";

const SECURED_HOST = "http://mylocalhost:8082";

interface References {
    authService: AuthService;
}

export class TokenInterceptor implements Interceptor {
    #authService: AuthService;

    constructor(options: ServiceOptions<References>) {
        this.#authService = options.references.authService;
    }

    async beforeRequest({ target, options }: BeforeRequestParams): Promise<void> {
        if (target.origin !== SECURED_HOST) {
            return;
        }

        const hasToken =
            target.searchParams.has("token") ||
            target.searchParams.has("access_token") ||
            options.headers.has("Authorization");
        if (hasToken) {
            return;
        }

        const session = await this.#authService.getSessionInfo();
        if (!session) {
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const token = (session.attributes?.keycloak as any)?.token as string | undefined;
        if (token) {
            options.headers.set("Authorization", `Bearer ${token}`);
        }
    }
}
