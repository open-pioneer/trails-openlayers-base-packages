// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useSyncExternalStore } from "react";
import { AuthService, AuthState } from "./api";

/**
 * React hook that always returns the `authService`'s current auth state.
 */
export function useAuthState(authService: AuthService): AuthState {
    // subscribe to changes of the auth service.
    // useCallback (or useMemo) is needed for stable function references:
    // otherwise `useSyncExternalStore` would re-subscribe on every render.
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
