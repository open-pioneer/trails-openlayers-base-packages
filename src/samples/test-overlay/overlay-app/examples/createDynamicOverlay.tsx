// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@chakra-ui/react";
import { MapModel } from "@open-pioneer/map";

/**
 * Creates an overlay that can update itself by replacing the `content` node.
 */
export function createDynamicOverlay(map: MapModel) {
    const contentItems = ["green", "yellow", "orange"].map((color: string, i: number) => (
        <Box key={i} bg={color} borderWidth={3} borderColor={"gray.700"} rounded={20} p={2}>
            {color}
        </Box>
    ));

    let index = 0;
    const overlay = map.overlays.addOverlay({
        positioning: "center-center",
        stopEvent: false,
        position: [410000, 5762000],
        content: contentItems[index]
    });

    return {
        overlay,
        update: () => {
            index = (index + 1) % contentItems.length;
            overlay.setContent(contentItems[index]); // completely replace content
        }
    };
}
