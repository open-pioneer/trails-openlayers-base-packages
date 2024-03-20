// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { assert, it } from "vitest";
import { KeycloakAuthPlugin, References } from "./KeycloakAuthPlugin";
import { KeycloakConfigProvider } from "./api";
import { ServiceOptions } from "@open-pioneer/runtime";

it("expect state to be 'not-authenticated'", async () => {
    const x = Promise.resolve(false);
    const keycloak = {
        init() {
            return x;
        }
    } as unknown;

    const config = {
        setKeycloak() {
            return keycloak;
        },

        getInitOptions() {
            return {
                onLoad: "check-sso",
                pkceMethod: "S256"
            };
        },

        getLoginOptions() {
            return {};
        },

        getLogoutOptions() {
            return {};
        },

        getRefreshOptions() {
            return {
                autoRefresh: true,
                interval: 6000,
                timeLeft: 70
            };
        }
    } as KeycloakConfigProvider;
    const plugin = new KeycloakAuthPlugin({
        references: { config: config }
    } as ServiceOptions<References>);
    x.then(() => assert.strictEqual(plugin.getAuthState().kind, "not-authenticated"));
});

it("expect state to be 'authenticated'", async () => {
    const x = Promise.resolve(true);
    const keycloak = {
        init() {
            return x;
        }
    } as unknown;

    const config = {
        setKeycloak() {
            return keycloak;
        },

        getInitOptions() {
            return {
                onLoad: "check-sso",
                pkceMethod: "S256"
            };
        },

        getLoginOptions() {
            return {};
        },

        getLogoutOptions() {
            return {};
        },

        getRefreshOptions() {
            return {
                autoRefresh: true,
                interval: 6000,
                timeLeft: 70
            };
        }
    } as KeycloakConfigProvider;
    const plugin = new KeycloakAuthPlugin({
        references: { config: config }
    } as ServiceOptions<References>);
    x.then(() => assert.strictEqual(plugin.getAuthState().kind, "authenticated"));
});

// auth refresh success, auto refresh fail, init fail
