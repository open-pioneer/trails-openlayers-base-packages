// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import {
    EventEmitter,
    ManualPromise,
    Resource,
    createAbortError,
    createManualPromise,
    destroyResource
} from "@open-pioneer/core";
import { ComponentType, createElement } from "react";
import type { AuthEvents, AuthPlugin, AuthService, AuthState, SessionInfo } from "./api";
import type { Service, ServiceOptions } from "@open-pioneer/runtime";

export class AuthServiceImpl extends EventEmitter<AuthEvents> implements AuthService, Service {
    #plugin: AuthPlugin;
    #currentState: AuthState;
    #whenUserInfo: ManualPromise<SessionInfo | undefined> | undefined;
    #eventHandle: Resource | undefined;

    constructor(serviceOptions: ServiceOptions<{ plugin: AuthPlugin }>) {
        super();
        this.#plugin = serviceOptions.references.plugin;

        // Init from plugin state and watch for changes.
        this.#currentState = this.#plugin.getAuthState();
        this.#eventHandle = this.#plugin.on?.("changed", () => this.#onPluginStateChanged());
    }

    destroy(): void {
        this.#whenUserInfo?.reject(createAbortError());
        this.#whenUserInfo = undefined;
        this.#eventHandle = destroyResource(this.#eventHandle);
    }

    getAuthState(): AuthState {
        return this.#currentState;
    }

    getUserInfo(): Promise<SessionInfo | undefined> {
        if (this.#currentState.kind !== "pending") {
            return Promise.resolve(getUserInfo(this.#currentState));
        }

        if (!this.#whenUserInfo) {
            this.#whenUserInfo = createManualPromise();
        }
        return this.#whenUserInfo?.promise;
    }

    getAuthFallback(): ComponentType {
        return Dummy;
    }

    #onPluginStateChanged() {
        const newState = this.#plugin.getAuthState();
        this.#currentState = newState;
        if (newState.kind !== "pending" && this.#whenUserInfo) {
            this.#whenUserInfo.resolve(getUserInfo(newState));
            this.#whenUserInfo = undefined;
        }
        this.emit("changed");
    }
}

function Dummy() {
    return createElement("span", undefined, "not logged in");
}

function getUserInfo(state: AuthState): SessionInfo | undefined {
    return state.kind === "authenticated" ? state.sessionInfo : undefined;
}
