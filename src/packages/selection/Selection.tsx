// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { FC } from "react";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";

/**
 * Properties supported by the {@link Search} component.
 */
export interface SelectionProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;
}

export const Selection: FC<SelectionProps> = (props) => {
    const { containerProps } = useCommonComponentProps("selection", props);
    return <Box {...containerProps}></Box>;
};
