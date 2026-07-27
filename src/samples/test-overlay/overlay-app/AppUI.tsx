// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, Popover, Portal, usePopoverContext } from "@chakra-ui/react";
import { DefaultMapProvider, MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { LuFlaskConical } from "react-icons/lu";
import { MAP_ID } from "./MapConfigProviderImpl";
import { OverlayControls } from "./OverlayControls";

export function AppUI() {
    const { map } = useMapModel(MAP_ID);
    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box role="region" textAlign="center" py={1}>
                        <SectionHeading size={"md"}>Open Pioneer Trails - Overlays</SectionHeading>
                    </Box>
                }
            >
                {map && (
                    <DefaultMapProvider map={map}>
                        <Flex flex="1" direction="column" position="relative">
                            <MapContainer>
                                <MapAnchor position="top-right" horizontalGap={10} verticalGap={10}>
                                    <Flex direction="column" gap={1} padding={1}>
                                        <OverlayControlsTool />
                                    </Flex>
                                </MapAnchor>
                            </MapContainer>
                        </Flex>
                    </DefaultMapProvider>
                )}
            </TitledSection>
        </Flex>
    );
}

function OverlayControlsTool() {
    return (
        <Popover.Root
            positioning={{ placement: "left-end" }}
            lazyMount={false}
            closeOnInteractOutside={false}
        >
            <Popover.Trigger asChild>
                <TriggerToolButton />
            </Popover.Trigger>
            <Portal>
                <Popover.Positioner>
                    <Popover.Content width="auto">
                        <Popover.Arrow />
                        <Popover.Body padding={2}>
                            <OverlayControls />
                        </Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    );
}

function TriggerToolButton() {
    const context = usePopoverContext();
    const { onClick, ...triggerProps } = context.getTriggerProps();
    return (
        <ToolButton
            active={context.open}
            label="Open test controls"
            icon={<LuFlaskConical />}
            onClick={onClick}
            buttonProps={triggerProps}
            tooltipProps={{
                ids: {
                    // Mixing Popup and menu/popover triggers requires some coordination.
                    // We tell the tooltip to watch the same dom element as the popover trigger.
                    // See https://chakra-ui.com/docs/components/tooltip#with-menutrigger
                    trigger: triggerProps.id
                },
                positioning: {
                    placement: "left"
                }
            }}
        />
    );
}
