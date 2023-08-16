// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Flex } from "@open-pioneer/chakra-integration";
import { Sidebar, SidebarItem } from "@open-pioneer/experimental-layout-sidebar";
import { LayerControlComponent } from "@open-pioneer/experimental-ol-layer-control";
import { MapContainer, MapPadding, ToolContainer } from "@open-pioneer/experimental-ol-map";
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
                    <ToolContainer position="top-left">
                        <Box backgroundColor="whiteAlpha.800" padding={4} boxShadow="lg">
                            I move with the sidebar 🙂
                        </Box>
                    </ToolContainer>
                    <ToolContainer position="bottom-right">
                        <ZoomComponent mapId={MAP_ID}></ZoomComponent>
                    </ToolContainer>
                    <ToolContainer position="top-right">
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
                    </ToolContainer>
                </MapContainer>

                <Sidebar
                    defaultExpanded={isExpanded}
                    expandedChanged={(expanded) => setExpanded(expanded)}
                    sidebarWidthChanged={(width) => setViewPadding({ left: width })}
                    items={items}
                />
            </Flex>
        </Flex>
    );
}
