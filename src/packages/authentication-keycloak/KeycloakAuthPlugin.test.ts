// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, beforeEach, it, vi, expect, SpyInstance } from "vitest";
import { KeycloakAuthPlugin } from "./KeycloakAuthPlugin";
import { createService } from "@open-pioneer/test-utils/services";
import { NotificationService, NotificationOptions } from "@open-pioneer/notifier";

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
    const { keycloakAuthPlugin } = await setup();
    await vi.waitUntil(() => keycloakAuthPlugin.getAuthState().kind === "authenticated");
});

it("expect state to be 'not-authenticated'", async () => {
    hoisted.keycloakMock.init.mockResolvedValue(false);
    const { keycloakAuthPlugin } = await setup();
    await vi.waitUntil(() => keycloakAuthPlugin.getAuthState().kind === "not-authenticated");
});

it("expect keycloak init to reject'", async () => {
    hoisted.keycloakMock.init.mockRejectedValue(new Error("Error"));

    const logSpy = vi.spyOn(global.console, "error").mockImplementation(() => undefined);
    restoreMocks.push(logSpy);

    const { notifier } = await setup();
    await vi.waitUntil(() => logSpy.mock.calls.length > 0); // wait until error is logged
    expect(logSpy).toMatchInlineSnapshot(`
      [MockFunction error] {
        "calls": [
          [
            "[ERROR] authentication-keycloak:KeycloakAuthPlugin: Failed to check if user is authenticated",
            [Error: Failed to initialize keycloak session],
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
    expect(notifier._notifications).toMatchInlineSnapshot(`
      [
        {
          "level": "error",
          "message": "loginFailed.message",
          "title": "loginFailed.title",
        },
      ]
    `);
});

it("should reject by updating the token", async () => {
    hoisted.keycloakMock.init.mockResolvedValue(true);
    hoisted.keycloakMock.updateToken.mockRejectedValue(new Error("Error"));
    const { keycloakAuthPlugin } = await setup();

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
    const { keycloakAuthPlugin } = await setup();
    const refreshSpy = vi.spyOn(keycloakAuthPlugin as any, "__refresh");
    restoreMocks.push(refreshSpy);

    await vi.waitUntil(() => keycloakAuthPlugin.getAuthState().kind === "authenticated");
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    vi.advanceTimersToNextTimer();
    expect(hoisted.keycloakMock.updateToken).toHaveBeenCalledTimes(1);
});

type MockedNotifier = Partial<NotificationService> & { _notifications: NotificationOptions[] };

async function setup() {
    const notifier = {
        _notifications: [] as NotificationOptions[],

        notify(options) {
            this._notifications.push(options);
        }
    } satisfies MockedNotifier;
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
        },
        references: {
            notifier
        }
    });

    return { notifier, keycloakAuthPlugin };
}
