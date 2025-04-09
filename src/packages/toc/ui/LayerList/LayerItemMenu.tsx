// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Button, CloseButton, Popover, Separator } from "@chakra-ui/react";
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
            <Popover.Root
                positioning={{ placement: "bottom-start" }}
                portalled={true}
                lazyMount={true}
            >
                <Popover.Trigger asChild>
                    <Button
                        disabled={!isAvailable}
                        className="toc-layer-item-details-button"
                        aria-label={buttonLabel}
                        borderRadius="full"
                        padding={0}
                        variant="ghost"
                    >
                        <FiMoreVertical />
                    </Button>
                </Popover.Trigger>
                <Popover.Positioner>
                    <Popover.Content
                        className="toc-layer-item-details"
                        overflowY="auto"
                        maxHeight="400"
                    >
                        <Popover.Header>
                            {title}
                            <Popover.CloseTrigger mt={1} asChild>
                                <CloseButton
                                    className="toc-layer-item-details-button"
                                    borderRadius="full"
                                    padding={0}
                                    variant="ghost"
                                ></CloseButton>
                            </Popover.CloseTrigger>
                        </Popover.Header>
                        <Separator></Separator>
                        <Popover.Body>{description}</Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Popover.Root>
        )
    );
}
