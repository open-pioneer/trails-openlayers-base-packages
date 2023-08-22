// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Flex } from "@open-pioneer/chakra-integration";
import { Sidebar, SidebarItem } from "@open-pioneer/experimental-layout-sidebar";
import { LayerControlComponent } from "@open-pioneer/experimental-ol-layer-control";
import { MapContainer, MapPadding } from "@open-pioneer/ol-map";
import { useMapModel } from "@open-pioneer/ol-map/useMapModel";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { ScaleComponent } from "map-sample-scale-component";
import { ZoomComponent } from "map-sample-zoom-component";
import { useRef, useState } from "react";
import { FiCodesandbox, FiLayers } from "react-icons/fi";
import { MAP_ID } from "./MapConfigProviderImpl";

const berlin = [1489200, 6894026, 1489200, 6894026];

export function MapApp() {
    const [viewPadding, setViewPadding] = useState<MapPadding>();
    const [isExpanded, setExpanded] = useState<boolean>(true);
    const mapState = useMapModel(MAP_ID);

    const centerBerlin = () => {
        const olMap = mapState.map?.olMap;
        if (olMap) {
            olMap?.getView().fit(berlin, { maxZoom: 13 });
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
                <MapContainer mapId={MAP_ID} viewPadding={viewPadding}></MapContainer>
                <ZoomComponent className="zoom-controls" mapId={MAP_ID}></ZoomComponent>
                <Flex
                    className="map-panel"
                    gap={3}
                    alignItems="center"
                    justifyContent="center"
                    padding={4}
                    roundedBottomLeft="lg"
                    boxShadow="lg"
                    backgroundColor={"whiteAlpha.800"}
                >
                    <ScaleViewer mapId={MAP_ID} ref={scaleViewerRef}></ScaleViewer>
                    <ScaleComponent mapId={MAP_ID}></ScaleComponent>
                </Flex>
                <Sidebar
                    defaultExpanded={isExpanded}
                    expandedChanged={(expanded) => setExpanded(expanded)}
                    sidebarWidthChanged={(width) => setViewPadding({ left: width / 2 })}
                    items={items}
                />
            </Flex>
        </Flex>
    );
}
