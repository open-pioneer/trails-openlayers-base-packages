// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Flex } from "@open-pioneer/chakra-integration";
import { Sidebar, SidebarItem } from "@open-pioneer/experimental-layout-sidebar";
import { LayerControlComponent } from "@open-pioneer/experimental-ol-layer-control";
import { MapAnchor, MapContainer, MapPadding } from "@open-pioneer/experimental-ol-map";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { ScaleComponent } from "map-sample-scale-component";
import { ZoomComponent } from "map-sample-zoom-component";
import { useService } from "open-pioneer:react-hooks";
import { useRef, useState } from "react";
import { FiCodesandbox, FiLayers } from "react-icons/fi";
import { useAsync } from "react-use";

import { MAP_ID } from "./services";

const berlin = [1489200, 6894026, 1489200, 6894026];

export function MapApp() {
    const [viewPadding, setViewPadding] = useState<MapPadding>();
    const [isExpanded, setExpanded] = useState<boolean>(true);

    const olMapRegistry = useService("ol-map.MapRegistry");
    const mapState = useAsync(async () => await olMapRegistry.getMap(MAP_ID));

    const centerBerlin = () => {
        if (mapState.value) {
            mapState.value.getView().fit(berlin, { maxZoom: 13 });
        }
    };

    const items: SidebarItem[] = [
        {
            id: "mapcontent",
            icon: <FiLayers />,
            label: "Karteninhalt",
            content: <LayerControlComponent mapId={MAP_ID} showOpacitySlider={true} />
        },
        {
            id: "sandbox",
            icon: <FiCodesandbox />,
            label: "Sandbox",
            content: <Button onClick={centerBerlin}>Center Berlin</Button>
        }
    ];

    const scaleViewerRef = useRef<HTMLDivElement>(null);
    const coordinateViewerRef = useRef<HTMLDivElement>(null);

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <Box textAlign="center" py={1}>
                Open Pioneer - Map sample
            </Box>
            <Flex flex="1" direction="column" position="relative">
                <MapContainer
                    mapId={MAP_ID}
                    viewPadding={viewPadding}
                    viewPaddingChangeBehavior="preserve-extent"
                >
                    <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                        <Box backgroundColor="whiteAlpha.800" padding={4} boxShadow="lg">
                            I move with the sidebar 🙂
                        </Box>
                    </MapAnchor>
                    <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={30}>
                        <ZoomComponent mapId={MAP_ID}></ZoomComponent>
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
                            <ScaleViewer mapId={MAP_ID} ref={scaleViewerRef}></ScaleViewer>
                            <ScaleComponent mapId={MAP_ID}></ScaleComponent>
                        </Flex>
                    </MapAnchor>
                    {/* <MapAnchor position="bottom-left" horizontalGap={10}>
                        <Box backgroundColor="whiteAlpha.800" padding={4} boxShadow="lg">
                            I move with the sidebar 🙂 I move with the sidebar 🙂 I move with the sidebar 🙂 I move with the sidebar 🙂 I move with the sidebar 🙂 I move with the sidebar 🙂 I move with the sidebar 🙂 I move with the sidebar 🙂 
                        </Box>
                        <Box
                            backgroundColor="whiteAlpha.800"
                            marginTop={2}
                            padding={4}
                            boxShadow="lg"
                        >
                            Aktueller Maßstab
                            <ScaleViewer mapId={MAP_ID} ref={scaleViewerRef}></ScaleViewer>
                        </Box>
                        <Box
                            backgroundColor="whiteAlpha.800"
                            marginTop={2}
                            padding={4}
                            boxShadow="lg"
                        >
                            Aktueller Maßstab
                            <ScaleViewer mapId={MAP_ID} ref={scaleViewerRef}></ScaleViewer>
                        </Box>
                        <Box
                            backgroundColor="whiteAlpha.800"
                            marginTop={2}
                            padding={4}
                            boxShadow="lg"
                        >
                            Aktueller Maßstab
                            <ScaleViewer mapId={MAP_ID} ref={scaleViewerRef}></ScaleViewer>
                        </Box>
                        <Box
                            backgroundColor="whiteAlpha.800"
                            marginTop={2}
                            padding={4}
                            boxShadow="lg"
                        >
                            Aktueller Maßstab
                            <ScaleViewer mapId={MAP_ID} ref={scaleViewerRef}></ScaleViewer>
                        </Box>
                        <Box
                            backgroundColor="whiteAlpha.800"
                            marginTop={2}
                            padding={4}
                            boxShadow="lg"
                        >
                            Aktueller Maßstab
                            <ScaleViewer mapId={MAP_ID} ref={scaleViewerRef}></ScaleViewer>
                        </Box>
                        <Box
                            backgroundColor="whiteAlpha.800"
                            marginTop={2}
                            padding={4}
                            boxShadow="lg"
                        >
                            Aktueller Maßstab
                            <ScaleViewer mapId={MAP_ID} ref={scaleViewerRef}></ScaleViewer>
                        </Box>
                        <Box
                            backgroundColor="whiteAlpha.800"
                            marginTop={2}
                            padding={4}
                            boxShadow="lg"
                        >
                            Aktueller Maßstab
                            <ScaleViewer mapId={MAP_ID} ref={scaleViewerRef}></ScaleViewer>
                        </Box>
                        <Box
                            backgroundColor="whiteAlpha.800"
                            marginTop={2}
                            padding={4}
                            boxShadow="lg"
                        >
                            Aktueller Maßstab
                            <ScaleViewer mapId={MAP_ID} ref={scaleViewerRef}></ScaleViewer>
                        </Box>
                        <Box
                            backgroundColor="whiteAlpha.800"
                            marginTop={2}
                            padding={4}
                            boxShadow="lg"
                        >
                            Aktueller Maßstab
                            <ScaleViewer mapId={MAP_ID} ref={scaleViewerRef}></ScaleViewer>
                        </Box>
                        <Box
                            backgroundColor="whiteAlpha.800"
                            marginTop={2}
                            padding={4}
                            boxShadow="lg"
                        >
                            Placeholder Chakra Box
                        </Box>
                        <Box
                            backgroundColor="whiteAlpha.800"
                            marginTop={2}
                            padding={4}
                            boxShadow="lg"
                        >
                            Placeholder Chakra Box
                        </Box>
                        <Box
                            backgroundColor="whiteAlpha.800"
                            marginTop={2}
                            padding={4}
                            boxShadow="lg"
                        >
                            Placeholder Chakra Box
                        </Box>
                    </MapAnchor> */}
                </MapContainer>

                <Sidebar
                    defaultExpanded={isExpanded}
                    expandedChanged={(expanded) => setExpanded(expanded)}
                    sidebarWidthChanged={(width) => setViewPadding({ left: width })}
                    items={items}
                />
            </Flex>
            <Flex gap={3} alignItems="center" justifyContent="center">
                <CoordinateViewer
                    mapId={MAP_ID}
                    ref={coordinateViewerRef}
                    precision={2}
                ></CoordinateViewer>
                <ScaleComponent mapId={MAP_ID}></ScaleComponent>
            </Flex>
        </Flex>
    );
}
