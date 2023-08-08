// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { useService } from "open-pioneer:react-hooks";
import { FC, ReactNode, useCallback, useMemo, useSyncExternalStore } from "react";
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
     *  these properties will be provided to the AuthFallback component implemented by the authentication plugin.
     */
    fallbackProps?: Record<string, unknown>;
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
 *
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
        case "not-authenticated":
            return AuthFallback ? <AuthFallback {...props.fallbackProps} /> : null;
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
