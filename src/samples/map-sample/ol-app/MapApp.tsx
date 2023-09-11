// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Flex } from "@open-pioneer/chakra-integration";
import { Sidebar, SidebarItem } from "@open-pioneer/experimental-layout-sidebar";
import { LayerControlComponent } from "@open-pioneer/experimental-ol-layer-control";
import { MapAnchor, MapContainer, MapPadding } from "@open-pioneer/map";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { BasemapSwitcher } from "@open-pioneer/basemap-switcher";
import { useMapModel } from "@open-pioneer/map";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { Zoom } from "@open-pioneer/zoom";
import { ScaleComponent } from "map-sample-scale-component";
import { useRef, useState } from "react";
import { FiCodesandbox, FiLayers } from "react-icons/fi";
import { MAP_ID } from "./MapConfigProviderImpl";
import { useIntl } from "open-pioneer:react-hooks";

const berlin = [796987, 5827477, 796987, 5827477];

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

    const intl = useIntl();

    const items: SidebarItem[] = [
        {
            id: "map-content",
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
    const basemapSwitcherRef = useRef<HTMLDivElement>(null);

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <Box textAlign="center" py={1} px={1}>
                Open Pioneer - Map sample
            </Box>

            <Flex flex="1" direction="column" position="relative">
                <MapContainer
                    mapId={MAP_ID}
                    viewPadding={viewPadding}
                    viewPaddingChangeBehavior="preserve-extent"
                >
                    <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                        <Box
                            backgroundColor="whiteAlpha.800"
                            borderWidth="1px"
                            borderRadius="lg"
                            padding={2}
                            boxShadow="lg"
                        >
                            <BasemapSwitcher
                                ref={basemapSwitcherRef}
                                label={intl.formatMessage({ id: "basemapLabel" })}
                                noneBasemap={{
                                    id: "noBasemap",
                                    label: intl.formatMessage({ id: "noBasemapLabel" }),
                                    selected: true
                                }}
                                mapId={MAP_ID}
                            ></BasemapSwitcher>
                        </Box>
                    </MapAnchor>
                    <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={30}>
                        <Zoom mapId={MAP_ID}></Zoom>
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
