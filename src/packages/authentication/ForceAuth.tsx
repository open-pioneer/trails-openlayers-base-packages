// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { useService } from "open-pioneer:react-hooks";
import { FC, ReactNode, useCallback, useMemo, useSyncExternalStore } from "react";
import { AuthService } from "./api";

export interface ForceAuthProps {
    children?: ReactNode;
}

export const ForceAuth: FC<ForceAuthProps> = (props) => {
    const authService = useService("authentication.AuthService");
    const state = useAuthState(authService);
    const AuthFallback = useMemo(() => {
        if (state.kind !== "pending") {
            return authService.getAuthFallback();
        }
    }, [authService, state.kind]);

    const waiting = "Waiting...";
    switch (state.kind) {
        case "pending":
            return <>{waiting}</>;
        case "not-authenticated":
            return AuthFallback ? <AuthFallback /> : <>{waiting}</>;
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
