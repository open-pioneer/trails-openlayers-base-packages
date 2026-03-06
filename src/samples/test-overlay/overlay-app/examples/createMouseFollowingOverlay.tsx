// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Icon } from "@chakra-ui/react";
import { MapModel } from "@open-pioneer/map";
import { LuCrosshair } from "react-icons/lu";

/**
 * Creates an overlay that follows the mouse.
 */
export function createMouseFollowingOverlay(map: MapModel) {
    return map.overlays.add({
        positioning: "center-center",
        stopEvent: false,
        mode: "follow-pointer",
        content: (
            <Icon size={"2xl"} color={"red.solid"}>
                <LuCrosshair />
            </Icon>
        )
    });
}
