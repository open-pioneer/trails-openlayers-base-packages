// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import {
    EventEmitter,
    ManualPromise,
    createAbortError,
    createManualPromise
} from "@open-pioneer/core";
import { ComponentType, createElement } from "react";
import type { AuthEvents, AuthService, AuthState, UserInfo } from "./api";
import type { Service } from "@open-pioneer/runtime";

export class AuthServiceImpl extends EventEmitter<AuthEvents> implements AuthService, Service {
    #currentState: AuthState = {
        kind: "pending"
    };
    #whenUserInfo: ManualPromise<UserInfo | undefined> | undefined;

    constructor() {
        super();
    }

    destroy(): void {
        this.#whenUserInfo?.reject(createAbortError());
        this.#whenUserInfo = undefined;
    }

    getAuthState(): AuthState {
        return this.#currentState;
    }

    getUserInfo(): Promise<UserInfo | undefined> {
        if (this.#currentState.kind !== "pending") {
            return Promise.resolve(getUserInfo(this.#currentState));
        }

        if (!this.#whenUserInfo) {
            this.#whenUserInfo = createManualPromise();
        }
        return this.#whenUserInfo?.promise;
    }

    async getAuthFallback(): Promise<ComponentType> {
        return Dummy;
    }

    // TODO: Watch plugin
    #onPluginStateChanged(newState: AuthState) {
        this.#currentState = newState;
        if (newState.kind !== "pending" && this.#whenUserInfo) {
            this.#whenUserInfo.resolve(getUserInfo(newState));
            this.#whenUserInfo = undefined;
        }
    }
}

function Dummy() {
    return createElement("span", "not logged in");
}

function getUserInfo(state: AuthState): UserInfo | undefined {
    return state.kind === "authenticated" ? state.userInfo : undefined;
}
