// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, Text } from "@open-pioneer/chakra-integration";
import { LegendItemComponentProps } from "@open-pioneer/legend";

const dotStyle = {
    height: "25px",
    width: "25px",
    borderColor: "#4cb3ff",
    borderWidth: "3px",
    borderRadius: "50%",
    display: "inline-block "
};

export function CustomLegend(props: LegendItemComponentProps) {
    return (
        <Box>
            <Text>{props.layer.title}</Text>
            <Box style={dotStyle}></Box>
        </Box>
    );
}

/**
 * TODO: Remove lorem ipsum component from MapConfigProviderImpl.ts before merge!
 */
export function LoremIpsumLegend(props: LegendItemComponentProps) {
    return (
        <Box>
            <Text as="b">{props.layer.title}</Text>
            <Text>
                Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod
                tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero
                eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea
                takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet,
                consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et
                dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo
                dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem
                ipsum dolor sit amet.
            </Text>
        </Box>
    );
}
