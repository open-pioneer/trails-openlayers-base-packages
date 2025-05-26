// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Text, VisuallyHidden } from "@chakra-ui/react";
import { MapModelProps, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useEffect, useState } from "react";

/**
 * These are the properties supported by the {@link ScaleViewer}.
 */
export interface ScaleViewerProps extends CommonComponentProps, MapModelProps {}

export const ScaleViewer: FC<ScaleViewerProps> = (props) => {
    const { containerProps } = useCommonComponentProps("scale-viewer", props);
    const { map } = useMapModel(props);
    const intl = useIntl();

    const scale = useReactiveSnapshot(() => map?.scale ?? 1, [map]);
    const displayScale = intl.formatNumber(scale);

    // Make the scale shown to the screen reader lag behind a bit via debounce.
    // Otherwise, the user is notified of too many updates (individual scale changes).
    // See https://github.com/open-pioneer/trails-openlayers-base-packages/issues/431
    const debouncedScale = useDebouncedValue(scale);
    const ariaLabel = intl.formatMessage({ id: "scaleLabel" }, { scale: debouncedScale });

    return (
        <Box
            {...containerProps}
            role="region"
            aria-label={intl.formatMessage({ id: "regionLabel" })}
        >
            <VisuallyHidden aria-live="polite" aria-atomic="true">
                {ariaLabel}
            </VisuallyHidden>
            <Text as="p" aria-hidden="true">
                1:{displayScale}
            </Text>
        </Box>
    );
};

// TODO: Might be useful in a shared package
function useDebouncedValue<T>(currentValue: T, timeout = 1000): T {
    const [value, setValue] = useState<T>(currentValue);

    useEffect(() => {
        const id = setTimeout(() => setValue(currentValue), timeout);
        return () => clearTimeout(id);
    }, [currentValue, timeout]);

    return value;
}
