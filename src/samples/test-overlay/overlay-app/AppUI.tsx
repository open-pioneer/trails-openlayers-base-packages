// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, Separator, VStack, Text } from "@chakra-ui/react";
import { DefaultMapProvider, MapAnchor, MapContainer, Overlay, useMapModel } from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { MAP_ID } from "./MapConfigProviderImpl";
import { useEffect, useId, useMemo } from "react";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { OverviewMap } from "@open-pioneer/overview-map";
import { BasemapSwitcher } from "@open-pioneer/basemap-switcher";

export function AppUI() {
    const intl = useIntl();
    const { map } = useMapModel(MAP_ID);

    const overviewMapLayer = useMemo(
        () =>
            new TileLayer({
                source: new OSM()
            }),
        []
    );

    useEffect(() => {
        let overlay: Overlay | undefined = undefined;
        if (map) {
            overlay = map.overlays.addOverlay({ position: [404747, 5757920], positioning: "center-center" }, <Box bg={"white"}>This is a static map overlay!</Box>);
        }
        return () => {
            if (overlay) {
                overlay.destroy();
            }
        };
    },[map]);

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box
                        role="region"
                        aria-label={intl.formatMessage({ id: "ariaLabel.header" })}
                        textAlign="center"
                        py={1}
                    >
                        <SectionHeading size={"md"}>
                            Open Pioneer Trails - Overlays
                        </SectionHeading>
                    </Box>
                }
            >
                {map && (
                    <DefaultMapProvider map={map}>
                        <Flex flex="1" direction="column" position="relative">
                            <MapContainer aria-label={intl.formatMessage({ id: "ariaLabel.map" })}>
                                <MapAnchor position="top-right" horizontalGap={5} verticalGap={5}>
                                    <Box
                                        backgroundColor="white"
                                        borderWidth="1px"
                                        borderRadius="lg"
                                        padding={2}
                                        boxShadow="lg"
                                        aria-label={intl.formatMessage({
                                            id: "ariaLabel.topRight"
                                        })}
                                    >
                                        <OverviewMap olLayer={overviewMapLayer} />
                                        <Separator mt={4} />
                                        <BasemapSwitcherComponent />
                                    </Box>
                                </MapAnchor>
                                <MapAnchor
                                    position="bottom-right"
                                    horizontalGap={10}
                                    verticalGap={30}
                                >
                                    <Flex
                                        aria-label={intl.formatMessage({
                                            id: "ariaLabel.bottomRight"
                                        })}
                                        direction="column"
                                        gap={1}
                                        padding={1}
                                    >
                                        
                                    </Flex>
                                </MapAnchor>
                            </MapContainer>
                        </Flex>
                        <Flex
                            role="region"
                            aria-label={intl.formatMessage({ id: "ariaLabel.footer" })}
                            gap={3}
                            alignItems="center"
                            justifyContent="center"
                        >
                            <CoordinateViewer precision={2} />
                            <ScaleBar />
                            <ScaleViewer />
                        </Flex>
                    </DefaultMapProvider>
                )}
            </TitledSection>
        </Flex>
    );
}


function BasemapSwitcherComponent() {
    const intl = useIntl();
    const labelId = useId();
    return (
        <VStack align="start" mt={2} gap={1}>
            <Text id={labelId} as="b" mb={1}>
                {intl.formatMessage({ id: "basemapLabel" })}
            </Text>
            <BasemapSwitcher aria-labelledby={labelId} allowSelectingEmptyBasemap />
        </VStack>
    );
}