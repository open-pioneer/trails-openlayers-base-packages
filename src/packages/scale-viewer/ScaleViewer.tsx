// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Text } from "@open-pioneer/chakra-integration";
import { useMapModel, useScale } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { FC } from "react";

/**
 * These are the properties supported by the {@link ScaleViewer}.
 */
export interface ScaleViewerProps extends CommonComponentProps {
    /**
     * The map id.
     */
    mapId: string;
}

export const ScaleViewer: FC<ScaleViewerProps> = (props) => {
    const { mapId } = props;
    const { containerProps } = useCommonComponentProps("scale-viewer", props);

    const { map } = useMapModel(mapId);
    const intl = useIntl();
    const scale = useScale(map?.olMap);
    const displayScale = scale ? intl.formatNumber(scale) : undefined;

    return <Box {...containerProps}>{displayScale && <Text>1:{displayScale}</Text>}</Box>;
};
