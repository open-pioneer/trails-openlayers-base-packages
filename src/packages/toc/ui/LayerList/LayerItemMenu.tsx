// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { CloseButton, Icon, IconButton, Popover, Portal, Text } from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { useIntl } from "open-pioneer:react-hooks";
import { useId } from "react";
import { LuEllipsisVertical } from "react-icons/lu";

export function LayerItemMenu(props: {
    title: string;
    description: string;

    /**
     * Whether the menu is disabled.
     * The layer item is disabled if the layer itself has a severe issue (e.g. it failed to load).
     */
    disabled: boolean;
}) {
    const { title, description, disabled } = props;
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
                <TriggerButton triggerId={triggerId} disabled={disabled} />
                <Portal>
                    <Popover.Positioner>
                        <Popover.Content
                            className="toc-layer-item-details"
                            overflowY="auto"
                            maxHeight="400"
                        >
                            <Popover.Arrow />
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

function TriggerButton(props: { triggerId: string; disabled: boolean }) {
    const { triggerId, disabled } = props;
    const intl = useIntl();
    const buttonLabel = intl.formatMessage({ id: "descriptionLabel" });

    return (
        <Tooltip ids={{ trigger: triggerId }} content={buttonLabel}>
            <Popover.Trigger asChild>
                <IconButton
                    disabled={disabled}
                    className="toc-layer-item-details-button"
                    aria-label={buttonLabel}
                    borderRadius="full"
                    focusRingOffset="-2px"
                    variant="ghost"
                    size="sm"
                >
                    <Icon>
                        <LuEllipsisVertical spacing={0} />
                    </Icon>
                </IconButton>
            </Popover.Trigger>
        </Tooltip>
    );
}
