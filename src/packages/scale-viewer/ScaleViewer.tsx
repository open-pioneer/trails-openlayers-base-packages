// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Text } from "@chakra-ui/react";
import { MapModelProps, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";
import { FC } from "react";

/**
 * These are the properties supported by the {@link ScaleViewer}.
 */
export interface ScaleViewerProps extends CommonComponentProps, MapModelProps {}

export const ScaleViewer: FC<ScaleViewerProps> = (props) => {
    const { containerProps } = useCommonComponentProps("scale-viewer", props);
    const { map } = useMapModel(props);
    const intl = useIntl();
    const scale = useReactiveSnapshot(() => map?.scale ?? 1, [map]);
    const displayScale = scale ? intl.formatNumber(scale) : undefined;
    const ariaLabel = scale ? intl.formatMessage({ id: "scaleLabel" }, { scale }) : undefined;

    return (
        <Box {...containerProps}>
            {displayScale && (
                <Text as="p" aria-live="polite" role="region" aria-label={ariaLabel}>
                    <span aria-hidden="true">1:{displayScale}</span>
                </Text>
            )}
        </Box>
    );
};
