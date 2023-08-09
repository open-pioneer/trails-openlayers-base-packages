// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { useAuthState } from "@open-pioneer/authentication";
import { Button } from "@open-pioneer/chakra-integration";
import { createLogger } from "@open-pioneer/core";
import { useService } from "open-pioneer:react-hooks";

const LOG = createLogger("auth-app:LogoutButton");

export function LogoutButton() {
    const authService = useService("authentication.AuthService");
    const authState = useAuthState(authService);
    const doLogout = () => {
        authService.logout().catch((e) => {
            LOG.error("Logout failed", e);
        });
    };

    if (authState.kind === "not-authenticated" || authState.kind === "pending") {
        return null;
    }
    return (
        <Button colorScheme="red" onClick={doLogout}>
            Log out
        </Button>
    );
}
