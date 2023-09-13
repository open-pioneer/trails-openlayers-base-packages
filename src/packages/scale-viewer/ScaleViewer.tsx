// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps, Text } from "@open-pioneer/chakra-integration";
import { useMapModel, useScale } from "@open-pioneer/map";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, ForwardedRef, RefAttributes, forwardRef } from "react";

export interface ScaleViewerProps extends BoxProps, RefAttributes<HTMLDivElement> {
    /**
     * The map id.
     */
    mapId: string;

    /**
     * Additional class name(s).
     */
    className?: string;
}

export const ScaleViewer: FC<ScaleViewerProps> = forwardRef(function ScaleViewer(
    props: ScaleViewerProps,
    ref: ForwardedRef<HTMLDivElement> | undefined
) {
    const { mapId, className, ...rest } = props;
    const { map } = useMapModel(mapId);
    const intl = useIntl();
    const scale = useScale(map?.olMap);
    const displayScale = scale ? intl.formatNumber(scale) : undefined;

    return (
        <Box className={classNames("scale-viewer", className)} ref={ref} {...rest}>
            {displayScale && <Text>1:{displayScale}</Text>}
        </Box>
    );
});
