// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { DefaultMapProvider, MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { Toc } from "@open-pioneer/toc";
import { ZoomIn, ZoomOut, InitialExtent } from "@open-pioneer/map-navigation";
import { useIntl } from "open-pioneer:react-hooks";
import { MAP_ID } from "./MapConfigProviderImpl";

export function MapApp() {
    const intl = useIntl();
    const { map } = useMapModel(MAP_ID);

    return (
        map && (
            <DefaultMapProvider map={map}>
                <Flex height="100%" direction="column" overflow="hidden">
                    <TitledSection
                        title={
                            <Box textAlign="center" py={1}>
                                <SectionHeading size={"md"}>
                                    Open Pioneer - OGC API Features and OGC API Tiles Sample
                                </SectionHeading>
                            </Box>
                        }
                    >
                        <Flex flex="1" direction="column" position="relative">
                            <MapContainer role="application">
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
                                                basemapSwitcherProps={{
                                                    allowSelectingEmptyBasemap: true
                                                }}
                                            />
                                        </TitledSection>
                                    </Box>
                                </MapAnchor>
                                <MapAnchor position="top-right" horizontalGap={10} verticalGap={10}>
                                    <VStack
                                        backgroundColor="whiteAlpha.900"
                                        borderWidth="1px"
                                        borderRadius="lg"
                                        padding={2}
                                        boxShadow="lg"
                                        maxWidth="400px"
                                    >
                                        <Text as="b">Description</Text>
                                        <Text>
                                            This application can be used to test OGC API Features
                                            and OGC API Tiles.
                                        </Text>
                                        <Text>
                                            Vector Tiles cannot be reprojected and require the map
                                            to use the same projection. Currently all known MVT
                                            vector tile sets are using WebMercator, making them
                                            unusable in the Default Sample App which uses ETRS89/UTM
                                            zone 32N. This Sample App uses WebMercator.
                                        </Text>
                                    </VStack>
                                </MapAnchor>
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
                    </TitledSection>
                </Flex>
            </DefaultMapProvider>
        )
    );
}
