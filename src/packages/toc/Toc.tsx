// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { Box, Text, BoxProps } from "@open-pioneer/chakra-integration";
import { FC, ForwardedRef, forwardRef, RefAttributes } from "react";
import classNames from "classnames";
import { BasemapSwitcher } from "@open-pioneer/basemap-switcher";

export interface TocProps extends BoxProps, RefAttributes<HTMLDivElement> {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Additional css class name(s) that will be added to the Toc component.
     */
    className?: string;
}

export const Toc: FC<TocProps> = forwardRef(function Toc(
    props: TocProps,
    ref: ForwardedRef<HTMLDivElement> | undefined
) {
    const { mapId, className, ...rest } = props;

    return (
        <Box className={classNames("toc", className)} ref={ref} {...rest}>
            <Box
                className="toc-header"
                padding={2}
                backgroundColor="var(--chakra-colors-blackAlpha-500)"
            >
                <Text as="b">Map content</Text>
            </Box>
            <Box className="toc-content" padding={2}>
                <BasemapSwitcher
                    label="Basemap"
                    noneBasemap={{
                        id: "noBasemap",
                        label: "Without basemap",
                        selected: true
                    }}
                    mapId={mapId}
                ></BasemapSwitcher>
            </Box>
        </Box>
    );
});
