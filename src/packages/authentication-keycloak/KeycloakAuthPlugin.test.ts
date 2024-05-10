// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, beforeEach, it, vi, expect, SpyInstance } from "vitest";
import { KeycloakAuthPlugin } from "./KeycloakAuthPlugin";
import { createService } from "@open-pioneer/test-utils/services";

//https://vitest.dev/api/vi.html#vi-mock
const hoisted = vi.hoisted(() => {
    return {
        keycloakMock: {
            init: vi.fn(),
            updateToken: vi.fn()
        }
    };
});
//The call to vi.mock is hoisted
vi.mock("keycloak-js", () => ({
    default: vi.fn().mockReturnValue(hoisted.keycloakMock)
}));

let restoreMocks: SpyInstance[] = [];

beforeEach(() => {
    vi.useFakeTimers();
    restoreMocks = [];
});

afterEach(() => {
    vi.clearAllMocks();
    for (const mock of restoreMocks) {
        mock.mockRestore();
    }
});

it("expect state to be 'authenticated'", async () => {
    hoisted.keycloakMock.init.mockResolvedValue(true);
    const keycloakAuthPlugin = await setup();
    await vi.waitUntil(() => keycloakAuthPlugin.getAuthState().kind === "authenticated");
});

it("expect state to be 'not-authenticated'", async () => {
    hoisted.keycloakMock.init.mockResolvedValue(false);
    const keycloakAuthPlugin = await setup();
    await vi.waitUntil(() => keycloakAuthPlugin.getAuthState().kind === "not-authenticated");
});

it("expect keycloak init to reject'", async () => {
    hoisted.keycloakMock.init.mockRejectedValue(new Error("Error"));

    const logSpy = vi.spyOn(global.console, "error").mockImplementation(() => undefined);
    restoreMocks.push(logSpy);

    const keycloakAuthPlugin = await setup();
    await vi.waitUntil(() => keycloakAuthPlugin.getAuthState().kind === "not-authenticated");
    expect(logSpy).toMatchInlineSnapshot(`
      [MockFunction error] {
        "calls": [
          [
            "[ERROR] authentication-keycloak:KeycloakAuthPlugin: Failed to check if user is authenticated",
            [Error: Error],
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
});

it("should reject by updating the token", async () => {
    hoisted.keycloakMock.init.mockResolvedValue(true);
    hoisted.keycloakMock.updateToken.mockRejectedValue(new Error("Error"));
    const keycloakAuthPlugin = await setup();
    restoreMocks.push(vi.spyOn(keycloakAuthPlugin, "refresh"));

    const logSpy = vi.spyOn(global.console, "error").mockImplementation(() => undefined);
    restoreMocks.push(logSpy);

    await vi.waitUntil(() => keycloakAuthPlugin.getAuthState().kind === "authenticated");
    vi.advanceTimersToNextTimer();

    await vi.waitUntil(() => keycloakAuthPlugin.getAuthState().kind === "not-authenticated");
    expect(logSpy).toMatchInlineSnapshot(`
      [MockFunction error] {
        "calls": [
          [
            "[ERROR] authentication-keycloak:KeycloakAuthPlugin: Failed to refresh token",
            [Error: Error],
          ],
          [
            "[ERROR] authentication-keycloak:KeycloakAuthPlugin: Failed to refresh token",
            [Error: Error],
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
});

it("should update the token in interval", async () => {
    hoisted.keycloakMock.init.mockResolvedValue(true);
    hoisted.keycloakMock.updateToken.mockResolvedValue(true);
    const keycloakAuthPlugin = await setup();
    const spy = vi.spyOn(keycloakAuthPlugin, "refresh");
    restoreMocks.push(spy);

    await vi.waitUntil(() => keycloakAuthPlugin.getAuthState().kind === "authenticated");
    expect(keycloakAuthPlugin.refresh).toHaveBeenCalledTimes(1);
    vi.advanceTimersToNextTimer();
    expect(hoisted.keycloakMock.updateToken).toHaveBeenCalledTimes(1);
});

async function setup() {
    const keycloakAuthPlugin = await createService(KeycloakAuthPlugin, {
        properties: {
            keycloakOptions: {
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
                keycloakConfig: {
                    url: "https://auth.exaple.com/",
                    realm: "realm",
                    clientId: "test-id"
                },
                keycloakLogoutOptions: null,
                keycloakLoginOptions: null
            }
        }
    });

    return keycloakAuthPlugin;
}

// auth refresh success, auto refresh fail, init fail
