// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { ForceAuth } from "@open-pioneer/authentication";
import { Container, Heading } from "@open-pioneer/chakra-integration";

export function AppUI() {
    return (
        <ForceAuth>
            <Container p={5}>
                <Heading as="h1">Authenticated</Heading>
                This is the actual content of the app. Authentication was successful.
            </Container>
        </ForceAuth>
    );
}
