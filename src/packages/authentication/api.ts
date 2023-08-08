// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import type { EventSource } from "@open-pioneer/core";
import type { ComponentType } from "react";

/**
 * Events emitted by the {@link AuthService}.
 */
export interface AuthEvents {
    /** Emitted when there were any changes to the service's state. */
    changed: void;
}

/**
 * Information about the authenticated user's session.
 */
export interface SessionInfo {
    /** Technical user id of the authenticated user, for example an email address. */
    userId: string;

    /**
     * Display name of the authenticated user.
     * Use the {@link userId} as a default value if this value is not available.
     */
    userName?: string;

    /** Set to a date if the session expires at some point. Optional. */
    expiresAt?: Date;

    /** Arbitrary attributes from the authentication plugin. */
    attributes?: Record<string, unknown>;
}

/**
 * This state is active when the authentication service
 * is still checking whether the current user is authenticated or not.
 */
export interface AuthStatePending {
    kind: "pending";
}

/**
 * The user not authenticated.
 */
export interface AuthStateNotAuthenticated {
    kind: "not-authenticated";
}

/**
 * The user is authenticated and its session attributes
 * can be retrieved.
 */
export interface AuthStateAuthenticated {
    kind: "authenticated";
    sessionInfo: SessionInfo;
}

/**
 * Models the current authentication state.
 *
 * NOTE: Future versions of this package may define additional states.
 * Your code should contain sensible fallback or error logic.
 */
export type AuthState = AuthStatePending | AuthStateNotAuthenticated | AuthStateAuthenticated;

/**
 * Manages the current user's authentication state.
 *
 * The current state (such as session info) can be retrieved and watched for changes.
 *
 * TODO:
 *  - Modeling of fallback component / imperative function for login?
 *  - Logout()
 */
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
     * Returns the current user's {@link SessionInfo} or `undefined`, if the current user is not authenticated.
     *
     * The method is asynchronous to allow for async initialization in the authentication plugin.
     *
     * This method must be called again after the {@link AuthService} has emitted the `changed` event.
     */
    getSessionInfo(): Promise<SessionInfo | undefined>;

    /**
     * Returns a UI component suitable for rendering when the user is not logged in.
     *
     * This can be, for example, a login dialog.
     *
     * The actual implementation of this component depends on the application's authentication plugin.
     */
    getAuthFallback(): ComponentType;
}

/** Events that may be emitted by an authentication plugin. */
export interface AuthPluginEvents {
    changed: void;
}

/** Optional base type for an authentication plugin: the event emitter interface is not required. */
export type AuthPluginEventBase = EventSource<AuthPluginEvents>;

/**
 * The authentication service requires an AuthPlugin to implement a concrete authentication flow.
 *
 * The plugin provides the current authentication state and the authentication fallback to the service.
 *
 * The current authentication state returned by {@link getAuthState} may change.
 * If that is the case, the plugin must also emit the `changed` event to notify the service.
 *
 * The implementation of `AuthPluginEventBase` is optional: it is only necessary if the state changes
 * during the lifetime of the plugin.
 * To implement the event, you can use `extend EventEmitter<AuthPluginEvents>`.
 */
export interface AuthPlugin extends Partial<AuthPluginEventBase> {
    getAuthState(): AuthState;
    getAuthFallback(): ComponentType;
}

import "@open-pioneer/runtime";
declare module "@open-pioneer/runtime" {
    interface ServiceRegistry {
        "authentication.AuthService": AuthService;
        "authentication.AuthPlugin": AuthPlugin;
    }
}
