// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { GeolocationC } from "@open-pioneer/geolocation";
import { Box, Flex, FormControl, FormLabel, Text, VStack } from "@open-pioneer/chakra-integration";
import { TitledSection, SectionHeading } from "@open-pioneer/react-utils";
import { MapAnchor, MapContainer } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import { MAP_ID } from "./MapConfigProviderImpl";

export function AppUI() {
    const intl = useIntl();

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box textAlign="center" py={1}>
                        <SectionHeading size={"md"}>
                            OpenLayers Base Packages - Geolocation
                        </SectionHeading>
                    </Box>
                }
            >
                <Flex flex="1" direction="column" position="relative">
                    <MapContainer mapId={MAP_ID}>
                        <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                            <Box
                                backgroundColor="whiteAlpha.900"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                            >
                                <FormControl>
                                    <FormLabel ps={1}>
                                        <Text as="b">
                                            {intl.formatMessage({ id: "LOCATE_ME" })}
                                        </Text>
                                    </FormLabel>
                                    <GeolocationC mapId={MAP_ID}></GeolocationC>
                                </FormControl>
                            </Box>
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
                                        This application can be used to test the geolocation.
                                    </Text>
                                </VStack>
                            </MapAnchor>
                        </MapAnchor>
                    </MapContainer>
                </Flex>
            </TitledSection>
        </Flex>
    );
}
