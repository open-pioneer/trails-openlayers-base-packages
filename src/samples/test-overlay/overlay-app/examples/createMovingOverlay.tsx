// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { CloseButton, Flex, Text } from "@chakra-ui/react";
import { reactive, Reactive } from "@conterra/reactivity-core";
import { MapModel, Overlay } from "@open-pioneer/map";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { Coordinate } from "ol/coordinate";

export interface MovingOverlay {
    overlay: Overlay;
    updatePosition: (offsetX: number) => void;
}

/**
 * Creates an overlay that changes its position.
 */
export function createMovingOverlay(map: MapModel) {
    const position = reactive([410000, 5757000]); // used in react component
    const overlay = map.overlays.addOverlay({
        position: position.value,
        tag: "sample-movable-overlay",
        content: (
            <MovableOverlayContent position={position} onCloseClicked={() => overlay.destroy()} />
        ),
        advanced: {
            autoPan: true,
            insertFirst: false
        }
    });

    const updatePosition = (offsetX: number) => {
        if (overlay.position) {
            const [x = 0, y = 0] = overlay.position;
            const newPos = [x + offsetX, y];
            position.value = newPos; // TODO: Consider watching on overlay.position
            overlay.setPosition(newPos);
        }
    };

    return {
        overlay,
        updatePosition
    };
}

function MovableOverlayContent(props: {
    position: Reactive<Coordinate>;
    onCloseClicked: () => void;
}) {
    const position = useReactiveSnapshot(() => props.position.value, [props.position]);
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
            <CloseButton onClick={props.onCloseClicked} variant={"solid"} size={"xs"}></CloseButton>
        </Flex>
    );
}
