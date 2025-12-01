// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { CloseButton, Flex, IconButton, Text } from "@chakra-ui/react";
import { reactive, Reactive } from "@conterra/reactivity-core";
import { MapModel, Overlay } from "@open-pioneer/map";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { Coordinate } from "ol/coordinate";
import { useIntl } from "open-pioneer:react-hooks";
import { useRef, useState } from "react";
import { LuArrowLeft, LuArrowRight, LuThermometerSnowflake } from "react-icons/lu";

export function Toolbar(props: { map: MapModel }) {
    const { map } = props;
    const intl = useIntl();
    const [tooltip, setTooltip] = useState<Overlay | undefined>();
    const overlayPositionRef = useRef<Reactive<Coordinate>>(reactive([410000, 5757000]));

    const destroyOverlay = () => {
        tooltip?.destroy();
        setTooltip(undefined);
    };

    return (
        <Flex
            role="toolbar"
            aria-label={intl.formatMessage({ id: "ariaLabel.toolbar" })}
            direction="column"
            gap={1}
            padding={1}
        >
            <InitialExtent />
            <ZoomIn />
            <ZoomOut />
            <ToolButton
                label="Toggle Tooltip"
                icon={<LuThermometerSnowflake />}
                active={tooltip != undefined}
                onClick={() => {
                    if (!tooltip) {
                        const tooltip = map.overlays.addOverlay(
                            {
                                position: overlayPositionRef.current.value,
                                insertFirst: false,
                                autoPan: true
                            },
                            <MovableOverlay
                                position={overlayPositionRef.current}
                                onCloseClicked={destroyOverlay}
                            />
                        );
                        setTooltip(tooltip);
                    } else {
                        destroyOverlay();
                    }
                }}
            />
            {tooltip && (
                <IconButton
                    onClick={() => {
                        const pos = tooltip.position;
                        if (pos && pos[0] && pos[1]) {
                            const newPos = [pos[0] + 500, pos[1]];
                            overlayPositionRef.current.value = newPos;
                            tooltip.setPosition(newPos);
                        }
                    }}
                >
                    <LuArrowRight></LuArrowRight>
                </IconButton>
            )}
            {tooltip && (
                <IconButton
                    onClick={() => {
                        const pos = tooltip.position;
                        if (pos && pos[0] && pos[1]) {
                            const newPos = [pos[0] - 500, pos[1]];
                            overlayPositionRef.current.value = newPos;
                            tooltip.setPosition(newPos);
                        }
                    }}
                >
                    <LuArrowLeft></LuArrowLeft>
                </IconButton>
            )}
        </Flex>
    );
}

function MovableOverlay(props: { position: Reactive<Coordinate>; onCloseClicked: () => void }) {
    const position = useReactiveSnapshot(() => props.position.value, [props]);

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
