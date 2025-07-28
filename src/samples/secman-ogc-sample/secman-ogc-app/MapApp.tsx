// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Code, Flex, Text, Clipboard, Button } from "@chakra-ui/react";
import { AuthService, ForceAuth } from "@open-pioneer/authentication";
import { DefaultMapProvider, MapAnchor, MapContainer } from "@open-pioneer/map";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { Notifier } from "@open-pioneer/notifier";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useService } from "open-pioneer:react-hooks";
import { MAP_ID } from "./services";

export function MapApp() {
    return (
        <ForceAuth>
            <Flex height="100%" direction="column" overflow="hidden">
                <Notifier />
                <TitledSection
                    title={
                        <Box role="region" textAlign="center" py={1}>
                            <SectionHeading size={"md"}>
                                Security.Manager OGC - Map Sample
                            </SectionHeading>
                        </Box>
                    }
                >
                    <DefaultMapProvider mapId={MAP_ID}>
                        <Flex flex="1" direction="column" position="relative">
                            <LoginStatus />
                            <MapContainer role="main">
                                <MapAnchor
                                    position="bottom-right"
                                    horizontalGap={10}
                                    verticalGap={30}
                                >
                                    <Flex direction="column" gap={1} padding={1}>
                                        <InitialExtent />
                                        <ZoomIn />
                                        <ZoomOut />
                                    </Flex>
                                </MapAnchor>
                            </MapContainer>
                        </Flex>
                    </DefaultMapProvider>
                </TitledSection>
            </Flex>
        </ForceAuth>
    );
}

function LoginStatus() {
    const authService = useService<AuthService>("authentication.AuthService");
    const authState = useReactiveSnapshot(() => authService.getAuthState(), [authService]);

    const sessionInfo = authState.kind === "authenticated" ? authState.sessionInfo : undefined;
    if (!sessionInfo) {
        return null;
    }

    const userName = sessionInfo.userName ?? sessionInfo.userId;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token: string | undefined = (sessionInfo.attributes as any).keycloak?.token;

    return (
        <Flex direction="row" justifyContent="center" gap={2} my={2}>
            <Text as="span">
                Logged in as <Code>{userName}</Code>
            </Text>

            <Box>
                <Clipboard.Root value={token}>
                    <Clipboard.Label>Token: </Clipboard.Label>
                    <Clipboard.Trigger asChild>
                        <Button variant="surface" size="xs">
                            <Clipboard.Indicator />
                            <Clipboard.CopyText />
                        </Button>
                    </Clipboard.Trigger>
                </Clipboard.Root>
            </Box>
        </Flex>
    );
}
