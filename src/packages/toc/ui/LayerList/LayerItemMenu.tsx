// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { IconButton, CloseButton, Popover, Portal, Text } from "@chakra-ui/react";
import { AnyLayer } from "@open-pioneer/map";
import { PackageIntl } from "@open-pioneer/runtime";
import { FiMoreVertical } from "react-icons/fi";
import { useLoadState } from "./hooks";

export function LayerItemMenu(props: {
    layer: AnyLayer;
    title: string;
    description: string;
    intl: PackageIntl;
}) {
    const { layer, title, description, intl } = props;
    const isPresent = !!description;
    const buttonLabel = intl.formatMessage({ id: "descriptionLabel" });
    const isAvailable = useLoadState(layer) !== "error";

    return (
        isPresent && (
            <Popover.Root lazyMount={true} positioning={{ placement: "bottom-start" }}>
                <Popover.Trigger asChild>
                    <IconButton
                        disabled={!isAvailable}
                        className="toc-layer-item-details-button"
                        aria-label={buttonLabel}
                        borderRadius="full"
                        padding={0}
                        variant="ghost"
                        size="sm"
                    >
                        <FiMoreVertical spacing={0} />
                    </IconButton>
                </Popover.Trigger>
                <Portal>
                    <Popover.Positioner>
                        <Popover.Content
                            className="toc-layer-item-details"
                            overflowY="auto"
                            maxHeight="400"
                        >
                            <Popover.Arrow></Popover.Arrow>
                            <Popover.Body>
                                <Popover.Title className="toc-layer-item-details-title">
                                    {title}
                                </Popover.Title>
                                <Text my="2" className="toc-layer-item-details-description">
                                    {description}
                                </Text>
                            </Popover.Body>
                            <Popover.CloseTrigger
                                position="absolute"
                                top="1"
                                right="1"
                                mt={3}
                                asChild
                            >
                                <CloseButton
                                    className="toc-layer-item-details-button"
                                    variant="ghost"
                                    size="sm"
                                />
                            </Popover.CloseTrigger>
                        </Popover.Content>
                    </Popover.Positioner>
                </Portal>
            </Popover.Root>
        )
    );
}
