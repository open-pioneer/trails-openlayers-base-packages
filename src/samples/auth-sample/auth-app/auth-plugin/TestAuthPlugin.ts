// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import {
    AuthPlugin,
    AuthPluginEvents,
    AuthState,
    LoginBehavior
} from "@open-pioneer/authentication";
import { EventEmitter } from "@open-pioneer/core";
import { Service } from "@open-pioneer/runtime";
import { createElement } from "react";
import { LoginMask } from "./LoginMask";

export class TestAuthPlugin extends EventEmitter<AuthPluginEvents> implements Service, AuthPlugin {
    #state: AuthState = {
        kind: "pending"
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    #timerId: any;
    #wasLoggedIn = false;

    constructor() {
        super();

        // Delay state change to simulate a delay that may be needed to
        // determine the user's login state (e.g. rest request).
        this.#timerId = setTimeout(() => {
            this.#state = {
                kind: "not-authenticated"
            };
            this.emit("changed");
        }, 500);
    }

    destroy() {
        clearTimeout(this.#timerId);
        this.#timerId = undefined;
    }

    getAuthState(): AuthState {
        return this.#state;
    }

    getLoginBehavior(): LoginBehavior {
        // Trivial username / password check called by the react component.
        // The plugin's state changes if the credentials are correct.
        const doLogin = (userName: string, password: string): string | undefined => {
            if (userName === "admin" && password === "admin") {
                this.#state = {
                    kind: "authenticated",
                    sessionInfo: {
                        userId: "admin",
                        userName: "Arnold Administrator"
                    }
                };
                this.#wasLoggedIn = true;
                this.emit("changed");
            } else {
                return "Invalid user name or password!";
            }
        };

        // This component is rendered when the user is not logged in, for example
        // by the `<ForceAuth />` component.
        const AuthFallback = () =>
            createElement(LoginMask, {
                doLogin: doLogin,
                wasLoggedIn: this.#wasLoggedIn
            });
        return {
            kind: "fallback",
            Fallback: AuthFallback
        };
    }

    logout() {
        if (this.#state.kind === "authenticated" || this.#state.kind === "pending") {
            this.#state = {
                kind: "not-authenticated"
            };
            clearTimeout(this.#timerId);
            this.#timerId = undefined;
            this.emit("changed");
        }
    }
}
