// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { ForceAuth, useAuthState } from "@open-pioneer/authentication";
import { useService } from "open-pioneer:react-hooks";
import Keycloak from "keycloak-js";
import { Container, Heading, Flex, Text } from "@open-pioneer/chakra-integration";
import { LogoutButton } from "./LogoutButton";

export function AppUI() {
    const authService = useService("authentication.AuthService");
    const authState = useAuthState(authService);
    const sessionInfo = authState.kind == "authenticated" ? authState.sessionInfo : undefined;
    const userId = sessionInfo?.userId;
    const keycloak = sessionInfo?.attributes?.keycloak as Keycloak;
    const familyName = sessionInfo?.attributes?.familyName as string;

    return (
        <ForceAuth>
            <Container p={5}>
                <Heading as="h1">Authenticated</Heading>
                <Text>UserId: {userId}</Text>
                <Text>Token: {keycloak?.idToken}</Text>
                <Text>Family Name: {familyName}</Text>
                <Flex pt={5} flexDirection="row" justifyContent="center">
                    <LogoutButton />
                </Flex>
            </Container>
        </ForceAuth>
    );
}
