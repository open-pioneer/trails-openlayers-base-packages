// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps, Select } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import { FC, ForwardedRef, forwardRef, RefAttributes, useState } from "react";
import { useBasemapLayers } from "./hooks";
import classNames from "classnames";

interface NoneBasemapConfig {
    id: string;
    label: string;
}
interface SelectOptions {
    id: string;
    label: string;
}

export interface BasemapSwitcherProps extends BoxProps, RefAttributes<HTMLDivElement> {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Additional css class name(s) that will be added to the BasemapSwitcher component.
     */
    className?: string;

    /**
     * The ID for the current selected active BaseLayer
     */
    baseLayerId: string;

    /**
     * The config object if none basemap option is settet
     */
    noneBasemap: NoneBasemapConfig | undefined;
}

export const BasemapSwitcher: FC<BasemapSwitcherProps> = forwardRef(function BasemapSwitcher(
    props: BasemapSwitcherProps,
    ref: ForwardedRef<HTMLDivElement> | undefined
) {
    const { mapId, className, baseLayerId, noneBasemap, ...rest } = props;
    const { map } = useMapModel(mapId);
    const layerCollection = map?.layers;
    const [value, setValue] = useState(baseLayerId);
    const { baseLayers } = useBasemapLayers(value, layerCollection);

    const options: SelectOptions[] | undefined = baseLayers?.map((item) => ({
        id: item.id,
        label: item.title
    }));

    if (noneBasemap) {
        options?.push(noneBasemap);
    }

    return (
        <Box className={classNames("basemap-switcher", className)} ref={ref} {...rest}>
            {options?.length ? (
                <Select
                    className="basemap-switcher-select"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                >
                    {options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                            {opt.label}
                        </option>
                    ))}
                </Select>
            ) : (
                ""
            )}
        </Box>
    );
});
