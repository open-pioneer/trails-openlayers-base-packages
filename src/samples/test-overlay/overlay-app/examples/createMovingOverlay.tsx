// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { CloseButton, Flex, Text } from "@chakra-ui/react";
import { MapModel, Overlay } from "@open-pioneer/map";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";

export interface MovingOverlay {
    overlay: Overlay;
    updatePosition: (offsetX: number) => void;
}

/**
 * Creates an overlay that changes its position.
 */
export function createMovingOverlay(map: MapModel) {
    const overlay = map.overlays.add({
        position: [410000, 5757000],
        tag: "sample-movable-overlay",
        advanced: {
            autoPan: true,
            insertFirst: false
        }
    });
    overlay.setContent(<MovableOverlayContent overlay={overlay} />);

    const updatePosition = (offsetX: number) => {
        if (overlay.position) {
            const [x = 0, y = 0] = overlay.position;
            const newPos = [x + offsetX, y];
            overlay.setPosition(newPos);
        }
    };

    return {
        overlay,
        updatePosition
    };
}

function MovableOverlayContent(props: { overlay: Overlay }) {
    const position = useReactiveSnapshot(() => props.overlay.position ?? [0, 0], [props.overlay]);
    return (
        <Flex
            bg={"whiteAlpha.700"}
            borderWidth={3}
            borderColor={"gray.700"}
            rounded={20}
            p={2}
            gap={2}
            alignItems={"center"}
        >
            <Text>
                X: {position[0]}, Y: {position[1]}
            </Text>
            <CloseButton onClick={() => props.overlay.destroy()} variant={"solid"} size={"xs"} />
        </Flex>
    );
}
