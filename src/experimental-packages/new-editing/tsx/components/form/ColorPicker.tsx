// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Popover } from "@chakra-ui/react";

import { useCallback, useState, type ReactElement } from "react";
import { CirclePicker, type ColorResult } from "react-color";
import type { Callback } from "../../types/types";

export function ColorPicker({ hexColor, colors, onChange }: ColorPickerProps): ReactElement {
    const [open, setOpen] = useState(false);

    const onChangeComplete = useCallback(
        (color: ColorResult) => {
            onChange(color.hex);
            setOpen(false);
        },
        [onChange]
    );

    return (
        <Popover.Root
            positioning={{ placement: "right-start" }}
            open={open}
            onOpenChange={(e) => setOpen(e.open)}
        >
            <Popover.Trigger asChild>
                <Button variant="outline" padding="5px">
                    <Box backgroundColor={hexColor} height="100%" width="100%" margin="5px" />
                </Button>
            </Popover.Trigger>
            <Popover.Positioner>
                <Popover.Content width={200}>
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
                </Popover.Content>
            </Popover.Positioner>
        </Popover.Root>
    );
}

interface ColorPickerProps {
    readonly hexColor: string | undefined;
    readonly colors?: string[];
    readonly onChange: Callback<string>;
}
