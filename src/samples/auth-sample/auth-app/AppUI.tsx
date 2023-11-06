// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ForceAuth } from "@open-pioneer/authentication";
import { Container, Flex, Heading } from "@open-pioneer/chakra-integration";
import { LogoutButton } from "./LogoutButton";

export function AppUI() {
    return (
        <ForceAuth>
            <Container p={5}>
                <Heading as="h1">Authenticated</Heading>
                This is the actual content of the app. Authentication was successful.
                <Flex pt={5} flexDirection="row" justifyContent="center">
                    <LogoutButton />
                </Flex>
            </Container>
        </ForceAuth>
    );
}
