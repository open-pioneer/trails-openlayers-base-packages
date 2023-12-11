// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
    PopoverArrow,
    PopoverCloseButton,
    Button,
    Portal,
    Flex,
    Box,
    Text,
    BoxProps
} from "@open-pioneer/chakra-integration";
import { CommonComponentProps } from "@open-pioneer/react-utils";
import { FC, ForwardedRef, forwardRef, useRef } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { useIntl } from "open-pioneer:react-hooks";
import { MapModel, SublayersCollection } from "@open-pioneer/map";

interface TocToolsProps extends CommonComponentProps {
    /**
     * The model of the map.
     */
    map: MapModel;
}

export const TocTools: FC<TocToolsProps> = (props: TocToolsProps) => {
    const intl = useIntl();

    const { map } = props;

    /**
     * Use `useRef` to focus an element when Popover opens:
     * https://chakra-ui.com/docs/components/popover/usage#focus-an-element-when-popover-opens
     *
     * Add `ref={initialFocusRef}` to the element which should have the initial focus.
     * The last element will be focused, if `ref` is configured more than once.
     */
    const initialFocusRef = useRef(null);

    return (
        <Popover initialFocusRef={initialFocusRef}>
            {({ onClose }) => (
                <>
                    <PopoverTrigger>
                        <Button
                            className="toc-tools-item-details-button"
                            aria-label={intl.formatMessage({ id: "toolsLabel" })}
                            borderRadius="full"
                            iconSpacing={0}
                            padding={0}
                            variant="ghost"
                            leftIcon={<FiMoreVertical />}
                        />
                    </PopoverTrigger>
                    <Portal>
                        <PopoverContent>
                            <PopoverArrow />
                            <PopoverCloseButton mt={1} />
                            <PopoverHeader as="b">
                                {intl.formatMessage({ id: "toolsLabel" })}
                            </PopoverHeader>
                            {/* Remove margin and padding for fulfilled box */}
                            <PopoverBody m={0} p={0}>
                                <PopoverBox
                                    /**
                                     * Allow user keyboard interaction with `enter` and `blank space`
                                     *
                                     * `onClose` is used to close the popover after user interaction.
                                     */
                                    onKeyDown={(evt) => {
                                        if (evt.key === "Enter" || evt.key === " ") {
                                            hideAllLayers(map);
                                            onClose();
                                        }
                                        return;
                                    }}
                                    onClick={() => {
                                        hideAllLayers(map);
                                        onClose();
                                    }}
                                    ref={initialFocusRef}
                                >
                                    {intl.formatMessage({
                                        id: "hideAllLayers"
                                    })}
                                </PopoverBox>
                                {/*
                                    Add new popover entries here. Please separat each entry with a divider.
                                    Example:
                                    `<Divider borderColor={"border"} />`

                                    A PopoverBox needs at least a label.
                                    Example:
                                    `<PopoverBox> label </PopoverBox>`
                                */}
                            </PopoverBody>
                        </PopoverContent>
                    </Portal>
                </>
            )}
        </Popover>
    );
};

interface PopoverBoxProps extends BoxProps {
    /**
     * Mandatory children representing the label
     */
    children: string;

    /**
     * Optional ref to set the initial focus
     */
    ref?: ForwardedRef<HTMLDivElement>;
}

const PopoverBox: FC<PopoverBoxProps> = forwardRef(function PopoverBox(
    props: PopoverBoxProps,
    ref: ForwardedRef<HTMLDivElement>
): JSX.Element {
    return (
        <Box
            p={2}
            m={1}
            tabIndex={0}
            rounded="md"
            cursor="pointer"
            outline={0}
            ref={ref}
            _hover={{ background: "trails.50" }}
            _focusVisible={{ boxShadow: "outline" }}
            {...props}
        >
            <Flex width="100%">
                <Text ms={1}>{props.children}</Text>
            </Flex>
        </Box>
    );
});

function hideAllLayers(map: MapModel | undefined) {
    const hideSublayer = (sublayers: SublayersCollection | undefined) => {
        sublayers?.getSublayers().forEach((layer) => {
            layer.setVisible(false);

            hideSublayer(layer?.sublayers);
        });
    };

    map?.layers.getOperationalLayers().forEach((layer) => {
        layer.setVisible(false);

        hideSublayer(layer?.sublayers);
    });
}
