// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Text, FormControl, FormLabel } from "@open-pioneer/chakra-integration";
import { FC } from "react";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { BasemapSwitcher, BasemapSwitcherProps } from "@open-pioneer/basemap-switcher";
import { useIntl } from "open-pioneer:react-hooks";

export interface TocProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

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

export const Toc: FC<TocProps> = (props) => {
    const intl = useIntl();

    const { mapId, hideBasemapSwitcher = false, basemapSwitcherProps } = props;
    const { containerProps } = useCommonComponentProps("toc", props);
    const basemapsLabel = intl.formatMessage({ id: "basemapsLabel" });
    const tocTitel = intl.formatMessage({ id: "tocTitel" });

    return (
        <Box {...containerProps}>
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
};
