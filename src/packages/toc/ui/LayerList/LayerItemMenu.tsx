// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { CloseButton, Icon, IconButton, Popover, Portal, Text } from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { AnyLayer } from "@open-pioneer/map";
import { PackageIntl } from "@open-pioneer/runtime";
import { useIntl } from "open-pioneer:react-hooks";
import { useId } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { useLoadState } from "./hooks";

export function LayerItemMenu(props: {
    layer: AnyLayer;
    title: string;
    description: string;
    intl: PackageIntl;
}) {
    const { layer, title, description } = props;
    const isPresent = !!description;

    const triggerId = useId(); // see https://chakra-ui.com/docs/components/tooltip#with-menutrigger

    return (
        isPresent && (
            <Popover.Root
                ids={{ trigger: triggerId }}
                positioning={{ placement: "bottom-start" }}
                lazyMount={true}
                unmountOnExit={true}
            >
                <TriggerButton triggerId={triggerId} layer={layer} />
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
                            <Popover.CloseTrigger position="absolute" top="1" right="1" asChild>
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

function TriggerButton(props: { triggerId: string; layer: AnyLayer }) {
    const { layer, triggerId } = props;
    const intl = useIntl();
    const buttonLabel = intl.formatMessage({ id: "descriptionLabel" });
    const isAvailable = useLoadState(layer) !== "error";

    return (
        <Tooltip ids={{ trigger: triggerId }} content={buttonLabel}>
            <Popover.Trigger asChild>
                <IconButton
                    disabled={!isAvailable}
                    className="toc-layer-item-details-button"
                    aria-label={buttonLabel}
                    borderRadius="full"
                    focusRingOffset="-2px"
                    variant="ghost"
                    size="sm"
                >
                    <Icon>
                        <FiMoreVertical spacing={0} />
                    </Icon>
                </IconButton>
            </Popover.Trigger>
        </Tooltip>
    );
}
