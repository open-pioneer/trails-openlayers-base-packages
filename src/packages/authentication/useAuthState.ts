// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useSyncExternalStore } from "react";
import { AuthService, AuthState } from "./api";

/**
 * React hook that always returns the `authService`'s current auth state.
 *
 * TODO: Should this use `useService` or a direct argument passing style?
 */
export function useAuthState(authService: AuthService): AuthState {
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
