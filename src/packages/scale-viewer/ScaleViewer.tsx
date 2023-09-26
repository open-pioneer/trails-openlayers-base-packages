// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps, Text } from "@open-pioneer/chakra-integration";
import { useMapModel, useScale } from "@open-pioneer/map";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { FC } from "react";

/**
 * These are special properties for the ScaleViewer.
 */
export interface ScaleViewerProps extends BoxProps {
    /**
     * The map id.
     */
    mapId: string;

    /**
     * Additional class name(s).
     */
    className?: string;
}

export const ScaleViewer: FC<ScaleViewerProps> = (props) => {
    const { mapId, className, ...rest } = props;
    const { map } = useMapModel(mapId);
    const intl = useIntl();
    const scale = useScale(map?.olMap);
    const displayScale = scale ? intl.formatNumber(scale) : undefined;

    return (
        <Box className={classNames("scale-viewer", className)} {...rest}>
            {displayScale && <Text>1:{displayScale}</Text>}
        </Box>
    );
};
