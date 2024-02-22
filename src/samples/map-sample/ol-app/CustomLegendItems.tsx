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

export function CustomLegendItem(props: LegendItemComponentProps) {
    return (
        <Box>
            <Text>{props.layer.title}</Text>
            <Box style={dotStyle}></Box>
        </Box>
    );
}
