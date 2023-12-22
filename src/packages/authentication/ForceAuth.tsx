// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useService } from "open-pioneer:react-hooks";
import { ComponentType, FC, ReactNode, useEffect, useMemo } from "react";
import {
    // For typedoc link
    // eslint-disable-next-line unused-imports/no-unused-imports
    AuthPlugin,
    AuthService
} from "./api";
import { useAuthState } from "./useAuthState";

/**
 * Properties for the ForceAuth component.
 */
export interface ForceAuthProps {
    /**
     * These properties will be provided to the AuthFallback component implemented by the authentication plugin.
     *
     * NOTE: This property is not used when {@link renderFallback} is specified.
     */
    fallbackProps?: Record<string, unknown>;

    /**
     * This property can be used to customize rendering of the authentication fallback.
     *
     * The `AuthFallback` parameter passed to the render prop is the fallback implemented by the authentication plugin.
     * You can customize the rendering of the fallback by implementing this function.
     * For example, `AuthFallback` could be wrapped with a few parent components.
     *
     * NOTE: `renderFallback` takes precedence before {@link fallbackProps}.
     *
     * Example:
     *
     * ```jsx
     * <ForceAuth
     *     renderFallback={(AuthFallback) => {
     *         return (
     *             <SomeContainer>
     *                 <AuthFallback foo="bar" />
     *             </SomeContainer>
     *         );
     *     }}
     * >
     *     App Content
     * </ForceAuth>
     * ```
     */
    renderFallback?: (AuthFallback: ComponentType<Record<string, unknown>>) => ReactNode;

    /** The children are rendered if the current user is authenticated. */
    children?: ReactNode;
}

/**
 * `ForceAuth` renders its children if the current user is authenticated.
 * If the user is not authenticated, a `AuthFallback` will be presented to the user.
 *
 * The implementation of the `AuthFallback` depends on the authentication plugin used by the application
 * (see {@link AuthPlugin}).
 *
 * For an application that requires the user to always be logged in, simply
 * surround the entire application UI with the `ForceAuth` component:
 *
 * ```jsx
 * import { ForceAuth } from "@open-pioneer/authentication";
 *
 * export function AppUI() {
 *     return (
 *         <ForceAuth>
 *              <TheRestOfYourApplication />
 *         </ForceAuth>
 *     );
 * }
 * ```
 */
export const ForceAuth: FC<ForceAuthProps> = (props) => {
    const authService = useService<AuthService>("authentication.AuthService");
    const state = useAuthState(authService);

    // Extract login behavior from service (only when needed).
    const behavior = useMemo(() => {
        if (state.kind === "not-authenticated") {
            return authService.getLoginBehavior();
        }
    }, [authService, state.kind]);

    // Call the login effect (if any) if not authenticated.
    useEffect(() => {
        if (state.kind === "not-authenticated" && behavior?.kind === "effect") {
            behavior.login();
        }
    }, [behavior, state.kind]);

    switch (state.kind) {
        case "pending":
            return null;
        case "not-authenticated": {
            if (!behavior || behavior.kind !== "fallback") {
                return null;
            }

            const AuthFallback = behavior.Fallback;
            if (props.renderFallback) {
                return <>{props.renderFallback(AuthFallback)}</>;
            }
            return <AuthFallback {...props.fallbackProps} />;
        }
        case "authenticated":
            return <>{props.children}</>;
    }
};
