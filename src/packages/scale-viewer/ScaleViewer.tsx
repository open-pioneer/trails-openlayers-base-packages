// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps, Text } from "@open-pioneer/chakra-integration";
import { OlComponentProps, useMap } from "@open-pioneer/experimental-ol-map";
import classNames from "classnames";
import { ForwardedRef, forwardRef } from "react";

import { useIntl } from "open-pioneer:react-hooks";
import { useCenter, useResolution, useScale } from "./hooks";

export const ScaleViewer = forwardRef(function ScaleViewer(
    props: OlComponentProps &
        BoxProps & {
            /**
             * Additional class name(s).
             */
            className?: string;
        },
    ref: ForwardedRef<HTMLDivElement> | undefined
) {
    const intl = useIntl();

    const { mapId, className, ...rest } = props;
    const { map } = useMap(mapId);

    const { center } = useCenter(map);
    const { resolution } = useResolution(map);
    const { scale } = useScale(map, resolution, center);

    return (
        <Box className={classNames("scale-viewer", className)} ref={ref} {...rest}>
            {scale && <Text>1:{intl.formatNumber(scale)}</Text>}
        </Box>
    );
});
