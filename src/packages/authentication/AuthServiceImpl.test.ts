// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter } from "@open-pioneer/core";
import { it } from "vitest";
import { AuthPlugin, AuthPluginEvents, AuthState, LoginFallback } from "./api";
import { createElement } from "react";
import { createService } from "@open-pioneer/test-utils/services";
import { AuthServiceImpl } from "./AuthServiceImpl";

it("forwards the authentication plugin's state changes", async () => {
    const plugin = new TestPlugin();
    const authService = await createService(AuthServiceImpl, {
        references: {
            plugin: plugin
        }
    });

    const observedStates: AuthState[] = [authService.getAuthState()];
    authService.on("changed", () => {
        observedStates.push(authService.getAuthState());
    });

    plugin.$setAuthState({ kind: "pending" });
    plugin.$setAuthState({
        kind: "authenticated",
        sessionInfo: {
            userId: "t.user"
        }
    });
    plugin.$setAuthState({ kind: "not-authenticated" });

    expect(observedStates).toMatchInlineSnapshot(`
      [
        {
          "kind": "not-authenticated",
        },
        {
          "kind": "pending",
        },
        {
          "kind": "authenticated",
          "sessionInfo": {
            "userId": "t.user",
          },
        },
        {
          "kind": "not-authenticated",
        },
      ]
    `);
});

it("creates a promise that resolves once the plugin is no longer pending", async () => {
    const plugin = new TestPlugin();
    plugin.$setAuthState({ kind: "pending" });
    const authService = await createService(AuthServiceImpl, {
        references: {
            plugin: plugin
        }
    });
    expect(authService.getAuthState().kind).toBe("pending");

    let didResolve = false;
    const sessionInfoPromise = authService.getSessionInfo().then((info) => {
        didResolve = true;
        return info;
    });
    await sleep(25);
    expect(didResolve).toBe(false);

    plugin.$setAuthState({
        kind: "authenticated",
        sessionInfo: {
            userId: "t.user"
        }
    });
    const sessionInfo = await sessionInfoPromise;
    expect(sessionInfo?.userId).toBe("t.user");
});

it("returns the authentication plugins fallback", async () => {
    const plugin = new TestPlugin();
    const authService = await createService(AuthServiceImpl, {
        references: {
            plugin: plugin
        }
    });

    const behavior = authService.getLoginBehavior();
    expect(behavior.kind).toBe("fallback");
    expect((behavior as LoginFallback).Fallback).toBe(DummyFallback);
});

it("calls the plugin's logout method", async () => {
    const plugin = new TestPlugin();
    const authService = await createService(AuthServiceImpl, {
        references: {
            plugin: plugin
        }
    });

    expect(plugin.$logoutCalled).toBe(0);
    await authService.logout();
    expect(plugin.$logoutCalled).toBe(1);
});

class TestPlugin extends EventEmitter<AuthPluginEvents> implements AuthPlugin {
    #state: AuthState = {
        kind: "not-authenticated"
    };

    $logoutCalled = 0;

    getAuthState(): AuthState {
        return this.#state;
    }

    getLoginBehavior(): LoginFallback {
        return {
            kind: "fallback",
            Fallback: DummyFallback
        };
    }

    logout(): void {
        ++this.$logoutCalled;
    }

    $setAuthState(newState: AuthState) {
        this.#state = newState;
        this.emit("changed");
    }
}

function DummyFallback(): JSX.Element {
    return createElement("span", undefined, "Permission denied");
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}
