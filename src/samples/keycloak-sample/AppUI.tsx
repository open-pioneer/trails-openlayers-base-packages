// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { ForceAuth, useAuthState } from "@open-pioneer/authentication";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { MapAnchor, MapContainer } from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { ZoomIn, ZoomOut, InitialExtent } from "@open-pioneer/map-navigation";
import { Toc } from "@open-pioneer/toc";
import { Flex, Box, Text } from "@open-pioneer/chakra-integration";
import { LogoutButton } from "./LogoutButton";
import { MAP_ID } from "./MapConfigProviderImpl";
import { AuthService } from "@open-pioneer/authentication";

export function AppUI() {
    const authService = useService<AuthService>("authentication.AuthService");
    const authState = useAuthState(authService);
    const sessionInfo = authState.kind == "authenticated" ? authState.sessionInfo : undefined;
    const userName = sessionInfo?.attributes?.userName as string;
    const intl = useIntl();

    return (
        <ForceAuth>
            <Flex height="100%" direction="column" overflow="hidden">
                <TitledSection
                    title={
                        <Box textAlign="center" py={1}>
                            <SectionHeading size={"md"}>
                                Open Pioneer - OGC-Feature-Sample
                            </SectionHeading>
                            <Text>Logged in as: {userName}</Text>
                            <LogoutButton />
                        </Box>
                    }
                >
                    <Flex flex="3" direction="column" position="relative">
                        <MapContainer mapId={MAP_ID}>
                            <MapAnchor position="top-left" horizontalGap={20} verticalGap={20}>
                                <Box
                                    backgroundColor="white"
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    padding={2}
                                    boxShadow="lg"
                                >
                                    <TitledSection
                                        title={
                                            <SectionHeading size="md">
                                                {intl.formatMessage({ id: "tocTitle" })}
                                            </SectionHeading>
                                        }
                                    >
                                        <Toc
                                            mapId={MAP_ID}
                                            basemapSwitcherProps={{
                                                allowSelectingEmptyBasemap: true
                                            }}
                                        />
                                    </TitledSection>
                                </Box>
                            </MapAnchor>
                            <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={30}>
                                <Flex direction="column" gap={1} padding={1}>
                                    <InitialExtent mapId={MAP_ID} />
                                    <ZoomIn mapId={MAP_ID} />
                                    <ZoomOut mapId={MAP_ID} />
                                </Flex>
                            </MapAnchor>
                        </MapContainer>
                    </Flex>
                </TitledSection>
            </Flex>
        </ForceAuth>
    );
}
