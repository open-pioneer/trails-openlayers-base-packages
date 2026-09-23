// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { ToolButton } from "@open-pioneer/map-ui-components";
import type { ReactNode } from "react";
import { LuChevronLeft, LuFilter } from "react-icons/lu";

export function LayerDrawer(props: {
    panelId: string;
    isOpen: boolean;
    title: string;
    expandLabel: string;
    collapseLabel: string;
    onToggle: () => void;
    children: ReactNode;
}) {
    const drawerClassName = props.isOpen
        ? "basis-opt-app__layer-drawer basis-opt-app__layer-drawer--open"
        : "basis-opt-app__layer-drawer";

    function stopMapInteraction(event: { stopPropagation: () => void }) {
        event.stopPropagation();
    }

    return (
        <Box
            className={drawerClassName}
            onClick={stopMapInteraction}
            onDoubleClick={stopMapInteraction}
            onPointerDown={stopMapInteraction}
        >
            <aside
                id={props.panelId}
                className="basis-opt-app__layer-drawer-panel"
                aria-label={props.title}
                aria-hidden={!props.isOpen}
            >
                {props.isOpen && (
                    <Box
                        minW={0}
                        w="100%"
                        overflowX="hidden"
                        overflowY="auto"
                        pt="0.65rem"
                        px="0.75rem"
                        pb="0.75rem"
                    >
                        <Flex align="center" justify="space-between" gap={2} mb={2}>
                            <Text as="h2" fontSize="sm" fontWeight="semibold">
                                {props.title}
                            </Text>
                            <Tooltip content={props.collapseLabel}>
                                <IconButton
                                    variant="ghost"
                                    size="2xs"
                                    flexShrink={0}
                                    aria-label={props.collapseLabel}
                                    aria-controls={props.panelId}
                                    aria-expanded={true}
                                    onClick={props.onToggle}
                                >
                                    <LuChevronLeft />
                                </IconButton>
                            </Tooltip>
                        </Flex>
                        {props.children}
                    </Box>
                )}
            </aside>
            {!props.isOpen && (
                <ToolButton
                    className="basis-opt-app__layer-drawer-toggle"
                    label={props.expandLabel}
                    icon={<LuFilter />}
                    onClick={props.onToggle}
                    tooltipProps={{ positioning: { placement: "right" } }}
                    buttonProps={{
                        type: "button",
                        "aria-controls": props.panelId,
                        "aria-expanded": false
                    }}
                />
            )}
        </Box>
    );
}
