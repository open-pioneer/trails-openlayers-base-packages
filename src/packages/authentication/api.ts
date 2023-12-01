// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { EventSource } from "@open-pioneer/core";
import type { DeclaredService } from "@open-pioneer/runtime";
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
    userName?: string | undefined;

    /** Set to a date if the session expires at some point. Optional. */
    expiresAt?: Date | undefined;

    /** Arbitrary attributes from the authentication plugin. */
    attributes?: Record<string, unknown> | undefined;
}

/**
 * Models the current authentication state.
 *
 * NOTE: Future versions of this package may define additional states.
 * Your code should contain sensible fallback or error logic.
 */
export type AuthState = AuthStatePending | AuthStateNotAuthenticated | AuthStateAuthenticated;

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
 * Defines the behavior of the authentication service when attempting to
 * authenticate a user.
 */
export type LoginBehavior = LoginFallback | LoginEffect;

/**
 * A fallback react component to present to the user.
 * For example, this can be a login form or a message.
 */
export interface LoginFallback {
    kind: "fallback";
    Fallback: ComponentType;
}

/**
 * An effect to perform when the user shall be authenticated.
 * `login()` may, for example, perform a redirect to an authentication provider.
 */
export interface LoginEffect {
    kind: "effect";
    login(): void;
}

/**
 * Manages the current user's authentication state.
 *
 * The current state (such as session info) can be retrieved and watched for changes.
 */
export interface AuthService
    extends EventSource<AuthEvents>,
        DeclaredService<"authentication.AuthService"> {
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
     * Returns the login behavior that should be performed if the user is not authenticated.
     *
     * The actual implementation of this component depends on the application's authentication plugin.
     */
    getLoginBehavior(): LoginBehavior;

    /**
     * Terminates the current session (if any).
     */
    logout(): void;
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
 * To implement the event, you can write `class MyPlugin extends EventEmitter<AuthPluginEvents>`.
 */
export interface AuthPlugin
    extends Partial<AuthPluginEventBase>,
        DeclaredService<"authentication.AuthPlugin"> {
    /**
     * Returns the current authentication state.
     *
     * Objects returned by this method should not be mutated.
     * Emit the `changed` event instead to communicate that there is a new state.
     */
    getAuthState(): AuthState;

    /**
     * Returns the login behavior that should be performed if the user is not authenticated.
     */
    getLoginBehavior(): LoginBehavior;

    /**
     * Explicitly triggers a logout.
     *
     * Should result in a new state (including a `changed` event) if the user
     * was authenticated.
     */
    logout(): Promise<void> | void;
}
