// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Flex } from "@open-pioneer/chakra-integration";
import { Sidebar, SidebarItem } from "@open-pioneer/experimental-layout-sidebar";
import { MapAnchor, MapContainer, MapPadding, useMapModel } from "@open-pioneer/map";
import { useState } from "react";
import { FiCodesandbox } from "react-icons/fi";
import { MAP_ID } from "./MapConfigProviderImpl";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";

const berlin = [796987, 5827477, 796987, 5827477];

export function AppUI() {
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
            id: "sandbox",
            icon: <FiCodesandbox />,
            label: "Sandbox",
            content: <Button onClick={centerBerlin}>Center Berlin</Button>
        }
    ];

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box textAlign="center" py={1} px={1}>
                        <SectionHeading size={"md"}>Sidebar sample</SectionHeading>
                    </Box>
                }
            >
                <Flex flex="1" direction="column" position="relative">
                    <Sidebar
                        defaultExpanded={isExpanded}
                        expandedChanged={(expanded) => setExpanded(expanded)}
                        sidebarWidthChanged={(width) => setViewPadding({ left: width })}
                        items={items}
                    />
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
                                This is a sample for a sidebar component.
                            </Box>
                        </MapAnchor>
                    </MapContainer>
                </Flex>
            </TitledSection>
        </Flex>
    );
}
