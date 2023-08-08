// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { AuthPlugin, AuthState } from "@open-pioneer/authentication";
import { ComponentType, createElement } from "react";
import { EventEmitter } from "@open-pioneer/core";
import { Service } from "@open-pioneer/runtime";
import { LoginMask } from "./LoginMask";

export class TestAuthPlugin extends EventEmitter<{ changed: void }> implements Service, AuthPlugin {
    #state: AuthState = {
        kind: "pending"
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    #timer: any;

    constructor() {
        super();
        this.#timer = setTimeout(() => {
            this.#state = {
                kind: "not-authenticated"
            };
            this.emit("changed");
        }, 1000);
    }

    destroy() {
        clearTimeout(this.#timer);
        this.#timer = undefined;
    }

    getAuthState(): AuthState {
        return this.#state;
    }

    getAuthFallback(): ComponentType {
        const doLogin = (userName: string, password: string): string | undefined => {
            if (userName === "admin" && password === "admin") {
                this.#state = {
                    kind: "authenticated",
                    sessionInfo: {
                        userId: "admin",
                        userName: "Arnold Administrator"
                    }
                };
                this.emit("changed");
            } else {
                return "Invalid user name or password!";
            }
        };
        const AuthFallback = () =>
            createElement(LoginMask, {
                doLogin: doLogin
            });
        return AuthFallback;
    }
}
