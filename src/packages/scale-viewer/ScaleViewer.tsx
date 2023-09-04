// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps, Text } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import classNames from "classnames";
import { FC, ForwardedRef, RefAttributes, forwardRef } from "react";
import { useCenter, useProjection, useResolution, useScale } from "@open-pioneer/map";

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
    const olMap = map?.olMap;

    const { center } = useCenter(olMap);
    const { resolution } = useResolution(olMap);
    const { projection } = useProjection(olMap);
    const { scale } = useScale(center, resolution, projection);

    return (
        <Box className={classNames("scale-viewer", className)} ref={ref} {...rest}>
            {scale && <Text>1:{scale}</Text>}
        </Box>
    );
});
