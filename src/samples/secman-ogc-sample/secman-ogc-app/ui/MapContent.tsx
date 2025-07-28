// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex } from "@chakra-ui/react";
import { MapAnchor, MapContainer } from "@open-pioneer/map";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { Toc } from "@open-pioneer/toc";

export function MapContent() {
    return (
        <MapContainer role="main">
            <MapAnchor position="top-left">
                <Box backgroundColor="whiteAlpha.800" p={2}>
                    <Toc />
                </Box>
            </MapAnchor>
            <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={30}>
                <Flex direction="column" gap={1} padding={1}>
                    <InitialExtent />
                    <ZoomIn />
                    <ZoomOut />
                </Flex>
            </MapAnchor>
        </MapContainer>
    );
}
