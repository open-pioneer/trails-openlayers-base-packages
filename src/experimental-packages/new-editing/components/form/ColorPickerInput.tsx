// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    ColorPicker,
    HStack,
    Portal,
    parseColor,
    type ColorPickerValueChangeDetails
} from "@chakra-ui/react";

import { useEvent } from "@open-pioneer/react-utils";
import { LuCheck } from "react-icons/lu";
import { useMemo, type ReactElement } from "react";

export function ColorPickerInput({
    hexColor,
    colors,
    onChange
}: ColorPickerInputProps): ReactElement {
    const defaultValue = useMemo(() => parseColor(hexColor ?? "black"), [hexColor]);

    const onValueChangeEnd = useEvent((details: ColorPickerValueChangeDetails) => {
        onChange(details.value.toString("hexa"));
    });

    return (
        <ColorPicker.Root defaultValue={defaultValue} onValueChangeEnd={onValueChangeEnd}>
            <ColorPicker.Control>
                <ColorPicker.Input />
                <ColorPicker.Trigger />
            </ColorPicker.Control>
            <Portal>
                <ColorPicker.Positioner>
                    <ColorPicker.Content>
                        <ColorPicker.Area />
                        <HStack>
                            <ColorPicker.EyeDropper size="xs" variant="outline" />
                            <ColorPicker.Sliders />
                        </HStack>
                        <SwatchGroup colors={colors} />
                    </ColorPicker.Content>
                </ColorPicker.Positioner>
            </Portal>
        </ColorPicker.Root>
    );
}

function SwatchGroup({ colors }: SwatchGroupProps): ReactElement | undefined {
    if (colors != null && colors.length >= 1) {
        return (
            <ColorPicker.SwatchGroup>
                {colors.map((color) => (
                    <ColorPicker.SwatchTrigger key={color} value={color}>
                        <ColorPicker.Swatch boxSize={4.5} value={color}>
                            <ColorPicker.SwatchIndicator>
                                <LuCheck />
                            </ColorPicker.SwatchIndicator>
                        </ColorPicker.Swatch>
                    </ColorPicker.SwatchTrigger>
                ))}
            </ColorPicker.SwatchGroup>
        );
    } else {
        return undefined;
    }
}

interface ColorPickerInputProps extends SwatchGroupProps {
    readonly hexColor: string | undefined;
    readonly onChange: (newHexColor: string) => void;
}

interface SwatchGroupProps {
    readonly colors: string[] | undefined;
}
