// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { AuthPlugin, AuthState } from "@open-pioneer/authentication";
import { ComponentType, createElement } from "react";
import { EventEmitter } from "@open-pioneer/core";
import { Service } from "@open-pioneer/runtime";

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
                kind: "authenticated",
                sessionInfo: {
                    userId: "test@user.com",
                    userName: "Test User"
                }
            };
            this.emit("changed");
        }, 3000);
    }

    destroy() {
        clearTimeout(this.#timer);
    }

    getAuthState(): AuthState {
        return this.#state;
    }

    getAuthFallback(): ComponentType {
        return function LoginMask() {
            return createElement("span", undefined, "Not logged in!");
        };
    }
}
