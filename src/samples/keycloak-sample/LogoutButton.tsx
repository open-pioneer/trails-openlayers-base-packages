// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Button } from "@open-pioneer/chakra-integration";
import { useService } from "open-pioneer:react-hooks";

export function LogoutButton() {
    const authService = useService("authentication.AuthService");

    const doLogout = () => {
        authService.logout();
    };

    return (
        <Button colorScheme="red" onClick={doLogout}>
            Log out
        </Button>
    );
}
