// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { useService } from "open-pioneer:react-hooks";
import { ReactNode, useCallback, useSyncExternalStore } from "react";
import { useAsync } from "react-use";
import { AuthService } from "./api";

export interface ForceAuthProps {
    children?: ReactNode;
}

export function ForceAuth(props: ForceAuthProps) {
    const authService = useService("authentication.AuthService");
    const state = useAuthState(authService);

    // TODO: Error?
    const { value: AuthFallback } = useAsync(async () => {
        if (state.kind === "not-authenticated") {
            return authService.getAuthFallback();
        }
    }, [authService, state.kind]);

    const waiting = "Waiting...";
    switch (state.kind) {
        case "pending":
            return waiting;
        case "not-authenticated":
            return AuthFallback ? <AuthFallback /> : waiting;
        case "authenticated":
            return props.children;
    }
}

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
