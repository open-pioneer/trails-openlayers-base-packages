// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { useService } from "open-pioneer:react-hooks";
import { ComponentType, FC, ReactNode, useCallback, useMemo, useSyncExternalStore } from "react";
import {
    AuthService,
    // eslint-disable-next-line unused-imports/no-unused-imports
    AuthPlugin
} from "./api";

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
    const authService = useService("authentication.AuthService");
    const state = useAuthState(authService);
    const AuthFallback = useMemo(() => {
        if (state.kind === "not-authenticated") {
            return authService.getAuthFallback();
        }
    }, [authService, state.kind]);

    switch (state.kind) {
        case "pending":
            return null;
        case "not-authenticated": {
            if (!AuthFallback) {
                return null;
            }
            if (props.renderFallback) {
                return <>{props.renderFallback(AuthFallback)}</>;
            }
            return <AuthFallback {...props.fallbackProps} />;
        }
        case "authenticated":
            return <>{props.children}</>;
    }
};

function useAuthState(authService: AuthService) {
    const subscribe = useCallback(
        (callback: () => void) => {
            const handle = authService.on("changed", callback);
            return () => handle.destroy();
        },
        [authService]
    );
    const getSnapshot = useCallback(() => {
        return authService.getAuthState();
    }, [authService]);
    const state = useSyncExternalStore(subscribe, getSnapshot);
    return state;
}
