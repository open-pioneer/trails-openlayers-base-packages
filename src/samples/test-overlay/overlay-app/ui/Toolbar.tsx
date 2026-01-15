// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    CloseButton,
    Flex,
    IconButton,
    Text,
    HStack,
    Popover,
    Portal,
    usePopoverContext
} from "@chakra-ui/react";
import { reactive, Reactive } from "@conterra/reactivity-core";
import { MapModel, Overlay } from "@open-pioneer/map";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { useEvent } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { Coordinate } from "ol/coordinate";
import { useIntl } from "open-pioneer:react-hooks";
import { RefObject, useRef, useState } from "react";
import { LuArrowLeft, LuArrowRight, LuArrowRightLeft } from "react-icons/lu";

export function Toolbar(props: { map: MapModel }) {
    const { map } = props;
    const intl = useIntl();
    const [movableOverlay, setMovableOverlay] = useState<Overlay | undefined>();
    const overlayPositionRef = useRef<Reactive<Coordinate>>(reactive([410000, 5757000]));

    const destroyOverlay = useEvent(() => {
        movableOverlay?.destroy();
        setMovableOverlay(undefined);
    });

    const toogleOverlay = () => {
        if (!movableOverlay) {
            const overlay = map.overlays.addOverlay({
                position: overlayPositionRef.current.value,
                tag: "sample-movable-overlay",
                content: (
                    <MovableOverlayContent
                        position={overlayPositionRef.current}
                        onCloseClicked={destroyOverlay}
                    />
                ),
                olOptions: {
                    autoPan: true,
                    insertFirst: false
                }
            });
            setMovableOverlay(overlay);
        } else {
            destroyOverlay();
        }
    };

    const updateOverlayPostion = (offsetX: number) => {
        if (!movableOverlay) {
            return;
        }

        const pos = movableOverlay.position;
        if (pos && pos[0] && pos[1]) {
            const newPos = [pos[0] + offsetX, pos[1]];
            overlayPositionRef.current.value = newPos;
            movableOverlay.setPosition(newPos);
        }
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

            <Popover.Root
                positioning={{ placement: "left" }}
                lazyMount={true}
                open={movableOverlay !== undefined}
                onOpenChange={toogleOverlay}
                closeOnInteractOutside= {false}
            >
                <Popover.Trigger asChild>
                    <TriggerToolButton active={movableOverlay !== undefined}></TriggerToolButton>
                </Popover.Trigger>
                <Portal>
                    <Popover.Positioner>
                        <Popover.Content width="auto">
                            <Popover.Arrow />
                            <Popover.Body padding={2}>
                                <HStack gap={2}>
                                    <IconButton onClick={() => updateOverlayPostion(-500)}>
                                        <LuArrowLeft></LuArrowLeft>
                                    </IconButton>
                                    <IconButton onClick={() => updateOverlayPostion(500)}>
                                        <LuArrowRight></LuArrowRight>
                                    </IconButton>
                                </HStack>
                            </Popover.Body>
                        </Popover.Content>
                    </Popover.Positioner>
                </Portal>
            </Popover.Root>
        </Flex>
    );
}

function MovableOverlayContent(props: {
    position: Reactive<Coordinate>;
    onCloseClicked: () => void;
}) {
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

const TriggerToolButton = function TriggerToolButton({
    ref,
    active
}: {
    ref?: RefObject<HTMLButtonElement>;
    active: boolean;
    }) {
    const intl = useIntl();
    const context = usePopoverContext();
    const { onClick, ...triggerProps } = context.getTriggerProps();
    return (
        <ToolButton
            active={active}
            ref={ref}
            label={intl.formatMessage({ id: "movableOverlay.tooltip" })}
            icon={<LuArrowRightLeft />}
            onClick={onClick}
            buttonProps={triggerProps}
            tooltipProps={{
                ids: {
                    // Mixing Popup and menu/popover triggers requires some coordination.
                    // We tell the tooltip to watch the same dom element as the popover trigger.
                    // See https://chakra-ui.com/docs/components/tooltip#with-menutrigger
                    trigger: triggerProps.id
                }
            }}
        />
    );
};
