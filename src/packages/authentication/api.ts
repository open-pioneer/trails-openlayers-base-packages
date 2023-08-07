// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import type { EventSource } from "@open-pioneer/core";

export interface AuthEvents {
    changed: void;
}

export interface UserInfo {
    todo: boolean;
}

export type AuthState =
    | {
          kind: "pending";
      }
    | {
          kind: "not-authenticated";
      }
    | {
          kind: "authenticated";
          userInfo: UserInfo;
      };

export interface AuthService extends EventSource<AuthEvents> {
    /**
     * Returns the current authentication state.
     *
     * The state may initially be `pending` to allow for async initialization in the authentication plugin.
     * After initialization, the state is either `not-authenticated` or `authenticated`.
     * 
      This method must be called again after the {@link AuthService} has emitted the `changed` event.
     */
    getAuthState(): AuthState;

    /**
     * Returns the current user's {@link UserInfo} or `undefined`, if the current user is not authenticated.
     *
     * The method is asynchronous to allow for async initialization in the authentication plugin.
     *
     * This method must be called again after the {@link AuthService} has emitted the `changed` event.
     */
    getUserInfo(): Promise<UserInfo | undefined>;

    /**
     * Returns a UI component suitable for rendering when the user is not logged in.
     *
     * This can be, for example, a login dialog.
     *
     * The actual implementation of this component depends on the application's authentication plugin.
     */
    getAuthFallback(): Promise<ComponentType>;
}

import "@open-pioneer/runtime";
import { ComponentType } from "react";
declare module "@open-pioneer/runtime" {
    interface ServiceRegistry {
        "authentication.AuthService": AuthService;
    }
}
