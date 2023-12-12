// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Container, Flex, Heading } from "@open-pioneer/chakra-integration";
import { LogoutButton } from "./LogoutButton";
import { ForceAuth } from "@open-pioneer/authentication";
import { useService } from "open-pioneer:react-hooks";
import { useEffect, useState } from "react";

export function AppUI() {
    const authService = useService("authentication.AuthService");
    const authState = authService.getAuthState();
    const sessionInfo = authState.kind == "authenticated" ? authState.sessionInfo : undefined;
    const [userName, setUserName] = useState<string | undefined>(undefined);

    useEffect(() => {
        setUserName(sessionInfo?.userId);
    }, [authState, sessionInfo]);

    return (
        <ForceAuth>
            <Container p={5}>
                <Heading as="h1">Authenticated</Heading>
                UserName: {userName}

                Token: {sessionInfo?.attributes?.keycloak.token}
                <Flex pt={5} flexDirection="row" justifyContent="center">
                    <LogoutButton />
                </Flex>
            </Container>
        </ForceAuth>
    );
}
