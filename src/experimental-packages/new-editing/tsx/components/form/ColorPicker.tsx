// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Button,
    Popover,
    PopoverContent,
    PopoverTrigger,
    useDisclosure
} from "@chakra-ui/react";

import { useCallback, type ReactElement } from "react";
import { CirclePicker, type ColorResult } from "react-color";
import type { Callback } from "../../types/types";

export function ColorPicker({ hexColor, colors, onChange }: ColorPickerProps): ReactElement {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const onChangeComplete = useCallback(
        (color: ColorResult) => {
            onChange(color.hex);
            onClose();
        },
        [onChange, onClose]
    );

    return (
        <Popover placement="right-start" isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
            <PopoverTrigger>
                <Button variant="outline" padding="5px">
                    <Box backgroundColor={hexColor} height="100%" width="100%" margin="5px" />
                </Button>
            </PopoverTrigger>
            <PopoverContent width={200}>
                <Box margin="5px" padding="5px">
                    <CirclePicker
                        width="full"
                        color={hexColor}
                        colors={colors}
                        circleSize={32}
                        circleSpacing={16}
                        onChangeComplete={onChangeComplete}
                    />
                </Box>
            </PopoverContent>
        </Popover>
    );
}

interface ColorPickerProps {
    readonly hexColor: string | undefined;
    readonly colors?: string[];
    readonly onChange: Callback<string>;
}
