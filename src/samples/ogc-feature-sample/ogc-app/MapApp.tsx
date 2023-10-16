// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex } from "@open-pioneer/chakra-integration";
import { MapAnchor, MapContainer } from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { Toc } from "@open-pioneer/toc";
import { ZoomIn, ZoomOut, InitialExtent } from "@open-pioneer/map-navigation";
import { useIntl } from "open-pioneer:react-hooks";
import { MAP_ID } from "./MapConfigProviderImpl";

export function MapApp() {
    const intl = useIntl();

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box textAlign="center" py={1}>
                        <SectionHeading size={"md"}>
                            Open Pioneer - OGC-Feature-Sample
                        </SectionHeading>
                    </Box>
                }
            >
                <Flex flex="1" direction="column" position="relative">
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
    );
}
