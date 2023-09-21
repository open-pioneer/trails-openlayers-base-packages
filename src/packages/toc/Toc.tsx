// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { Box, Text, BoxProps, FormControl, FormLabel } from "@open-pioneer/chakra-integration";
import { FC, ForwardedRef, forwardRef, RefAttributes } from "react";
import classNames from "classnames";
import { BasemapSwitcher, BasemapSwitcherProps } from "@open-pioneer/basemap-switcher";
import { useIntl } from "open-pioneer:react-hooks";
export interface TocProps extends BoxProps, RefAttributes<HTMLDivElement> {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Additional css class name(s) that will be added to the Toc component.
     */
    className?: string;

    /**
     * Defines whether the basemap switcher is shown in the toc.
     * Defaults to false.
     */
    hideBasemapSwitcher?: boolean;

    /**
     * Properties for the embedded basemap switcher.
     * Property "mapId" is not applied.
     */
    basemapSwitcherProps?: Omit<BasemapSwitcherProps, "mapId">;
}

export const Toc: FC<TocProps> = forwardRef(function Toc(
    props: TocProps,
    ref: ForwardedRef<HTMLDivElement> | undefined
) {
    const intl = useIntl();

    const { mapId, className, hideBasemapSwitcher = false, basemapSwitcherProps, ...rest } = props;
    const basemapsLabel = intl.formatMessage({ id: "basemapsLabel" });
    const tocTitel = intl.formatMessage({ id: "tocTitel" });

    return (
        <Box className={classNames("toc", className)} ref={ref} {...rest}>
            {/*TODO: remove header as it should be added by an app developer if needed? */}
            <Box
                className="toc-header"
                padding={2}
                backgroundColor="var(--chakra-colors-blackAlpha-500)"
            >
                <Text as="b">{tocTitel}</Text>
            </Box>
            {hideBasemapSwitcher || (
                <Box className="toc-content" padding={2}>
                    <FormControl>
                        <FormLabel ps={1}>
                            <Text as="b">{basemapsLabel}:</Text>
                        </FormLabel>
                        <BasemapSwitcher {...basemapSwitcherProps} mapId={mapId}></BasemapSwitcher>
                    </FormControl>
                </Box>
            )}
        </Box>
    );
});
