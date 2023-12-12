// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Container, Flex, Heading, Text } from "@open-pioneer/chakra-integration";
import { LogoutButton } from "./LogoutButton";
import { ForceAuth, useAuthState } from "@open-pioneer/authentication";
import { useService } from "open-pioneer:react-hooks";
import Keycloak from "keycloak-js";

export function AppUI() {
    const authService = useService("authentication.AuthService");
    const authState = useAuthState(authService);
    const sessionInfo = authState.kind == "authenticated" ? authState.sessionInfo : undefined;
    const userName = sessionInfo?.userId;
    const keycloak = sessionInfo?.attributes?.keycloak as Keycloak;

    return (
        <ForceAuth>
            <Container p={5}>
                <Heading as="h1">Authenticated</Heading>
                <Text>UserName: {userName}</Text>
                <Text>Token: {keycloak.token}</Text>
                <Flex pt={5} flexDirection="row" justifyContent="center">
                    <LogoutButton />
                </Flex>
            </Container>
        </ForceAuth>
    );
}
