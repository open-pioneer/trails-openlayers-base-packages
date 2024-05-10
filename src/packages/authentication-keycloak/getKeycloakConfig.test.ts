// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { it, expect } from "vitest";
import { getKeycloakConfig } from "./KeycloakAuthPlugin";
import { KeycloakOptions } from "./api";

it("expect to throw an error if the keycloakConfig not provided ", async () => {
    const keycloakOptions = {
        refreshOptions: {
            autoRefresh: true,
            interval: 6000,
            timeLeft: 70
        },
        keycloakInitOptions: {
            onLoad: "check-sso",
            pkceMethod: "S256",
            scope: "data:read"
        },
        keycloakConfig: {}
    } as KeycloakOptions;

    const properties = {
        keycloakOptions
    };
    expect(() => getKeycloakConfig(properties)).toThrowErrorMatchingInlineSnapshot(
        '"KeycloakConfig not found: The Keycloak configuration options are required by the plugin to perform login and logout operations"'
    );
});
