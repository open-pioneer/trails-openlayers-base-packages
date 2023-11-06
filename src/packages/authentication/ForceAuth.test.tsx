// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter } from "@open-pioneer/core";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { ForceAuth } from "./ForceAuth";
import { AuthEvents, AuthService, AuthState, LoginBehavior, SessionInfo } from "./api";

it("renders children if the user is authenticated", async () => {
    const mocks = {
        services: {
            "authentication.AuthService": new TestAuthService({
                kind: "authenticated",
                sessionInfo: {
                    userId: "test-id"
                }
            })
        }
    };

    render(
        <PackageContextProvider {...mocks}>
            <ForceAuth>
                <div data-testid="1234">testDiv</div>
            </ForceAuth>
        </PackageContextProvider>
    );

    await screen.findByTestId("1234");
});

it("renders no children if the state is pending", async () => {
    const mocks = {
        services: {
            "authentication.AuthService": new TestAuthService({
                kind: "pending"
            })
        }
    };

    render(
        <PackageContextProvider {...mocks}>
            <div data-testid="1234">
                <ForceAuth>
                    <div>testDiv</div>
                </ForceAuth>
            </div>
        </PackageContextProvider>
    );

    const result = await screen.findByTestId("1234");
    expect(result.outerHTML).toMatchInlineSnapshot('"<div data-testid=\\"1234\\"></div>"');
});

it("renders AuthFallback if the user is not authenticated", async () => {
    const mocks = {
        services: {
            "authentication.AuthService": new TestAuthService({
                kind: "not-authenticated"
            })
        }
    };

    render(
        <PackageContextProvider {...mocks}>
            <ForceAuth>
                <div data-testid="1234">testDiv</div>
            </ForceAuth>
        </PackageContextProvider>
    );

    await screen.findByTestId("LoginFallBack");
});

it("renders the AuthFallback with custom props", async () => {
    const mocks = {
        services: {
            "authentication.AuthService": new TestAuthService({
                kind: "not-authenticated"
            })
        }
    };

    render(
        <PackageContextProvider {...mocks}>
            <ForceAuth fallbackProps={{ name: "TestProp" }}>
                <div data-testid="1234">testDiv</div>
            </ForceAuth>
        </PackageContextProvider>
    );

    const result = await screen.findByTestId("LoginFallBack");
    expect(result.textContent).toMatchInlineSnapshot('"\\"TestProp\\""');
});

it("renders the AuthFallback with a custom render function", async () => {
    const mocks = {
        services: {
            "authentication.AuthService": new TestAuthService({
                kind: "not-authenticated"
            })
        }
    };

    render(
        <PackageContextProvider {...mocks}>
            <ForceAuth
                renderFallback={(AuthFallback) => {
                    return (
                        <div data-testid="LoginFallBack-wrapper">
                            <AuthFallback name="TestProp" />
                        </div>
                    );
                }}
            >
                <div data-testid="1234">testDiv</div>
            </ForceAuth>
        </PackageContextProvider>
    );

    const result = await screen.findByTestId("LoginFallBack-wrapper");
    expect(result).toMatchInlineSnapshot(`
      <div
        data-testid="LoginFallBack-wrapper"
      >
        <div
          data-testid="LoginFallBack"
        >
          "TestProp"
        </div>
      </div>
    `);
});

it("re-renders when the service's state changes", async () => {
    const testAuthService = new TestAuthService({
        kind: "pending"
    });
    const mocks = {
        services: {
            "authentication.AuthService": testAuthService
        }
    };

    render(
        <PackageContextProvider {...mocks}>
            <div data-testid="outer-div">
                <ForceAuth>
                    <div data-testid="inner-div">testDiv</div>
                </ForceAuth>
            </div>
        </PackageContextProvider>
    );

    const result = await screen.findByTestId("outer-div");
    expect(result.outerHTML).toMatchInlineSnapshot('"<div data-testid=\\"outer-div\\"></div>"');

    act(() => {
        testAuthService.setAuthState({
            kind: "authenticated",
            sessionInfo: {
                userId: "test-id"
            }
        });
    });

    const innerDiv = await screen.findByTestId("inner-div");
    expect(innerDiv.outerHTML).toMatchInlineSnapshot(
        '"<div data-testid=\\"inner-div\\">testDiv</div>"'
    );
});

it("calls a login effect if present", async () => {
    let loginCalled = false;
    const testAuthService = new TestAuthService(
        {
            kind: "not-authenticated"
        },
        {
            kind: "effect",
            login() {
                loginCalled = true;
            }
        }
    );
    const mocks = {
        services: {
            "authentication.AuthService": testAuthService
        }
    };

    render(
        <PackageContextProvider {...mocks}>
            <ForceAuth>Content</ForceAuth>
        </PackageContextProvider>
    );

    await waitFor(() => {
        if (!loginCalled) {
            throw new Error("login effect was not called");
        }
    });
});

class TestAuthService extends EventEmitter<AuthEvents> implements AuthService {
    #currentState: AuthState;
    #behavior: LoginBehavior;
    constructor(initState: AuthState, loginBehavior?: LoginBehavior) {
        super();
        this.#currentState = initState;
        this.#behavior = loginBehavior ?? {
            kind: "fallback",
            Fallback(props: Record<string, unknown>) {
                return <div data-testid="LoginFallBack">{JSON.stringify(props.name)}</div>;
            }
        };
    }
    getAuthState(): AuthState {
        return this.#currentState;
    }
    getSessionInfo(): Promise<SessionInfo | undefined> {
        throw new Error("Method not implemented.");
    }
    getLoginBehavior(): LoginBehavior {
        return this.#behavior;
    }
    logout() {
        throw new Error("Method not implemented.");
    }
    setAuthState(newState: AuthState) {
        this.#currentState = newState;
        this.emit("changed");
    }
}
