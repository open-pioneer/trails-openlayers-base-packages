// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import {
    EventEmitter,
    ManualPromise,
    Resource,
    createAbortError,
    createManualPromise,
    destroyResource,
    createLogger
} from "@open-pioneer/core";
import { ComponentType } from "react";
import type { AuthEvents, AuthPlugin, AuthService, AuthState, SessionInfo } from "./api";
import type { Service, ServiceOptions } from "@open-pioneer/runtime";

const LOG = createLogger("authentication:AuthService");

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
        LOG.debug(
            `Constructed with initial auth state '${this.#currentState.kind}'`,
            this.#currentState
        );
    }

    destroy(): void {
        this.#whenUserInfo?.reject(createAbortError());
        this.#whenUserInfo = undefined;
        this.#eventHandle = destroyResource(this.#eventHandle);
    }

    getAuthState(): AuthState {
        return this.#currentState;
    }

    getSessionInfo(): Promise<SessionInfo | undefined> {
        if (this.#currentState.kind !== "pending") {
            return Promise.resolve(getSessionInfo(this.#currentState));
        }

        if (!this.#whenUserInfo) {
            this.#whenUserInfo = createManualPromise();
        }
        return this.#whenUserInfo?.promise;
    }

    getAuthFallback(): ComponentType {
        return this.#plugin.getAuthFallback();
    }

    #onPluginStateChanged() {
        const newState = this.#plugin.getAuthState();
        this.#currentState = newState;
        if (newState.kind !== "pending" && this.#whenUserInfo) {
            this.#whenUserInfo.resolve(getSessionInfo(newState));
            this.#whenUserInfo = undefined;
        }
        LOG.debug(`Auth state changed to '${this.#currentState.kind}'`, this.#currentState);
        this.emit("changed");
    }
}

function getSessionInfo(state: AuthState): SessionInfo | undefined {
    return state.kind === "authenticated" ? state.sessionInfo : undefined;
}
