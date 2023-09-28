// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { BasemapSwitcher } from "@open-pioneer/basemap-switcher";
import { Box, Flex, FormControl, FormLabel, Text } from "@open-pioneer/chakra-integration";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { Sidebar, SidebarItem } from "@open-pioneer/experimental-layout-sidebar";
import { LayerControlComponent } from "@open-pioneer/experimental-ol-layer-control";
import { InitialExtent } from "@open-pioneer/initial-extent";
import { MapAnchor, MapContainer, MapPadding } from "@open-pioneer/map";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { ScaleComponent } from "map-sample-scale-component";
import { useIntl } from "open-pioneer:react-hooks";
import { useRef, useState } from "react";
import { FiLayers } from "react-icons/fi";
import { InitialExtent } from "@open-pioneer/initial-extent";
import { MapAnchor, MapContainer } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import { useRef } from "react";
import { MAP_ID } from "./MapConfigProviderImpl";
import { ZoomIn, ZoomOut } from "@open-pioneer/zoom";

export function MapApp() {
    const [viewPadding, setViewPadding] = useState<MapPadding>();
    const [isExpanded, setExpanded] = useState<boolean>(true);

    const intl = useIntl();

    const items: SidebarItem[] = [
        {
            id: "map-content",
            icon: <FiLayers />,
            label: "Karteninhalt",
            content: <LayerControlComponent mapId={MAP_ID} showOpacitySlider={true} />
        }
    ];

    const scaleViewerRef = useRef<HTMLDivElement>(null);
    const coordinateViewerRef = useRef<HTMLDivElement>(null);
    const intl = useIntl();
    const basemapSwitcherRef = useRef<HTMLDivElement>(null);

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <Box textAlign="center" py={1} px={1}>
                Open Pioneer - OGC-Feature-Sample
            </Box>

            <Flex flex="1" direction="column" position="relative">
                <MapContainer
                    mapId={MAP_ID}
                    viewPadding={viewPadding}
                    viewPaddingChangeBehavior="preserve-extent"
                >
                <MapContainer mapId={MAP_ID}>
                    <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                        <Box
                            backgroundColor="whiteAlpha.800"
                            borderWidth="1px"
                            borderRadius="lg"
                            padding={2}
                            boxShadow="lg"
                        >
                            <FormControl>
                                <FormLabel ps={1}>
                                    <Text as="b">{intl.formatMessage({ id: "basemapLabel" })}</Text>
                                </FormLabel>
                                <BasemapSwitcher
                                    ref={basemapSwitcherRef}
                                    allowSelectingEmptyBasemap
                                    mapId={MAP_ID}
                                />
                            </FormControl>
                        </Box>
                    </MapAnchor>
                    <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={30}>
                        <Flex direction="column" gap={1} padding={1}>
                            <InitialExtent mapId={MAP_ID} />
                            <ZoomIn mapId={MAP_ID} />
                            <ZoomOut mapId={MAP_ID} />
                        </Flex>
                    </MapAnchor>
                    <MapAnchor position="top-right">
                        <Flex
                            gap={3}
                            alignItems="center"
                            justifyContent="center"
                            padding={4}
                            boxShadow="lg"
                            backgroundColor="whiteAlpha.800"
                        >
                            <ScaleViewer mapId={MAP_ID} ref={scaleViewerRef} />
                            <ScaleComponent mapId={MAP_ID} />
                        </Flex>
                    </MapAnchor>
                </MapContainer>
            </Flex>
        </Flex>
    );
}
