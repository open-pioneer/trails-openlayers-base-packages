// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Button,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Portal
} from "@open-pioneer/chakra-integration";
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
            <Popover placement="bottom-start">
                <PopoverTrigger>
                    <Button
                        isDisabled={!isAvailable}
                        className="toc-layer-item-details-button"
                        aria-label={buttonLabel}
                        borderRadius="full"
                        iconSpacing={0}
                        padding={0}
                        variant="ghost"
                        leftIcon={<FiMoreVertical />}
                    />
                </PopoverTrigger>
                <Portal>
                    <PopoverContent
                        className="toc-layer-item-details"
                        overflowY="auto"
                        maxHeight="400"
                    >
                        <PopoverArrow />
                        <PopoverCloseButton mt={1} />
                        <PopoverHeader>{title}</PopoverHeader>
                        <PopoverBody>{description}</PopoverBody>
                    </PopoverContent>
                </Portal>
            </Popover>
        )
    );
}
